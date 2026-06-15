/**
 * wave-64-skill1-feedback-1.0.0.ts
 *
 * Skill 1 (Critical AI judgment) feedback pass — the two items that
 * didn't need Canvas access (source-precision is blocked on auth):
 *
 *   A35 (Decision Framework Draft) step 1: rename the sort_buckets
 *     "Default to AI" bucket to "Lead with AI (low-stakes)" so it
 *     doesn't read as "hand it to AI with no human review." Updates
 *     the matching rationale too.
 *   A28 (Three Things AI Can and Can't Do) step 4: add a one-line
 *     pointer to the Explore Sources and Resources box, since the
 *     reviewer wasn't sure where the deeper sources lived.
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

  // ---- A35 step 1: rename the "Default to AI" bucket ----
  const { data: s1 } = await sb
    .from("activity_guide_steps")
    .select("interactive_data")
    .eq("activity_id", 35)
    .eq("step_number", 1)
    .single();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = s1?.interactive_data as any;
  if (data?.buckets) {
    data.buckets = data.buckets.map((b: { id: string; label: string }) =>
      b.id === "yes" ? { ...b, label: "Lead with AI (low-stakes)" } : b
    );
  }
  if (data?.items) {
    data.items = data.items.map(
      (it: { rationale?: string }) =>
        it.rationale?.includes('default to AI')
          ? {
              ...it,
              rationale: it.rationale.replace(
                /A solid "default to AI" case\./i,
                "A solid lead-with-AI case."
              ),
            }
          : it
    );
  }
  await sb
    .from("activity_guide_steps")
    .update({ interactive_data: data })
    .eq("activity_id", 35)
    .eq("step_number", 1);
  console.log('✓ A35 step 1 — bucket renamed to "Lead with AI (low-stakes)"');

  // ---- A28 step 4: pointer to the Explore Sources and Resources box ----
  const { data: a28s4 } = await sb
    .from("activity_guide_steps")
    .select("detailed_help")
    .eq("activity_id", 28)
    .eq("step_number", 4)
    .single();
  const help =
    (a28s4?.detailed_help ?? "").replace(/\s+$/, "") +
    "\n\nWant to go deeper? The Explore Sources and Resources box at the bottom of this page has the underlying Canvas modules on what AI can and can't do.";
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: help })
    .eq("activity_id", 28)
    .eq("step_number", 4);
  console.log("✓ A28 step 4 — pointer to Explore Sources and Resources box");
}

main();
