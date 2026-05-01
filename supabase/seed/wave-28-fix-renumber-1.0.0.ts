/**
 * wave-28-fix-renumber-1.0.0.ts
 *
 * Fix the bad renumbering wave-27 introduced. The previous script's
 * sequential UPDATE chain (6→5, then 5→4, then 4→3) cascaded because
 * after the first update there were two rows with step_number=5,
 * which the second update then both matched, etc. End state: three
 * rows all sharing step_number=3 with the same instruction.
 *
 * Identify each row by its primary key (id) and assign correct
 * step_number + restore the right instruction for steps 4 and 5.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// IDs identified from a SELECT before this script runs:
//   id 45 — was originally step 4 (Run the workflow + gate-tracking interactive). Stays as step 3.
//   id 46 — was originally step 5 (Write up). Should become step 4 with Write-up instruction.
//   id 47 — was originally step 6 (Package as template). Should become step 5 with Package instruction.
const STEP_4_INSTRUCTION =
  "Write up where AI added value (speed, breadth, connections you missed) and where it introduced risk against your step-1 question. Capture this in the deliverable box at the bottom of this page.";
const STEP_4_HELP =
  "**Honest write-up beats favorable.** \"AI added value at stage 1 (breadth of initial sources) and stage 4 (synthesis structure). It introduced risk at stage 1 (5 of 12 sources didn't exist) and stage 4 (synthesized findings the source papers didn't actually claim).\" That's the kind of note that transfers to the next research question.";

const STEP_5_INSTRUCTION =
  "Package the workflow as a reusable template a colleague could follow without you in the room.";
const STEP_5_HELP =
  "**A reusable template means a colleague could run your workflow without you in the room.** Each gate gets a sentence on what to look for. Each stage gets the prompt or process you used. Save it where the team can find it.";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // Phase 1: park the conflicting rows at non-conflicting offsets so
  // the second update doesn't match three rows.
  await sb
    .from("activity_guide_steps")
    .update({ step_number: 104 })
    .eq("id", 46);
  await sb
    .from("activity_guide_steps")
    .update({ step_number: 105 })
    .eq("id", 47);
  console.log("✓ parked rows 46, 47 at offsets 104, 105");

  // Phase 2: assign their final numbers + restore their original
  // instructions/help (which got clobbered by wave-27).
  await sb
    .from("activity_guide_steps")
    .update({
      step_number: 4,
      instruction: STEP_4_INSTRUCTION,
      detailed_help: STEP_4_HELP,
      interactive_type: null,
      interactive_data: null,
    })
    .eq("id", 46);
  await sb
    .from("activity_guide_steps")
    .update({
      step_number: 5,
      instruction: STEP_5_INSTRUCTION,
      detailed_help: STEP_5_HELP,
      interactive_type: null,
      interactive_data: null,
    })
    .eq("id", 47);

  console.log("✓ row 46 → step 4 (Write up); row 47 → step 5 (Package)");
  console.log("\nDone.");
}

main();
