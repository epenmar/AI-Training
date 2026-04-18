/**
 * Patch 1.3.2 — Q3 Intermediate now covers both manual database
 * spot-check and search-enabled AI lookup. Beta feedback noted that
 * using a grounded AI (one with web access) to confirm citations is
 * a common real-world practice equivalent in rigor to a database
 * spot-check — the verification step is the same, just delegated.
 *
 * Guard: this only covers *search-grounded* AI (Perplexity, ChatGPT
 * with web, Claude with search). Pure LLM-to-LLM checking without
 * grounding is weaker and belongs at Foundational, not Intermediate,
 * because both models can share hallucination patterns. The wording
 * specifies "search-enabled" to make that distinction.
 *
 * Semver convention for this family of migrations:
 *   MAJOR — structural change (add/remove questions, scoring changes)
 *   MINOR — a question is refocused (intent changes)
 *   PATCH — wording tweaks that preserve intent
 *
 * Run with: npx tsx supabase/seed/update-options-1.3.2.ts
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
    question_id: 3,
    by_level: {
      Intermediate:
        "I'd spot-check a couple of titles — in a library database or through a search-enabled AI — to confirm they're real before leaning on them.",
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
  console.log("\n✅ Patch 1.3.2 applied");
}

run();
