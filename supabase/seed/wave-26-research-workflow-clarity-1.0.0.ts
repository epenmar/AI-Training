/**
 * wave-26-research-workflow-clarity-1.0.0.ts
 *
 * Activity 9 (AI-Assisted Research Workflow) step 2: rewrite the
 * "design a multi-step workflow" instruction so it's obvious which
 * stages are AI calls, which are human verification, and whether AI
 * stages should run in fresh chats. The previous wording was a single
 * dense paragraph that made it ambiguous whether the whole thing was
 * one prompt with five sub-steps or five distinct moves.
 *
 * Same activity, step 4: also clarify that the user is *running* the
 * five-stage workflow they just designed, not re-designing it.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const STEP_2_INSTRUCTION =
  "Design a 5-stage workflow you'll run in step 4. The structure below is the recommended baseline. Each stage is a distinct move, two are AI prompts (in *fresh* chats so they don't cross-contaminate), and three are human verification.";

const STEP_2_HELP =
  "**The 5 stages, with who does what:**\n\n1. **AI prompt #1 — generate sources.** In a fresh chat, ask the AI for an initial list of relevant sources for your step-1 question. (Example: \"Give me 8 peer-reviewed articles on [topic] published in the last five years, with full citations.\")\n\n2. **Human verification — does each source actually exist?** Search Google Scholar / your library database for each citation. Cross out any that don't exist.\n\n3. **Human reading — read the actual abstracts.** Open the verified sources and read their abstracts (not the AI's summary of them). This is what produces the *verified set* used in stage 4.\n\n4. **AI prompt #2 — synthesize across the verified set only.** Open a *fresh* chat (don't continue the stage-1 chat — it still believes its fabricated sources are real). Paste in the verified-set abstracts and ask the AI for a synthesis.\n\n5. **Human verification — does the synthesis hold up against the abstracts?** Compare the AI's synthesis to what the abstracts actually say. Mark anywhere the AI invented a connection or overstated a finding.\n\n**Why fresh chats for the two AI stages.** Continuing the stage-1 chat means the AI's working memory still contains the fabricated sources from stage 1; it will happily \"synthesize\" findings from papers that don't exist. A fresh chat with only the verified abstracts pasted in forces the AI to work from real material.\n\n**Skip any stage and the workflow's risk profile changes:**\n• No \"verify each source exists\" → fabricated citations propagate.\n• No \"read actual abstracts\" → you cite based on AI's summary, which is often subtly wrong.\n• No \"verify synthesis\" → AI's connections-between-papers may be plausible but unfounded.\n\nStart with the five stages above. Add more only if your specific workflow demands them.";

const STEP_4_INSTRUCTION =
  "Run the 5-stage workflow you designed in step 2 on the question you captured in step 1. Document what you catch at each verification stage (stages 2, 3, and 5): fabricated sources, misrepresentations, missing nuance.";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { error: e2 } = await sb
    .from("activity_guide_steps")
    .update({
      instruction: STEP_2_INSTRUCTION,
      detailed_help: STEP_2_HELP,
    })
    .eq("activity_id", 9)
    .eq("step_number", 2);
  if (e2) console.error("step 9/2:", e2.message);
  else console.log("✓ activity 9 step 2 updated");

  const { error: e4 } = await sb
    .from("activity_guide_steps")
    .update({ instruction: STEP_4_INSTRUCTION })
    .eq("activity_id", 9)
    .eq("step_number", 4);
  if (e4) console.error("step 9/4:", e4.message);
  else console.log("✓ activity 9 step 4 updated");
}

main();
