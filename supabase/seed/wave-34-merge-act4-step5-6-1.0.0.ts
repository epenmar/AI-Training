/**
 * wave-34-merge-act4-step5-6-1.0.0.ts
 *
 * Activity 4 (My First AI Conversation): merge step 5 (re-read +
 * one-sentence diff) and step 6 (broader reflection + deliverable
 * pointer + forward bridge) into a single final step. Both were
 * reflective and overlapping; the user shouldn't write two
 * reflections.
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

  const newInstruction =
    "After turn 5, re-read the whole conversation. In the deliverable box at the bottom of this page: note how the final response differs from the first, whether the conversation went somewhere you didn't expect, and what you'd do differently next time.";

  const newHelp =
    "**What you're looking for:** the difference between turn 1 and turn 5 is the difference between what AI gives *anyone* on this topic and what it gives *you* after your steering. Maybe the final response uses a specific example you asked for, maybe it concedes a point, maybe it's more nuanced. Maybe it still sounds canned, that's also useful data.\n\n**The underlying skill:** treating AI as a thinking partner rather than an answer machine. One-shot prompts get you the surface; conversations get you somewhere you couldn't have gone alone. It happens because you push — asking why, asking for examples, redirecting. Next time you're tempted to take the first answer, remember how different turn 5 was.\n\n**Where this goes next.** The Foundational → Intermediate activity for this skill, [The Anchoring Breaker](/activities/5), uses the multi-turn habit you just built to deliberately push AI off its first answer.";

  // Replace step 5 with the merged content.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction: newInstruction,
      detailed_help: newHelp,
    })
    .eq("activity_id", 4)
    .eq("step_number", 5);

  // Delete the old step 6.
  await sb
    .from("activity_guide_steps")
    .delete()
    .eq("activity_id", 4)
    .eq("step_number", 6);

  console.log("✓ activity 4: steps 5 and 6 merged into a single step 5");
}

main();
