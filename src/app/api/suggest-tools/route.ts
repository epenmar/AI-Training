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

const MODEL = "claude-haiku-4-5-20251001";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
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

  const prompt = `You are helping an ASU learner pick the right GenAI tools for a specific activity. Suggest 3-5 currently-available AI tools that would help them complete the activity well.

Activity title: ${activity.title}
Activity description: ${activity.description ?? ""}
Deliverable: ${activity.deliverable ?? ""}
Steps:
${stepList}

Respond with a JSON object of the form:
{"tools": [{"name": "Tool Name", "url": "https://...", "why": "One-sentence reason this tool fits this activity."}, ...]}

Only include tools that (a) are publicly available as of your knowledge, (b) have a real, stable URL, and (c) directly help with THIS activity's deliverable. Prefer well-known tools (ChatGPT, Claude, Gemini, Gamma, Canva, NotebookLM, Perplexity, Mermaid, etc.) when they fit. Keep the "why" under 20 words. Output ONLY the JSON object, no surrounding prose.`;

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 800,
      messages: [
        { role: "user", content: prompt },
        { role: "assistant", content: "{" },
      ],
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    return NextResponse.json(
      { error: "anthropic_error", detail: errText.slice(0, 500) },
      { status: 502 }
    );
  }

  const data = (await res.json()) as {
    content?: Array<{ type: string; text?: string }>;
  };
  const text =
    "{" + (data.content?.find((c) => c.type === "text")?.text ?? "");

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
