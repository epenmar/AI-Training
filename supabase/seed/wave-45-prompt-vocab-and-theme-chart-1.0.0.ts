/**
 * wave-45-prompt-vocab-and-theme-chart-1.0.0.ts
 *
 * Two threads:
 *
 * 1. Strip the {{prompt:...}} clickable from any activity outside the
 *    first two skills in display order:
 *      - skill 2 "Iterative dialogue" (display_order 1)
 *      - skill 1 "Tool choice"        (display_order 2)
 *    By the time learners reach the third skill the term has earned
 *    its keep — the clickable becomes noise.
 *
 * 2. A20 (Theme Finder) step 5: the instruction asks the user to
 *    "build a comparison" but only shows the format in detailed_help.
 *    Drop in a prompt_sandbox so AI can build the comparison chart
 *    from the themes the user collected in step 2 and step 3 — paste
 *    your themes + AI's themes, get a populated table back ready for
 *    the deliverable.
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

// Skill IDs to KEEP {{prompt:}} clickable on. Pulled from
// `skills.display_order` 1 and 2.
const KEEP_SKILL_IDS = new Set<number>([2, 1]);

function stripPromptVocab(text: string | null): string | null {
  if (text == null) return null;
  // Match {{prompt:...}} or {{Prompt:...}} or {{prompts:...}}; preserve
  // the original casing/plural in the replacement.
  return text.replace(
    /\{\{([Pp]rompts?):[^}]*\}\}/g,
    (_, term) => term
  );
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // Build activity_id → skill_id map.
  const { data: acts } = await sb
    .from("level_up_activities")
    .select("id, skill_id")
    .eq("is_active", true);
  const activitySkill = new Map<number, number | null>();
  for (const a of acts ?? []) activitySkill.set(a.id, a.skill_id);

  // Walk every step; strip prompt vocab when the activity's skill is
  // outside the keep-set.
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id, activity_id, step_number, instruction, detailed_help");

  let changed = 0;
  for (const s of steps ?? []) {
    const skillId = activitySkill.get(s.activity_id ?? -1) ?? null;
    if (skillId != null && KEEP_SKILL_IDS.has(skillId)) continue;
    const newInstr: string | null = stripPromptVocab(s.instruction);
    const newHelp: string | null = stripPromptVocab(s.detailed_help);
    if (newInstr === s.instruction && newHelp === s.detailed_help) continue;
    const patch: { instruction?: string; detailed_help?: string | null } = {};
    if (newInstr !== s.instruction && newInstr !== null)
      patch.instruction = newInstr;
    if (newHelp !== s.detailed_help) patch.detailed_help = newHelp;
    await sb.from("activity_guide_steps").update(patch).eq("id", s.id);
    changed++;
    console.log(
      `  · stripped {{prompt:}} on A${s.activity_id} (skill=${skillId}) step ${s.step_number}`
    );
  }
  console.log(
    `✓ Stripped {{prompt:}} from ${changed} steps in skills outside [2, 1]`
  );

  // ---- A20 step 5: AI-assisted comparison chart prompt ----
  const a20Step5Help =
    "**Comparison table format:**\n\n" +
    "| Your theme | AI theme | Same? | Notes |\n" +
    "|---|---|---|---|\n" +
    "| Time pressure | Workload concerns | ✓ | Same content, different label |\n" +
    "| Tech frustration | (not found) |, | AI missed this, appears in 4 responses |\n" +
    "| (not found) | Group dynamics |, | I missed this, AI surfaced it across 6 responses |\n\n" +
    "At the bottom: **net findings** — which approach surfaced what, and what your real combined theme list is.\n\n" +
    "**Use the prompt below** to have AI build the comparison table for you: paste your themes from step 2 and AI's themes from step 3, and the AI returns a populated comparison ready to drop into the deliverable. Don't take it on faith — eyeball the rows against your own read before you keep it.\n\n" +
    "**Where this goes next.** The Intermediate → Advanced activity for this skill, [Privacy-First Data Analysis Workflow](/activities/21), wraps the AI-clustering habit in de-identification, tool-approval verification, and an audit log defensible under FERPA scrutiny.";
  const a20Step5Data = {
    hint: "Replace the bracketed sections with your actual themes (from step 2) and the AI's themes (from step 3), then send.",
    starter:
      "I've clustered a set of survey responses two ways. I want a side-by-side comparison table to evaluate where the two reads agreed, disagreed, or surfaced different things.\n\n" +
      "## My themes (read by hand, from step 2)\n" +
      "[paste your theme list — short noun phrase + 1-line description per item]\n\n" +
      "## AI's themes (from step 3)\n" +
      "[paste the AI's theme labels + 1-sentence descriptions]\n\n" +
      "Return a Markdown table with these columns:\n" +
      "| Your theme | AI theme | Same? | Notes |\n\n" +
      "Rules:\n" +
      "- One row per theme, including themes that only one of us found (use \"(not found)\" in the empty cell).\n" +
      "- \"Same?\" is ✓, ~ (partial overlap), or ✗.\n" +
      "- \"Notes\" is one short sentence on what made you align them or split them.\n" +
      "- Below the table, write 2-3 bullets of net findings: where AI surfaced what I missed, where my read caught what AI missed, and any clusters that look wrong.\n\n" +
      "No preamble. Table + bullets only.",
  };
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help: a20Step5Help,
      interactive_type: "prompt_sandbox",
      interactive_data: a20Step5Data,
    })
    .eq("activity_id", 20)
    .eq("step_number", 5);
  console.log("✓ A20 step 5 — prompt_sandbox with comparison-table starter");
}

main();
