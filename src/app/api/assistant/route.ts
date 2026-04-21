import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database";

type Sb = SupabaseClient<Database>;

type ChatMessage = { role: "user" | "assistant"; content: string };

type RequestBody = {
  messages?: ChatMessage[];
  pathname?: string;
};

const MAX_MESSAGES = 12;
const MAX_CONTENT = 2000;

function sanitizeMessages(raw: unknown): ChatMessage[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter(
      (m): m is ChatMessage =>
        typeof m === "object" &&
        m !== null &&
        "role" in m &&
        "content" in m &&
        (m.role === "user" || m.role === "assistant") &&
        typeof (m as ChatMessage).content === "string"
    )
    .slice(-MAX_MESSAGES)
    .map((m) => ({
      role: m.role,
      content: m.content.slice(0, MAX_CONTENT),
    }));
}

async function buildPageContext(sb: Sb, pathname: string): Promise<string> {
  const path = pathname.split("?")[0].replace(/\/$/, "") || "/";

  const activityMatch = path.match(/^\/activities\/(\d+)$/);
  if (activityMatch) {
    const activityId = parseInt(activityMatch[1], 10);
    const { data: activity } = await sb
      .from("level_up_activities")
      .select("title, description, deliverable, band, skill_id, time_estimate")
      .eq("id", activityId)
      .single();
    if (!activity) return `User is on an activity page (id ${activityId}).`;
    const { data: skill } = await sb
      .from("skills")
      .select("short_name, statement")
      .eq("id", activity.skill_id)
      .single();
    return [
      `User is on the activity page for: "${activity.title}".`,
      `Band: ${activity.band}. Time: ${activity.time_estimate ?? "n/a"}.`,
      skill
        ? `Skill: ${skill.short_name} — ${skill.statement}`
        : "",
      `Description: ${activity.description ?? "(none)"}`,
      `Deliverable: ${activity.deliverable ?? "(none)"}`,
      `Activity ID: ${activityId}. Skill ID: ${activity.skill_id}.`,
    ]
      .filter(Boolean)
      .join("\n");
  }

  if (path === "/activities") {
    return "User is on the activities index — the list of all level-up activities, filterable by band and skill.";
  }

  const phaseMatch = path.match(/^\/learning-paths\/(\d+)$/);
  if (phaseMatch) {
    const phaseId = parseInt(phaseMatch[1], 10);
    const { data: phase } = await sb
      .from("bloom_phases")
      .select("name, bloom_levels, description")
      .eq("id", phaseId)
      .single();
    if (!phase) return `User is on a learning-path phase page (id ${phaseId}).`;
    return `User is on phase ${phaseId}: "${phase.name}" (${phase.bloom_levels}). ${phase.description}`;
  }

  if (path === "/learning-paths") {
    return "User is browsing the 9 Bloom's-aligned learning path phases.";
  }

  if (path === "/skill-summary") {
    return "User is on their personal skill-summary page showing interpretive reads of their self-assessment results.";
  }

  if (path === "/assessment") {
    return "User is on the self-assessment page — 14 scenario questions mapping to 14 ASU AI skills, plus their progress history and skill growth charts once they've taken it.";
  }

  if (path === "/community") {
    return "User is on the community Look Book — where ASU learners share screenshots/videos of AI work they've built.";
  }

  if (path === "/") {
    return "User is on the dashboard home page.";
  }

  return `User is on: ${path}.`;
}

const SYSTEM_PROMPT = `You are the AI Assistant for an ASU GenAI skills training dashboard built for faculty and staff. Be concise, warm, and practical. Keep answers under ~150 words unless the user asks for more. Use plain prose — no markdown headers, no code fences.

You can help learners:
- Understand an activity or learning phase they're looking at.
- Suggest alternatives or next steps.
- Clarify AI concepts at the level of a first-time learner.
- Recommend which ASU-sanctioned or licensed tool fits (prefer in this order: Create AI / Create AI Compare → Adobe Firefly/Express, NotebookLM → creative tools like Napkin, Suno, Runway, Ideogram, Gamma, Mermaid Live, Perplexity → generic ChatGPT/Claude/Gemini).

If the user asks something outside this scope (personal advice unrelated to AI learning, medical/legal, etc.), gently redirect them back to the dashboard's focus.

You will be given the page context the user is currently viewing. Use it to make your answer specific. If the user asks about "this activity" or "this phase," assume they mean what's in the page context.`;

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
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as RequestBody;
  const messages = sanitizeMessages(body.messages);
  if (messages.length === 0 || messages[messages.length - 1].role !== "user") {
    return NextResponse.json({ error: "missing_user_message" }, { status: 400 });
  }

  const pathname = typeof body.pathname === "string" ? body.pathname : "/";
  const context = await buildPageContext(supabase, pathname);

  const conversationText = messages
    .map((m) =>
      m.role === "user" ? `User: ${m.content}` : `Assistant: ${m.content}`
    )
    .join("\n\n");

  const fullQuery = `Page context:\n${context}\n\nConversation so far:\n${conversationText}\n\nReply as the Assistant, speaking to the User.`;

  const res = await fetch(apiUrl, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      action: "query",
      request_source: "override_params",
      query: fullQuery,
      model_provider: modelProvider,
      model_name: modelName,
      model_params: {
        system_prompt: SYSTEM_PROMPT,
        temperature: 0.4,
        max_tokens: 500,
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
  const reply = (data.response ?? "").trim();
  if (!reply) {
    return NextResponse.json({ error: "empty_response" }, { status: 502 });
  }

  return NextResponse.json({ reply });
}
