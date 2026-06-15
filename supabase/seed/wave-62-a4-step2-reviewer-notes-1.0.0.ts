/**
 * wave-62-a4-step2-reviewer-notes-1.0.0.ts
 *
 * Implements reviewer notes on A4 (My First AI Conversation), step 2,
 * approved 2026-06-15:
 *
 *   Note 2 (DO): add a prompt_sandbox with an editable starter that
 *     doesn't need full erasing — a "teach me as a beginner" opener
 *     with a built-in follow-up hook (fits the activity's ask-a-
 *     follow-up structure).
 *   Note 3 (DO, evergreen-shaped): instead of hardcoding 3 LLMs (they
 *     change), turn on the step-specific Suggest tools button and add
 *     a help line steering novices toward a fast / lightweight model
 *     tier for low-stakes practice.
 *
 * Note 1 (deliverable / "Look Book" language) needed no change — the
 * inconsistency was already fixed in Phase 5 (every activity shows the
 * same 3 deliverable buttons; "Look Book" is gone from the button).
 * Decision: keep "Share project". All 3 notes are resolved at the end.
 *
 * Also fixes a stale "Explore the Sources" reference in the help
 * (the callout is now "Explore Sources and Resources").
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ---- A4 step 2: prompt_sandbox + model-tier guidance + tools button ----
  const newHelp =
    "**What makes a good opening prompt:** it's specific enough that the AI can give you something useful, but open enough that there's somewhere to go next. \"What is photosynthesis?\" is a closed question: one answer, conversation over. \"How would you explain photosynthesis to a student who already understands cell respiration?\" has an angle and leaves room.\n\n" +
    "**Pick a light, fast model for this.** Any general chat tool works for a first conversation. Use the Suggest tools button below for current options, and lean toward a tool's faster, smaller tier (often labeled something like \"flash,\" \"mini,\" or \"nano\"). It's cheaper, lower-impact, and plenty for low-stakes practice.\n\n" +
    "If you want to read the underlying material on what makes a prompt land, the Explore Sources and Resources accordion at the bottom of the page has both ASU's reference PDF and the Articulate Rise lesson on prompt construction.";

  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help: newHelp,
      interactive_type: "prompt_sandbox",
      interactive_data: {
        hint: "Swap [a topic you know well] for your topic, then paste this into the AI you picked. Edit the wording however you like.",
        starter:
          "Teach me about [a topic you know well] as if I am a beginner. Keep it short, then ask me one question to check what I understood.",
      },
      show_external_tools: true,
    })
    .eq("activity_id", 4)
    .eq("step_number", 2);
  console.log("✓ A4 step 2 — prompt_sandbox + model-tier guidance + Suggest tools on");

  // ---- Resolve the 3 reviewer notes on A4 ----
  // Find the admin to attribute the resolution to (the note author).
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();

  // step 2 id for matching step-targeted notes
  const { data: step2 } = await sb
    .from("activity_guide_steps")
    .select("id")
    .eq("activity_id", 4)
    .eq("step_number", 2)
    .single();

  const rowIds = ["4", step2 ? String(step2.id) : ""].filter(Boolean);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sbAny = sb as any;
  const { data: resolved, error } = await sbAny
    .from("admin_edit_comments")
    .update({
      status: "resolved",
      resolved_by: admin?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("status", "open")
    .in("row_id", rowIds)
    .select("id");
  if (error) {
    console.warn("(could not resolve notes) " + error.message);
  } else {
    console.log(`✓ Resolved ${resolved?.length ?? 0} reviewer notes on A4`);
  }
}

main();
