/**
 * update-step-links-1.0.0.ts
 *
 * Replace named-page references in step instructions with direct markdown
 * links. The activity detail page already renders `[text](url)` as an
 * anchor via renderRichText, so no schema change is needed — we just swap
 * the strings.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type StepUpdate = {
  activityId: number;
  stepNumber: number;
  instruction: string;
};

const VITRA_URL =
  "https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra";
const SCHOLAR_URL = "https://scholar.google.com";
const ASU_AI_HUB_URL = "https://ai.asu.edu";
const ASU_SYLLABUS_POLICY_URL =
  "https://canvas.asu.edu/courses/157584/pages/syllabus-statements-for-generative-ai";

const stepUpdates: StepUpdate[] = [
  {
    // Activity 3: Tool Audit & Recommendation Brief
    activityId: 3,
    stepNumber: 2,
    instruction: `Check its VITRA status: go to [ASU's tool approval page (VITRA)](${VITRA_URL}) or ask your IT liaison, and document whether it's approved, under review, or not yet submitted.`,
  },
  {
    // Activity 7: Source Check Challenge
    activityId: 7,
    stepNumber: 3,
    instruction: `Open [Google Scholar](${SCHOLAR_URL}). Search for each article by its exact title.`,
  },
  {
    // Activity 8: The Fabrication Detector
    activityId: 8,
    stepNumber: 3,
    instruction: `For each citation: search for it in [Google Scholar](${SCHOLAR_URL}) or your library database. Highlight green if it exists and the AI described it accurately.`,
  },
  {
    // Activity 25: Find the Policy
    activityId: 25,
    stepNumber: 1,
    instruction: `Look up ASU's current guidance on disclosing AI use in faculty or staff work. Start at [ASU's AI hub](${ASU_AI_HUB_URL}) or the [Syllabus statements for generative AI](${ASU_SYLLABUS_POLICY_URL}) page in Canvas. Bookmark what you find and write a 1-sentence summary.`,
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  for (const s of stepUpdates) {
    const { error, count } = await sb
      .from("activity_guide_steps")
      .update({ instruction: s.instruction }, { count: "exact" })
      .eq("activity_id", s.activityId)
      .eq("step_number", s.stepNumber);
    if (error) {
      console.error(
        `Step ${s.stepNumber} of activity #${s.activityId} failed:`,
        error.message
      );
    } else {
      console.log(
        `✓ Step ${s.stepNumber} of activity #${s.activityId} updated (${count} row)`
      );
    }
  }

  console.log("\nDone.");
}

main();
