/**
 * Third pass on assessment option text. Beta feedback: some options
 * named specific tools (ChatGPT, Copilot in Excel, Gemini in Sheets,
 * Napkin, Mermaid) while sibling options used generic phrasing ("my
 * preferred AI", "an AI tool"). The inconsistency leaked signal —
 * the generic wording sounded more sophisticated than naming a brand,
 * which isn't the intended tier distinction.
 *
 * This pass makes all options tool-agnostic. Tier signal now comes
 * from *what the respondent does*, not which tool they name.
 *
 * Run with: npx tsx supabase/seed/update-options-v3.ts
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
      "New to this":
        "I'd point them to the AI tool I've heard of most — it seems like it handles summaries well.",
    },
  },
  {
    question_id: 7,
    by_level: {
      Foundational:
        "I'd paste some of the comments into an AI chat tool to find themes — nothing with names attached.",
      Intermediate:
        "I'd use the AI feature built into my spreadsheet tool to summarize trends without moving the data anywhere.",
    },
  },
  {
    question_id: 8,
    by_level: {
      Foundational:
        "I'd ask an AI tool to generate one and use whatever it comes up with.",
      Advanced:
        "I'd use a tool built for diagrams and expect to polish labels and relationships myself.",
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
  console.log("\n✅ All options updated (v3 — tool-agnostic)");
}

run();
