/**
 * wave-44-raccca-rework-1.0.0.ts
 *
 * RACCCA in Practice (A12) gets the Fabrication Detector treatment:
 *
 *   - Step 2 becomes the pinned-right workspace where the user pastes
 *     the AI-generated content. Re-uses the highlighter_workspace
 *     widget (same component A8 uses), pin_to_side: true so the text
 *     stays visible on the right while the learner scrolls through
 *     the per-dimension steps. Highlighting maps cleanly to RACCCA
 *     scores (green/yellow/red ≈ Strong/Adequate/Weak), so the
 *     learner can mark evidence in-place if they want.
 *   - Steps 3-8 each get a `scorecard` widget in single mode for
 *     their dimension (Relevance, Accuracy, Currency, Credibility,
 *     Coverage, Audience). One dropdown — Strong / Adequate / Weak —
 *     plus an evidence textarea. All six steps share one storageKey
 *     so the scores persist across the activity.
 *   - Step 9 becomes the transposed scorecard: a vertical stack
 *     (long, not wide) of all six dimensions, each row mirroring its
 *     dropdown + evidence from the matching earlier step, plus the
 *     final verdict field. Mode = "summary".
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

const SCORECARD_KEY = "activity-12-raccca-scorecard-v2";
const WORKSPACE_KEY = "activity-12-raccca-workspace";

const DIMENSIONS = [
  {
    id: "relevance",
    label: "Relevance",
    placeholder:
      "Was this paragraph the right tool for the reader's actual job?",
  },
  {
    id: "accuracy",
    label: "Accuracy",
    placeholder: "Specific claims you verified — and how you verified them.",
  },
  {
    id: "currency",
    label: "Currency",
    placeholder: "Dates checked. Anything time-sensitive that's stale?",
  },
  {
    id: "credibility",
    label: "Credibility",
    placeholder: "Sources assessed. Real, fabricated, or weak?",
  },
  {
    id: "coverage",
    label: "Coverage",
    placeholder: "What's missing? Perspectives, counter-arguments, caveats?",
  },
  {
    id: "audience",
    label: "Audience",
    placeholder:
      "Tone / complexity / framing mismatch with the intended reader?",
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // -------- Step 2: pinned highlighter workspace --------
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Paste the AI-generated content into the workspace on the right (or below on narrow screens). It stays pinned while you score each RACCCA dimension, so you can keep referring back to the exact text.",
      detailed_help:
        "**Why a pinned workspace.** RACCCA is six passes over the same content. Bouncing between a paragraph in another tab and the rubric is where evaluations get sloppy. The workspace keeps the text visible while you score.\n\n**Highlighting is optional but useful.** The workspace lets you highlight passages green / yellow / red — those map directly to Strong / Adequate / Weak, so you can mark evidence in-place as you read. If you'd rather just read and score, ignore the highlighter; the dropdowns in the next steps are what's persisted to the deliverable.",
      interactive_type: "highlighter_workspace",
      interactive_data: {
        storageKey: WORKSPACE_KEY,
        title: "AI content under evaluation",
        placeholder:
          "Paste the AI-generated paragraph(s) you're evaluating here.",
      },
      pin_to_side: true,
    })
    .eq("activity_id", 12)
    .eq("step_number", 2);
  console.log("✓ A12 step 2 — highlighter_workspace pinned right");

  // -------- Steps 3-8: scorecard single per dimension --------
  // step 3 = Relevance, step 4 = Accuracy, …, step 8 = Audience.
  for (let i = 0; i < DIMENSIONS.length; i++) {
    const stepNumber = 3 + i;
    const d = DIMENSIONS[i];
    await sb
      .from("activity_guide_steps")
      .update({
        interactive_type: "scorecard",
        interactive_data: {
          storageKey: SCORECARD_KEY,
          mode: "single",
          dimensionId: d.id,
          dimensionLabel: d.label,
          dimensionPlaceholder: d.placeholder,
        },
      })
      .eq("activity_id", 12)
      .eq("step_number", stepNumber);
    console.log(`✓ A12 step ${stepNumber} — scorecard single (${d.label})`);
  }

  // -------- Step 9: scorecard summary + verdict --------
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Review every dimension together below. The dropdowns and notes mirror what you scored in steps 3-8 — adjust here if your read changed once you saw the full picture. Then write the final verdict (use as-is / revise / discard) and capture all of it in the deliverable box at the bottom of this page.",
      detailed_help:
        "**The verdict is the output. Strong / Adequate / Weak per dimension is the evidence.** \"Use as-is\" requires Strong on Relevance, Accuracy, and Audience at minimum. \"Revise with specific changes\" is the right call when the issues are tractable. \"Discard\" is the right call when fixing the AI output would take longer than starting from your own.",
      interactive_type: "scorecard",
      interactive_data: {
        storageKey: SCORECARD_KEY,
        mode: "summary",
        dimensions: DIMENSIONS.map((d) => ({ id: d.id, label: d.label })),
        showVerdict: true,
        verdictPlaceholder:
          "Use as-is / Revise (with the specific changes) / Discard — and one sentence on why.",
      },
    })
    .eq("activity_id", 12)
    .eq("step_number", 9);
  console.log("✓ A12 step 9 — scorecard summary (transposed, long not wide)");
}

main();
