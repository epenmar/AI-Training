/**
 * wave-71-skill6-reviewer-notes-1.0.0.ts
 *
 * Skill 6 (Creative use) reviewer notes from the Coda feedback form,
 * approved 2026-06-26.
 *
 * A31 — The Unexpected Prompt (New -> Foundational)
 *   "Objective: Change 'See what AI surfaces when given creative
 *    latitude' to 'Evaluate what AI surfaces when given creative
 *    latitude'."
 *     -> Objective verb See -> Evaluate.
 *
 * A32 — Reimagine an Assignment (Foundational -> Intermediate)
 *   "A good extension might be to evaluate the AI option and determine
 *    if AI provides a valuable addition to the course and identify why
 *    or why not ... AI isn't going to be a beneficial addition to every
 *    situation."
 *     -> Add an optional extension (owner: extension, not woven into the
 *        core flow) that has the learner judge whether AI genuinely
 *        improves the AI-as-tool alternative they generated.
 *
 * A33 — Design a Novel AI Learning Experience: praise only, no change.
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

  // ---- A31: objective See -> Evaluate ----
  const { data: a31 } = await sb
    .from("level_up_activities")
    .select("objectives")
    .eq("id", 31)
    .single();
  const a31Obj = (a31?.objectives as string[] | null) ?? [];
  const a31New = a31Obj.map((o) =>
    o.startsWith("See what AI surfaces when given creative latitude")
      ? o.replace(/^See\b/, "Evaluate")
      : o
  );
  await sb
    .from("level_up_activities")
    .update({ objectives: a31New })
    .eq("id", 31);
  console.log(`✓ A31 objective — "See" -> "Evaluate" (${JSON.stringify(a31New)})`);

  // ---- A32: add the "does AI actually add value?" optional extension ----
  const a32Description =
    "Overview: In this activity, you will take one existing assignment and use AI to generate three creative alternatives that meet the same learning objective differently — at least one treating AI as a student-facing tool. You'll pick your favorite and use AI to draft the actual student-facing assignment description page.\n\n" +
    "Optional extension: Decide whether AI actually belongs in the assignment.\n\n" +
    "Take the AI-as-tool alternative you generated and judge it honestly — does AI make the learning *better* here, or just busier? Write 2-3 sentences on why or why not, and name what would have to be true for AI to be the right call. That's the case you'd make to a faculty member about when AI is, and isn't, worth building in — because AI isn't a beneficial addition to every assignment or course, and being able to say *why not* is as useful as saying why.";

  await sb
    .from("level_up_activities")
    .update({ description: a32Description })
    .eq("id", 32);
  console.log("✓ A32 — optional extension added (judge whether AI adds value)");

  // ---- Resolve any open reviewer notes on A31/A32/A33 ----
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .in("activity_id", [31, 32, 33]);
  const rowIds = ["31", "32", "33", ...(steps ?? []).map((s) => String(s.id))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sbAny = sb as any;
  const { data: resolved, error } = await sbAny
    .from("admin_edit_comments")
    .update({
      status: "resolved",
      resolved_by: admin?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("status", "open")
    .in("row_id", rowIds)
    .select("id");
  if (error) {
    console.warn("(could not resolve notes) " + error.message);
  } else {
    console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A31/A32/A33`);
  }
}

main();
