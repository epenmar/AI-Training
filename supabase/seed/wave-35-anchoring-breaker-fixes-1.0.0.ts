/**
 * wave-35-anchoring-breaker-fixes-1.0.0.ts
 *
 * Activity 5 (The Anchoring Breaker) text-only fixes:
 *   - Step 4 instruction: clarify that Round 1 is mirrored from
 *     step 2; the user paste only Round 2.
 *   - Step 5 instruction: drop "gold" from "click the gold checkbox"
 *     since the box itself isn't gold (only the row highlight is).
 *   - Step 6 instruction: tighter pointer to the deliverable box.
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

  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Paste each of the AI's new ideas into a Round 2 box. Round 1 is shown alongside, mirrored from step 2 — you don't need to re-type those.",
    })
    .eq("activity_id", 5)
    .eq("step_number", 4);
  console.log("✓ step 4 instruction updated");

  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Compare the two rounds below. Click the checkbox next to any Round 2 idea that only appeared after you broke the anchor — the row will highlight so the standouts are easy to spot at a glance.",
    })
    .eq("activity_id", 5)
    .eq("step_number", 5);
  console.log("✓ step 5 instruction updated (dropped 'gold')");

  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Capture your one-sentence reflection in the deliverable box at the bottom of this page: which round was more useful, and what does that tell you about how AI defaults work?",
    })
    .eq("activity_id", 5)
    .eq("step_number", 6);
  console.log("✓ step 6 instruction updated (clearer deliverable pointer)");
}

main();
