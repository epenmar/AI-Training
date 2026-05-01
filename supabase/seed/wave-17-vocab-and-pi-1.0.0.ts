/**
 * wave-17-vocab-and-pi-1.0.0.ts
 *
 *   1. Replace the four vocab_flip_cards interactives (activities 4, 14,
 *      17, 26) with inline {{term:definition}} markup in the matching
 *      step's detailed_help. The renderRichText parser turns each
 *      {{term:definition}} into a click-to-reveal VocabTerm so terms
 *      get defined where they're introduced, not in a sidebar widget.
 *   2. Activity 36 (Principled Innovation Case Study): step 3 swaps
 *      the prompt sandbox for an interactive Principled Innovation
 *      infographic — four clickable cards (curiosity / care / clarity
 *      / intentionality), each revealing what to look for, the common
 *      tension, and a worked example.
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
};

const patches: StepPatch[] = [
  // ── Activity 4 (My First AI Conversation), step 3 ─────────────────
  {
    activityId: 4,
    stepNumber: 3,
    detailedHelp:
      "**What \"multi-turn conversation\" means:** after each reply, the AI remembers what you both just said and uses it as context for the next response. This is what makes chat tools different from search engines, you can build on answers instead of starting over.\n\n**Why follow up instead of starting a new topic:** starting fresh treats the AI like a search bar. The whole point of a conversation is that each turn deepens what came before. A follow-up might ask for an example, push on something that felt incomplete, or redirect based on what the AI said. Don't worry about whether your question is \"good enough\", just keep going.\n\n**Vocabulary you'll see across this skill** (click each term for the definition):\n\n• A {{Prompt:Anything you type into an AI to get a response, a question, an instruction, or a request.}} is anything you type into the AI.\n\n• A {{Multi-turn conversation:A back-and-forth where the AI remembers what was said earlier in the same session and uses it as context for later turns.}} is the back-and-forth where context carries over.\n\n• {{Anchoring:When AI locks onto its first answer's framing and treats follow-ups as variations of that framing. The Anchoring Breaker activity is built around recognizing and breaking this pattern.}} is when the AI locks onto its first framing.\n\n• The {{Context window:The amount of text the AI can hold in mind at once. Older parts of long chats start to drop off when the conversation exceeds it.}} is the AI's working memory for this conversation.",
    interactiveType: null,
    interactiveData: null,
  },

  // ── Activity 14 (Style Coach), step 1 ─────────────────────────────
  {
    activityId: 14,
    stepNumber: 1,
    detailedHelp:
      "**Pick something you wrote and felt good about.** A recent email that landed well. A syllabus section a student actually read. A report paragraph you remember being proud of.\n\n**One sample is enough to start.** More samples help if you have them, but you can train an AI's voice off a single high-quality paragraph.\n\nRedact anything sensitive (names, identifiers) before pasting if the tool isn't VITRA-cleared. See [ASU's VITRA process (Canvas, ~5 min)](/pdf/the-important-role-of-vendor-it-risk-assessment-vitra) if you're not sure.\n\n**Vocabulary for what you're trying to capture** (click each term for the definition):\n\n• {{Tone:How formal or casual the writing feels. Think \"Could you possibly\" vs. \"Hey, quick one.\" Tone is what your reader hears in their head as they read.}} is how formal or casual it feels.\n\n• {{Register:The contextual norms a piece of writing follows. Academic register is dense and citation-heavy; email register is short and direct; conference-talk register is somewhere between.}} is the contextual norm a piece of writing follows.\n\n• {{Voice:The recognizable fingerprint of how someone writes. Word choices, sentence rhythms, what they leave out. Two writers can hit the same tone but still have very different voices.}} is the writer's recognizable fingerprint.\n\n• {{Cadence:Sentence-length pattern. Short, short, then long. AI often defaults to medium-medium-medium, which feels generic. Cadence is a quick way to spot AI-flavored writing.}} is the rhythm of sentence lengths across a passage.\n\n**Where this comes from.** The Foundational → Intermediate activity for this skill, **The Anchoring Breaker**, builds the multi-turn conversation habit you'll lean on when teaching the AI your style.",
    interactiveType: null,
    interactiveData: null,
  },

  // ── Activity 17 (Design an Agent), step 2 ─────────────────────────
  {
    activityId: 17,
    stepNumber: 2,
    instruction:
      "Map the workflow digitally — list every step in order, from trigger to completion. Use a free whiteboard tool: [Excalidraw](https://excalidraw.com) (no account needed), [Whimsical](https://whimsical.com), [Google Drawings](https://docs.google.com/drawings/), or [Microsoft Whiteboard](https://whiteboard.microsoft.com) (ASU-licensed). For text-only mapping, a numbered list in any doc works.",
    detailedHelp:
      "**Why digital, not paper:** you'll want to share the design with a colleague (step 6) and re-arrange steps as you go. Both are easier digitally.\n\n**Excalidraw is the fastest start**, open the link, drag rectangles for steps, draw arrows between them. No sign-up, no learning curve. Save the canvas as a PNG when you're done.\n\n**Whimsical** is better for proper flowcharts with branching logic. Free tier covers this.\n\n**Mermaid** ([live editor](https://mermaid.live)) is best if you'd rather write the diagram as text, `flowchart TD; A[trigger]-->B[step 1]-->C[step 2]`, and have it rendered.\n\n**The mapping itself:** each step gets its own node. \"Receive submission\" → \"Check formatting\" → \"Note errors\" → \"Reply to student\" → \"File submission.\"\n\n**Vocabulary for agent design** (click each term for the definition):\n\n• A {{Trigger:The event that kicks off the agent. A new email landing, a scheduled time, a button click, a file appearing in a folder. Without a trigger, you have a chat tool, not an agent.}} is what kicks the agent off.\n\n• A {{Step:One discrete action the agent takes. Read X, classify Y, send Z. Each step should fit on one line; if it doesn't, break it up.}} is one discrete action it takes.\n\n• A {{Tool:Anything the agent has to access or use to do its job. Email, calendar, a database, a file. Tools are how the agent reaches out beyond its own context.}} is anything the agent has to access (email, calendar, files).\n\n• A {{Human checkpoint:A pause where a person reviews and approves before the agent continues. Belongs anywhere a mistake would be hard to undo, anywhere judgment is required, and anywhere sensitive data is involved.}} is a pause where a person reviews before the agent continues.",
    interactiveType: null,
    interactiveData: null,
  },

  // ── Activity 26 (Write Your Disclosure Statement), step 4 ─────────
  {
    activityId: 26,
    stepNumber: 4,
    detailedHelp:
      "**The three-question audit:**\n\n**What tool?** Specific name. \"AI\" is too vague. \"ChatGPT-4o\" or \"ASU Create AI\" is right.\n\n**What task?** Drafting? Summarizing? Coding? Brainstorming? Be specific enough that the reader knows what AI did and didn't do.\n\n**How verified?** \"All citations checked against primary sources.\" \"Data tables hand-verified against the original spreadsheet.\" \"Author edited every paragraph.\" Without this, the disclosure feels nervous rather than confident.\n\n**Vocabulary for disclosure** (click each term for the definition):\n\n• {{Disclosure:Telling your audience that AI was used and what it did. Required by most journals, funders, and increasingly courses. Disclosure is about transparency, not seeking permission.}} is telling your audience that AI was used and what it did.\n\n• {{Attribution:Crediting AI as a tool used in the work. Different from authorship. Most policies say AI cannot be an author, but it should still be attributed if it shaped the work.}} is crediting AI as a tool, distinct from authorship.\n\n• {{Verification:The human-checked confirmation that AI output is accurate. The thing that turns AI assistance from risk into asset. Without verification, every AI-assisted publication is a fabrication waiting to surface.}} is the human-checked confirmation that AI output is accurate.\n\n• {{Substantive use:AI use that shaped the document beyond cosmetic editing. Drafting, ideating, summarizing, citing. The bar for required disclosure. Spell-check and grammar suggestions usually don't count.}} is AI use that shaped the document beyond cosmetic edits.",
    interactiveType: null,
    interactiveData: null,
  },

  // ── Activity 36 (Principled Innovation Case Study), step 3 ────────
  // Replace the prompt sandbox added in wave-16 with the PI infographic.
  // The infographic IS the per-principle teaching artifact; the AI prompt
  // can move down to a later step or be removed (it duplicates the
  // teaching). Keep step 3's flow lean by replacing.
  {
    activityId: 36,
    stepNumber: 3,
    instruction:
      "Work through the four Principled Innovation principles below. Tap each card for what to look for, the common tension with another principle, and an AI-decision example. The card opens what your case is asking under that lens.",
    detailedHelp:
      "**How to use the cards.** For each principle, ask the question on the card front. Open the card to see what \"good\" looks like and the tension it usually pulls against. The most useful PI cases are the ones where two principles pull in different directions; the cards help you spot the tension.\n\n**Capture your case-specific notes in the deliverable box** at the bottom of this page, organized by principle. The infographic is the teaching artifact; your case is what you write up.\n\n**Vocabulary** (click for the definition):\n\n• {{Principled Innovation:ASU's framework for making decisions that honor curiosity, care, clarity, and intentionality together, not as a checklist but as a balanced set. Cases where two principles pull in different directions are the ones the framework was designed for.}} is ASU's decision-making framework.\n\n• {{Principle tension:When two principles in a single situation pull in different directions, e.g., curiosity wants to try the new thing, care wants to protect the people who'd be affected. Naming the tension is half the analysis.}} is when two principles pull in different directions in a case.",
    interactiveType: "principled_innovation_infographic",
    interactiveData: {
      prompt:
        "Four principles. Tap each card to see what to look for in your case.",
    },
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
