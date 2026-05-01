/**
 * wave-14-resource-rebalance-1.0.0.ts
 *
 * Per the latest review, "most of the time we won't need both" Compare AI
 * and the external-tool suggester. Apply per-step judgment:
 *
 *   - Activities about model variance (skills 2, 4, 10) → Compare AI
 *     only; external tools off.
 *   - Activities about creating with ASU's platform (skills 6, 11, 14)
 *     → Build in Create AI only; external tools off.
 *   - Activities where the platform callout doesn't render anyway
 *     (skills 5, 7, 8, plus IA tier of 1, 3, 4) → external tools only;
 *     unset show_asu_resources so the data matches what's visible.
 *   - Skill 3 NF/FI (Source Check, Fabrication Detector) → external
 *     tools only (verification doesn't benefit much from cross-model
 *     comparison).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type Decision = {
  activityId: number;
  stepNumber: number;
  asu: boolean;
  ext: boolean;
};

const decisions: Decision[] = [
  // Compare AI only (model-variance activities)
  { activityId: 4, stepNumber: 2, asu: true, ext: false },
  { activityId: 5, stepNumber: 2, asu: true, ext: false },
  { activityId: 6, stepNumber: 2, asu: true, ext: false },
  { activityId: 10, stepNumber: 2, asu: true, ext: false },
  { activityId: 11, stepNumber: 2, asu: true, ext: false },
  { activityId: 28, stepNumber: 2, asu: true, ext: false },

  // Build in Create AI only (skills 6, 11, 14)
  { activityId: 16, stepNumber: 2, asu: true, ext: false },
  { activityId: 18, stepNumber: 1, asu: true, ext: false },
  { activityId: 31, stepNumber: 1, asu: true, ext: false },
  { activityId: 32, stepNumber: 2, asu: true, ext: false },
  { activityId: 40, stepNumber: 1, asu: true, ext: false },
  { activityId: 41, stepNumber: 2, asu: true, ext: false },

  // External tools only (no platform callout would render anyway, OR the
  // activity benefits more from external tool variety than from comparison)
  { activityId: 3, stepNumber: 1, asu: false, ext: true },
  { activityId: 7, stepNumber: 1, asu: false, ext: true },
  { activityId: 8, stepNumber: 1, asu: false, ext: true },
  { activityId: 9, stepNumber: 1, asu: false, ext: true },
  { activityId: 12, stepNumber: 1, asu: false, ext: true },
  { activityId: 13, stepNumber: 1, asu: false, ext: true },
  { activityId: 14, stepNumber: 1, asu: false, ext: true },
  { activityId: 15, stepNumber: 1, asu: false, ext: true },
  { activityId: 19, stepNumber: 2, asu: false, ext: true },
  { activityId: 20, stepNumber: 3, asu: false, ext: true },
  { activityId: 21, stepNumber: 2, asu: false, ext: true },
  { activityId: 22, stepNumber: 2, asu: false, ext: true },
  { activityId: 23, stepNumber: 2, asu: false, ext: true },
  { activityId: 24, stepNumber: 1, asu: false, ext: true },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);
  for (const d of decisions) {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({
        show_asu_resources: d.asu,
        show_external_tools: d.ext,
      })
      .eq("activity_id", d.activityId)
      .eq("step_number", d.stepNumber);
    if (error)
      console.error(`  x ${d.activityId}/${d.stepNumber}:`, error.message);
    else
      console.log(
        `✓ ${d.activityId}/${d.stepNumber} asu=${d.asu} ext=${d.ext}`
      );
  }
  console.log(`\n${decisions.length} re-balanced steps.`);
}

main();
