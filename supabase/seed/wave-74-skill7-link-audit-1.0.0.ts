/**
 * wave-74-skill7-link-audit-1.0.0.ts
 *
 * Skill 7 reviewer note (A8 resources): "two give errors, one doesn't
 * seem directly related." Verified live:
 *   - https://lib.asu.edu/databases -> HTTP 404 (the ASU Library link,
 *     used both inline in A8 step 3 help AND in extra_sources). Correct
 *     A-Z databases URL is https://libguides.asu.edu/az/databases.
 *   - Civic Online Reasoning (cor.stanford.edu/curriculum) loads but is
 *     K-12 civic/news literacy — not academic citation verification, so
 *     it's the "not directly related" item. Remove from A8 (the reviewer
 *     found A7's resources relevant, so leave it there).
 *   (Checkology, the other dead link, was removed in wave-72.)
 *
 * The broken ASU Library URL is repaired everywhere it appears (a 404 is
 * a 404 regardless of activity).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const BROKEN = "https://lib.asu.edu/databases";
const FIXED = "https://libguides.asu.edu/az/databases";
const STANFORD_COR = "https://cor.stanford.edu/curriculum/";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // 1) Fix the broken ASU Library URL inline in any step help.
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id, activity_id, step_number, detailed_help")
    .ilike("detailed_help", `%${BROKEN}%`);
  for (const s of steps ?? []) {
    const fixed = (s.detailed_help ?? "").split(BROKEN).join(FIXED);
    await sb
      .from("activity_guide_steps")
      .update({ detailed_help: fixed })
      .eq("id", s.id);
    console.log(`✓ A${s.activity_id} step ${s.step_number} — inline ASU Library URL repaired`);
  }
  if ((steps ?? []).length === 0) console.log("(no inline ASU Library links found)");

  // 2) Fix the broken URL in any activity's extra_sources.
  type ExtraSource = { url?: string; [k: string]: unknown };
  const { data: acts } = await sb
    .from("level_up_activities")
    .select("id, extra_sources");
  for (const a of acts ?? []) {
    const extras = Array.isArray(a.extra_sources)
      ? (a.extra_sources as ExtraSource[])
      : [];
    let changed = false;
    let next = extras.map((e) => {
      if ((e?.url ?? "") === BROKEN) {
        changed = true;
        return { ...e, url: FIXED };
      }
      return e;
    });
    // Drop the off-topic Civic Online Reasoning link from A8 only.
    if (a.id === 8) {
      const before = next.length;
      next = next.filter((e) => (e?.url ?? "") !== STANFORD_COR);
      if (next.length !== before) changed = true;
    }
    if (changed) {
      await sb
        .from("level_up_activities")
        .update({ extra_sources: next })
        .eq("id", a.id);
      console.log(`✓ A${a.id} — extra_sources updated (${next.length} sources)`);
    }
  }
}

main();
