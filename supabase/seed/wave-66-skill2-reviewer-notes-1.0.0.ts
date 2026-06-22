/**
 * wave-66-skill2-reviewer-notes-1.0.0.ts
 *
 * Implements the Skill 2 (Iterative dialogue) reviewer notes from the
 * Coda feedback form, approved 2026-06-22. A4 was already done in
 * wave-62; this wave handles A5 and A6.
 *
 * Reviewer note  ->  change (decisions confirmed with owner):
 *
 * A5 — The Anchoring Breaker (Foundational -> Intermediate)
 *   "the prompt is about the activity ... and not a design idea";
 *   "CreateAI Compare Models doesn't retain chat history ... do the
 *    activity in just 1 model for chat memory"
 *     -> Step 2: auto-populate the real brainstorm prompt right where
 *        the learner acts (no back-and-forth to another step/tool, per
 *        owner), and add an explicit "stay in one chat with memory"
 *        note. (A5 no longer has a Compare-AI link at all — already
 *        removed in an earlier restructure — so nothing to "keep.")
 *   "The 3 bulleted prompts are similar to but not as robust as the
 *    prompts within the dropdown ... direct learners to the dropdown
 *    rather than have 2 versions"
 *     -> Step 3: drop the 3 duplicate bullets from the instruction;
 *        point learners to the editable prompt below. The richer set of
 *        three anchor-breakers stays in the help.
 *   "May need to get more specific than Module 4 overview OR delete"
 *     -> Step 3 help: remove the inline "Canvas Module 4 (overview)"
 *        line (redundant + against the no-inline-sources pattern).
 *
 * A6 — Structured Divergent Brainstorm (Intermediate -> Advanced)
 *   "update the provided prompt to say '... taking online, asynchronous
 *    courses ...' — output was only appropriate for an in-person course"
 *     -> Steps 2 & 3: add a [your course modality] bracket to the
 *        persona (owner chose an evergreen variable over hardcoding
 *        "online, asynchronous" so it fits every modality).
 *   "include the instructions to run Steps 2-4 in fresh chats in Steps
 *    3 and 4"
 *     -> Steps 2, 3, 4: add a fresh-chat reminder to each hint so the
 *        three angles never cross-pollinate (don't wait until step 5).
 *   "Optional Extension ... instructions weren't very clear ... am I
 *    supposed to ... run a Tree of Thought prompt?"
 *     -> The old extension just re-described step 4 (Tree of Thought)
 *        and step 6 (synthesis), which is why it read as confusing.
 *        Replace it with a genuine next step: merge the two strongest
 *        cross-angle ideas into one hybrid design.
 *
 * Also (not a reviewer note, but a stale factual error found while
 * editing): A6's deliverable said "the two idea sets" though the
 * activity now uses three angles -> "three idea sets".
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

  // ====================== A5 — The Anchoring Breaker ======================

  // ---- Step 2 (id 19): auto-populate the brainstorm prompt + one-chat note ----
  const a5s2Instruction =
    "Open a single AI chat — you'll reuse it all the way through step 4, so the model keeps the conversation in memory. Paste this prompt, swapping in the design problem you wrote in step 1:\n\n" +
    "> Brainstorm 5 distinct ideas for this design problem: [your problem from step 1]. Number them 1–5, one or two sentences each.\n\n" +
    "Then paste each of the 5 ideas into a Round 1 box below.";
  const a5s2Help =
    "**Anchoring** is what happens after this step: the AI's first 5 ideas establish a frame, and every follow-up tends to ride along it. Filling in Round 1 explicitly lets you compare against Round 2 in step 4 — the in-page boxes are your record, no separate doc needed.\n\n" +
    "**Do the whole activity in one chat.** Breaking the anchor in step 3 only works if the model still remembers these Round 1 ideas, so don't open a new chat or switch models between rounds. (Comparing models is its own skill — here, keep a single chat with memory.)";

  await sb
    .from("activity_guide_steps")
    .update({ instruction: a5s2Instruction, detailed_help: a5s2Help })
    .eq("activity_id", 5)
    .eq("step_number", 2);
  console.log("✓ A5 step 2 — brainstorm prompt auto-populated + one-chat memory note");

  // ---- Step 3 (id 20): drop duplicate bullets; remove inline Module 4 line ----
  const a5s3Instruction =
    "Now break the anchor. Edit the prompt below to fit your scenario, then send it as your next message in the same chat.";
  const a5s3Help =
    "**Three reliable anchor-breakers:**\n\n" +
    "**Contrarian role.** \"You are a deeply skeptical colleague who thinks gamified projects are a waste of time. What 5 ideas would you suggest instead?\"\n\n" +
    "**Hard constraint.** \"Same task, but the project cannot involve any technology, including computers.\" Constraints force the model out of its default solution space.\n\n" +
    "**Opposing perspective.** \"What would someone who disagrees with all of those previous suggestions propose?\" This often surfaces the assumption the AI was running on.";

  await sb
    .from("activity_guide_steps")
    .update({ instruction: a5s3Instruction, detailed_help: a5s3Help })
    .eq("activity_id", 5)
    .eq("step_number", 3);
  console.log("✓ A5 step 3 — bullets removed (point to dropdown); inline source removed");

  // =================== A6 — Structured Divergent Brainstorm ===================

  // ---- Step 2 (id 25): modality bracket + fresh-chat reminder ----
  const a6s2Help =
    "**The student perspective surfaces what current AI use actually feels like in your course.** Students are often the most accurate predictors of where AI shortcuts a learning goal. The prompt's job is to get them to imagine the scenario you actually need them to engage with, not the one they could phone in.\n\n" +
    "**Set the modality bracket to match your course.** The reviewer found that leaving it unset gave answers that only fit an in-person class. Naming your modality — online asynchronous, in-person, hybrid — makes the AI's suggestions fit how your students actually work.\n\n" +
    "**Worked example.** If your step-1 problem was \"I need a midterm format that lets students use AI without making the assessment trivial,\" the bracketed `[topic from step 1]` becomes that exact sentence. The AI's response will be specifically about your context, not a generic college course.";

  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help: a6s2Help,
      interactive_data: {
        hint: "Set [your course modality] to match how you teach, replace [topic from step 1] with the problem you captured, then run it in a brand-new chat (each angle gets its own fresh chat — you'll compare them in step 5).",
        starter:
          "You are a college student taking [your course modality — e.g., online asynchronous, in-person, or hybrid] courses, facing this challenge: [topic from step 1].\n\nWhat assessment format or activity design would challenge you the most and help you learn, even with AI access? Be specific about why each part of your suggestion would resist the AI shortcut.",
      },
    })
    .eq("activity_id", 6)
    .eq("step_number", 2);
  console.log("✓ A6 step 2 — modality bracket + fresh-chat reminder");

  // ---- Step 3 (id 26): modality bracket + fresh-chat reminder ----
  const a6s3Help =
    "**The skeptic prompt forces you to see the failure modes.** Asking AI to argue against the very thing you're trying to design surfaces blind spots a confirmation-biased prompt would never reveal. The risks the skeptic names are usually the ones to design around.\n\n" +
    "**Keep the modality bracket consistent with step 2.** Same reason: an unset modality gave the reviewer feedback that only made sense for an in-person course. Match it to how you actually teach.\n\n" +
    "**Worked example.** Same problem from step 1 plugs in here too. If your problem was \"AI-resilient midterm,\" the skeptic might propose abandoning timed assessments entirely, or argue that any take-home assessment is now meaningless. Take their objections seriously even when you disagree.";

  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help: a6s3Help,
      interactive_data: {
        hint: "Same [topic from step 1] and the same [your course modality] as step 2 — keep both consistent so the angles are comparable. Run it in a fresh chat, separate from steps 2 and 4.",
        starter:
          "You are a deeply skeptical faculty member teaching [your course modality — e.g., online asynchronous, in-person, or hybrid] courses, who believes AI makes the typical solution to this challenge meaningless: [topic from step 1].\n\nWhat would you propose as an alternative approach, and what are the biggest risks even your alternative would still face?",
      },
    })
    .eq("activity_id", 6)
    .eq("step_number", 3);
  console.log("✓ A6 step 3 — modality bracket + fresh-chat reminder");

  // ---- Step 4 (id 27): fresh-chat reminder ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_data: {
        hint: "Same [topic from step 1] across all three angles. Run this in its own fresh chat too (separate from steps 2 and 3) so the angles don't cross-pollinate — you'll line all three up in step 5. The Tree-of-Thought instruction is what differentiates this prompt from the prior two.",
        starter:
          "Generate three completely independent approaches to: [topic from step 1].\n\nFor each approach, reason through the design logic step by step before proposing the final answer. The three approaches must share no structural similarities (different format, different student experience, different evaluation criteria).",
      },
    })
    .eq("activity_id", 6)
    .eq("step_number", 4);
  console.log("✓ A6 step 4 — fresh-chat reminder");

  // ---- A6 description: replace the stale Optional extension ----
  const a6Description =
    "Overview: In this activity, you will brainstorm the same problem from three contrasting angles — asking AI as a student, then as a skeptical colleague, then through a Tree-of-Thought prompt that forces parallel reasoning paths. You'll synthesize across all three angles to see which ideas only emerged from one of them.\n\n" +
    "Optional extension: Pick the two strongest ideas that came from different angles and prompt AI to merge them into a single hybrid design — one coherent assessment that keeps the best of both. Note what you had to trade off to make them fit together.";

  // ---- A6 deliverable: "two idea sets" -> "three idea sets" (stale count) ----
  const a6Deliverable =
    "A side-by-side visual card (slide or graphic) showing the three idea sets and which ideas only emerged from one angle.";

  await sb
    .from("level_up_activities")
    .update({ description: a6Description, deliverable: a6Deliverable })
    .eq("id", 6);
  console.log("✓ A6 — optional extension replaced + deliverable count fixed (two -> three)");

  // ============ Resolve any open reviewer notes on A5 / A6 ============
  // (Notes may live in admin_edit_comments if they were entered in-app;
  // best-effort — won't error if none exist.)
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();

  const { data: a5a6Steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .in("activity_id", [5, 6]);
  const rowIds = [
    "5",
    "6",
    ...(a5a6Steps ?? []).map((s) => String(s.id)),
  ];

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
    console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A5/A6`);
  }
}

main();
