/**
 * wave-8-skill-1-bridges-1.0.0.ts
 *
 * Skill 1 (Choose the right AI tool) cross-level scaffolding fixes
 * proposed in the previous review:
 *
 *   - Activity 1 step 5 detailed_help: forward-reference Tool
 *     Selection Matrix so the NF learner sees where the tool sense
 *     they just built leads.
 *   - Activity 2 step 2 detailed_help: explicit "VITRA at this
 *     level" hint so VITRA isn't dropped on the FI learner cold.
 *   - Activity 2 step 3 instruction: name the contrast between the
 *     NF dimensions (length / tone / constraint / accuracy) and the
 *     FI dimensions (input length / file support / VITRA / iteration).
 *   - Activity 2 step 4 instruction: tie back to Compare AI from
 *     the Safari activity.
 *   - Activity 3 step 1 detailed_help: backward-reference Tool
 *     Selection Matrix as the practice ground for this skill.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type StepPatch = {
  activityId: number;
  stepNumber: number;
  instruction?: string;
  detailedHelp?: string;
};

const patches: StepPatch[] = [
  // ── Activity 1 (NF, AI Tool Safari) — bridge forward to FI ──────────
  {
    activityId: 1,
    stepNumber: 5,
    detailedHelp:
      "**Three rows, four columns.** Edit the row labels to the actual model names you used in Compare AI. Each cell is short, just enough to remind future-you what you noticed.\n\n**The four columns map to the four dimensions from step 4:**\n\n• **1, Length**, did it stick to three sentences, or did it pad?\n• **2, Tone**, formal vs. casual; would you put this in a syllabus as-is?\n• **3, Constraint-following**, did it hold the three-sentence cap as a hard rule or a loose suggestion?\n• **4, Accuracy**, anything that sounded factually off?\n\n**Your reflection lives in the deliverable box.** \"I liked Claude\" is a starting point. \"Claude held the three-sentence constraint and matched a syllabus voice\" is the kind of reason that transfers to the next decision. Write the reflection directly in the deliverable notes below the activity.\n\n**Where this goes next.** The next-level activity for this skill, **Tool Selection Matrix**, asks you to do the reverse move: given a teaching scenario, pick the right tool. The vocabulary you just built (length, tone, constraint, accuracy) is what you'll lean on there.",
  },

  // ── Activity 2 (FI, Tool Selection Matrix) — VITRA hint, contrast NF, Compare AI tie-back
  {
    activityId: 2,
    stepNumber: 2,
    detailedHelp:
      "**The four questions that usually decide which tool fits:**\n\n**Input length.** Long readings or large datasets need tools with bigger context windows (Claude, Gemini Pro). Short prompts work anywhere.\n\n**File support.** Does the task involve uploading PDFs, images, or spreadsheets? ASU's [vetted AI tool list](https://ai.asu.edu/ai-tools) shows which tools support what.\n\n**Sensitive data.** If student data is involved, the tool needs to be VITRA-approved before you put real data in. See [ASU's VITRA process (Canvas, ~5 min)](https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra). **VITRA at this level just means: if the tool isn't approved, use de-identified data only.** You'll go deeper into VITRA in the next-level activity, Tool Audit & Recommendation Brief.\n\n**Speed of iteration.** If you'll be revising 5+ times, a fast tool with strong follow-up handling matters more than getting the perfect first draft.",
  },
  {
    activityId: 2,
    stepNumber: 3,
    instruction:
      "Fill in your matrix: rows = scenarios, columns = Recommended Tool, Why This Tool, One Limitation. Note: the dimensions you're using here (input length / file support / VITRA / iteration) are about *fit for the task*. They're a different lens from the AI Tool Safari dimensions (length / tone / constraint / accuracy), which were about *output quality*. Both matter; they answer different questions.",
  },
  {
    activityId: 2,
    stepNumber: 4,
    instruction:
      "For at least one scenario, actually try the task in your recommended tool. Does reality match your prediction? If you used [Compare AI](https://compare.aiml.asu.edu) in the Tool Safari activity, this is a great place to use it again, run the same task across 2-3 candidate tools to see the difference live.",
  },

  // ── Activity 3 (IA, Tool Audit & Recommendation Brief) — bridge backward to FI
  {
    activityId: 3,
    stepNumber: 1,
    detailedHelp:
      "**Pick a tool with a real adoption decision behind it.** This activity is sturdier when there's a real audience for your brief: a department considering ChatGPT Enterprise, a colleague piloting Claude Projects, an admin asking about a specific generative-AI plugin. Generic \"evaluate ChatGPT\" briefs read as performative.\n\n**Where this comes from.** If you've worked through Tool Selection Matrix at the previous level, the four \"fit for the task\" dimensions (input length / file support / VITRA / iteration) are your warm-up. This audit goes wider: VITRA is now its own deep dive, and you add data handling and accessibility as full sections of the brief.",
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);
  for (const p of patches) {
    const patch: Database["public"]["Tables"]["activity_guide_steps"]["Update"] = {};
    if (p.instruction !== undefined) patch.instruction = p.instruction;
    if (p.detailedHelp !== undefined) patch.detailed_help = p.detailedHelp;
    const { error } = await sb
      .from("activity_guide_steps")
      .update(patch)
      .eq("activity_id", p.activityId)
      .eq("step_number", p.stepNumber);
    if (error)
      console.error(`  x ${p.activityId}/${p.stepNumber}:`, error.message);
    else console.log(`✓ ${p.activityId}/${p.stepNumber}`);
  }
  console.log(`\n${patches.length} skill-1 scaffolding bridges applied.`);
}

main();
