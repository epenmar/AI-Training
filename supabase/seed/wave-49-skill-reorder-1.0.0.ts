/**
 * wave-49-skill-reorder-1.0.0.ts
 *
 * Reorder the 12 active skills:
 *   - skill_id 17 "Critical AI judgment"     → display_order 1 (was 10)
 *   - skill_id 18 "Bias and equity in AI"    → display_order 8 (was 11; moves to right after "Verify what AI gives you")
 *
 * Everything else slides to keep relative order:
 *
 *   1  Critical AI judgment            (skill_id 17)  ← was 10
 *   2  Iterative dialogue              (skill_id 2)
 *   3  Tool choice                     (skill_id 1)
 *   4  Learning with AI                (skill_id 14)
 *   5  Editing AI output               (skill_id 5)
 *   6  Creative use                    (skill_id 11)
 *   7  Verify what AI gives you        (skill_id 15)
 *   8  Bias and equity in AI           (skill_id 18)  ← was 11
 *   9  Data & privacy                  (skill_id 7)
 *   10 Build with AI                   (skill_id 16)
 *   11 Disclosure                      (skill_id 9)
 *   12 Staying current                 (skill_id 13)
 *
 * Dependency audit (separate report) confirmed everything else reads
 * display_order dynamically. No code changes needed:
 *   - Learning paths page, activities index, dashboard, recommendations
 *     engine all use ORDER BY display_order
 *   - Skill icon mappings + activity bridge URLs key off stable
 *     skill.id / activity.id, not display_order
 *   - The {{prompt:}} clickable keep-set in wave-45 ([skill 2, skill 1])
 *     is intentionally preserved by skill identity, not by current
 *     display position — those are still the skills that naturally
 *     introduce the term, even though they're no longer the first two
 *     by display order. (Memory note updated to reflect this.)
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

// New display_order, keyed by stable skill_id. Order matters for
// readability only — the update applies them all by primary key.
const NEW_ORDER: Array<[number, number]> = [
  [17, 1], // Critical AI judgment — moved from 10 to 1
  [2, 2], // Iterative dialogue
  [1, 3], // Tool choice
  [14, 4], // Learning with AI
  [5, 5], // Editing AI output
  [11, 6], // Creative use
  [15, 7], // Verify what AI gives you
  [18, 8], // Bias and equity in AI — moved from 11 to right after Verify
  [7, 9], // Data & privacy
  [16, 10], // Build with AI: agents, visuals, mechanics
  [9, 11], // Disclosure
  [13, 12], // Staying current
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // Defensive: confirm we're operating on the active 12.
  const { data: active } = await sb
    .from("skills")
    .select("id, short_name, is_active, display_order")
    .eq("is_active", true);
  const activeIds = new Set((active ?? []).map((s) => s.id));
  const planned = new Set(NEW_ORDER.map(([id]) => id));
  if (
    activeIds.size !== planned.size ||
    [...activeIds].some((id) => !planned.has(id))
  ) {
    throw new Error(
      `Plan/active mismatch — active: [${[...activeIds].join(",")}], plan: [${[...planned].join(",")}]`
    );
  }

  // Two-phase update to avoid violating any UNIQUE(display_order)
  // constraint mid-flight (none currently exists, but safe by default).
  // Phase 1: shift everything to a high range.
  for (const [skillId] of NEW_ORDER) {
    await sb
      .from("skills")
      .update({ display_order: 100 + skillId })
      .eq("id", skillId);
  }
  // Phase 2: set the final values.
  for (const [skillId, order] of NEW_ORDER) {
    await sb
      .from("skills")
      .update({ display_order: order })
      .eq("id", skillId);
    console.log(`✓ skill ${skillId} → display_order ${order}`);
  }

  // Print final state for verification.
  const { data: after } = await sb
    .from("skills")
    .select("id, short_name, display_order")
    .eq("is_active", true)
    .order("display_order");
  console.log("\nFinal active-skill order:");
  for (const s of after ?? []) {
    console.log(`  ${s.display_order}. ${s.short_name} (id=${s.id})`);
  }
}

main();
