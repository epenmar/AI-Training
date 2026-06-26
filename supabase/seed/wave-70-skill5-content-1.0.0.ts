/**
 * wave-70-skill5-content-1.0.0.ts
 *
 * Skill 5 (Editing AI output) reviewer notes — the content items.
 * (The A13 "Suggest tools / evergreen vetted list" note was handled by
 * the suggest-tools catalog work: migration 023 + wave-69 + the route.)
 *
 * A14 — The Style Coach (Foundational -> Intermediate)
 *   "Extension idea: Have AI develop a personal style guide for your
 *    writing style (syntax, sentence structure, commonly used vocab,
 *    etc.). You can also have AI develop a style guide for a specific
 *    project ... I had AI develop a dissertation style guide."
 *     -> Add the style-guide extension ALONGSIDE the existing spoken-
 *        voice one (owner: add, learner picks). The page renders a
 *        single "Optional extension: " block — headline before the
 *        first blank line, directions after — so both options live in
 *        one block under a "pick whichever" headline.
 *
 * A15 — The Refinement Loop (Intermediate -> Advanced)
 *   "change 'See how output quality evolves across multiple passes' to
 *    'Assess how output quality evolves across multiple passes.'"
 *     -> Objective verb See -> Assess.
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

  // ---- A14: add the personal/project style-guide extension ----
  const a14Description =
    "Overview: In this activity, you will paste a sample of your own writing and ask AI to describe your style, then have it redraft a short piece in that voice. You'll fix what's still off by hand and produce a single comparison visual showing the three versions and where AI fell short.\n\n" +
    "Optional extension: Two ways to push further — pick whichever interests you.\n\n" +
    "**Build a reusable style guide.** Ask AI to turn its analysis of your sample into a personal style guide — your syntax, sentence structure, go-to vocabulary, punctuation habits, and the moves you avoid. Save it and paste it into future prompts so every draft starts closer to your voice. You can also scope a guide to a specific project (a course redesign, a grant, a dissertation) so it fits that work's register.\n\n" +
    "**Clone your spoken voice.** Try the same calibration probe on your *spoken* voice. (1) Record yourself reading 1-2 sentences in your normal voice. (2) Use an AI voice tool — the Suggest-tools button surfaces current options; many produce voice clones from short samples. (3) Have it read the AI-revised draft *as you*. (4) Compare the audio match against the written-voice match — same probe, different modality. Submit the audio file as your share if it's the more interesting artifact.";

  await sb
    .from("level_up_activities")
    .update({ description: a14Description })
    .eq("id", 14);
  console.log("✓ A14 — style-guide extension added alongside spoken-voice");

  // ---- A15: objective See -> Assess ----
  const { data: a15 } = await sb
    .from("level_up_activities")
    .select("objectives")
    .eq("id", 15)
    .single();
  const objectives = (a15?.objectives as string[] | null) ?? [];
  const newObjectives = objectives.map((o) =>
    o.startsWith("See how output quality evolves")
      ? o.replace(/^See\b/, "Assess")
      : o
  );
  await sb
    .from("level_up_activities")
    .update({ objectives: newObjectives })
    .eq("id", 15);
  console.log(
    `✓ A15 objective — "See" -> "Assess" (${JSON.stringify(newObjectives)})`
  );

  // ---- Resolve any open reviewer notes on A13/A14/A15 ----
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .in("activity_id", [13, 14, 15]);
  const rowIds = ["13", "14", "15", ...(steps ?? []).map((s) => String(s.id))];
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
    console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A13/A14/A15`);
  }
}

main();
