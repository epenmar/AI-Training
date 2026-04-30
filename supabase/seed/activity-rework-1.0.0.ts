/**
 * activity-rework-1.0.0.ts
 *
 *   1. Em-dash cleanup on every value_add (42 activities).
 *   2. community_action set per activity (lookbook | observation | ask).
 *   3. Activity 28 (Three Things AI Can and Can't Do): combine the
 *      "draw a chart" + "list your predictions" steps into a single
 *      digital text-list-entry step; renumber the rest. Add ASU
 *      resources to the test step.
 *   4. Activity 7 (Source Check Challenge): add ASU resources to
 *      step 1, swap step 2's "copy into a doc" for a citation
 *      tracker entry, swap step 4 for a verify view of the same
 *      citations, point step 5 at the deliverable box.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// ─────────────────────────────────────────────────────────────────
// Activity-level updates: value_add (em-dash cleanup) + community_action
// ─────────────────────────────────────────────────────────────────
type CommunityAction = "lookbook" | "observation" | "ask" | "none";

type ActivityUpdate = {
  id: number;
  valueAdd: string;
  communityAction: CommunityAction;
};

const ACTIVITY_UPDATES: ActivityUpdate[] = [
  {
    id: 1,
    valueAdd:
      "Different AI tools have different strengths and limits, even on the same prompt. Trying a few side-by-side gives you a feel for which tool is the right call for which job, without committing to one before you know what's out there.",
    communityAction: "observation",
  },
  {
    id: 2,
    valueAdd:
      "Most teaching and research work doesn't have one \"right\" AI tool. Choices vary by task. A reusable comparison habit saves you from defaulting to whatever's open.",
    communityAction: "observation",
  },
  {
    id: 3,
    valueAdd:
      "When your department asks \"should we use this?\" you become the trustworthy answer. A structured audit protects students, protects you, and makes adoption decisions defensible.",
    communityAction: "observation",
  },
  {
    id: 4,
    valueAdd:
      "AI is more useful as a conversation than as a vending machine. The follow-up question is where the value lives. Most one-shot prompts leave 80% of the tool unused.",
    communityAction: "lookbook",
  },
  {
    id: 5,
    valueAdd:
      "AI tends to lock onto its first response and treat it as the right framing. If you don't deliberately break that anchor, you'll get one good idea and four variations of it, and miss the actually different option.",
    communityAction: "observation",
  },
  {
    id: 6,
    valueAdd:
      "Different prompt strategies surface different ideas. A multi-angle approach gives you a richer raw material set, especially for problems where the obvious answer isn't the right one.",
    communityAction: "observation",
  },
  {
    id: 7,
    valueAdd:
      "AI tools confidently invent citations that don't exist. A 5-minute habit of checking what you cite saves your reputation and protects students from spreading made-up sources.",
    communityAction: "observation",
  },
  {
    id: 8,
    valueAdd:
      "Plausible-sounding paragraphs can be 40% wrong without anything looking off. Color-coded verification trains your eye to see what's real and what's invented.",
    communityAction: "lookbook",
  },
  {
    id: 9,
    valueAdd:
      "AI can dramatically speed up literature work, but only with verification gates baked in. A documented workflow lets you (and your team) get the speed without the risk.",
    communityAction: "lookbook",
  },
  {
    id: 10,
    valueAdd:
      "AI sounds confident even when it's wrong. The first step to catching hallucinations is realizing how often they happen on topics you actually know.",
    communityAction: "observation",
  },
  {
    id: 11,
    valueAdd:
      "Confidence is not accuracy. A short, structured check turns \"this sounds right\" into \"I have evidence either way,\" without burning an hour on every claim.",
    communityAction: "observation",
  },
  {
    id: 12,
    valueAdd:
      "When AI-generated material goes into real work, you need a defensible evaluation, not a vibe check. RACCCA gives you a shared vocabulary for what's wrong and where.",
    communityAction: "observation",
  },
  {
    id: 13,
    valueAdd:
      "AI output reads as \"almost yours.\" That's the trap. Editing aloud trains the part of your ear that catches every sentence that doesn't actually sound like you.",
    communityAction: "observation",
  },
  {
    id: 14,
    valueAdd:
      "AI can mimic your style, but only if you teach it your style. The work you put in once pays off across every future draft for that voice.",
    communityAction: "observation",
  },
  {
    id: 15,
    valueAdd:
      "Quality climbs steeply when you treat drafting as iteration, not generation. Self-critique-then-revise gets you 80% of the way to publishable in a fraction of the manual time.",
    communityAction: "observation",
  },
  {
    id: 16,
    valueAdd:
      "\"Agent\" is the buzzword everyone is using and almost no one is using carefully. Knowing the actual difference saves you from being sold a chat tool with a fancy label.",
    communityAction: "observation",
  },
  {
    id: 17,
    valueAdd:
      "Most agent ideas die because the design wasn't sturdy. Mapping it digitally exposes the holes before you've burned time building the wrong thing.",
    communityAction: "lookbook",
  },
  {
    id: 18,
    valueAdd:
      "A live agent that handles even one task reliably is a real productivity gain, and a real responsibility. Building, testing, and watching for drift is the only way to know which it is.",
    communityAction: "lookbook",
  },
  {
    id: 19,
    valueAdd:
      "AI summaries of data are a fast first read, but they confidently mis-describe things you can't always check at a glance. The skill is using them as a starting hypothesis, not a finding.",
    communityAction: "observation",
  },
  {
    id: 20,
    valueAdd:
      "Open-ended responses are usually the richest data and the most painful to analyze. AI clustering can compress days of coding work into an hour, if you steer the prompt and audit the results.",
    communityAction: "observation",
  },
  {
    id: 21,
    valueAdd:
      "Student data analysis with AI is high-leverage and high-risk. A privacy-first workflow gives you the leverage without exposing students or yourself to compliance failures.",
    communityAction: "observation",
  },
  {
    id: 22,
    valueAdd:
      "Describing a concept to an AI image tool is a stress test of your own clarity. Where the picture goes wrong tells you exactly what your description was missing.",
    communityAction: "lookbook",
  },
  {
    id: 23,
    valueAdd:
      "Most of the time spent on a 5-slide deck is in starting from blank. AI gets you a workable skeleton in minutes, leaving your human time for what only you know about your audience.",
    communityAction: "lookbook",
  },
  {
    id: 24,
    valueAdd:
      "AI-generated visuals look professional and can quietly mislead: wrong labels, off-by-one comparisons, inaccessible color choices. The audit habit catches this before publication.",
    communityAction: "lookbook",
  },
  {
    id: 25,
    valueAdd:
      "Disclosure rules vary by institution, journal, and funder. Getting one wrong can mean a retraction or a blocked grant. Knowing where the policies live is half the battle.",
    communityAction: "observation",
  },
  {
    id: 26,
    valueAdd:
      "A pre-written disclosure statement is one less thing to draft under deadline. Three reusable versions cover most of what shows up in a typical week.",
    communityAction: "observation",
  },
  {
    id: 27,
    valueAdd:
      "Edge cases are where disclosure gets contentious. A team-level decision tree turns judgment calls into agreed defaults, and reduces the load on any one person to relitigate it.",
    communityAction: "lookbook",
  },
  {
    id: 28,
    valueAdd:
      "A lot of strong opinions about AI come from never-tested assumptions. Testing your own predictions is the fastest way to build a stance that can survive a hallway argument.",
    communityAction: "observation",
  },
  {
    id: 29,
    valueAdd:
      "Strong claims about AI come at you all the time. Practicing nuance (yes-and instead of yes-or-no) keeps the conversation moving instead of polarizing it.",
    communityAction: "observation",
  },
  {
    id: 30,
    valueAdd:
      "Departments need someone who can hold a balanced 15-minute conversation about AI without it devolving into cheerleading or panic. That person earns disproportionate influence on what their unit actually does.",
    communityAction: "observation",
  },
  {
    id: 31,
    valueAdd:
      "Most prompts are timid. Asking for an obviously weird format unlocks ideas you wouldn't have otherwise, and shows you the upper edges of what AI can play with.",
    communityAction: "observation",
  },
  {
    id: 32,
    valueAdd:
      "AI is a forcing function for assignment redesign: what would actually be hard for AI to do well is often a sharper version of your learning objective. The reimagining is at least as valuable as the alternatives themselves.",
    communityAction: "observation",
  },
  {
    id: 33,
    valueAdd:
      "The most interesting AI-in-courses work isn't \"AI as tutor,\" it's activities that couldn't exist without AI. Designing one is how you find out what your discipline actually wants from this technology.",
    communityAction: "observation",
  },
  {
    id: 34,
    valueAdd:
      "Most AI use happens on autopilot: you reach for it or skip it without noticing why. A short log surfaces your real decision criteria, including the ones you wouldn't have admitted out loud.",
    communityAction: "observation",
  },
  {
    id: 35,
    valueAdd:
      "A written personal framework is the fastest way to stop relitigating \"should I use AI for this\" every time. Once you've decided, future you can just check the rules.",
    communityAction: "observation",
  },
  {
    id: 36,
    valueAdd:
      "Real AI decisions rarely hit only one principle: curiosity, care, clarity, and intentionality often pull in different directions. A structured case study makes those tensions visible and resolvable.",
    communityAction: "observation",
  },
  {
    id: 37,
    valueAdd:
      "AI moves fast, and the news doesn't stay news for long. A small set of trusted sources gives you a manageable signal stream instead of doomscrolling LinkedIn for AI takes.",
    communityAction: "observation",
  },
  {
    id: 38,
    valueAdd:
      "Most AI content is hype, and hype distorts what you think the technology can do. A simple evaluation rubric turns scrolling into triage.",
    communityAction: "observation",
  },
  {
    id: 39,
    valueAdd:
      "Your colleagues can't read everything either. A monthly brief makes you the person whose updates the team actually opens, and saves them all the same triage work you've been doing.",
    communityAction: "lookbook",
  },
  {
    id: 40,
    valueAdd:
      "AI is unusually good at teaching you about itself, but with the same caveats as any other AI output. The exercise is a 15-minute crash course and a real test of your verification habits.",
    communityAction: "observation",
  },
  {
    id: 41,
    valueAdd:
      "Every AI tool has features you haven't tried. Asking the AI itself to teach you is the cheapest, fastest learning loop, as long as you check its work as you go.",
    communityAction: "observation",
  },
  {
    id: 42,
    valueAdd:
      "New AI features ship constantly. A reusable meta-learning protocol turns \"another thing to learn\" into \"here's the 5-step thing I do.\" Compounds across years.",
    communityAction: "observation",
  },
];

// ─────────────────────────────────────────────────────────────────
// Activity 28 — combine steps 1 and 2 into a single digital step
// ─────────────────────────────────────────────────────────────────
const ACTIVITY_28_STEP_1_INSTRUCTION =
  "Predict before you test. Without looking anything up, write 3 things you think AI can do well and 3 things you think it can't. Use the entry boxes below.";

const ACTIVITY_28_STEP_1_HELP =
  "**Why predict first.** Your guesses are a fingerprint of your current mental model. Once you test in the next step, the gap between what you predicted and what actually happened is what you'll learn from.\n\n**What to write.** Concrete enough that you could test it in five minutes. \"AI can summarize a long article\" is testable. \"AI is helpful\" is not.\n\n**One per box** — six predictions total, three per side. Save in your browser; you'll come back to these.";

const ACTIVITY_28_STEP_2_INSTRUCTION =
  "Open an AI tool and test each prediction. Pick one tool from the resources below if you're not sure where to start.";

const ACTIVITY_28_STEP_2_HELP =
  "**How to test, fast.** For each prediction, give the AI a tiny version of the task and see what comes back. \"AI can summarize a long article\" → paste a 2,000-word article and ask for a summary. \"AI can't do real-time math\" → ask it to compute 4,827 × 6,193 without using a tool.\n\n**Spend ~3 minutes per prediction.** This is calibration, not exhaustive evaluation. You're looking for surface-level surprises, not deep findings.\n\nUse [Compare AI](https://compare.aiml.asu.edu) to run the same test prompt against 2–3 tools at once when you want a second read.";

const ACTIVITY_28_STEP_3_INSTRUCTION =
  "Go back to your predictions above and update them. Edit any prediction the test changed your mind on, and add a note next to anything that surprised you.";

const ACTIVITY_28_STEP_3_HELP =
  "**The map you started with vs. the map you have now.** Edit your predictions in place. If \"AI can do X\" turned out to be \"AI can do X but only with a one-shot example,\" rewrite the prediction to reflect that nuance.\n\n**Mark surprises clearly.** Add an asterisk or \"!\" to anything that landed differently than expected. The surprises are the highest-information part of this exercise; you want them visible when you reflect.";

const ACTIVITY_28_STEP_4_INSTRUCTION =
  "Capture your reflection in the deliverable box at the bottom of this page. What was your biggest surprise? What does that tell you about your mental model of AI?";

const ACTIVITY_28_STEP_4_HELP =
  "**Two questions, two short paragraphs.**\n\n*Biggest surprise* — name a specific prediction that flipped, and what flipped it. \"I thought AI couldn't summarize long articles, but it handled a 15-page report fine\" is good. \"AI was surprising in many ways\" is too vague to revisit.\n\n*Mental model gap* — what does the surprise tell you about where your map of AI is off? Are you underestimating what it can do? Overestimating? Calibrated about general use but off about specific tasks?\n\n**Sources for going deeper.** [Module 1, Lesson 2 — \"Differentiate GPT vs LLM\" (Canvas, ~5 min)](https://canvas.asu.edu/courses/157584/pages/module-1-overview-3) covers what's under the hood; [Module 2, Lessons 1–3 — Types of AI applications and current capabilities (Canvas, ~10 min total)](https://canvas.asu.edu/courses/157584/pages/module-2-overview-2) walks through the capability landscape.";

// ─────────────────────────────────────────────────────────────────
// Activity 7 — citation tracker rework
// ─────────────────────────────────────────────────────────────────
const ACTIVITY_7_STEP_1_HELP =
  "**What's about to happen:** the AI will likely give you three official-looking citations — author names, journal titles, years, page numbers. Some will be real. Some will be partially real (real authors, real journal, wrong combination). Some will be entirely invented.\n\nThese are called **hallucinations**: content the AI generates that sounds authoritative but isn't true. They happen because the model is trained to produce *plausible* text, not *accurate* text, and citations follow very regular patterns that are easy to imitate. More on what to watch for in [Canvas Module 5, Lesson 2 — Key terms for evaluating GenAI outputs (~5 min)](https://canvas.asu.edu/courses/157584/pages/module-5-overview-2).\n\nUse the resources below to pick a tool. Pick a topic in your field so you can spot problems. Ask exactly as written.";

const ACTIVITY_7_STEP_2_INSTRUCTION =
  "Paste the 3 citations into the entry boxes below. They'll be saved in your browser so you can come back to mark them after you check each one.";

const ACTIVITY_7_STEP_2_HELP =
  "Paste verbatim, including any quirks like unusual capitalization or missing punctuation. Those details sometimes reveal fabrication on their own (real journals have strict house styles).\n\nDon't skip ones that feel \"obviously right.\" The convincing ones are exactly what you need to check.";

const ACTIVITY_7_STEP_3_HELP =
  "**Why Google Scholar:** it indexes peer-reviewed articles and books, and it's free. If an article exists in a real journal, Scholar usually knows about it.\n\nSearch by **exact title** first, in quotation marks. If nothing comes up, search the title without quotes. If still nothing, try the author name plus a distinctive phrase from the title. If none of that surfaces anything, the article likely doesn't exist.";

const ACTIVITY_7_STEP_4_INSTRUCTION =
  "Now go back to your saved citations below and mark each one Real, Frankenstein, or Fully invented based on what Scholar showed you.";

const ACTIVITY_7_STEP_4_HELP =
  "Three patterns you'll probably see:\n\n**Real.** Title, author, journal, year all match. → *Real*\n\n**Frankenstein.** Real author, real journal, but the specific paper doesn't exist. The AI assembled a plausible combination from its training data. → *Frankenstein*\n\n**Fully invented.** No trace of the article. Sometimes the author doesn't exist either. → *Fully invented*\n\nThe middle category is the dangerous one. It passes a sniff test, and it'll fool anyone who only checks whether the journal is real. [ASU's ChatGPT for faculty page (Canvas, ~3 min skim of the \"Strengths and limits\" section)](https://canvas.asu.edu/courses/157584/pages/maximizing-teaching-efficacy-with-asus-chatgpt-resources) covers why AI fabricates these patterns.";

const ACTIVITY_7_STEP_5_INSTRUCTION =
  "Capture your takeaway in the deliverable box at the bottom of this page. What percentage was real? Would you have caught the fakes without checking?";

const ACTIVITY_7_STEP_5_HELP =
  "The number matters less than the habit. Even one fake citation in three means \"verify every citation the AI gives you, always.\"\n\n**Why this is the skill.** AI-generated citations are the single most common way AI misinformation enters academic work. Not because people are lazy — because the fakes are convincing. The defense isn't skepticism (you'd never finish anything); it's a mechanical verification step. Search every title. Every time.";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ── 1. Activity-level (value_add + community_action) ─────────────
  for (const a of ACTIVITY_UPDATES) {
    const { error } = await sb
      .from("level_up_activities")
      .update({
        value_add: a.valueAdd,
        community_action: a.communityAction,
      })
      .eq("id", a.id);
    if (error) console.error(`activity ${a.id}:`, error.message);
  }
  console.log(`✓ ${ACTIVITY_UPDATES.length} activities updated (value_add + community_action)`);

  // ── 2. Activity 28 — combine steps 1 + 2, renumber the rest ──────
  // Step 1: combined predict instruction + text_list_entry interactive
  await sb
    .from("activity_guide_steps")
    .update({
      instruction: ACTIVITY_28_STEP_1_INSTRUCTION,
      detailed_help: ACTIVITY_28_STEP_1_HELP,
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-28-predictions",
        prompt: "Three predictions on each side — be specific enough to test.",
        groups: [
          {
            id: "can",
            label: "AI can do this",
            placeholder: "e.g., summarize a long article",
            count: 3,
          },
          {
            id: "cant",
            label: "AI can't do this",
            placeholder: "e.g., reliably do multi-digit mental math",
            count: 3,
          },
        ],
      },
      show_asu_resources: false,
    })
    .eq("activity_id", 28)
    .eq("step_number", 1);

  // Delete old step 2.
  await sb
    .from("activity_guide_steps")
    .delete()
    .eq("activity_id", 28)
    .eq("step_number", 2);

  // Renumber 3 → 2, 4 → 3, 5 → 4. Postgres allows this since (activity_id,
  // step_number) has no unique constraint. Update from highest down to
  // avoid any transient collisions.
  await sb
    .from("activity_guide_steps")
    .update({
      step_number: 4,
      instruction: ACTIVITY_28_STEP_4_INSTRUCTION,
      detailed_help: ACTIVITY_28_STEP_4_HELP,
      interactive_type: null,
      interactive_data: null,
      show_asu_resources: false,
    })
    .eq("activity_id", 28)
    .eq("step_number", 5);

  await sb
    .from("activity_guide_steps")
    .update({
      step_number: 3,
      instruction: ACTIVITY_28_STEP_3_INSTRUCTION,
      detailed_help: ACTIVITY_28_STEP_3_HELP,
      // Same storageKey as step 1 — users see their predictions and update them.
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-28-predictions",
        prompt: "Edit your predictions in place. Add * or ! to surprises.",
        groups: [
          { id: "can", label: "AI can do this", count: 3 },
          { id: "cant", label: "AI can't do this", count: 3 },
        ],
      },
      show_asu_resources: false,
    })
    .eq("activity_id", 28)
    .eq("step_number", 4);

  await sb
    .from("activity_guide_steps")
    .update({
      step_number: 2,
      instruction: ACTIVITY_28_STEP_2_INSTRUCTION,
      detailed_help: ACTIVITY_28_STEP_2_HELP,
      // Clear the old sort_buckets that was previously here.
      interactive_type: null,
      interactive_data: null,
      show_asu_resources: true,
    })
    .eq("activity_id", 28)
    .eq("step_number", 3);

  console.log(
    "✓ Activity 28: collapsed steps 1+2 into a single digital predict step; renumbered 3→2 (with ASU resources), 4→3, 5→4 (deliverable reference)."
  );

  // ── 3. Activity 7 — citation tracker rework ─────────────────────
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help: ACTIVITY_7_STEP_1_HELP,
      show_asu_resources: true,
    })
    .eq("activity_id", 7)
    .eq("step_number", 1);

  await sb
    .from("activity_guide_steps")
    .update({
      instruction: ACTIVITY_7_STEP_2_INSTRUCTION,
      detailed_help: ACTIVITY_7_STEP_2_HELP,
      interactive_type: "citation_tracker",
      interactive_data: {
        storageKey: "activity-7-citations",
        mode: "entry",
        count: 3,
      },
      show_asu_resources: false,
    })
    .eq("activity_id", 7)
    .eq("step_number", 2);

  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help: ACTIVITY_7_STEP_3_HELP,
      // Clear the old claim_quiz that was previously here on step 3 (after
      // earlier seed). Keep the existing instruction (it already links
      // Google Scholar).
      interactive_type: null,
      interactive_data: null,
      show_asu_resources: false,
    })
    .eq("activity_id", 7)
    .eq("step_number", 3);

  // The previous seed had a claim_quiz on step 4 — replace with the verify
  // mode of the citation tracker pointing at the same storageKey.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction: ACTIVITY_7_STEP_4_INSTRUCTION,
      detailed_help: ACTIVITY_7_STEP_4_HELP,
      interactive_type: "citation_tracker",
      interactive_data: {
        storageKey: "activity-7-citations",
        mode: "verify",
        count: 3,
      },
      show_asu_resources: false,
    })
    .eq("activity_id", 7)
    .eq("step_number", 4);

  await sb
    .from("activity_guide_steps")
    .update({
      instruction: ACTIVITY_7_STEP_5_INSTRUCTION,
      detailed_help: ACTIVITY_7_STEP_5_HELP,
      interactive_type: null,
      interactive_data: null,
      show_asu_resources: false,
    })
    .eq("activity_id", 7)
    .eq("step_number", 5);

  console.log(
    "✓ Activity 7: ASU resources on step 1; citation tracker entry on step 2, verify on step 4; step 5 points at deliverable."
  );

  console.log("\nDone.");
}

main();
