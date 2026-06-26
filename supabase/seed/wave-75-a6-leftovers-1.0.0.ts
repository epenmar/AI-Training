/**
 * wave-75-a6-leftovers-1.0.0.ts
 *
 * A6 — Structured Divergent Brainstorm (Skill 2). The reviewer's
 * "Skill 7 Advanced" notes actually describe this activity (it was
 * mis-filed at review time). wave-66 handled the Anchoring-Breaker link
 * and the fresh-chat reminders; these are the remaining items:
 *
 *   Step 1: "'Define your problem' isn't sufficient — indicate what TYPE
 *     of problem ... the explanation seems very faculty-facing."
 *     -> Make explicit that this is a teaching / course-design problem
 *        you (the designer) want better ideas for, with that framing.
 *
 *   Step 6: "Implementation is difficult ... the outputs are long and it
 *     seems we're supposed to summarize in small form ... not the best
 *     format for tree-of-thought. A graph/infographic like a logic tree?"
 *     -> Reframe synthesis as pulling the 1-2 standouts per angle (not
 *        transcribing long outputs) and steer the deliverable toward a
 *        branching/logic-tree visual; turn on the Suggest-tools button so
 *        a diagram tool (e.g. Napkin) is one click away.
 *
 * "The final two references are the same through different links" is
 * already resolved — A6's three sources are distinct.
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

  // ---- Step 1: name the problem TYPE + the designer framing ----
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Define a real teaching or course-design challenge in one sentence — an assignment, an assessment, an activity, or a lesson you'd genuinely want better ideas for. Capture it below. Steps 2-4 push this exact problem through three prompt angles, and step 6 synthesizes ideas for it.",
      detailed_help:
        "**This is a *design* problem — something you're trying to build or fix as the educator, not a factual question for AI to answer or a personal to-do.** A teaching challenge worth brainstorming from several angles. You're the designer solving it; the three angles in steps 2-4 are ways to pressure-test your own thinking.\n\n" +
        "**One sentence, with the constraint baked in.** \"I need a new midterm\" is too open. \"I need a midterm format that lets students use AI without making the assessment trivial\" is sharp enough that the divergent prompts have something to push against.\n\n" +
        "**The problem stays the same across the next four steps.** Steps 2, 3, and 4 each prompt AI from a different angle on this *exact* problem; step 6 synthesizes across the three angles. If your problem changes, come back here and update it.",
    })
    .eq("activity_id", 6)
    .eq("step_number", 1);
  console.log("✓ A6 step 1 — problem type + designer framing clarified");

  // ---- Step 6: lighter synthesis + branching-visual steer + tools on ----
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "**Pull the standouts — don't transcribe everything.** Each round's output is long; you're not summarizing all of it. From each angle, lift just the one or two ideas that genuinely stood out — especially ones that appeared in only that angle. Those are what a single-prompt brainstorm would have missed.\n\n" +
        "**Tie each back to your step-1 problem.** Every shortlisted idea should answer: how does this address the specific problem you defined in step 1? \"It's a creative idea\" doesn't count if it solves a different problem. Tensions between angles usually reveal a real design trade-off worth naming.\n\n" +
        "**For the deliverable, a branching visual reads better than a list.** Picture your step-1 problem at the root, the three angles as branches, and the standout ideas as the leaves — a quick logic tree makes the \"which idea came from where\" story obvious at a glance. A diagram tool like Napkin (use the Suggest-tools button below for current options) turns your shortlist into one of these in a couple of clicks.",
      show_external_tools: true,
    })
    .eq("activity_id", 6)
    .eq("step_number", 6);
  console.log("✓ A6 step 6 — lighter synthesis, logic-tree deliverable, Suggest-tools on");

  // ---- Resolve any open reviewer notes on A6 ----
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .eq("activity_id", 6);
  const rowIds = ["6", ...(steps ?? []).map((s) => String(s.id))];
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
  if (error) console.warn("(could not resolve notes) " + error.message);
  else console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A6`);
}

main();
