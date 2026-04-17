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

Prefer ASU's sanctioned platforms when they fit the activity:
- Create AI (https://platform.aiml.asu.edu/) — ASU's institutional AI platform for building custom AI projects, assistants, and agents. Preferred for anything involving reusable prompts, custom assistants, or team-wide AI tools.
- Create AI Compare (https://compare.aiml.asu.edu/) — side-by-side comparison of multiple models on the same prompt. Preferred whenever the activity benefits from seeing how different models respond to the same input.

Otherwise prefer well-known tools (ChatGPT, Claude, Gemini, Gamma, Canva, NotebookLM, Perplexity, Mermaid, etc.) when they fit.`;

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
