/**
 * update-activity-value-add-1.0.0.ts
 *
 * Populate `value_add` (one short paragraph — "why am I doing this?") and
 * `objectives` (bulleted list — "what is it teaching me?") for every
 * level-up activity. Run after migration 013 ships.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type Update = {
  id: number;
  value_add: string;
  objectives: string[];
};

// IDs match the seed order in Level-Up_Activities.csv (sequential, starting at 1).
const updates: Update[] = [
  // Skill 1 — Choose the right AI tool
  {
    id: 1,
    value_add:
      "Different AI tools have different strengths and limits, even on the same prompt. Trying a few side-by-side gives you a feel for which tool is the right call for which job — without committing to one before you know what's out there.",
    objectives: [
      "Recognize that AI tools differ in tone, format, and accuracy.",
      "Build a personal sense of which tools fit which tasks.",
      "Notice what surprises you that you wouldn't have predicted.",
    ],
  },
  {
    id: 2,
    value_add:
      "Most teaching and research work doesn't have one \"right\" AI tool — choices vary by task. A reusable comparison habit saves you from defaulting to whatever's open.",
    objectives: [
      "Match tools to tasks based on real strengths, not familiarity.",
      "Articulate the trade-offs between competing tools.",
      "Catch limitations before they bite you in a real workflow.",
    ],
  },
  {
    id: 3,
    value_add:
      "When your department asks \"should we use this?\" you become the trustworthy answer. A structured audit protects students, protects you, and makes adoption decisions defensible.",
    objectives: [
      "Run a systematic, multi-axis evaluation of an AI tool.",
      "Translate VITRA, privacy, and accessibility checks into plain-language risk.",
      "Produce a recommendation a busy decision-maker can act on.",
    ],
  },

  // Skill 2 — Iterative conversation & anchoring
  {
    id: 4,
    value_add:
      "AI is more useful as a conversation than as a vending machine. The follow-up question is where the value lives — most one-shot prompts leave 80% of the tool unused.",
    objectives: [
      "Practice multi-turn dialogue instead of one-and-done prompting.",
      "Notice how AI output sharpens (or drifts) across turns.",
      "Build the habit of pushing back instead of accepting the first answer.",
    ],
  },
  {
    id: 5,
    value_add:
      "AI tends to lock onto its first response and treat it as the right framing. If you don't deliberately break that anchor, you'll get one good idea and four variations of it — and miss the actually different option.",
    objectives: [
      "Recognize when an AI conversation has anchored on one direction.",
      "Use constraints, contrarian roles, and reframing to force divergent thinking.",
      "Compare anchored vs. broken-anchor output side by side.",
    ],
  },
  {
    id: 6,
    value_add:
      "Different prompt strategies surface different ideas. A multi-angle approach gives you a richer raw material set — especially for problems where the obvious answer isn't the right one.",
    objectives: [
      "Apply role-based and structured-reasoning prompts (Tree of Thought).",
      "Cross-compare what each angle uniquely surfaces.",
      "Synthesize across prompts rather than picking a single \"best\" output.",
    ],
  },

  // Skill 3 — Research & verify sources
  {
    id: 7,
    value_add:
      "AI tools confidently invent citations that don't exist. A 5-minute habit of checking what you cite saves your reputation — and protects students from spreading made-up sources.",
    objectives: [
      "See how often AI fabricates citations.",
      "Build a fast verification routine using Google Scholar.",
      "Calibrate your trust in AI-generated bibliographies.",
    ],
  },
  {
    id: 8,
    value_add:
      "Plausible-sounding paragraphs can be 40% wrong without anything looking off. Color-coded verification trains your eye to see what's real and what's invented.",
    objectives: [
      "Apply a systematic claim-by-claim verification pass.",
      "Distinguish \"wrong\" from \"partially accurate\" from \"fabricated.\"",
      "Spot patterns in the kinds of claims AI most often gets wrong.",
    ],
  },
  {
    id: 9,
    value_add:
      "AI can dramatically speed up literature work — but only with verification gates baked in. A documented workflow lets you (and your team) get the speed without the risk.",
    objectives: [
      "Design a workflow that pairs AI speed with human verification.",
      "Identify where AI adds value vs. where it adds risk.",
      "Produce a reusable template colleagues can adopt.",
    ],
  },

  // Skill 4 — Fact-check hallucinations
  {
    id: 10,
    value_add:
      "AI sounds confident even when it's wrong. The first step to catching hallucinations is realizing how often they happen on topics you actually know.",
    objectives: [
      "Recognize hallucinations on familiar territory.",
      "Build skepticism that doesn't depend on external lookup.",
      "See how confident wrong-ness sounds in AI output.",
    ],
  },
  {
    id: 11,
    value_add:
      "Confidence is not accuracy. A short, structured check turns \"this sounds right\" into \"I have evidence either way\" — without burning an hour on every claim.",
    objectives: [
      "Notice when AI confidence is doing the persuading rather than the facts.",
      "Apply a 3-step verification check under time pressure.",
      "Learn the tell-tale signs that an AI is bluffing.",
    ],
  },
  {
    id: 12,
    value_add:
      "When AI-generated material goes into real work, you need a defensible evaluation — not a vibe check. RACCCA gives you a shared vocabulary for what's wrong and where.",
    objectives: [
      "Apply a six-dimension framework to real AI output.",
      "Justify use/revise/discard decisions with specific evidence.",
      "Communicate AI quality concerns clearly to a colleague.",
    ],
  },

  // Skill 5 — Edit & refine AI output
  {
    id: 13,
    value_add:
      "AI output reads as \"almost yours\" — and that's the trap. Editing aloud trains the part of your ear that catches every sentence that doesn't actually sound like you.",
    objectives: [
      "Distinguish AI's voice from your own.",
      "Build a personal editing pass that goes faster than starting from scratch.",
      "Avoid sending AI-flavored text out under your name.",
    ],
  },
  {
    id: 14,
    value_add:
      "AI can mimic your style, but only if you teach it your style. The work you put in once pays off across every future draft for that voice.",
    objectives: [
      "Use samples to teach AI your tone, structure, and word choices.",
      "Identify which style elements AI captures and which it can't.",
      "Develop a fast personal-style-rewrite loop.",
    ],
  },
  {
    id: 15,
    value_add:
      "Quality climbs steeply when you treat drafting as iteration, not generation. Self-critique-then-revise gets you 80% of the way to publishable in a fraction of the manual time.",
    objectives: [
      "Use AI to critique its own drafts against explicit criteria.",
      "See how output quality evolves across multiple passes.",
      "Identify the gap between \"AI-best\" and \"publishable\" — and what only you can close.",
    ],
  },

  // Skill 6 — Build & deploy simple agents
  {
    id: 16,
    value_add:
      "\"Agent\" is the buzzword everyone is using and almost no one is using carefully. Knowing the actual difference saves you from being sold a chat tool with a fancy label.",
    objectives: [
      "Define the line between an agent and a chat conversation.",
      "Notice where AI handles steps autonomously vs. needs you to direct.",
      "Build a working mental model for how agents fit (or don't) in your work.",
    ],
  },
  {
    id: 17,
    value_add:
      "Most agent ideas die because the design wasn't sturdy. Mapping it on paper exposes the holes before you've burned time building the wrong thing.",
    objectives: [
      "Translate a real recurring task into an agent design spec.",
      "Identify where humans need to stay in the loop.",
      "Surface risks and edge cases before any code or config exists.",
    ],
  },
  {
    id: 18,
    value_add:
      "A live agent that handles even one task reliably is a real productivity gain — and a real responsibility. Building, testing, and watching for drift is the only way to know which it is.",
    objectives: [
      "Translate a paper design into a working agent.",
      "Stress-test it across varied inputs.",
      "Decide whether the agent is trustworthy unsupervised, with evidence.",
    ],
  },

  // Skill 7 — Analyze data with AI
  {
    id: 19,
    value_add:
      "AI summaries of data are a fast first read — but they confidently mis-describe things you can't always check at a glance. The skill is using them as a starting hypothesis, not a finding.",
    objectives: [
      "See how AI describes patterns vs. invents them.",
      "Compare AI's read of a dataset to your own informed read.",
      "Build calibrated trust in AI as a first-pass analyst.",
    ],
  },
  {
    id: 20,
    value_add:
      "Open-ended responses are usually the richest data and the most painful to analyze. AI clustering can compress days of coding work into an hour — if you steer the prompt and audit the results.",
    objectives: [
      "Use explicit instructions to constrain AI theme generation.",
      "Compare AI themes against your own manual analysis.",
      "Identify what AI clustering catches vs. misses.",
    ],
  },
  {
    id: 21,
    value_add:
      "Student data analysis with AI is high-leverage and high-risk. A privacy-first workflow gives you the leverage without exposing students or yourself to compliance failures.",
    objectives: [
      "Design de-identification and tool-approval steps that hold up under audit.",
      "Build an audit trail you'd be willing to defend.",
      "Run the workflow on real-world data and refine where it broke.",
    ],
  },

  // Skill 8 — Create visuals with AI
  {
    id: 22,
    value_add:
      "Describing a concept to an AI image tool is a stress test of your own clarity. Where the picture goes wrong tells you exactly what your description was missing.",
    objectives: [
      "Translate concepts into prompts an image tool can act on.",
      "Notice where AI visuals need human correction.",
      "Build a faster path from \"idea\" to \"rough visual.\"",
    ],
  },
  {
    id: 23,
    value_add:
      "Most of the time spent on a 5-slide deck is in starting from blank. AI gets you a workable skeleton in minutes — leaving your human time for what only you know about your audience.",
    objectives: [
      "Use AI to scaffold structure and visual hierarchy.",
      "Identify what AI gets right about generic decks and wrong about yours.",
      "Direct your editing time at the parts that actually matter.",
    ],
  },
  {
    id: 24,
    value_add:
      "AI-generated visuals look professional and can quietly mislead — wrong labels, off-by-one comparisons, inaccessible color choices. The audit habit catches this before publication.",
    objectives: [
      "Audit AI visuals for accuracy, clarity, and accessibility.",
      "Spot the kinds of errors that survive a casual look.",
      "Document corrections in a way that scales across future visuals.",
    ],
  },

  // Skill 9 — Disclose & attribute AI use
  {
    id: 25,
    value_add:
      "Disclosure rules vary by institution, journal, and funder — and getting one wrong can mean a retraction or a blocked grant. Knowing where the policies live is half the battle.",
    objectives: [
      "Locate ASU's current AI disclosure guidance.",
      "Locate one external policy relevant to your work.",
      "Notice how requirements differ across contexts.",
    ],
  },
  {
    id: 26,
    value_add:
      "A pre-written disclosure statement is one less thing to draft under deadline. Three reusable versions cover most of what shows up in a typical week.",
    objectives: [
      "Write context-specific disclosures you can reuse.",
      "Distinguish what to disclose from what's overshare.",
      "Frame AI use in language your audience already trusts.",
    ],
  },
  {
    id: 27,
    value_add:
      "Edge cases are where disclosure gets contentious. A team-level decision tree turns judgment calls into agreed defaults — and reduces the load on any one person to relitigate it.",
    objectives: [
      "Map disclosure decisions across audience, purpose, and context.",
      "Handle ambiguous cases with explicit rationale.",
      "Produce a reference your team can actually use.",
    ],
  },

  // Skill 10 — Discuss AI possibilities & limitations
  {
    id: 28,
    value_add:
      "A lot of strong opinions about AI come from never-tested assumptions. Testing your own predictions is the fastest way to build a stance that can survive a hallway argument.",
    objectives: [
      "Articulate what you currently believe AI can and can't do.",
      "Test those beliefs against actual AI behavior.",
      "Update your mental model with evidence rather than vibes.",
    ],
  },
  {
    id: 29,
    value_add:
      "Strong claims about AI come at you all the time. Practicing nuance — yes-and instead of yes-or-no — keeps the conversation moving instead of polarizing it.",
    objectives: [
      "Identify the kernel of truth and the kernel of overstatement in a claim.",
      "Cite specific limitations and biases by name.",
      "Respond in a way that opens dialogue rather than closing it.",
    ],
  },
  {
    id: 30,
    value_add:
      "Departments need someone who can hold a balanced 15-minute conversation about AI without it devolving into cheerleading or panic. That person earns disproportionate influence on what their unit actually does.",
    objectives: [
      "Design talking points that cover capability and limitation evenly.",
      "Anticipate the predictable objections and have responses ready.",
      "Move a group from \"should we?\" to \"what's our next step?\"",
    ],
  },

  // Skill 11 — Use AI creatively
  {
    id: 31,
    value_add:
      "Most prompts are timid. Asking for an obviously weird format unlocks ideas you wouldn't have otherwise — and shows you the upper edges of what AI can play with.",
    objectives: [
      "Push past the default \"make this professional\" prompt.",
      "See what AI surfaces when given creative latitude.",
      "Recognize where playful prompting yields actually useful output.",
    ],
  },
  {
    id: 32,
    value_add:
      "AI is a forcing function for assignment redesign — what would actually be hard for AI to do well is often a sharper version of your learning objective. The reimagining is at least as valuable as the alternatives themselves.",
    objectives: [
      "Generate genuinely different versions of an existing assignment.",
      "Evaluate which versions still hit the original learning objective.",
      "Identify what's worth piloting vs. what's a fun-but-wrong direction.",
    ],
  },
  {
    id: 33,
    value_add:
      "The most interesting AI-in-courses work isn't \"AI as tutor\" — it's activities that couldn't exist without AI. Designing one is how you find out what your discipline actually wants from this technology.",
    objectives: [
      "Identify a learning goal AI uniquely enables.",
      "Design an activity where AI is structurally essential.",
      "Anticipate what could go wrong and how you'd handle it.",
    ],
  },

  // Skill 12 — Balance curiosity, care, clarity, intentionality
  {
    id: 34,
    value_add:
      "Most AI use happens on autopilot — you reach for it or skip it without noticing why. A short log surfaces your real decision criteria, including the ones you wouldn't have admitted out loud.",
    objectives: [
      "Notice when and why you choose AI (or don't).",
      "Identify your own implicit decision rules.",
      "Spot patterns you want to keep — and ones you want to change.",
    ],
  },
  {
    id: 35,
    value_add:
      "A written personal framework is the fastest way to stop relitigating \"should I use AI for this\" every time. Once you've decided, future you can just check the rules.",
    objectives: [
      "Articulate your own criteria for when to use AI.",
      "Bake at least one ethical and one practical consideration into the rules.",
      "Capture what you're still uncertain about — to revisit later.",
    ],
  },
  {
    id: 36,
    value_add:
      "Real AI decisions rarely hit only one principle — curiosity, care, clarity, and intentionality often pull in different directions. A structured case study makes those tensions visible and resolvable.",
    objectives: [
      "Apply ASU's Principled Innovation framework to a real situation.",
      "Surface tensions between competing principles.",
      "Propose a path forward that's defensible to a colleague.",
    ],
  },

  // Skill 13 — Stay current with reliable resources
  {
    id: 37,
    value_add:
      "AI moves fast — the news doesn't stay news for long. A small set of trusted sources gives you a manageable signal stream instead of doomscrolling LinkedIn for AI takes.",
    objectives: [
      "Identify three sources you'll actually check regularly.",
      "Diversify across institutional, practitioner, and tool perspectives.",
      "Begin a sustainable reading habit.",
    ],
  },
  {
    id: 38,
    value_add:
      "Most AI content is hype, and hype distorts what you think the technology can do. A simple evaluation rubric turns scrolling into triage.",
    objectives: [
      "Distinguish hype from substance in AI writing.",
      "Decide quickly whether something is relevant to your work.",
      "Build a habit of only saving what's actually useful.",
    ],
  },
  {
    id: 39,
    value_add:
      "Your colleagues can't read everything either. A monthly brief makes you the person whose updates the team actually opens — and saves them all the same triage work you've been doing.",
    objectives: [
      "Curate AI updates for a non-expert audience.",
      "Write summaries that make relevance obvious.",
      "Build a reusable template you can sustain.",
    ],
  },

  // Skill 14 — Use AI to learn AI
  {
    id: 40,
    value_add:
      "AI is unusually good at teaching you about itself — but with the same caveats as any other AI output. The exercise is a 15-minute crash course AND a real test of your verification habits.",
    objectives: [
      "Get a fast, personalized intro to AI from AI.",
      "Compare AI's self-description against other things you've heard.",
      "Practice asking better follow-up questions.",
    ],
  },
  {
    id: 41,
    value_add:
      "Every AI tool has features you haven't tried. Asking the AI itself to teach you is the cheapest, fastest learning loop — as long as you check its work as you go.",
    objectives: [
      "Use AI as a tutor for one of its own features.",
      "Notice where AI instructions are wrong, vague, or out of date.",
      "Build the metaskill of \"asking the AI to teach you the AI.\"",
    ],
  },
  {
    id: 42,
    value_add:
      "New AI features ship constantly. A reusable meta-learning protocol turns \"another thing to learn\" into \"here's the 5-step thing I do.\" Compounds across years.",
    objectives: [
      "Design a 5-step protocol for learning any new AI capability.",
      "Stress-test the protocol on something genuinely unfamiliar.",
      "Notice where AI alone isn't enough and external sources are needed.",
    ],
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  for (const u of updates) {
    const { error } = await sb
      .from("level_up_activities")
      .update({ value_add: u.value_add, objectives: u.objectives })
      .eq("id", u.id);
    if (error) {
      console.error(`Activity #${u.id} failed:`, error.message);
    } else {
      console.log(`✓ Activity #${u.id} updated`);
    }
  }

  console.log(`\nDone — ${updates.length} activities updated.`);
}

main();
