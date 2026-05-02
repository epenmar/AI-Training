/**
 * wave-37-ask-ai-about-ai-1.0.0.ts
 *
 * Activity 40 (Ask AI About AI):
 *   - Step 1: rewrite away from "Have ASU's build it in Create AI" /
 *     "open any AI tool" (too advanced for a level-1 activity) toward
 *     ASU's Compare Models page. Move the {{prompt:...}} vocab here
 *     since step 2 (which originally introduced it) is being removed.
 *   - Step 2: delete (was redundant with step 1 — both said "open a
 *     tool, paste this prompt"). Renumber 3→2, 4→3, 5→4 by primary
 *     key so we don't trip the cascading-update bug we hit in wave-27.
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

  // 1) Rewrite step 1 (id 227): point at Compare AI; absorb the vocab
  //    that previously lived in step 2.
  const newStep1Instruction =
    "Open [ASU's Compare AI](https://compare.aiml.asu.edu) and run this {{prompt:Anything you type into an AI to get a response — a question, an instruction, or a request.}} in any one of the columns: " +
    "*\"I'm brand new to using AI tools. What are the 3 most important things I should understand before I start using you for my work as an educator?\"*";

  const newStep1Help =
    "**Why Compare AI for this.** It's the simplest way to talk to a vetted AI tool inside ASU's environment — no extra account, no install, no decision about which model to pick. Drop the prompt into one column and read what comes back.\n\n**Why this prompt works.** AI chat tools have read large amounts of text *about* using AI: best-practices guides, cautionary posts, tutorials. They're genuinely informed on the question \"how should someone use me?\" — at a conventional-wisdom level. The \"brand new\" framing matters; it signals the AI to pitch for a beginner, not a prompt engineer.\n\n**What this doesn't mean.** The AI is not an authority on itself. It gives you the aggregated consensus of what's been written, which is usually reasonable, sometimes outdated, occasionally wrong. Treat the answer as \"a reasonable starting take,\" not \"ground truth.\"";

  const { error: e1 } = await sb
    .from("activity_guide_steps")
    .update({
      instruction: newStep1Instruction,
      detailed_help: newStep1Help,
      // Keep prompt_sandbox in case the user wants to tweak/copy.
      interactive_type: "prompt_sandbox",
      interactive_data: {
        hint: "Already pasted in Compare AI? Use this to tweak the wording before you send.",
        starter:
          "I'm brand new to using AI tools. What are the 3 most important things I should understand before I start using you for my work as an educator?",
      },
    })
    .eq("id", 227);
  if (e1) throw e1;
  console.log("✓ step 1 rewritten (Compare AI; vocab moved here)");

  // 2) Delete the redundant step 2 (id 228).
  const { error: eDel } = await sb
    .from("activity_guide_steps")
    .delete()
    .eq("id", 228);
  if (eDel) throw eDel;
  console.log("✓ step 2 deleted (was redundant)");

  // 3) Renumber by primary key (avoids cascading on (activity_id,step_number)).
  //    229 → 2, 230 → 3, 231 → 4.
  for (const [id, step] of [
    [229, 2],
    [230, 3],
    [231, 4],
  ] as const) {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({ step_number: step })
      .eq("id", id);
    if (error) throw error;
    console.log(`✓ renumbered id=${id} → step ${step}`);
  }
}

main();
