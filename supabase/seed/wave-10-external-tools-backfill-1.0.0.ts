/**
 * wave-10-external-tools-backfill-1.0.0.ts
 *
 *   1. Backfill: every step that already had show_asu_resources=true keeps
 *      its current behavior (both ASU platform + external tools shown).
 *   2. Tool Safari step 1: external tools off — the activity is built
 *      around Compare AI, so the generic suggester just adds noise.
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

  const { data: rows, error } = await sb
    .from("activity_guide_steps")
    .select("id,activity_id,step_number,show_asu_resources")
    .eq("show_asu_resources", true);
  if (error) throw error;

  let on = 0;
  for (const r of rows ?? []) {
    const { error: uErr } = await sb
      .from("activity_guide_steps")
      .update({ show_external_tools: true })
      .eq("id", r.id);
    if (uErr) console.error(`  x ${r.id}:`, uErr.message);
    else on++;
  }
  console.log(`backfilled show_external_tools=true on ${on} steps`);

  // Tool Safari step 1: external tools off.
  const { error: offErr } = await sb
    .from("activity_guide_steps")
    .update({ show_external_tools: false })
    .eq("activity_id", 1)
    .eq("step_number", 1);
  if (offErr) console.error("  x activity 1 step 1:", offErr.message);
  else console.log("✓ activity 1 step 1 external tools off");
}

main();
