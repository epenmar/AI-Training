/**
 * wave-11-content-patches-1.0.0.ts
 *
 * Targeted content fixes per the latest review:
 *
 *   1. Activity 1 (AI Tool Safari): merge step 4 (notice) and step 5
 *      (table fill) into one step with the comparison table; step 5
 *      becomes the pure-reflection pointer to the deliverable box.
 *   2. Activity 2 (Tool Selection Matrix): provide the inline 3x3
 *      matrix in step 1 so the user fills it directly here. Step 3
 *      becomes a pointer back to the matrix in step 1. Add Coda as
 *      an outside-tool alternative.
 *   3. Audit other activities for "open a doc / copy to a sheet"
 *      style instructions and convert to in-page experiences. Note
 *      Coda (and other ASU-supported tools) as alternatives the
 *      user could replicate elsewhere if they wanted.
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

const CODA_NOTE =
  "If you'd rather work in a separate tool, [Coda](https://coda.io) (ASU-supported) handles tables and notes on the same page; [Google Sheets](https://sheets.google.com) and [Microsoft Excel](https://www.office.com/launch/excel) work too. The matrix above saves to your browser by default.";

const patches: StepPatch[] = [
  // ───────────────────────────────────────────────────────────────
  // Activity 1: AI Tool Safari, step 4+5 restructure
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 1,
    stepNumber: 4,
    instruction:
      "Notice four things in each tool's output and capture them in the table below: length, tone, constraint-following, and accuracy.",
    detailedHelp:
      "**Length.** Did it stick to three sentences, or did it pad?\n\n**Tone.** Would you put this in a syllabus as-is, or does it read like a marketing brochure?\n\n**Constraint-following.** The prompt said three sentences. Some tools treat that as a hard rule, others as a loose suggestion.\n\n**Accuracy.** Anything that sounds factually off? Active learning has been written about for decades, AI shouldn't be inventing things here.\n\nThree rows, four columns. Edit the row labels to the actual model names you used in Compare AI. No tool will be best on all four. That's the point.",
    interactiveType: "comparison_table",
    interactiveData: {
      storageKey: "activity-1-comparison-table",
      rowHeader: "Tool",
      rows: [
        { id: "row1", label: "Tool 1", placeholder: "e.g., GPT-5" },
        { id: "row2", label: "Tool 2", placeholder: "e.g., Claude Sonnet" },
        { id: "row3", label: "Tool 3", placeholder: "e.g., Gemini Pro" },
      ],
      columns: [
        { id: "col1", label: "1. Length" },
        { id: "col2", label: "2. Tone" },
        { id: "col3", label: "3. Constraint" },
        { id: "col4", label: "4. Accuracy" },
      ],
      cellPlaceholder: "Short note",
    },
  },
  {
    activityId: 1,
    stepNumber: 5,
    instruction:
      "Reflect: which tool would you reach for first next time, and why? Write your reflection directly in the deliverable notes box at the bottom of this page.",
    detailedHelp:
      "**The reflection is what transfers.** \"I liked Claude\" is a starting point. \"Claude held the three-sentence constraint and matched a syllabus voice\" is a reason that transfers to your next decision.\n\n**Where this goes next.** The next-level activity for this skill, **Tool Selection Matrix**, asks you to do the reverse move: given a teaching scenario, pick the right tool. The vocabulary you just built (length, tone, constraint, accuracy) is what you'll lean on there.",
    interactiveType: null,
    interactiveData: null,
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 2: Tool Selection Matrix, in-page matrix at step 1
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 2,
    stepNumber: 1,
    instruction:
      "Read the three scenarios below and fill in your matrix directly here. You'll come back to this matrix in steps 3 and 5.",
    detailedHelp:
      "**The three scenarios:**\n\n• **Quiz questions** — drafting 5 multiple-choice questions on a chapter you've already taught, for a low-stakes review quiz.\n\n• **Summarizing readings** — a 30-page assigned reading you want condensed for an end-of-week recap, with the key arguments preserved.\n\n• **Drafting feedback** — short feedback notes (3-5 sentences each) on a class set of student reflections (de-identified).\n\nEach row, three columns: pick the tool, name why it fits, name one limitation. Cells save in your browser.\n\n" +
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
    showAsuResources: undefined,
  } as StepPatch,
  {
    activityId: 2,
    stepNumber: 3,
    instruction:
      "Go back to the matrix in step 1 and complete it now: rows = scenarios, columns = Recommended Tool, Why This Tool, One Limitation.",
    detailedHelp:
      "**What goes in each cell:**\n\n*Recommended tool* — name the specific tool. \"Whatever's free\" doesn't transfer to next time.\n\n*Why this tool* — one or two sentences tying the choice to a concrete property of the tool. \"Handles 50+ page PDFs without truncation\" is good. \"It's reliable\" is not.\n\n*One limitation* — what this tool can't do well for this scenario, so you remember the trade-off. Every choice has one — write it now while it's fresh.\n\nIf you're stuck on which tool to pick, the **Suggest tools** button below will give you AI-powered options matched to the specific task.",
  },
  {
    activityId: 2,
    stepNumber: 5,
    instruction:
      "Revise the matrix in step 1 based on what you learned from the test run. Don't add a third tool, replace the recommendation if the test pointed somewhere else.",
    detailedHelp:
      "Update the cell, don't add a third tool, **replace** the recommendation if the test run pointed somewhere else. The matrix is meant to be wrong on first pass; that's how you build a tool sense rooted in real evidence instead of marketing copy.\n\n**Save the test-run notes** alongside the matrix. Six months from now, when you're choosing a tool for a new scenario, you'll want to remember why this one moved.",
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 5: Anchoring Breaker — replace "Copy them into a doc" with
  // an in-page paired list, since users are comparing Round 1 vs Round 2.
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 5,
    stepNumber: 2,
    instruction:
      "Prompt the AI to brainstorm 5 ideas. Paste them into Round 1 below.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-5-rounds",
      prompt:
        "Round 1 ideas (anchored). The boxes save in your browser, you'll add Round 2 after you break the anchor.",
      groups: [
        {
          id: "round1",
          label: "Round 1, 5 ideas",
          placeholder: "One idea per box, paste from the AI",
          count: 5,
        },
      ],
    },
  },
  {
    activityId: 5,
    stepNumber: 4,
    instruction:
      "Paste the new ideas into Round 2 below, alongside the Round 1 ideas you saved earlier.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-5-rounds",
      prompt:
        "Round 2 ideas (after the anchor break). Same storage key as Round 1, so you can see both side by side here.",
      groups: [
        {
          id: "round1",
          label: "Round 1 (anchored)",
          placeholder: "Already saved",
          count: 5,
        },
        {
          id: "round2",
          label: "Round 2 (anchor broken)",
          placeholder: "Paste each new idea here",
          count: 5,
        },
      ],
    },
  },
  {
    activityId: 5,
    stepNumber: 5,
    instruction:
      "Compare the two rounds above. Mark the ideas that only appeared after you broke the anchor — add an asterisk or \"!\" inline so they stand out at a glance.",
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 22: Describe It, See It — "Try it in an AI tool" → keep
  // the existing prompt_sandbox, but the description currently asks
  // users to "drop the prompt into" something else; reinforce the
  // sandbox.
  // ───────────────────────────────────────────────────────────────
  // (No instruction change needed; sandbox is already in step 2.)

  // ───────────────────────────────────────────────────────────────
  // Activity 23: Slide Deck Draft — step 6 asks for a "comparison
  // note", convert to in-page text_list_entry.
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 23,
    stepNumber: 6,
    instruction:
      "Capture your comparison notes below: what you kept, what you changed, what the AI couldn't have known. Copy the final reflection into the deliverable box at the bottom of this page when ready.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-23-comparison",
      prompt:
        "Three short notes. Save in browser; copy to deliverable when ready.",
      groups: [
        {
          id: "kept",
          label: "What you kept from the AI draft",
          placeholder: "Structure, opening, headings...",
          count: 3,
        },
        {
          id: "changed",
          label: "What you changed",
          placeholder: "Examples, specifics, vocabulary...",
          count: 3,
        },
        {
          id: "missed",
          label: "What the AI couldn't have known",
          placeholder: "Audience nuance, recent context, internal vocab...",
          count: 3,
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 32: Reimagine an Assignment — step 4 "Write a short plan"
  // becomes in-page text_list_entry.
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 32,
    stepNumber: 4,
    instruction:
      "Pick the alternative you'd most want to pilot and capture your plan below. The boxes save in your browser; copy the final plan into the deliverable box at the bottom when ready.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-32-pilot-plan",
      prompt: "One-page pilot plan, three sections.",
      groups: [
        {
          id: "build",
          label: "What you'd need to build",
          placeholder: "Rubric, instructions, sample, prompt template...",
          count: 5,
        },
        {
          id: "tell",
          label: "What you'd tell students",
          placeholder: "Framing, expectations, what's allowed",
          count: 1,
        },
        {
          id: "assess",
          label: "What you'd assess",
          placeholder: "Rubric criteria in 1-2 sentences",
          count: 1,
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 38: Signal vs. Noise Filter — step 4 "Compile into a
  // simple table" becomes the actual in-page table.
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 38,
    stepNumber: 4,
    instruction:
      "Capture your evaluation in the table below. Five rows, one per item.",
    interactiveType: "comparison_table",
    interactiveData: {
      storageKey: "activity-38-noise-filter",
      rowHeader: "Item",
      rowsReadOnly: false,
      rows: [
        { id: "i1", label: "Item 1", placeholder: "Source name" },
        { id: "i2", label: "Item 2", placeholder: "Source name" },
        { id: "i3", label: "Item 3", placeholder: "Source name" },
        { id: "i4", label: "Item 4", placeholder: "Source name" },
        { id: "i5", label: "Item 5", placeholder: "Source name" },
      ],
      columns: [
        { id: "headline", label: "Headline" },
        { id: "verdict", label: "Hype / Substance / Mixed" },
        { id: "relevance", label: "Relevance" },
        { id: "takeaway", label: "1-line takeaway" },
      ],
      cellPlaceholder: "Short note",
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
