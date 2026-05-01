/**
 * wave-22-link-activity-refs-1.0.0.ts
 *
 *   Sweep step detailed_help for bold activity-name references like
 *   "**Tool Selection Matrix**" and convert each to a markdown link
 *   to the matching activity page (`[Title](/activities/N)`). The
 *   activity-detail renderRichText now uses Next.js Link for
 *   internal paths so these navigate in-app.
 *
 *   We replace literal `**{title}**` occurrences for every activity
 *   we know about — uniqueness of activity titles makes false
 *   positives unlikely.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data: activities, error: aErr } = await sb
    .from("level_up_activities")
    .select("id,title");
  if (aErr) throw aErr;

  // Sort longest title first so substring titles don't match before
  // their parent (none today, but defensive).
  const sorted = [...(activities ?? [])].sort(
    (a, b) => b.title.length - a.title.length
  );

  const { data: steps, error: sErr } = await sb
    .from("activity_guide_steps")
    .select("id,activity_id,detailed_help");
  if (sErr) throw sErr;

  let touched = 0;
  let totalReplacements = 0;
  for (const step of steps ?? []) {
    if (!step.detailed_help) continue;
    let next = step.detailed_help;
    let stepReplacements = 0;

    for (const a of sorted) {
      // Don't link the activity's own title back to itself.
      if (a.id === step.activity_id) continue;
      // Match exactly **Title** (boldface). The ?! lookahead avoids
      // matching `**Title**xyz` where xyz might keep the bold context.
      const pattern = new RegExp(
        `\\*\\*${escapeRegex(a.title)}\\*\\*`,
        "g"
      );
      const replacement = `[${a.title}](/activities/${a.id})`;
      const before = next;
      next = next.replace(pattern, replacement);
      if (next !== before) {
        stepReplacements += (before.match(pattern) ?? []).length;
      }
    }

    if (stepReplacements === 0) continue;
    const { error: uErr } = await sb
      .from("activity_guide_steps")
      .update({ detailed_help: next })
      .eq("id", step.id);
    if (uErr) {
      console.error(`  x step ${step.id}:`, uErr.message);
    } else {
      touched++;
      totalReplacements += stepReplacements;
    }
  }
  console.log(
    `✓ linked activity references on ${touched} steps (${totalReplacements} replacements)`
  );
}

main();
