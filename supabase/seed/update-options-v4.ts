/**
 * Fourth pass on assessment option text. Audit found three weak
 * distinctions (Q2 Int/Adv, Q4 Found/Int, Q8 Int/Adv) and one
 * mis-tiered option (Q5 Foundational read as an expert move).
 *
 * Also re-focused Q4 away from generic info-literacy ("did you
 * web-search?") toward Maynard's actual skill: recognizing how AI
 * specifically fails (confident specifics, fabricated quotes and
 * citations, hallucination-prone categories).
 *
 * Nuance notes: Advanced/Intermediate answers use hedging ("can be",
 * "often", "my first step") instead of absolutes, to read like a
 * practitioner's habit rather than a textbook rule.
 *
 * Run with: npx tsx supabase/seed/update-options-v4.ts
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
    question_id: 2,
    by_level: {
      Advanced:
        "I'd start by running the same prompt through a different AI — each model has its own anchors — and keep pushing past the first set with constraints or a counter-argument.",
    },
  },
  {
    question_id: 4,
    by_level: {
      "New to this":
        "The AI gave a real university, a year, and a quote — that specificity usually means it found a real source.",
      Foundational:
        "I'd do a quick web search to confirm the policy and the quote before using them.",
      Intermediate:
        "Named quotes and specific dates are the things AI most often fabricates, so I'd start by verifying those separately — one could be real and the other invented.",
      Advanced:
        "Confident specifics from AI can be a hallucination signal, so I'd check the quote in a primary source and confirm the policy on the university's own site — and if the AI cited sources, verify those exist too, since fabricated citations are common.",
    },
  },
  {
    question_id: 5,
    by_level: {
      Foundational:
        "I'd retype it in my own words — I'm not sure how to get the AI to sound more like me.",
    },
  },
  {
    question_id: 8,
    by_level: {
      Intermediate:
        "I'd generate a draft with AI, adjust what looks off, and move on.",
      Advanced:
        "I'd expect AI diagrams to often get relationships or labels wrong — my first step would be drafting with AI, then redoing any part where the logic doesn't match what I'm teaching.",
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
  console.log("\n✅ All options updated (v4 — tier distinctions + AI-specific Q4)");
}

run();
