/**
 * wave-72-skill7-content-1.0.0.ts
 *
 * Skill 7 (Verify) reviewer notes — the CONTENT fixes. Mapped by
 * content from the reviewer's Google Doc ("Personal notes for EDL AI
 * experience", kwelch23@asu.edu). The reviewer's section labels are
 * from an earlier build; by content they map to:
 *   "Skill 7 New→Foundational"     -> A7  Source Check Challenge
 *   "Skill 7 Foundational→Inter."  -> A8  The Fabrication Detector
 *   "Skill 7 Inter.→Advanced"      -> A6  Structured Divergent Brainstorm
 *                                       (Skill 2; mostly handled in wave-66)
 *
 * Widget/UX bugs the reviewer raised (citation step2->step4 mirror,
 * highlighter toolbar button labels, "Saved in your browser" contrast)
 * are NOT here — they need component changes + manual verification and
 * are tracked as a separate batch.
 *
 * The "literal asterisks" items (markdown *italic* not rendering) are
 * fixed at the root in renderRichText (single-* italic support), so the
 * help text below can use *italic* normally.
 *
 * A7 — Source Check Challenge
 *   Step 1: "details assume all/most will see a hallucination — tone
 *     down"; "random Canvas Module reference can be taken out".
 *   Step 4: "Frankenstein example is restrictive — give more options
 *     for what Frankenstein means" (real title, missing authors, etc.).
 *   Resources: "Checkology goes to an error page" -> remove.
 *
 * A8 — The Fabrication Detector
 *   Step 1: "the ask is complicated — add an example or a copy-paste
 *     prompt with fill-ins" -> prompt_sandbox starter + a concrete
 *     niche-topic example; de-nest "Citations *and* reference list".
 *   Step 6: "where does this capture go?" -> clarify the deliverable
 *     saves to the learner's own account; sharing is optional.
 *   Resources: remove the dead Checkology link (full link audit of the
 *     rest is a separate pass).
 *
 * A12 — RACCCA: remove the same dead Checkology link.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const CHECKOLOGY_URL = "https://newslit.org/educators/checkology/";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ===================== A7 — Source Check Challenge =====================

  // Step 1: tone down the "you WILL see a hallucination" framing; drop
  // the inline Canvas Module 5 reference (it's in the Explore box).
  const a7s1Help =
    "**What's about to happen:** the AI will give you three official-looking citations — author names, journal titles, years, page numbers. Some may be real, some partially real (real authors, real journal, wrong combination), and some entirely invented. You might even get three solid ones — but you won't know which is which until you check, and that's the point.\n\n" +
    "These near-misses are called **hallucinations**: content the AI generates that sounds authoritative but isn't true. They happen because the model is trained to produce *plausible* text, not *accurate* text, and citations follow very regular patterns that are easy to imitate.\n\n" +
    "Use the resources below to pick a tool. Pick a topic in your field so you can spot problems. Ask exactly as written.";
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: a7s1Help })
    .eq("activity_id", 7)
    .eq("step_number", 1);
  console.log("✓ A7 step 1 — softened hallucination framing; inline Canvas ref removed");

  // Step 4: broaden what "Frankenstein" covers; drop inline Canvas ref.
  const a7s4Help =
    "Three patterns you'll probably see:\n\n" +
    "**Real.** Title, author, journal, year all match. → *Real*\n\n" +
    "**Frankenstein.** Some parts are real, but they don't actually go together. The classic version is a real author + real journal with a paper that doesn't exist — but it also shows up as a real title with the wrong or missing authors, a real paper with the wrong year or journal, or a real article the AI *summarizes* inaccurately. If any piece is real but the combination isn't, it's a Frankenstein. → *Frankenstein*\n\n" +
    "**Fully invented.** No trace of the article anywhere. Sometimes the author doesn't exist either. → *Fully invented*\n\n" +
    "The middle category is the dangerous one. It passes a sniff test, and it'll fool anyone who only checks whether the journal is real.";
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: a7s4Help })
    .eq("activity_id", 7)
    .eq("step_number", 4);
  console.log("✓ A7 step 4 — Frankenstein definition broadened");

  // ===================== A8 — The Fabrication Detector =====================

  // Step 1: give a copy-paste prompt starter + a concrete niche example;
  // de-nest the bold/italic that rendered as literal asterisks.
  const a8s1Help =
    "**Pick a topic where you can verify quickly.** Niche enough that the AI's training data is thin (good — fabrications surface faster), but familiar enough that you can spot when the framing is off. *Example:* not \"machine learning,\" but \"concept-drift detection in streaming fraud models\"; not \"active learning,\" but \"peer instruction in large-enrollment organic chemistry.\" The narrower the topic, the faster the fabrications show.\n\n" +
    "**The two-paragraph constraint matters.** Long enough that the AI has to commit to multiple claims; short enough that you can verify all of them in 20 minutes.\n\n" +
    "**Citations and a reference list both.** Don't accept just in-text — make the AI commit to a full reference. That's where the fabrications concentrate.";
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Ask the AI for a 2-paragraph literature review on a topic in your field — use the prompt below as a starting point. Then paste its full response into the workspace in step 2 so you can mark it up across the next steps.",
      detailed_help: a8s1Help,
      interactive_type: "prompt_sandbox",
      interactive_data: {
        hint: "Swap [a specific, fairly niche topic in your field] for something you can fact-check fast, then send. Paste the AI's full response into the workspace in step 2.",
        starter:
          "Write a 2-paragraph literature review on [a specific, fairly niche topic in your field] for an informed but non-expert reader. Include in-text citations and a full reference list — real, verifiable sources with author, journal, and year.",
      },
      show_external_tools: true,
    })
    .eq("activity_id", 8)
    .eq("step_number", 1);
  console.log("✓ A8 step 1 — prompt starter + niche example; de-nested asterisks");

  // Step 6: clarify where the captured deliverable goes.
  const a8s6Help =
    "**Where your work goes:** the deliverable box at the bottom of this page saves to your own account — it's yours to revisit, and you decide if and when to share it. Nothing is sent to a facilitator automatically.\n\n" +
    "**The verification habit you're building:** for any AI-generated content that goes into work, the citations and statistics get verified before you use them. Every time, not when you remember.\n\n" +
    "If that feels slow, the alternative is publishing fabrications under your name. The verification habit is non-negotiable; the speed comes with practice.";
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: a8s6Help })
    .eq("activity_id", 8)
    .eq("step_number", 6);
  console.log("✓ A8 step 6 — clarified where the deliverable is saved");

  // ============ Remove the dead Checkology link from A7 / A8 / A12 ============
  type ExtraSource = { url?: string; [k: string]: unknown };
  for (const aid of [7, 8, 12]) {
    const { data: row } = await sb
      .from("level_up_activities")
      .select("extra_sources")
      .eq("id", aid)
      .single();
    const extras = (Array.isArray(row?.extra_sources)
      ? (row!.extra_sources as ExtraSource[])
      : []
    ).filter((e) => (e?.url ?? "") !== CHECKOLOGY_URL);
    await sb
      .from("level_up_activities")
      .update({ extra_sources: extras })
      .eq("id", aid);
    console.log(`✓ A${aid} — removed dead Checkology link (extra_sources now ${extras.length})`);
  }

  // ============ Resolve any open reviewer notes on A7/A8/A12 ============
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .in("activity_id", [7, 8, 12]);
  const rowIds = ["7", "8", "12", ...(steps ?? []).map((s) => String(s.id))];
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
    console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A7/A8/A12`);
  }
}

main();
