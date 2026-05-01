/**
 * wave-13-flow-fixes-1.0.0.ts
 *
 *   - Activity 2 (Tool Selection Matrix): the inline matrix moves from
 *     step 1 to step 3, where users actually fill it in. Step 1
 *     introduces the scenarios; step 3 holds the comparison_table; step
 *     5 references the matrix in step 3.
 *   - Activity 4 (My First AI Conversation): the vocab flip cards move
 *     from step 1 (where they felt disconnected) to step 3, where
 *     "multi-turn conversation" / "context window" / "anchoring" are
 *     actually introduced.
 *   - Fix three orphan "Suggest tools button" references where the
 *     button isn't actually on that step: rephrase to use a generic
 *     "external-tool suggester (open a step that surfaces ASU resources)"
 *     reference, or just drop the call-out.
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
  interactiveType?: string | null;
  interactiveData?: unknown;
  showAsuResources?: boolean;
  showExternalTools?: boolean;
};

const CODA_NOTE =
  "If you'd rather work in a separate tool, [Coda](https://coda.io) (ASU-supported) handles tables and notes on the same page; [Google Sheets](https://sheets.google.com) and [Microsoft Excel](https://www.office.com/launch/excel) work too. The matrix in this activity saves to your browser by default.";

const patches: StepPatch[] = [
  // ───────────────────────────────────────────────────────────────
  // Activity 2: Tool Selection Matrix, matrix lives in step 3
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 2,
    stepNumber: 1,
    instruction:
      "Read the three scenarios below. You'll fill in a comparison matrix for them in step 3, after you've thought through the deciding factor for each (step 2).",
    detailedHelp:
      "**The three scenarios:**\n\n• **Quiz questions**, drafting 5 multiple-choice questions on a chapter you've already taught, for a low-stakes review quiz.\n\n• **Summarizing readings**, a 30-page assigned reading you want condensed for an end-of-week recap, with the key arguments preserved.\n\n• **Drafting feedback**, short feedback notes (3-5 sentences each) on a class set of student reflections (de-identified).\n\nDon't pick tools yet. The next step is the calibration; the matrix itself is in step 3.",
    interactiveType: null,
    interactiveData: null,
    showAsuResources: false,
    showExternalTools: false,
  },
  {
    activityId: 2,
    stepNumber: 3,
    instruction:
      "Fill in the matrix below: rows = scenarios, columns = Recommended Tool, Why This Tool, One Limitation.",
    detailedHelp:
      "**What goes in each cell:**\n\n*Recommended tool*, name the specific tool. \"Whatever's free\" doesn't transfer to next time.\n\n*Why this tool*, one or two sentences tying the choice to a concrete property of the tool. \"Handles 50+ page PDFs without truncation\" is good. \"It's reliable\" is not.\n\n*One limitation*, what this tool can't do well for this scenario, so you remember the trade-off. Every choice has one, write it now while it's fresh.\n\nIf you're stuck on which tool to pick, the **Suggest tools** button below will give you AI-powered options matched to the specific task.\n\n" +
      CODA_NOTE,
    interactiveType: "comparison_table",
    interactiveData: {
      storageKey: "activity-2-matrix",
      rowHeader: "Scenario",
      rowsReadOnly: true,
      rows: [
        { id: "quiz", label: "Quiz questions" },
        { id: "summary", label: "Summarizing readings" },
        { id: "feedback", label: "Drafting feedback" },
      ],
      columns: [
        { id: "tool", label: "Recommended tool" },
        { id: "why", label: "Why this tool" },
        { id: "limit", label: "One limitation" },
      ],
      cellPlaceholder: "Short note",
    },
    // Move external tool suggester to this step (where users actually need
    // tool suggestions). Compare AI is not particularly relevant here.
    showAsuResources: false,
    showExternalTools: true,
  },
  {
    activityId: 2,
    stepNumber: 4,
    // Step 4 had the ASU resources panel before. Now the matrix-fill in
    // step 3 is the "tool decision moment", so resources move there.
    showAsuResources: false,
    showExternalTools: false,
  },
  {
    activityId: 2,
    stepNumber: 5,
    instruction:
      "Revise the matrix in step 3 based on what you learned from the test run. Don't add a third tool, replace the recommendation if the test pointed somewhere else.",
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 4: My First AI Conversation, vocab cards move to step 3
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 4,
    stepNumber: 1,
    instruction:
      "Pick a topic you know well. You'll have a multi-turn conversation with an AI on that topic. Familiarity matters: it's how you'll know whether the AI is being accurate, vague, or making things up.",
    detailedHelp:
      "**Why a topic you know well:** you need to be able to tell when the AI is right, wrong, or hand-waving. On unfamiliar territory, everything sounds plausible, that's a recipe for absorbing misinformation without noticing. Start on home turf so your BS detector can actually work.\n\nWhich AI tool to use comes in step 2.\n\n**Where this goes next.** The Foundational → Intermediate activity for this skill, **The Anchoring Breaker**, uses the multi-turn habit you just built to deliberately push AI off its first answer.",
    interactiveType: null,
    interactiveData: null,
  },
  {
    activityId: 4,
    stepNumber: 3,
    detailedHelp:
      "**What \"multi-turn conversation\" means:** after each reply, the AI remembers what you both just said and uses it as context for the next response. This is what makes chat tools different from search engines, you can build on answers instead of starting over.\n\n**Why follow up instead of starting a new topic:** starting fresh treats the AI like a search bar. The whole point of a conversation is that each turn deepens what came before. A follow-up might ask for an example, push on something that felt incomplete, or redirect based on what the AI said. Don't worry about whether your question is \"good enough\", just keep going.\n\nThe vocabulary below covers the four terms you'll see across the rest of this skill.",
    interactiveType: "vocab_flip_cards",
    interactiveData: {
      cards: [
        {
          term: "Prompt",
          definition:
            "Anything you type into an AI to get a response, a question, an instruction, or a request.",
        },
        {
          term: "Multi-turn conversation",
          definition:
            "A back-and-forth where the AI remembers what was said earlier in the same session and uses it as context.",
        },
        {
          term: "Anchoring",
          definition:
            "When AI locks onto its first answer's framing and treats follow-ups as variations of that framing.",
        },
        {
          term: "Context window",
          definition:
            "The amount of text the AI can hold in mind at once, older parts of long chats start to drop off.",
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Orphan "Suggest tools button" reference fixes
  // ───────────────────────────────────────────────────────────────
  // Activity 18 (Build & Test Agent) step 2: rephrase generic.
  {
    activityId: 18,
    stepNumber: 2,
    detailedHelp:
      "**The system prompt is the agent.** Spend the time here. State the goal in one sentence, list the steps the agent should take, list the inputs it should expect, list the cases it should refuse. Anything left implicit will go wrong on test 1.\n\n(Use the **System prompt** template below to draft each section in place.)",
  },
  // Activity 22 (Describe It, See It) step 3: drop the orphan suggest mention.
  {
    activityId: 22,
    stepNumber: 3,
    detailedHelp:
      "**Three image-style options most people start with:**\n\n*ChatGPT with image generation* (DALL-E inside ChatGPT) for sketchy concept visuals.\n\n*Canva AI* for slide-friendly visuals, particularly diagrams that need clean alignment.\n\n*A text-to-diagram tool* like [Mermaid Live](https://mermaid.live) (text → diagram) or [Napkin.ai](https://www.napkin.ai) (idea → infographic) for structured visuals.\n\nIf the description doesn't render what you imagined, the prompt is the issue, not the tool. Try again with more specific spatial language (\"two columns side-by-side\", \"a flow with arrows pointing right\", \"dark text on a light card\").",
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);
  for (const p of patches) {
    const patch: Database["public"]["Tables"]["activity_guide_steps"]["Update"] = {};
    if (p.instruction !== undefined) patch.instruction = p.instruction;
    if (p.detailedHelp !== undefined) patch.detailed_help = p.detailedHelp;
    if (p.interactiveType !== undefined) patch.interactive_type = p.interactiveType;
    if (p.interactiveData !== undefined) patch.interactive_data = p.interactiveData;
    if (p.showAsuResources !== undefined)
      patch.show_asu_resources = p.showAsuResources;
    if (p.showExternalTools !== undefined)
      patch.show_external_tools = p.showExternalTools;
    const { error } = await sb
      .from("activity_guide_steps")
      .update(patch)
      .eq("activity_id", p.activityId)
      .eq("step_number", p.stepNumber);
    if (error)
      console.error(`  x ${p.activityId}/${p.stepNumber}:`, error.message);
    else console.log(`✓ ${p.activityId}/${p.stepNumber}`);
  }
  console.log(`\n${patches.length} step patches applied.`);
}

main();
