/**
 * wave-39-feedback-batch-1.0.0.ts
 *
 * Four-part feedback batch:
 *   1. A41 (Teach Me a Feature) step 3 — turn the three failure modes
 *      from explanatory prose in detailed_help into clickable vocab
 *      reveals in the instruction itself.
 *   2. A42 (Meta-Learning Protocol) step 7 — point users at the
 *      deliverable box at the bottom of the page (was a generic
 *      "write up the protocol" instruction with no detailed_help).
 *   3. A13 (Before & After) step 4 — drop the sort_buckets interactive
 *      (the "human" examples in the seeded data used em-dashes, the
 *      same tell as the AI examples; the activity wasn't well-formed).
 *      Also drop the inline "Input quality = output quality reference
 *      (PDF, p. 2)" mention — that PDF is already in this activity's
 *      Sources and Resources callout.
 *   4. Strip {{prompt:...}} and {{tone:...}} clickable vocab from all
 *      Intermediate → Advanced band steps. The clickable definitions
 *      are pedagogy aimed at first encounters; they're noise on the
 *      advanced track where readers already know these terms.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

function stripPromptToneVocab(text: string | null): string | null {
  if (text == null) return null;
  // Match {{prompt:def}} / {{tone:def}} — definitions never contain
  // `}` in current content, so [^}]* is safe.
  return text.replace(/\{\{(prompt|tone):[^}]*\}\}/gi, (_, term) => term);
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ---------- 1. A41 step 3 — failure modes as clickable vocab ----------
  const a41Step3Instruction =
    "Follow the steps exactly as given. Note any step that's unclear, wrong, or missing. Three failure modes to watch: " +
    "{{step skipping:AI assumes you know how to do something obvious (\"open the app\") that's actually different in the version you're using.}}, " +
    "{{wrong UI:AI describes a button that doesn't exist in the current interface — UIs change faster than training data.}}, and " +
    '{{vague pointer:"Go to the menu" without saying which menu — the AI gives a direction but skips the locator.}}.';
  const a41Step3Help =
    "**Follow exactly, even if you can guess what's next.** The point isn't to learn the feature; the point is to learn where AI's instructions break down.\n\nTap each bolded term in the instruction above to see how that failure shows up. The next step is where you tell the AI what happened — that's the meta-skill.";
  {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({
        instruction: a41Step3Instruction,
        detailed_help: a41Step3Help,
      })
      .eq("activity_id", 41)
      .eq("step_number", 3);
    if (error) throw error;
    console.log("✓ A41 step 3 — failure modes as clickable vocab");
  }

  // ---------- 2. A42 step 7 — point to deliverable box ----------
  const a42Step7Instruction =
    "Capture your reusable protocol document in the deliverable box at the bottom of this page — annotated with where the protocol worked, where it fell short, and how you'd adapt it for a colleague.";
  {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({ instruction: a42Step7Instruction })
      .eq("activity_id", 42)
      .eq("step_number", 7);
    if (error) throw error;
    console.log("✓ A42 step 7 — points to deliverable box");
  }

  // ---------- 3. A13 step 4 — drop sort_buckets + inline PDF ref ----------
  const a13Step4Help =
    "**Don't polish, rewrite.** Polishing keeps the AI scaffolding and layers your voice on top. Rewriting forces you to think about what you'd actually say.\n\n**Why AI drafts sound generic:** they're optimized for \"works for most readers\" — the opposite of voice. Your voice is the specific choices you make that mark text as yours: the words you reach for, the rhythm, how much you hedge or don't, your sign-off.";
  {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({
        detailed_help: a13Step4Help,
        interactive_type: null,
        interactive_data: null,
      })
      .eq("activity_id", 13)
      .eq("step_number", 4);
    if (error) throw error;
    console.log(
      "✓ A13 step 4 — sort_buckets removed; PDF p.2 mention dropped (still in Sources callout)"
    );
  }

  // ---------- 4. Strip {{prompt:}} and {{tone:}} from Advanced band ----------
  const { data: advanced } = await sb
    .from("level_up_activities")
    .select("id")
    .eq("is_active", true)
    .like("band", "%Advanced%");
  const advancedIds = (advanced ?? []).map((a) => a.id);

  const { data: advSteps } = await sb
    .from("activity_guide_steps")
    .select("id, activity_id, step_number, instruction, detailed_help")
    .in("activity_id", advancedIds);

  let strippedCount = 0;
  for (const s of advSteps ?? []) {
    const newInstr = stripPromptToneVocab(s.instruction);
    const newHelp = stripPromptToneVocab(s.detailed_help);
    if (newInstr === s.instruction && newHelp === s.detailed_help) continue;
    const patch: { instruction?: string; detailed_help?: string | null } = {};
    if (newInstr !== s.instruction && newInstr !== null) patch.instruction = newInstr;
    if (newHelp !== s.detailed_help) patch.detailed_help = newHelp;
    const { error } = await sb
      .from("activity_guide_steps")
      .update(patch)
      .eq("id", s.id);
    if (error) throw error;
    strippedCount++;
    console.log(
      `  · stripped on A${s.activity_id} step ${s.step_number} (id=${s.id})`
    );
  }
  console.log(`✓ Stripped {{prompt:}}/{{tone:}} from ${strippedCount} advanced steps`);
}

main();
