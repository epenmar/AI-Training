/**
 * wave-32-strip-step1-bridge-1.0.0.ts
 *
 * Activity 4 (My First AI Conversation) step 1 mistakenly carries a
 * "Where this goes next" forward bridge that belongs only on the
 * final step (which already has it). Strip the bridge from step 1.
 *
 * Audit confirmed this is the only offender across all activities.
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
  const { data: row } = await sb
    .from("activity_guide_steps")
    .select("id,detailed_help")
    .eq("activity_id", 4)
    .eq("step_number", 1)
    .single();
  if (!row?.detailed_help) {
    console.log("nothing to strip");
    return;
  }
  // Cut the bridge paragraph (everything from "**Where this goes next**" on)
  // and any trailing whitespace.
  const cleaned = row.detailed_help
    .replace(/\n{0,2}\*\*Where this goes next.*$/s, "")
    .trim();
  if (cleaned === row.detailed_help.trim()) {
    console.log("no bridge text matched the strip pattern");
    return;
  }
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: cleaned })
    .eq("id", row.id);
  console.log("✓ activity 4 step 1 — forward bridge removed");
}

main();
