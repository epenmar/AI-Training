import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type CacheEntry = { at: number; tools: SuggestedTool[] };
const cache = new Map<number, CacheEntry>();
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

type SuggestedTool = {
  name: string;
  url: string;
  why: string;
};

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
  };
  const activityId = body.activityId;
  if (!activityId || typeof activityId !== "number") {
    return NextResponse.json({ error: "missing_activity_id" }, { status: 400 });
  }

  const cached = cache.get(activityId);
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

  const system =
    "You help ASU learners pick GenAI tools for a specific activity. Respond with ONLY a single JSON object, no surrounding prose, no markdown code fences.";

  const prompt = `Suggest 3-5 currently-available AI tools that would help an ASU learner complete this activity well.

Activity title: ${activity.title}
Activity description: ${activity.description ?? ""}
Deliverable: ${activity.deliverable ?? ""}
Steps:
${stepList}

Respond with a JSON object of the form:
{"tools": [{"name": "Tool Name", "url": "https://...", "why": "One-sentence reason this tool fits this activity."}, ...]}

Only include tools that (a) are publicly available as of your knowledge, (b) have a real, stable URL, and (c) directly help with THIS activity's deliverable. Keep the "why" under 20 words.

Tool selection guidelines, in priority order. Aim for a mix across tiers — do NOT default to only well-known options when a licensed or better-fit alternative exists.

1. ASU-sanctioned platforms — prefer whenever they fit:
   - Create AI (https://platform.aiml.asu.edu/) — ASU's institutional AI platform for custom assistants, agents, and reusable prompts.
   - Create AI Compare (https://compare.aiml.asu.edu/) — side-by-side comparison of multiple models on the same prompt.

2. ASU-licensed tools — prefer over free alternatives when they fit the deliverable:
   - Adobe Firefly (https://firefly.adobe.com/) — AI image generation; ASU licenses the full Adobe suite.
   - Adobe Express (https://new.express.adobe.com/) — fast AI-assisted visual design (flyers, social graphics, simple videos).
   - NotebookLM (https://notebooklm.google.com/) — source-grounded research assistant with audio overviews; enterprise-available at ASU.

3. Creative or less-obvious tools — include when they genuinely fit, even if the deliverable could be met by a more generic tool:
   - Napkin (https://www.napkin.ai/) — turns text into editable visual notes and diagrams.
   - Suno (https://suno.com/) or Udio (https://www.udio.com/) — music, jingles, audio branding.
   - ElevenLabs (https://elevenlabs.io/) — voice generation and cloning.
   - Runway (https://runwayml.com/) or Pika (https://pika.art/) — short video generation.
   - Ideogram (https://ideogram.ai/) — images with reliable text rendering (posters, typographic art).
   - Gamma (https://gamma.app/) — AI-drafted slide decks.
   - Mermaid Live Editor (https://mermaid.live/) — text-to-diagram for flowcharts and process maps.
   - Perplexity (https://www.perplexity.ai/) — research with inline citations.

4. General-purpose assistants — fine to include when the task is open-ended reasoning or drafting, and nothing above fits better:
   - ChatGPT (https://chat.openai.com/), Claude (https://claude.ai/), Gemini (https://gemini.google.com/).

When the activity calls for something creative (music, voice, video, a poster, a jingle, an unusual artifact), reach for tier 3 — don't suggest a generic chatbot just because it's famous.`;

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

  const tools = (parsed.tools ?? []).filter(
    (t): t is SuggestedTool =>
      typeof t?.name === "string" &&
      typeof t?.url === "string" &&
      typeof t?.why === "string"
  );

  cache.set(activityId, { at: Date.now(), tools });
  return NextResponse.json({ tools, cached: false });
}
