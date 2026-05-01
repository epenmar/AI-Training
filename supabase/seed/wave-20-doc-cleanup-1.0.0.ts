/**
 * wave-20-doc-cleanup-1.0.0.ts
 *
 *   Sweep activities for "open a doc / paste into a sheet" style
 *   references and re-anchor them to the in-page widgets that already
 *   exist for each step. Where users genuinely benefit from external
 *   tools (digital markup tools, large doc editors), keep the option
 *   but reframe so the in-page interactive is the default. Add a
 *   reminder that the Ask AI assistant can search across past
 *   activities so users don't need an external doc to "remember
 *   where they did X."
 *
 *   Also: set community_action='both' on activities whose deliverable
 *   is a visual artifact (so they show both Look Book and Discussion
 *   share buttons).
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

const ASK_AI_NOTE =
  "If you forget where you did this work later, the **Ask AI** button on the Discussion tab can search your past activities by description.";

const patches: StepPatch[] = [
  // ── Activity 5 (Anchoring Breaker) ───────────────────────────────
  {
    activityId: 5,
    stepNumber: 2,
    instruction:
      "Prompt the AI to brainstorm 5 ideas. Paste each one into a Round 1 box below.",
    detailedHelp:
      "**Anchoring** is what happens after this step: the AI's first 5 ideas establish a frame, and every follow-up tends to ride along it. Filling in Round 1 explicitly lets you compare against Round 2 in step 4 — the in-page boxes are your record, no separate doc needed.",
  },

  // ── Activity 6 (Structured Divergent) ────────────────────────────
  {
    activityId: 6,
    stepNumber: 5,
    instruction:
      "Run all three prompts in fresh chats. Copy each tool's output into the Round 1 / Round 2 / Round 3 fields below so you can compare side by side.",
    // detailed_help previously said "single document" — rewrite to point at the in-page capture below.
    detailedHelp:
      "Run all three independently, in fresh chats. Cross-pollination ruins the comparison. The in-page boxes below give you all three side-by-side without leaving the activity. " +
      ASK_AI_NOTE,
  },

  // ── Activity 8 (Fabrication Detector) ────────────────────────────
  {
    activityId: 8,
    stepNumber: 2,
    instruction:
      "Paste the AI output into the markup workspace below. You'll color-code each citation and claim in steps 3 and 4. Three highlight colors: green, yellow, red.",
    detailedHelp:
      "**Why digital markup over print:** you'll need to copy-paste citation strings into Google Scholar in step 3, and you'll likely revise the markup as you verify. Both go faster digitally.\n\n**The in-page workspace below** keeps the AI output, your highlights, and your verification status in one place. If you'd rather use a Google Doc or Word doc you already have open, that works too — but you'll need to copy your verdicts back here for the tally in step 5.\n\nIf you forget where you did this work later, the **Ask AI** button on the Discussion tab can search your past activities by description.",
  },
  {
    activityId: 8,
    stepNumber: 6,
    detailedHelp:
      "**The verification habit you're building:** for any AI-generated content that goes into work, the citations and statistics get verified before you use them. Every time, not when you remember.\n\nIf that feels slow, the alternative is publishing fabrications under your name. The verification habit is non-negotiable; the speed comes with practice.\n\n" +
      ASK_AI_NOTE,
  },

  // ── Activity 12 (RACCCA in Practice) ─────────────────────────────
  {
    activityId: 12,
    stepNumber: 2,
    detailedHelp:
      "**Six sections, one column each for evidence.** The in-page entry below saves your scoring and notes per dimension; you don't need a separate doc. (If you already keep your evaluation memos in **Coda** or another tool, you can mirror your final memo there once it's locked.)\n\nMore on the framework in **Canvas Module 5, Lesson 2, Key terms for evaluating GenAI outputs (~5 min)** — see the Explore the Sources accordion at the bottom of the page.",
  },

  // ── Activity 20 (Theme Finder) ───────────────────────────────────
  {
    activityId: 20,
    stepNumber: 3,
    instruction:
      "Paste the de-identified responses into your AI tool of choice with the prompt below. Then capture the AI's themes in the table at step 5 of this activity.",
    detailedHelp:
      "**The prompt is doing real work** — it's setting bounds (4–6 themes), forcing labeling (give each a name), demanding evidence (which responses go where), and pushing to specificity (1-sentence description, not a paragraph).\n\nIf you let the AI freelance with \"find themes,\" you'll get vague, overlapping clusters. The constraints make the output usable.\n\nIf the AI returns something where one theme contains 80% of responses, push back: \"That theme is too broad — split it into 2–3 sub-themes.\"",
  },

  // ── Activity 35 (Decision Framework Draft) ───────────────────────
  {
    activityId: 35,
    stepNumber: 1,
    detailedHelp:
      "**The header is doing real work.** \"When I will and won't use AI\" is a forcing function — you have to commit to both directions. \"Guidelines\" lets you weasel.\n\n**Where this lives.** The framework you're drafting can live in this activity's deliverable box for now; once you're happy with it, mirror to **Coda** (ASU-supported), Notion, or wherever your personal reference docs live. " +
      ASK_AI_NOTE,
  },

  // ── Activity 38 (Signal vs. Noise Filter) ────────────────────────
  {
    activityId: 38,
    stepNumber: 1,
    detailedHelp:
      "**Five sources, varied.** Mix social media (LinkedIn, X), news (major outlets, niche newsletters), and institutional/academic (Inside Higher Ed, EDUCAUSE, university blogs).\n\n**Why varied:** the calibration only works if the sample reflects what you'll actually encounter. If all five are LinkedIn posts, your filter will only handle LinkedIn.\n\nSave each source name + headline in the table at step 4 of this activity. " +
      ASK_AI_NOTE,
  },
];

const BOTH_BUTTONS: number[] = [
  4, 8, 9, 17, 18, 22, 23, 24, 27, 39,
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

  for (const id of BOTH_BUTTONS) {
    const { error } = await sb
      .from("level_up_activities")
      .update({ community_action: "both" })
      .eq("id", id);
    if (error) console.error(`  x activity ${id}:`, error.message);
    else console.log(`✓ activity ${id} → community_action=both`);
  }

  console.log(`\n${patches.length} step patches + ${BOTH_BUTTONS.length} both-button activities.`);
}

main();
