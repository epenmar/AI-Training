/**
 * wave-40-clickable-vocab-cleanup-1.0.0.ts
 *
 * Two threads:
 *
 * A. The Unexpected Prompt (A31) text fixes:
 *    - Step 1 currently shows the Create AI / Compare Models callouts
 *      (via show_asu_resources). The user is just *picking* a routine
 *      task in step 1 — they aren't pasting a prompt yet. Move the
 *      ASU platform callouts to step 2 where the prompting actually
 *      happens.
 *    - Step 4 detailed_help has an inline "Canvas Module 4 (overview)
 *      … and the AI Creative Learning Lab is worth a bookmark" prose
 *      paragraph. Both items already live in this activity's Sources
 *      and Resources callout — strip the inline mention.
 *
 * B. Clickable-vocab principle: clickable terms should be AI/tech
 *    terms unfamiliar to users (prompt, VITRA, RACCCA, hallucination,
 *    etc.). General writing/communication concepts (tone, voice,
 *    length) shouldn't be clickable.
 *
 *    - Strip {{tone:def}} → tone everywhere it appears.
 *    - Strip {{voice:def}} → voice everywhere it appears.
 *    - A1 step 4 currently has length / tone / constraint-following /
 *      accuracy all as clickables in the instruction. Rewrite to a
 *      bare list in the instruction with the four "what to look for"
 *      hints in detailed_help — keeps the substance but drops the
 *      clickable affordance for non-AI terms.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

function stripTerm(text: string | null, term: string): string | null {
  if (text == null) return null;
  // Definitions never contain `}` in current content.
  const re = new RegExp(`\\{\\{${term}:[^}]*\\}\\}`, "gi");
  return text.replace(re, term);
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ---------- A. A31 ASU callout move + step 4 inline-source strip ----------
  await sb
    .from("activity_guide_steps")
    .update({ show_asu_resources: false })
    .eq("activity_id", 31)
    .eq("step_number", 1);
  console.log("✓ A31 step 1 — show_asu_resources off");

  await sb
    .from("activity_guide_steps")
    .update({ show_asu_resources: true })
    .eq("activity_id", 31)
    .eq("step_number", 2);
  console.log("✓ A31 step 2 — show_asu_resources on");

  const a31Step4Help =
    "**What this tells you:** creative prompting isn't just a party trick. Changing the form of a request changes what the AI reaches for. If \"write me a meeting agenda\" gives you the same predictable output every time, trying \"write me an agenda as if each item were a small mystery to solve\" can produce genuinely different structure, because the AI has to think about the agenda differently to fit the frame.\n\n**Where this goes next.** The Foundational → Intermediate activity for this skill, [Reimagine an Assignment](/activities/32), uses the playful-{{prompt:Anything you type into an AI to get a response — a question, an instruction, or a request.}} habit you just tried to generate three structurally different alternatives to an existing assignment.";
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: a31Step4Help })
    .eq("activity_id", 31)
    .eq("step_number", 4);
  console.log(
    "✓ A31 step 4 — inline 'Canvas Module 4 / AI Creative Learning Lab' paragraph removed (already in Sources callout)"
  );

  // ---------- B. A1 step 4 — bare list in instruction, hints in help ----------
  const a1Step4Instruction =
    "Notice four things in each tool's output and capture them in the table below: length, tone, constraint-following, and accuracy.";
  const a1Step4Help =
    "Four lenses, one per row in the table below.\n\n" +
    "**Length.** Did it stick to three sentences, or did it pad? Some models treat a numeric constraint as a hard rule, others as a loose suggestion.\n\n" +
    "**Tone.** How formal or casual the writing feels. Would you put this in a syllabus as-is, or does it read like a marketing brochure?\n\n" +
    "**Constraint-following.** The prompt said three sentences. Did the tool hold the cap as a hard rule, or did it drift past it?\n\n" +
    "**Accuracy.** Anything that sounds factually off? Active learning has been written about for decades — the AI shouldn't be inventing things here.\n\n" +
    "Three tools, four dimensions. Edit the column labels to the actual model names you used in Compare AI. No tool will be best on all four — that's the point.";
  await sb
    .from("activity_guide_steps")
    .update({ instruction: a1Step4Instruction, detailed_help: a1Step4Help })
    .eq("activity_id", 1)
    .eq("step_number", 4);
  console.log("✓ A1 step 4 — bare list in instruction; definitions in help");

  // ---------- B. Strip {{tone:}} and {{voice:}} from any remaining steps ----------
  const { data: allSteps } = await sb
    .from("activity_guide_steps")
    .select("id, activity_id, step_number, instruction, detailed_help");

  let stripped = 0;
  for (const s of allSteps ?? []) {
    let newInstr: string | null = s.instruction;
    let newHelp: string | null = s.detailed_help;
    newInstr = stripTerm(newInstr, "tone");
    newInstr = stripTerm(newInstr, "voice");
    newHelp = stripTerm(newHelp, "tone");
    newHelp = stripTerm(newHelp, "voice");
    if (newInstr === s.instruction && newHelp === s.detailed_help) continue;
    const patch: { instruction?: string; detailed_help?: string | null } = {};
    if (newInstr !== s.instruction && newInstr !== null) patch.instruction = newInstr;
    if (newHelp !== s.detailed_help) patch.detailed_help = newHelp;
    await sb.from("activity_guide_steps").update(patch).eq("id", s.id);
    stripped++;
    console.log(
      `  · stripped on A${s.activity_id} step ${s.step_number} (id=${s.id})`
    );
  }
  console.log(
    `✓ Stripped {{tone:}}/{{voice:}} from ${stripped} additional steps`
  );
}

main();
