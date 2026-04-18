/**
 * Fifth pass on assessment option text. Audit caught that Advanced
 * answers were still readable as "the right one" because of:
 *   - Length: Adv ran 28–39 words vs ~15–20 for siblings
 *   - Jargon tells: "anchors", "hallucination signal", "fabricated
 *     citations", "expect AI to get X wrong"
 *   - Conditional framing ("I'd start by…") across the board — no
 *     habitual register to signal established practice
 *
 * This pass normalizes length (~18–28 words), strips jargon in favor
 * of plain-language behaviors, and shifts Advanced answers to
 * habitual framing ("I tend to", "I usually", "I stick to", present
 * tense) where the scenario allows. The skill signal comes from
 * *what the person does* plus *whether it reads as an integrated
 * practice* — not from vocabulary or length.
 *
 * Q6, Q10, Q11, Q12, Q13 are left alone — those scenarios ask for
 * one-off reactions or their Advanced answers are already habitual.
 *
 * Run with: npx tsx supabase/seed/update-options-v5.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type OptionUpdate = {
  question_id: number;
  by_level: Record<string, string>;
};

const updates: OptionUpdate[] = [
  {
    question_id: 1,
    by_level: {
      Advanced:
        "I start with the data involved — student posts have privacy implications — and then narrow to ASU-approved tools that handle long inputs.",
    },
  },
  {
    question_id: 2,
    by_level: {
      Advanced:
        "I usually try the same prompt in a different AI, then push past the first set with constraints or a counter-argument.",
    },
  },
  {
    question_id: 3,
    by_level: {
      Advanced:
        "I look up each citation in a database to confirm it exists and the findings are quoted correctly.",
    },
  },
  {
    question_id: 4,
    by_level: {
      Advanced:
        "I tend to check the quote in a primary source and the policy on the university's own site — confident details are exactly where AI tends to invent.",
    },
  },
  {
    question_id: 5,
    by_level: {
      Advanced:
        "I usually paste in a sample of my own writing as a style reference, have the AI try again, then polish what's still off.",
    },
  },
  {
    question_id: 7,
    by_level: {
      Advanced:
        "I stick to tools cleared for student data, de-identify before anything leaves my machine, and keep the raw file out of shared spaces.",
    },
  },
  {
    question_id: 8,
    by_level: {
      Advanced:
        "I draft with AI and then redo the parts where the logic doesn't match what I'm teaching — diagrams are where AI oversimplifies.",
    },
  },
  {
    question_id: 9,
    by_level: {
      Advanced:
        "I check the funder's policy and ASU's guidance, then note what the AI did and how I verified the content.",
    },
  },
  {
    question_id: 14,
    by_level: {
      Advanced:
        "I ask the AI itself to walk me through it, try on a low-stakes document, and cross-check what it tells me.",
    },
  },
];

async function run() {
  for (const { question_id, by_level } of updates) {
    for (const [level, text] of Object.entries(by_level)) {
      const { error } = await supabase
        .from("assessment_options")
        .update({ option_text: text })
        .eq("question_id", question_id)
        .eq("level_label", level);
      if (error) {
        console.error(`Q${question_id} ${level}: ${error.message}`);
      }
    }
    console.log(`Updated Q${question_id}`);
  }
  console.log("\n✅ All options updated (v5 — habitual framing on Advanced)");
}

run();
