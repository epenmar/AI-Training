/**
 * wave-48-disclosure-trio-fixes-1.0.0.ts
 *
 * Three disclosure-skill activities (A25, A26, A27) all needed
 * capture space and a few text fixes.
 *
 * A25 (Find the Policy):
 *   - Step 1: add a text_list_entry for the ASU policy summary the
 *     learner is asked to write. Replace the duplicate-"Canvas
 *     Canvas Module 3" prose with a clean inline link to the actual
 *     Canvas page (the course is "Teaching and Learning with
 *     Generative AI"; the page is Module 3 (overview)).
 *   - Step 2: drop the dual ASU+external text_list_entry — the ASU
 *     half moves to step 1, the external half moves to step 3, so
 *     the capture lives at the moment the learner is doing the work.
 *   - Step 3: add a text_list_entry for the external-policy summary.
 *
 * A26 (Write Your Disclosure Statement):
 *   - Steps 1-3 each ask the learner to draft a 2-3 sentence
 *     disclosure for a different context (syllabus, conference,
 *     grant). Add a text_list_entry on each so they have a place to
 *     put the draft.
 *
 * A27 (Disclosure Decision Tree):
 *   - Step 6 currently asks the learner to write rationales for each
 *     endpoint with no pointer to where the rationale should live.
 *     Update to point at the deliverable box at the bottom.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

const CANVAS_COURSE = "https://canvas.asu.edu/courses/157584";
const CANVAS_MODULE_3 =
  "https://canvas.asu.edu/courses/157584/pages/module-3-overview-2";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ====================================================================
  // A25 (Find the Policy)
  // ====================================================================

  // Step 1: add text_list_entry; fix the "Canvas Canvas" prose.
  const a25Step1Help =
    `**Why disclosure matters:** disclosure is what separates using AI as a tool (legitimate, widely accepted) from passing off AI output as your own (misconduct). Policies exist so there's a shared expectation of where the line is.\n\n` +
    `**Where to look at ASU:** start with the Provost's AI page or ASU's main AI hub. The policy landscape is evolving — different colleges and units sometimes have more specific guidance than the university-wide statement. ` +
    `The [Module 3 overview — ethical AI, fairness, transparency (~10 min skim)](${CANVAS_MODULE_3}) page in the [Teaching and Learning with Generative AI](${CANVAS_COURSE}) Canvas course is a useful companion if you want to understand what the policies are actually protecting against.\n\n` +
    `Bookmark whatever you find. This is the reference you'll reach for most.`;
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help: a25Step1Help,
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-25-asu-policy",
        prompt:
          "Capture the ASU source you found and your one-sentence summary. Saves in your browser.",
        groups: [
          {
            id: "asu",
            count: 1,
            label: "ASU policy — source + 1-sentence summary",
            placeholder:
              "e.g., ASU AI Hub — \"Disclose AI use in any work submitted under your name; no university-wide ban on tools.\"",
          },
        ],
      },
    })
    .eq("activity_id", 25)
    .eq("step_number", 1);
  console.log(
    "✓ A25 step 1 — ASU policy text_list_entry + clean Canvas link"
  );

  // Step 2: drop the dual text_list_entry; pick-an-external-context only.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: null,
      interactive_data: null,
    })
    .eq("activity_id", 25)
    .eq("step_number", 2);
  console.log(
    "✓ A25 step 2 — dual capture removed (split across step 1 and step 3)"
  );

  // Step 3: add text_list_entry for the external-policy summary.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-25-external-policy",
        prompt:
          "Capture the external source you found and your one-sentence summary. Saves in your browser.",
        groups: [
          {
            id: "external",
            count: 1,
            label: "External policy (journal/funder/org) — source + 1-sentence summary",
            placeholder:
              "e.g., Nature — \"Requires AI use disclosure in a dedicated Methods section; AI cannot be listed as an author.\"",
          },
        ],
      },
    })
    .eq("activity_id", 25)
    .eq("step_number", 3);
  console.log(
    "✓ A25 step 3 — external policy text_list_entry added"
  );

  // ====================================================================
  // A26 (Write Your Disclosure Statement)
  // ====================================================================

  const a26ContextWidgets = [
    {
      stepNumber: 1,
      storageKey: "activity-26-syllabus",
      label: "Syllabus disclosure (2–3 sentences)",
      placeholder:
        "Sentence 1: how I used AI in materials. Sentence 2: how students may/may not use AI on assignments. Sentence 3: verification or attribution expectation.",
    },
    {
      stepNumber: 2,
      storageKey: "activity-26-conference",
      label: "Conference disclosure (1–2 sentences)",
      placeholder:
        "What tool, what task, how verified — short enough to live in a slide acknowledgment.",
    },
    {
      stepNumber: 3,
      storageKey: "activity-26-grant",
      label: "Grant disclosure (2–3 sentences)",
      placeholder:
        "Default pattern: Generative AI tools were used to [task]; all [outputs] were independently verified by the PI.",
    },
  ];
  for (const w of a26ContextWidgets) {
    await sb
      .from("activity_guide_steps")
      .update({
        interactive_type: "text_list_entry",
        interactive_data: {
          storageKey: w.storageKey,
          prompt:
            "Draft your statement. Saves in your browser. Step 4 is the three-question audit; step 5 is the read-back review.",
          groups: [
            {
              id: "draft",
              count: 1,
              label: w.label,
              placeholder: w.placeholder,
            },
          ],
        },
      })
      .eq("activity_id", 26)
      .eq("step_number", w.stepNumber);
    console.log(`✓ A26 step ${w.stepNumber} — text_list_entry for the draft`);
  }

  // ====================================================================
  // A27 (Disclosure Decision Tree)
  // ====================================================================

  const a27Step6Instruction =
    "Capture a brief rationale for each endpoint in the deliverable box at the bottom of this page (\"Full disclosure needed because…\", \"No disclosure needed because…\"). The rationale is what makes the tree defensible later.";
  await sb
    .from("activity_guide_steps")
    .update({ instruction: a27Step6Instruction })
    .eq("activity_id", 27)
    .eq("step_number", 6);
  console.log("✓ A27 step 6 — points to deliverable box");
}

main();
