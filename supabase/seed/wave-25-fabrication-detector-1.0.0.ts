/**
 * wave-25-fabrication-detector-1.0.0.ts
 *
 * Activity 8 (The Fabrication Detector): build the in-page markup
 * workspace step 2 has been promising. The HighlighterWorkspace is
 * pinned to the right column; subsequent steps reference back to it
 * without scrolling away. Step 5's manual count instruction goes
 * away — the workspace counts and computes percentages live.
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
  pinToSide?: boolean;
};

const patches: StepPatch[] = [
  // ─────────────────────────────────────────────────────────────────
  // Step 1: ask AI for a 2-paragraph lit review (referenced by step 2)
  // ─────────────────────────────────────────────────────────────────
  {
    activityId: 8,
    stepNumber: 1,
    instruction:
      "Ask the AI for a 2-paragraph literature review on a topic in your field, with in-text citations and a reference list. Then paste the full response into the workspace on the right (or below on narrow screens) so you can mark it up across the next steps.",
    detailedHelp:
      "**Pick a topic where you can verify quickly.** Niche enough that the AI's training data is thin (good — fabrications surface faster). Familiar enough that you can spot when the framing is off.\n\n**The two-paragraph constraint matters.** Long enough that the AI has to commit to multiple claims; short enough that you can verify all of them in 20 minutes.\n\n**Citations *and* reference list both.** Don't accept just in-text — make the AI commit to a full reference. That's where the fabrications concentrate.",
  },

  // ─────────────────────────────────────────────────────────────────
  // Step 2: paste into workspace (pinned)
  // ─────────────────────────────────────────────────────────────────
  {
    activityId: 8,
    stepNumber: 2,
    instruction:
      "Paste the AI output into the workspace on the right. Once you click \"Start highlighting,\" you can select any portion of the text and apply a color in the next steps.",
    detailedHelp:
      "**The workspace stays visible** as you scroll through the rest of the steps, so you don't have to flip back and forth. Select text and click a color in the toolbar to mark it.\n\n**Three colors:** *green* for verified-and-accurate, *yellow* for partially accurate or unsure, *red* for wrong or fabricated. The percentages update live as you go.\n\n**To replace the pasted text** with a different AI output, use \"Replace text\" in the workspace toolbar — that resets all highlights.",
    interactiveType: "highlighter_workspace",
    interactiveData: {
      storageKey: "activity-8-workspace",
      prompt:
        "Paste the AI's full literature review (both paragraphs + the reference list) here.",
      placeholder:
        "Paste the AI-generated paragraphs and reference list here. You'll select portions and apply highlight colors in the next steps.",
      legend: [
        { color: "green", label: "Verified and accurate" },
        { color: "yellow", label: "Partially accurate or unsure" },
        { color: "red", label: "Wrong or fabricated" },
      ],
    },
    pinToSide: true,
  },

  // ─────────────────────────────────────────────────────────────────
  // Step 3: verify each citation, mark in workspace
  // ─────────────────────────────────────────────────────────────────
  {
    activityId: 8,
    stepNumber: 3,
    instruction:
      "Go through each citation in the workspace. Search for it in [Google Scholar](https://scholar.google.com) or your library database. In the workspace, select the citation text and click the right color: green if it exists and is described accurately, red if it's fabricated or misrepresented, yellow if you're unsure or it's partially right.",
    detailedHelp:
      "**Search method:** copy the *exact* citation title into [Google Scholar](https://scholar.google.com), wrapped in quotation marks. If nothing comes back, drop the quotes and try again. If still nothing, search the author's name plus a distinctive phrase from the title.\n\n**Three patterns to expect:**\n• **Real:** title, author, journal, year all match. → *green*\n• **Frankenstein:** real author + real journal, but this specific paper doesn't exist. → *red*\n• **Fully invented:** no trace anywhere. Sometimes the author also doesn't exist. → *red*\n\n\"Described accurately\" means the AI's summary of the article actually matches the abstract. A real paper with a wrong-summary still gets red.",
  },

  // ─────────────────────────────────────────────────────────────────
  // Step 4: verify each non-citation factual claim
  // ─────────────────────────────────────────────────────────────────
  {
    activityId: 8,
    stepNumber: 4,
    instruction:
      "Now do the same for non-citation factual claims (dates, statistics, attributions, definitions). Select each claim in the workspace and apply yellow if partially accurate, red if wrong or fabricated, green if confirmed.",
    detailedHelp:
      "**Yellow (partially accurate):** the gist is right but the specifics are off. \"Active learning emerged in the 1990s\" when the term traces to Bonwell & Eison's 1991 ASHE-ERIC report — close, but compresses a longer history.\n\n**Red (fabricated):** the claim is presented as fact but isn't. \"75% of universities have adopted X\" with no source you can find.\n\nIf you can't quickly find a primary source, that's a yellow at best — \"plausibly true but unverified\" still belongs in the doubt column.",
  },

  // ─────────────────────────────────────────────────────────────────
  // Step 5: read the live stats; interpret
  // ─────────────────────────────────────────────────────────────────
  {
    activityId: 8,
    stepNumber: 5,
    instruction:
      "Read the live percentages at the bottom of the workspace. Note the pattern in the errors — what type of claim was most likely to be wrong?",
    detailedHelp:
      "The workspace already counts the green / yellow / red percentages and totals for you, so step 5 isn't about counting; it's about *interpreting*.\n\n**Patterns to watch for:**\n• Are the fabrications clustered in *citations* (most common) or in *general claims*?\n• Did the AI fabricate *more* on niche subtopics or *more* on broad ones?\n• Did it invent specific numbers more often than qualitative claims?\n\nThe number matters less than the order of magnitude. 80% green tells a different story than 30% green.",
  },

  // ─────────────────────────────────────────────────────────────────
  // Step 6: reflection — refer to deliverable
  // ─────────────────────────────────────────────────────────────────
  {
    activityId: 8,
    stepNumber: 6,
    instruction:
      "Capture your reflection in the deliverable box at the bottom of this page: which type of claim was most often wrong, and how would you build a verification habit into your workflow going forward?",
    detailedHelp:
      "**The verification habit you're building:** for any AI-generated content that goes into work, the citations and statistics get verified before you use them. Every time, not when you remember.\n\nIf that feels slow, the alternative is publishing fabrications under your name. The verification habit is non-negotiable; the speed comes with practice.",
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
    if (p.pinToSide !== undefined) patch.pin_to_side = p.pinToSide;
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
