import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CacheEntry = { at: number; tools: SuggestedTool[] };
// Cache key combines activityId + stepNumber so step-specific
// suggestions don't collide with activity-level ones.
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type SuggestedTool = {
  name: string;
  url: string;
  why: string;
  vetted?: boolean;
};

// ASU's authoritative, regularly-updated list of approved AI tools.
// The suggester grounds its picks here and flags which ones appear on it.
const ASU_VETTED_TOOLS_URL = "https://ai.asu.edu/ai-tools";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.CREATE_AI_API_KEY;
  const apiUrl = process.env.CREATE_AI_API_URL;
  const modelName = process.env.CREATE_AI_MODEL;
  const modelProvider = process.env.CREATE_AI_PROVIDER;
  if (!apiKey || !apiUrl || !modelName || !modelProvider) {
    return NextResponse.json(
      { error: "not_configured" },
      { status: 503 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    activityId?: number;
    stepNumber?: number;
  };
  const activityId = body.activityId;
  if (!activityId || typeof activityId !== "number") {
    return NextResponse.json({ error: "missing_activity_id" }, { status: 400 });
  }
  const stepNumber =
    typeof body.stepNumber === "number" ? body.stepNumber : null;

  const cacheKey = `${activityId}:${stepNumber ?? "all"}`;
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({ tools: cached.tools, cached: true });
  }

  const { data: activity } = await supabase
    .from("level_up_activities")
    .select("title, description, deliverable")
    .eq("id", activityId)
    .single();
  if (!activity) {
    return NextResponse.json({ error: "activity_not_found" }, { status: 404 });
  }

  const { data: steps } = await supabase
    .from("activity_guide_steps")
    .select("step_number, instruction")
    .eq("activity_id", activityId)
    .order("step_number");

  const stepList =
    (steps ?? [])
      .map((s) => `${s.step_number}. ${s.instruction}`)
      .join("\n") || "(no steps)";

  const focusedStep =
    stepNumber !== null
      ? (steps ?? []).find((s) => s.step_number === stepNumber) ?? null
      : null;

  const system =
    "You help ASU learners pick GenAI tools for a specific activity step. Respond with ONLY a single JSON object, no surrounding prose, no markdown code fences.";

  // When the suggester is invoked from a specific step, focus the
  // recommendation on that step's task. The "why" line should explain
  // how the tool helps with THAT step, not the activity broadly.
  const stepFocusBlock =
    focusedStep !== null
      ? `\n\nFOCUS — this learner is on step ${focusedStep.step_number} of the activity. Recommend tools that specifically help with this step's task:\n  Step ${focusedStep.step_number}: ${focusedStep.instruction}\n\nThe \"why\" line for each tool MUST tie the recommendation to this step specifically (e.g., "best for [this step's specific task] because…"). Generic activity-level reasons are not acceptable.`
      : "";

  // Live ASU-vetted catalog — the grounded candidate set the model must
  // prefer and the only tools allowed to be flagged "vetted". Read at
  // request time so catalog edits take effect with no redeploy. The
  // public ai.asu.edu/ai-tools page is too thin to scrape, so this
  // curated table (maintained via seed) is the source of truth.
  type VettedRow = {
    name: string;
    url: string;
    use_cases: string[] | null;
    asu_status: string;
    department_scope: string;
    data_sensitivity: string;
    description: string | null;
  };
  // vetted_tools isn't in the generated Database types yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: vt } = await (supabase as any)
    .from("vetted_tools")
    .select(
      "name, url, use_cases, asu_status, department_scope, data_sensitivity, description"
    )
    .eq("active", true);
  const vettedTools = (vt ?? []) as VettedRow[];

  const vettedBlock =
    vettedTools.length > 0
      ? vettedTools
          .map(
            (t) =>
              `   - ${t.name} (${t.url}) — ${t.description ?? ""} [${t.asu_status}; scope: ${t.department_scope}; data: ${t.data_sensitivity}; good for: ${(t.use_cases ?? []).join(", ")}]`
          )
          .join("\n")
      : "   (catalog temporarily unavailable — fall back to your knowledge of ASU-sanctioned and ASU-licensed tools: Create AI, the Adobe suite, Microsoft Copilot, Google/NotebookLM.)";

  const prompt = `Suggest 3-5 currently-available AI tools that would help an ASU learner complete ${
    focusedStep ? "this step" : "this activity"
  } well.

Activity title: ${activity.title}
Activity description: ${activity.description ?? ""}
Deliverable: ${activity.deliverable ?? ""}
All steps (for context):
${stepList}${stepFocusBlock}

Respond with a JSON object of the form:
{"tools": [{"name": "Tool Name", "url": "https://...", "vetted": true, "why": "One-sentence reason this tool fits ${
    focusedStep ? "this step" : "this activity"
  }."}, ...]}

Only include tools that (a) are publicly available as of your knowledge, (b) have a real, stable URL, and (c) directly help with ${
    focusedStep ? "THIS STEP'S task" : "THIS activity's deliverable"
  }. Keep the "why" under 25 words and lead with "Best for [the specific task]…".

GROUND YOUR PICKS IN ASU'S VETTED TOOL CATALOG (below). This is ASU's current set of sanctioned, licensed, and enterprise-available AI tools, maintained by ASU and read live. Prefer a catalog tool whenever one fits the task. For every tool you return, set "vetted": true ONLY if it appears in the catalog below (match by name); set "vetted": false for anything else. Never mark a tool vetted unless it is in the catalog. (ASU also publishes a public overview at ${ASU_VETTED_TOOLS_URL}, but the catalog below is the authoritative set for this feature.)

ASU VETTED TOOL CATALOG (live):
${vettedBlock}

Tool selection guidelines, in priority order. Aim for a mix across tiers — do NOT default to only well-known options when a catalog or better-fit alternative exists.

1. ASU vetted catalog (above) — prefer whenever a catalog tool genuinely fits the task. These are the only tools you may mark "vetted": true.

2. Creative or less-obvious tools — include when they genuinely fit, even if the deliverable could be met by a more generic tool. Mark these "vetted": false unless they also appear in the catalog:
   - Napkin (https://www.napkin.ai/) — turns text into editable visual notes and diagrams.
   - Suno (https://suno.com/) or Udio (https://www.udio.com/) — music, jingles, audio branding.
   - ElevenLabs (https://elevenlabs.io/) — voice generation and cloning.
   - Runway (https://runwayml.com/) or Pika (https://pika.art/) — short video generation.
   - Ideogram (https://ideogram.ai/) — images with reliable text rendering (posters, typographic art).
   - Gamma (https://gamma.app/) — AI-drafted slide decks.
   - Mermaid Live Editor (https://mermaid.live/) — text-to-diagram for flowcharts and process maps.
   - Perplexity (https://www.perplexity.ai/) — research with inline citations.

3. General-purpose assistants — fine to include when the task is open-ended reasoning or drafting, and nothing above fits better:
   - ChatGPT (https://chat.openai.com/), Claude (https://claude.ai/), Gemini (https://gemini.google.com/).

When the activity calls for something creative (music, voice, video, a poster, a jingle, an unusual artifact), reach for the creative tools in tier 2 — don't suggest a generic chatbot just because it's famous.`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      action: "query",
      request_source: "override_params",
      query: prompt,
      model_provider: modelProvider,
      model_name: modelName,
      model_params: {
        system_prompt: system,
        temperature: 0,
        max_tokens: 800,
      },
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "create_ai_error", detail: errText.slice(0, 500) },
      { status: 502 }
    );
  }

  const data = (await res.json()) as { response?: string };
  const text = (data.response ?? "").trim();

  let parsed: { tools?: SuggestedTool[] };
  try {
    parsed = JSON.parse(text);
  } catch {
    const match = text.match(/\{[\s\S]*\}/);
    if (!match) {
      return NextResponse.json({ error: "parse_error" }, { status: 502 });
    }
    parsed = JSON.parse(match[0]);
  }

  const tools = (parsed.tools ?? [])
    .filter(
      (t): t is SuggestedTool =>
        typeof t?.name === "string" &&
        typeof t?.url === "string" &&
        typeof t?.why === "string"
    )
    .map((t) => ({
      name: t.name,
      url: t.url,
      why: t.why,
      vetted: t.vetted === true,
    }));

  cache.set(cacheKey, { at: Date.now(), tools });
  return NextResponse.json({ tools, cached: false });
}
