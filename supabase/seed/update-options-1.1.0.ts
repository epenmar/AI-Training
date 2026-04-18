/**
 * Revises assessment option text to be more level in length across tiers,
 * so "longest = Advanced" is no longer a giveaway. Foundational consistently
 * references common, named tools; Advanced emphasizes finding/building
 * fit-for-purpose tools and techniques.
 *
 * Run with: npx tsx supabase/seed/update-options.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type OptionUpdate = {
  question_id: number;
  by_level: Record<string, string>; // level_label → new text
};

const updates: OptionUpdate[] = [
  {
    question_id: 1,
    by_level: {
      "New to this":
        "Not sure which tools are available for that — I'd have to look into it before helping.",
      Foundational:
        "I'd suggest ChatGPT or Copilot, since those are the ones I've heard of most.",
      Intermediate:
        "I'd ask what they want from the summaries, then recommend a couple of tools I've used for similar tasks.",
      Advanced:
        "I'd help them weigh options — including ones I haven't used — against data privacy, input length, and VITRA status.",
    },
  },
  {
    question_id: 2,
    by_level: {
      "New to this":
        "I haven't used AI to brainstorm — not sure how to have a back-and-forth with it.",
      Foundational:
        "I'd take the best of the five — ChatGPT usually gets it right on the first try.",
      Intermediate:
        "I'd rephrase my prompt to be more specific and ask it to try again with more variety.",
      Advanced:
        "I'd push past the anchor — assign a different perspective, add constraints, or have it challenge its own assumptions.",
    },
  },
  {
    question_id: 3,
    by_level: {
      "New to this": "I haven't tried using AI for research tasks yet.",
      Foundational:
        "If ChatGPT included citations, I'd assume they're real — that's the point of using it for research.",
      Intermediate:
        "I'd skim the citations to see if the journal names and dates look reasonable, then use them.",
      Advanced:
        "I'd search each article by title and author in Google Scholar or ERIC — AI often fabricates plausible citations.",
    },
  },
  {
    question_id: 4,
    by_level: {
      "New to this":
        "I'm not familiar enough with AI outputs to know what would need checking.",
      Foundational:
        "If Copilot gave that much detail — a university, a year, a quote — it probably found it somewhere.",
      Intermediate:
        "I'd do a quick web search to confirm the policy and quote before including them.",
      Advanced:
        "I'd verify the quote in a primary source and check the actual policy page — AI often conflates or fabricates details.",
    },
  },
  {
    question_id: 5,
    by_level: {
      "New to this":
        "I haven't used AI to write anything, so I'm not sure what the output would look like.",
      Foundational:
        "I'd use what ChatGPT produced as-is — content matters most, I can always tweak tone later.",
      Intermediate:
        "I'd rewrite the parts that feel off by hand — I know my voice better than the AI does.",
      Advanced:
        "I'd paste a sample of my writing as a style reference, have it try again, then polish what's still off.",
    },
  },
  {
    question_id: 6,
    by_level: {
      "New to this":
        "I've heard the term 'AI agent' but I'm not clear on what it actually means.",
      Foundational:
        "Not sure how AI would handle a multi-step process — I think of ChatGPT as a Q&A tool.",
      Intermediate:
        "I'd look for a tool that could automate parts of it, but I'd want someone to walk me through the setup.",
      Advanced:
        "I'd map the steps, pick or build an agent with the right tool access, and add a human checkpoint before anything sends.",
    },
  },
  {
    question_id: 7,
    by_level: {
      "New to this": "I'm not sure how AI could help with a spreadsheet.",
      Foundational:
        "I'd sort and filter the spreadsheet manually — hadn't thought to use ChatGPT for data analysis.",
      Intermediate:
        "I might paste comments into ChatGPT to find themes, after I removed any student names.",
      Advanced:
        "I'd use a tool approved for student data (like Copilot in Excel) and de-identify everything before it leaves my machine.",
    },
  },
  {
    question_id: 8,
    by_level: {
      "New to this": "I didn't know AI could create visuals or diagrams.",
      Foundational:
        "I'd build it myself in PowerPoint or Canva — I wouldn't think to use AI for a diagram.",
      Intermediate:
        "I'd ask ChatGPT or Copilot to generate one and see what it came up with.",
      Advanced:
        "I'd find a purpose-built tool (Napkin, Mermaid via an LLM) and expect to polish labels and layout myself.",
    },
  },
  {
    question_id: 9,
    by_level: {
      "New to this": "I'm not aware of any policies about disclosing AI use.",
      Foundational:
        "Hadn't thought about that — does it matter if ChatGPT just helped with the writing?",
      Intermediate:
        "I think you're supposed to mention it somewhere — a footnote maybe — but I'm not sure of the rules.",
      Advanced:
        "I'd check the funder's policy and ASU's guidance, then note what AI did and how I verified the content.",
    },
  },
  {
    question_id: 10,
    by_level: {
      "New to this":
        "I don't feel informed enough about AI to weigh in on a question like that.",
      Foundational:
        "I could agree or disagree, but I'm not sure I could give a nuanced answer on the spot.",
      Intermediate:
        "I'd say it's complicated — AI helps with writing but it makes mistakes and carries biases.",
      Advanced:
        "I'd push back — AI changes what writing looks like, but analysis, argument, and synthesis still matter. Assignments need redesigning.",
    },
  },
  {
    question_id: 11,
    by_level: {
      "New to this":
        "I'd be curious to hear the suggestion — I don't have a sense of what's possible yet.",
      Foundational:
        "I'm not sure how ChatGPT fits into history — it seems more useful for STEM or writing.",
      Intermediate:
        "I could see using AI to help students contextualize a source or generate discussion questions.",
      Advanced:
        "I'd try unconventional uses — have students prompt AI as a historical figure and critique where it diverges from the record.",
    },
  },
  {
    question_id: 12,
    by_level: {
      "New to this":
        "I haven't used AI enough to have an approach to that question.",
      Foundational:
        "I'd say I'm still figuring it out — I mostly try things in ChatGPT and see if they work.",
      Intermediate:
        "I'd say I try to be thoughtful — AI is fine for routine tasks, I'm more careful with student data.",
      Advanced:
        "I'd walk through how I weigh purpose, stakes, policy, and my own judgment — less a rulebook, more intentional practice.",
    },
  },
  {
    question_id: 13,
    by_level: {
      "New to this": "I'm not sure where to go for reliable information about AI.",
      Foundational:
        "Honestly, it moves so fast I've mostly given up trying to keep up.",
      Intermediate:
        "I keep an eye on what ASU shares, and I read articles people send me.",
      Advanced:
        "I follow curated sources I trust, test new tools myself, and focus on what actually changed — not hype.",
    },
  },
  {
    question_id: 14,
    by_level: {
      "New to this":
        "I wouldn't know where to start with something like that.",
      Foundational:
        "I'd click around in ChatGPT to figure it out, or wait until someone showed me.",
      Intermediate:
        "I'd search for a tutorial or ask a colleague who's used it before.",
      Advanced:
        "I'd ask the AI itself to walk me through it, try on a low-stakes document, and cross-check what it told me.",
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
  console.log("\n✅ All options updated");
}

run();
