import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// "Summarize my work" — the deliverable panel sweeps localStorage for
// every widget key starting with `activity-${id}-`, then sends the
// collected data here so AI can draft a deliverable summary based on
// what the learner actually entered into the activity's widgets.
//
// Same Create AI plumbing as /api/suggest-tools. No caching — every
// summary is unique to the learner's current state.

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const apiKey = process.env.CREATE_AI_API_KEY;
  const apiUrl = process.env.CREATE_AI_API_URL;
  const modelName = process.env.CREATE_AI_MODEL;
  const modelProvider = process.env.CREATE_AI_PROVIDER;
  if (!apiKey || !apiUrl || !modelName || !modelProvider) {
    return NextResponse.json({ error: "not_configured" }, { status: 503 });
  }

  const body = (await request.json().catch(() => ({}))) as {
    activityId?: number;
    // localStorage entries collected from the browser. Keys are
    // expected to start with `activity-${id}-`; values are the raw
    // JSON strings as stored.
    entries?: { key: string; value: string }[];
  };
  const activityId = body.activityId;
  if (!activityId || typeof activityId !== "number") {
    return NextResponse.json(
      { error: "missing_activity_id" },
      { status: 400 }
    );
  }
  const entries = Array.isArray(body.entries) ? body.entries : [];

  const { data: activity } = await supabase
    .from("level_up_activities")
    .select("title, description, deliverable, objectives")
    .eq("id", activityId)
    .single();
  if (!activity) {
    return NextResponse.json({ error: "activity_not_found" }, { status: 404 });
  }

  // Flatten each entry — most widgets store JSON we can parse and
  // pass to the model in a readable form. Cap each entry at 2KB so a
  // single oversized widget doesn't blow the prompt budget.
  const flat: string[] = [];
  for (const e of entries) {
    if (!e.key.startsWith(`activity-${activityId}-`)) continue;
    let val: unknown;
    try {
      val = JSON.parse(e.value);
    } catch {
      val = e.value;
    }
    const rendered = JSON.stringify(val, null, 2).slice(0, 2000);
    flat.push(`### ${e.key}\n${rendered}`);
  }

  const collected = flat.length > 0
    ? flat.join("\n\n")
    : "(no widget data found for this activity)";

  const objectives = Array.isArray(activity.objectives)
    ? (activity.objectives as string[]).map((o, i) => `${i + 1}. ${o}`).join("\n")
    : "";

  const system =
    "You help ASU learners summarize the work they did inside an activity so they can drop the summary into their deliverable. Respond ONLY with the summary text — no preamble, no list of caveats, no markdown headings. Plain prose. Keep it under 200 words.";

  const prompt = `Draft a deliverable summary for a learner who just completed an activity. Use the data they entered into the activity's widgets to write a short, first-person reflection that hits the activity's objectives.

Activity title: ${activity.title}
Activity description: ${activity.description ?? ""}
Deliverable expectation: ${activity.deliverable ?? "(no deliverable spec)"}
Objectives:
${objectives || "(no objectives listed)"}

Data the learner entered (one block per widget, key + JSON value):
${collected}

Write the summary in the learner's voice ("I..."), 100-200 words, plain prose. Cover what they did, what they learned, and what they'd do differently or take with them. If a widget had no entries, ignore it — don't say "I didn't fill this in." If the data is too thin to draft from, return a single line: "(Add a few entries to the activity's widgets first, then try Summarize my work again.)"`;

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
        temperature: 0.4,
        max_tokens: 600,
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
  const summary = (data.response ?? "").trim();
  return NextResponse.json({ summary });
}
