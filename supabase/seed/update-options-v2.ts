/**
 * Second pass on assessment option text. Beta feedback: the earlier
 * revision still had "I haven't" / "I'm not sure" in the New tier and
 * gave Advanced away through insider jargon (VITRA, ERIC, Google
 * Scholar, "anchoring"). Result was that testers could pick the "right"
 * answer without reading carefully.
 *
 * This pass applies four rules:
 *   - New           = confident but naive (no self-rating language)
 *   - Foundational  = surface effort, stops early
 *   - Intermediate  = partial rigor, samples the problem
 *   - Advanced      = complete behavior, described as habit not insight
 *   - All options within ~18-25 words and equalized in length
 *   - Advanced uses accessible phrasing ("ASU-approved", "primary source")
 *     instead of vocabulary flexes.
 *
 * Run with: npx tsx supabase/seed/update-options-v2.ts
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
        "I'd point them to ChatGPT — it's the one I know by name and seems to handle summaries well.",
      Foundational:
        "I'd recommend whatever tool I've personally used and show them how I set it up.",
      Intermediate:
        "I'd ask about their use case first, then suggest two or three tools I've used and where each fell short.",
      Advanced:
        "I'd ask about the data involved first — student posts have privacy implications — then narrow to ASU-approved tools that handle long inputs well.",
    },
  },
  {
    question_id: 2,
    by_level: {
      "New to this":
        "I'd pick the best of the five — that's usually close enough for a brainstorm.",
      Foundational:
        "I'd rephrase my prompt to ask for something different and try again.",
      Intermediate:
        "I'd ask it to generate ideas that take a completely different angle — maybe from a student's perspective.",
      Advanced:
        "I'd push past the first set — add a constraint, swap the perspective, or have it argue against its own suggestions.",
    },
  },
  {
    question_id: 3,
    by_level: {
      "New to this":
        "I'd build my point around those citations — if the AI pulled them, they're in its training data somewhere.",
      Foundational:
        "I'd scan the journal names and years to see if anything looks off, then use the citations as-is.",
      Intermediate:
        "I'd search one or two titles in a library database to spot-check before leaning on them.",
      Advanced:
        "I'd look up each citation in a database to confirm it exists and the findings are quoted correctly.",
    },
  },
  {
    question_id: 4,
    by_level: {
      "New to this":
        "I'd include it — the AI gave a specific university, year, and quote, so it probably found a real source.",
      Foundational:
        "I'd do a quick web search to confirm the policy and quote exist before using them.",
      Intermediate:
        "I'd search the quote and the policy separately — sometimes AI gets the university right but the quote wrong.",
      Advanced:
        "I'd verify the quote in a primary source and check the university's actual policy page before I reference any of it.",
    },
  },
  {
    question_id: 5,
    by_level: {
      "New to this":
        "I'd use the draft as-is — getting the content right matters more than whether the tone is exactly mine.",
      Foundational:
        "I'd rewrite the parts that feel off by hand — I know my voice better than the AI does.",
      Intermediate:
        "I'd give the AI more direction on tone and try again, then polish whatever still feels off.",
      Advanced:
        "I'd paste in a sample of my own writing as a style reference, have it try again, then polish what's still off.",
    },
  },
  {
    question_id: 6,
    by_level: {
      "New to this":
        "I don't see how AI would handle a multi-step process — I think of it as a Q&A tool.",
      Foundational:
        "I'd look for a tool that could automate pieces of it, but I'd need someone to help me set it up.",
      Intermediate:
        "I'd use templates and prompts to speed up each step, but keep myself in the loop for every send.",
      Advanced:
        "I'd map the steps, pick or build an agent with the right tool access, and add a human checkpoint before anything sends.",
    },
  },
  {
    question_id: 7,
    by_level: {
      "New to this":
        "I'd sort and filter the spreadsheet manually — it hadn't occurred to me that AI could help.",
      Foundational:
        "I'd paste some of the comments into ChatGPT to find themes — nothing with names attached.",
      Intermediate:
        "I'd use Copilot in Excel or Gemini in Sheets to summarize trends without moving the data anywhere.",
      Advanced:
        "I'd use a tool cleared for student data, de-identify before anything leaves my machine, and keep the raw file out of shared spaces.",
    },
  },
  {
    question_id: 8,
    by_level: {
      "New to this":
        "I'd build it in PowerPoint or Canva — hadn't thought to use AI for a diagram.",
      Foundational:
        "I'd ask ChatGPT to generate one and use whatever it comes up with.",
      Intermediate:
        "I'd draft it with an AI tool, then fix the labels and layout myself.",
      Advanced:
        "I'd use a tool built for diagrams — Napkin, or Mermaid via an LLM — and expect to polish labels and relationships.",
    },
  },
  {
    question_id: 9,
    by_level: {
      "New to this":
        "I don't think it matters — the writing is mine, the AI just helped with the phrasing.",
      Foundational:
        "I'd mention it in a footnote if it came up, but I wouldn't go out of my way.",
      Intermediate:
        "I'd check the funder's guidelines and add a line about AI assistance if they ask for it.",
      Advanced:
        "I'd check the funder's policy and ASU's guidance, then note what the AI did and how I verified the content.",
    },
  },
  {
    question_id: 10,
    by_level: {
      "New to this":
        "Honestly, I'd agree — AI is fluent enough that writing-from-scratch feels less necessary.",
      Foundational:
        "I'd say it's more complicated than that — AI helps, but it also makes mistakes and can be biased.",
      Intermediate:
        "I'd say writing still matters — the thinking behind it is what AI can't really do for you.",
      Advanced:
        "I'd push back — AI changes what writing looks like, but analysis, argument, and synthesis still matter. We need to redesign the assignments.",
    },
  },
  {
    question_id: 11,
    by_level: {
      "New to this":
        "I'd keep the activity as-is — primary sources are about students engaging with the text, not AI.",
      Foundational:
        "I'd have AI summarize or translate a source so students can focus on the analysis.",
      Intermediate:
        "I'd use AI to generate discussion questions or give students context before they analyze the source.",
      Advanced:
        "I'd have students prompt AI to role-play the author, then critique where its responses diverge from the historical record.",
    },
  },
  {
    question_id: 12,
    by_level: {
      "New to this":
        "I try things and see what works — I don't really have a framework for deciding.",
      Foundational:
        "I use AI for routine tasks and stay away from anything touching student work.",
      Intermediate:
        "I think about whether AI is genuinely helping vs. just faster, and I'm careful with sensitive data.",
      Advanced:
        "I weigh purpose, stakes, and policy — and I stay open to changing my mind as the tools and norms evolve.",
    },
  },
  {
    question_id: 13,
    by_level: {
      "New to this":
        "Honestly, I've given up — it moves too fast for me to keep up.",
      Foundational:
        "I read what ASU sends out and an occasional article if a colleague passes one along.",
      Intermediate:
        "I skim a few newsletters and try new tools when something seems genuinely useful.",
      Advanced:
        "I follow curated sources I trust, test tools in low-stakes ways, and focus on what actually changed — not hype.",
    },
  },
  {
    question_id: 14,
    by_level: {
      "New to this":
        "I'd wait until someone showed me — I don't like learning new tools by poking around.",
      Foundational:
        "I'd click around and figure it out, or ask someone who's used it before.",
      Intermediate:
        "I'd search for a tutorial or video walkthrough before trying it myself.",
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
  console.log("\n✅ All options updated (v2)");
}

run();
