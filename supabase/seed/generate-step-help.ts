/**
 * Generate detailed_help text for every activity_guide_step that belongs to
 * a "New → Foundational" activity. Uses Create AI (ASU-sanctioned). Skips
 * steps that already have detailed_help so reruns are safe.
 *
 * Run with:
 *   npx tsx --env-file=.env.local supabase/seed/generate-step-help.ts
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const CREATE_AI_API_KEY = process.env.CREATE_AI_API_KEY;
const CREATE_AI_API_URL = process.env.CREATE_AI_API_URL;
const CREATE_AI_MODEL = process.env.CREATE_AI_MODEL;
const CREATE_AI_PROVIDER = process.env.CREATE_AI_PROVIDER;

if (
  !SUPABASE_URL ||
  !SERVICE_ROLE_KEY ||
  !CREATE_AI_API_KEY ||
  !CREATE_AI_API_URL ||
  !CREATE_AI_MODEL ||
  !CREATE_AI_PROVIDER
) {
  throw new Error(
    "Missing env vars. Need NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, and CREATE_AI_*"
  );
}

const NF_BAND = "New → Foundational";

const SYSTEM_PROMPT =
  "You write short, concrete help text for learners who are brand new to GenAI. Keep it grounded, practical, and specific. Return plain text only — no markdown headers, no code fences.";

function buildUserPrompt(args: {
  activityTitle: string;
  activityDescription: string | null;
  deliverable: string | null;
  stepNumber: number;
  instruction: string;
}): string {
  return `Activity: ${args.activityTitle}
Description: ${args.activityDescription ?? "(none)"}
Deliverable: ${args.deliverable ?? "(none)"}

Step ${args.stepNumber}: ${args.instruction}

Write the "more details" text a first-time GenAI learner would see if they expanded this step. It should:
- Start with one sentence that clarifies WHAT success looks like for this step.
- Give 2 concrete example prompts or inputs the learner could try verbatim (in quotes). Make them specific to higher ed / instructional design when natural, but keep them simple.
- Note 1-2 things to watch out for or how to tell if they're on the right track.

Keep it under 120 words total. No headings, no bullet markdown — just short paragraphs or inline quoted examples. Address the learner in second person ("you"). Do not repeat the step's instruction verbatim.`;
}

async function callCreateAi(userPrompt: string): Promise<string> {
  const res = await fetch(CREATE_AI_API_URL!, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${CREATE_AI_API_KEY}`,
    },
    body: JSON.stringify({
      action: "query",
      request_source: "override_params",
      query: userPrompt,
      model_provider: CREATE_AI_PROVIDER,
      model_name: CREATE_AI_MODEL,
      model_params: {
        system_prompt: SYSTEM_PROMPT,
        temperature: 0.3,
        max_tokens: 400,
      },
    }),
  });
  if (!res.ok) {
    const txt = await res.text().catch(() => "");
    throw new Error(`Create AI error ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = (await res.json()) as { response?: string };
  return (data.response ?? "").trim();
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data: activities, error: actErr } = await sb
    .from("level_up_activities")
    .select("id, title, description, deliverable, band")
    .eq("band", NF_BAND)
    .order("id");
  if (actErr) throw actErr;

  console.log(`Found ${activities?.length ?? 0} N → F activities.`);

  let generated = 0;
  let skipped = 0;
  let failed = 0;

  for (const activity of activities ?? []) {
    const { data: steps, error: stepErr } = await sb
      .from("activity_guide_steps")
      .select("id, step_number, instruction, detailed_help")
      .eq("activity_id", activity.id)
      .order("step_number");
    if (stepErr) {
      console.error(`Activity #${activity.id} step fetch failed:`, stepErr.message);
      failed++;
      continue;
    }

    for (const step of steps ?? []) {
      if (step.detailed_help && step.detailed_help.trim()) {
        skipped++;
        continue;
      }
      try {
        const prompt = buildUserPrompt({
          activityTitle: activity.title,
          activityDescription: activity.description,
          deliverable: activity.deliverable,
          stepNumber: step.step_number,
          instruction: step.instruction,
        });
        const help = await callCreateAi(prompt);
        if (!help) {
          console.error(
            `Activity #${activity.id} step ${step.step_number}: empty response`
          );
          failed++;
          continue;
        }
        const { error: updErr } = await sb
          .from("activity_guide_steps")
          .update({ detailed_help: help })
          .eq("id", step.id);
        if (updErr) {
          console.error(
            `Activity #${activity.id} step ${step.step_number} update failed:`,
            updErr.message
          );
          failed++;
          continue;
        }
        generated++;
        console.log(
          `✓ Activity #${activity.id} "${activity.title}" step ${step.step_number}`
        );
      } catch (e) {
        console.error(
          `Activity #${activity.id} step ${step.step_number} failed:`,
          e instanceof Error ? e.message : e
        );
        failed++;
      }
    }
  }

  console.log(
    `\nDone. generated=${generated} skipped=${skipped} failed=${failed}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
