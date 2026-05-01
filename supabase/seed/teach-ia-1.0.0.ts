/**
 * teach-ia-1.0.0.ts
 *
 * Author detailed_help for every step in every IA (Intermediate →
 * Advanced) activity. Tone is advisor-style, not lecture-style: these
 * learners are running real workflows, so the help focuses on
 * frameworks, decision criteria, and where to get more depth, not on
 * "what is a prompt."
 *
 * Also surfaces ASU resources on the step in each IA activity where
 * the learner first needs an AI tool, points last reflective steps at
 * the deliverable box, attaches a few interactives where they earn
 * their pixels, and keeps the writing em-dash free.
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
  detailedHelp?: string;
  instruction?: string;
  showAsuResources?: boolean;
  interactiveType?: string | null;
  interactiveData?: unknown;
};

// Reusable URL labels (consistent with nf-fi-followups-1.0.0.ts).
const VITRA =
  "https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra";
const VITRA_LABEL = "ASU's VITRA process (Canvas, ~5 min)";
const ASU_AI_TOOLS = "https://ai.asu.edu/ai-tools";
const ASU_AI_TOOLS_LABEL = "ASU's vetted AI tool list";
const COMPARE_AI = "https://compare.aiml.asu.edu";
const PLATFORM_AI = "https://platform.aiml.asu.edu";
const SCHOLAR = "https://scholar.google.com";
const EXCALIDRAW = "https://excalidraw.com";
const WHIMSICAL = "https://whimsical.com";
const MERMAID_LIVE = "https://mermaid.live";
const SYLLABUS_PAGE =
  "https://canvas.asu.edu/courses/157584/pages/syllabus-statements-for-generative-ai";
const ETHICAL_AI =
  "https://canvas.asu.edu/courses/157584/pages/module-3-overview-2";
const EVAL_TERMS =
  "https://canvas.asu.edu/courses/157584/pages/module-5-overview-2";
const EVAL_TERMS_LABEL =
  "Canvas Module 5, Lesson 2, Key terms for evaluating GenAI outputs (~5 min)";

const patches: StepPatch[] = [
  // ── Activity 3: Tool Audit & Recommendation Brief ─────────────────
  {
    activityId: 3,
    stepNumber: 1,
    detailedHelp:
      "**Pick a tool with a real adoption decision behind it.** This activity is sturdier when there's a real audience for your brief: a department considering ChatGPT Enterprise, a colleague piloting Claude Projects, an admin asking about a specific generative-AI plugin. Generic \"evaluate ChatGPT\" briefs read as performative.",
    showAsuResources: true,
  },
  {
    activityId: 3,
    stepNumber: 3,
    detailedHelp:
      "**Pick a representative task, not a stress test.** What you actually do with this category of tool 60% of the time is the right benchmark. Time-box the test to 15 minutes, anything longer turns into a rabbit hole and skews your read on \"ease of use.\"\n\nUse [Compare AI](https://compare.aiml.asu.edu) if you want to run the same task against 2 other vetted tools at once, the differences in output quality are usually the most telling part of the audit.",
  },
  {
    activityId: 3,
    stepNumber: 4,
    detailedHelp:
      "**The data-handling questions that decide most adoption decisions:**\n\n*Where does data live?* On vendor servers, in EU regions, customer-controlled storage?\n*Is your input used to train the next model?* Default vs. opt-out vs. impossible-to-train-on.\n*Who at the vendor can see prompts and outputs?* Engineers debugging? Support? Nobody by policy?\n*What's the data-retention default?* 30 days, 90 days, indefinite, customer-controlled?\n\nIf any of those answers makes you uncomfortable putting student data in, that's a finding for the brief, not a reason to stop the audit.",
  },
  {
    activityId: 3,
    stepNumber: 5,
    detailedHelp:
      "**The accessibility checks that surface most issues:**\n\n*Screen reader behavior on streamed responses.* AI tools that update text token-by-token sometimes confuse screen readers, the user hears each token announced separately or hears nothing.\n*Keyboard-only navigation.* Tab through every action a sighted user would mouse over. Send button, history, settings.\n*Output accessibility.* If the tool generates HTML, slides, or images, are they accessible by default or do users have to remediate every output?\n\nMost tools fail at least one of these. The question isn't \"is it perfect?\" but \"what's the workaround?\"",
  },
  {
    activityId: 3,
    stepNumber: 6,
    detailedHelp:
      "**The brief's recommendation does the work, the rest is evidence.** A reader skims, lands on the recommendation, then reads back to find the evidence that supports it.\n\n*Adopt:* the tool clears VITRA, handles data acceptably, and beats whatever you're using now.\n*Pilot:* solid candidate but you need a controlled test before institutional rollout.\n*Wait:* tool is promising but immature, or VITRA isn't through.\n*Reject:* fails on data handling or accessibility in a way no workaround fixes.\n\nKeep the brief to one page. If the recommendation needs more than one page to defend, the recommendation is probably \"pilot.\"",
  },

  // ── Activity 6: Structured Divergent Brainstorm ───────────────────
  {
    activityId: 6,
    stepNumber: 1,
    detailedHelp:
      "**One sentence, with the constraint baked in.** \"I need a new midterm\" is too open. \"I need a midterm format that lets students use AI without making the assessment trivial\" is sharp enough that the divergent prompts have something to push against.",
  },
  {
    activityId: 6,
    stepNumber: 2,
    detailedHelp:
      "**The student perspective surfaces what current AI use actually feels like in your course.** Students are often the most accurate predictors of where AI shortcuts a learning goal. The prompt's job is to get them to imagine the assessment they'd actually have to engage with, not the one they could phone in.",
    showAsuResources: true,
  },
  {
    activityId: 6,
    stepNumber: 3,
    detailedHelp:
      "**The skeptic prompt forces you to see the failure modes.** Asking AI to argue against the very thing you're trying to design surfaces blind spots a confirmation-biased prompt would never reveal. The risks the skeptic names are usually the ones to design around.",
  },
  {
    activityId: 6,
    stepNumber: 4,
    detailedHelp:
      "**Tree of Thought is a deliberate technique, not a meta-instruction.** When the prompt forces the model to *reason through three independent approaches before proposing*, you get parallel logics rather than three flavors of the same idea. The instruction \"share no structural similarities\" is what produces real divergence, AI's default is to vary surface details only.",
  },
  {
    activityId: 6,
    stepNumber: 5,
    detailedHelp:
      "Run all three independently, in fresh chats. Cross-pollination ruins the comparison. A single document with the three outputs side-by-side beats trying to remember which idea came from which angle.",
  },
  {
    activityId: 6,
    stepNumber: 6,
    detailedHelp:
      "**The shortlist is the deliverable, the comparison is the work.** Look for ideas that appeared in only one angle, those are the ones a single-prompt brainstorm would have missed. Tensions between angles usually reveal a real design trade-off worth naming.",
  },

  // ── Activity 9: AI-Assisted Research Workflow ─────────────────────
  {
    activityId: 9,
    stepNumber: 1,
    detailedHelp:
      "**Pick a question you're actively working on.** A live question keeps you honest. The fabrication you'd catch on someone else's topic is the one you might miss on yours, that's where the verification gates earn their keep.",
    showAsuResources: true,
  },
  {
    activityId: 9,
    stepNumber: 2,
    detailedHelp:
      "**The five-step structure is the bare minimum for AI-in-research that's defensible.** Skip any step and the workflow's risk profile changes:\n\n• No \"verify each source exists\" → fabricated citations propagate.\n• No \"read actual abstracts\" → you cite based on AI's summary, which is often subtly wrong.\n• No \"verify synthesis\" → AI's connections-between-papers may be plausible but unfounded.\n\nStart with the five steps. Add more only if your specific workflow demands them.",
  },
  {
    activityId: 9,
    stepNumber: 3,
    detailedHelp:
      "**Diagram digitally so the workflow is shareable.** [Excalidraw](https://excalidraw.com) is fastest for a quick visual, [Mermaid Live](https://mermaid.live) lets you write the flow as text and have it rendered, [Whimsical](https://whimsical.com) gives you proper flowchart shapes.\n\nMark the verification gates explicitly, that's what distinguishes this from \"AI-assisted research\" as a slogan.",
  },
  {
    activityId: 9,
    stepNumber: 4,
    detailedHelp:
      "**Document at each gate, not at the end.** What did the AI hand you? What did you find when you verified? What was the discrepancy? Real-time logging matters because by the end you'll have forgotten the smaller catches, and those add up to the verification habit you're building.",
  },
  {
    activityId: 9,
    stepNumber: 5,
    detailedHelp:
      "**Honest write-up beats favorable.** \"AI added value at step 1 (breadth of initial sources) and step 4 (synthesis structure). It introduced risk at step 1 (5 of 12 sources didn't exist) and step 5 (synthesized findings the source papers didn't actually claim).\" That's the kind of note that transfers to the next research question.",
  },
  {
    activityId: 9,
    stepNumber: 6,
    detailedHelp:
      "**A reusable template means a colleague could run your workflow without you in the room.** Each gate gets a sentence on what to look for. Each step gets the prompt or process you used. Save it where the team can find it.",
  },

  // ── Activity 12: RACCCA in Practice ───────────────────────────────
  {
    activityId: 12,
    stepNumber: 1,
    detailedHelp:
      "**Real content beats hypothetical content.** A paragraph an AI actually drafted for your work, even if you've already revised it, gives you the texture of \"things AI does well-ish that still need scrutiny.\" Synthesized examples never stress-test the framework as hard.",
    showAsuResources: true,
  },
  {
    activityId: 12,
    stepNumber: 2,
    detailedHelp:
      "**Six sections, one column each for evidence.** Use a Google Doc, Notion page, or any structured format you'll re-read. The structure forces you to commit to specific findings, not vibes. More on the framework in [Canvas Module 5, Lesson 2, Key terms for evaluating GenAI outputs (~5 min)](https://canvas.asu.edu/courses/157584/pages/module-5-overview-2).",
  },
  {
    activityId: 12,
    stepNumber: 3,
    detailedHelp:
      "**Relevance is the easiest dimension to rationalize.** \"It's loosely about the topic\" is not relevance. The test: would this paragraph have been the right tool for the job your reader actually has?",
  },
  {
    activityId: 12,
    stepNumber: 4,
    detailedHelp:
      "**Document what you verified and how.** \"The 2019 enrollment figure is correct per the IPEDS data file\" is verification. \"Looks plausible\" is not. If you can't verify a specific claim, that's data for Accuracy.",
  },
  {
    activityId: 12,
    stepNumber: 5,
    detailedHelp:
      "**Currency catches the silent staleness.** AI training cutoffs are months or years old, anything time-sensitive (policy, technology, leadership) needs an explicit currency check. Even \"last week's news\" can be wrong.",
  },
  {
    activityId: 12,
    stepNumber: 6,
    detailedHelp:
      "**Credibility is about the source the AI is citing, not about the AI.** A fabricated citation has zero credibility regardless of how authoritative it sounds. A real citation to a low-quality source has poor credibility too.",
  },
  {
    activityId: 12,
    stepNumber: 7,
    detailedHelp:
      "**Coverage finds what's missing, not what's wrong.** Did the AI omit a perspective the topic demands? Did it discuss benefits without risks? \"Topic comprehensively addressed\" is the bar for Strong, not just \"topic mentioned.\"",
  },
  {
    activityId: 12,
    stepNumber: 8,
    detailedHelp:
      "**Audience is where AI most often fails silently.** A grad-student-readable paragraph dropped into an undergrad lecture is a real miss, the framework just sees \"competent text.\" Run audience as a deliberate check.",
  },
  {
    activityId: 12,
    stepNumber: 9,
    detailedHelp:
      "**The verdict is the output. Strong/Adequate/Weak per dimension is the evidence.** \"Use as-is\" requires Strong on Relevance, Accuracy, Audience at minimum. \"Revise with specific changes\" is what you write when the issues are tractable. \"Discard\" is the right call when fixing the AI output would take longer than starting from your own.",
  },

  // ── Activity 15: The Refinement Loop ──────────────────────────────
  {
    activityId: 15,
    stepNumber: 1,
    detailedHelp:
      "**Pick something with real stakes.** A course description that students will read, a section of a proposal you actually need to submit, a report paragraph that will go to leadership. Real stakes are what make the loop reveal what only a human can fix.",
    showAsuResources: true,
  },
  {
    activityId: 15,
    stepNumber: 2,
    detailedHelp:
      "**The four-component prompt: audience, purpose, length, tone, key points.** Each one removes a degree of freedom the AI would otherwise fill in poorly. Write the prompt as if you were briefing a freelancer with no context on your work.",
  },
  {
    activityId: 15,
    stepNumber: 3,
    detailedHelp:
      "**Pasting the draft back triggers the most useful AI behavior.** AI's self-critique is genuinely good when you give it explicit criteria. Without criteria, you get \"this is well-written\" generic praise. With criteria, you get specific weaknesses you can act on.",
  },
  {
    activityId: 15,
    stepNumber: 4,
    detailedHelp:
      "**The revision pass usually closes 60-70% of the gap.** What survives the AI's own critique is usually decent. What gets rewritten is the deeper substance, which is where you'll catch what the AI still can't quite see.",
  },
  {
    activityId: 15,
    stepNumber: 5,
    detailedHelp:
      "**The final manual edit is where your fingerprint goes.** AI can't add the specific anecdote, the institutional context, the joke that lands with this audience. That's the last 30%. If your final manual pass is shorter than the AI passes, you've got a draft that sounds AI-flavored, push harder.",
  },
  {
    activityId: 15,
    stepNumber: 6,
    detailedHelp:
      "**The annotated progression is the real artifact.** Show the four versions side by side, mark what changed at each pass. The pattern of \"AI fixed structure, AI tightened language, only I could add the audience-specific detail\" is what makes this loop reusable.",
  },

  // ── Activity 18: Build and Test a Simple Agent ────────────────────
  {
    activityId: 18,
    stepNumber: 1,
    detailedHelp:
      "**Translate from your paper design (activity 17) to a real platform.** Most platforms support roughly the same primitives: a system prompt, persistent instructions, sometimes attached files or tools. Map your design steps to those primitives.",
    showAsuResources: true,
  },
  {
    activityId: 18,
    stepNumber: 2,
    detailedHelp:
      "**The system prompt is the agent.** Spend the time here. State the goal in one sentence, list the steps the agent should take, list the inputs it should expect, list the cases it should refuse. Anything left implicit will go wrong on test 1.",
  },
  {
    activityId: 18,
    stepNumber: 3,
    detailedHelp:
      "**Three diverse test inputs, not three similar ones.** A clean case, an edge case, a deliberately broken case. The clean case is your baseline. The edge case is where most agents start drifting. The broken case tells you what the agent does when reality doesn't match the system prompt's assumptions.",
  },
  {
    activityId: 18,
    stepNumber: 4,
    detailedHelp:
      "**Capture screenshots or chat exports, not summaries.** \"It worked\" is not evidence. The actual transcript is. If you ever ship this agent to colleagues, the test logs are what justifies that decision.",
  },
  {
    activityId: 18,
    stepNumber: 5,
    detailedHelp:
      "**The evaluation has three honest answers per test:** what the agent did, what it should have done, and the gap. If the gap is \"system prompt missed this case,\" you can fix it. If the gap is \"the agent invented information,\" you have a more serious problem.",
  },
  {
    activityId: 18,
    stepNumber: 6,
    detailedHelp:
      "**Trust calls are decisions, not assessments.** \"Trustworthy unsupervised\" requires evidence the agent stays on-task across multiple test cases. \"Needs review\" means a human checkpoint on every output. \"Not ready\" means you go back to the system prompt before testing again.",
  },

  // ── Activity 21: Privacy-First Data Analysis Workflow ─────────────
  {
    activityId: 21,
    stepNumber: 1,
    detailedHelp:
      "**Identify the dataset before you build the workflow.** A workflow designed without a real dataset always misses something. Even a synthetic-but-realistic dataset is better than abstract design.",
  },
  {
    activityId: 21,
    stepNumber: 2,
    detailedHelp:
      "**The de-identification checklist is the first gate.** Names, IDs, course-specific identifiers, anything in the response that identifies a person. If your dataset has free-text responses, scan for accidental identifiers (\"as a senior in your honors section…\"). See [ASU's VITRA process (Canvas, ~5 min)](https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra) for the institutional bar.",
    showAsuResources: true,
  },
  {
    activityId: 21,
    stepNumber: 3,
    detailedHelp:
      "**Tool-approval verification means VITRA-cleared, not vendor-claimed.** Vendors will tell you their tool is FERPA-compliant. The institution's VITRA process is the source of truth for whether you can use it with student data.",
  },
  {
    activityId: 21,
    stepNumber: 4,
    detailedHelp:
      "**The exact prompt belongs in the audit log.** Future-you needs to know what was asked, when. Generic notes like \"summarized survey data\" don't pass an audit if the question comes up later.",
  },
  {
    activityId: 21,
    stepNumber: 5,
    detailedHelp:
      "**The output review is where most workflows fail.** AI can fabricate themes, mis-attribute responses, invent numbers. Reviewing AI output against the actual data is non-negotiable, even when it slows you down.",
  },
  {
    activityId: 21,
    stepNumber: 6,
    detailedHelp:
      "**The audit log template should be runnable by a colleague.** Date, dataset description, de-identification steps taken, tool used, exact prompt, output review notes, decisions made. If a year from now someone asks \"what did you do with this data?\" the log answers without you in the room.",
  },
  {
    activityId: 21,
    stepNumber: 7,
    detailedHelp:
      "**Run on real data once you've validated the workflow on a sample.** Scale the de-identification, scale the audit log, document any new edge cases. The workflow is only as good as its weakest run.",
  },

  // ── Activity 24: Visual Communication Audit ───────────────────────
  {
    activityId: 24,
    stepNumber: 1,
    detailedHelp:
      "**Pick something where being wrong would matter.** A comparison chart in a report, an infographic for a workshop, a process diagram for an SOP. AI-generated visuals look professional and can be confidently wrong, the audit only earns its keep on visuals you'd actually publish.",
    showAsuResources: true,
  },
  {
    activityId: 24,
    stepNumber: 2,
    detailedHelp:
      "**Accuracy is the most-failed dimension.** AI image tools and diagram generators routinely mislabel axes, swap categories, invent numbers, and lose the specificity of your prompt in the rendering. Check every label against your source data.",
  },
  {
    activityId: 24,
    stepNumber: 3,
    detailedHelp:
      "**Spatial relationships carry meaning.** Boxes connected with arrows imply causation or sequence. Concentric circles imply hierarchy. Side-by-side implies comparison. AI tools often pick visual metaphors that don't match the relationships you intended, this is where misleading visuals live.",
  },
  {
    activityId: 24,
    stepNumber: 4,
    detailedHelp:
      "**The could-this-mislead test:** if a colleague glanced at this for 5 seconds, what would they walk away believing? If the answer differs from what you intended, the visual needs revision before it goes out.",
  },
  {
    activityId: 24,
    stepNumber: 5,
    detailedHelp:
      "**Accessibility checks per visual:**\n\n*Color contrast.* AI tools often pick visually pleasing color pairs that fail WCAG contrast. Run them through a contrast checker (Stark, Coolors).\n*Text-based alternative.* What does this visual communicate that a screen reader user needs to also receive? That's the alt text.\n*Information beyond color.* If the chart relies on red-vs-green to communicate, it fails for color-blind readers.",
  },
  {
    activityId: 24,
    stepNumber: 6,
    detailedHelp:
      "**Document the corrections you made post-generation.** This is where the next-visual savings come from. \"AI's first version had wrong axis labels and a misleading legend, I had to fix both before publishing\" is a transferable lesson.",
  },

  // ── Activity 27: Disclosure Decision Tree ─────────────────────────
  {
    activityId: 27,
    stepNumber: 1,
    detailedHelp:
      "**Pick a real workflow your team actually does.** Generic decision trees are less useful than specific ones. The point is something your team can hand to a new member as the disclosure standard.",
  },
  {
    activityId: 27,
    stepNumber: 2,
    detailedHelp:
      "**The three branching dimensions usually capture the decision:**\n\n*Type of work* (course material, research output, internal memo, public-facing).\n*Audience* (students, peers, public, regulators).\n*Institutional context* (does ASU have a published policy here? Does the journal? Does the funder?).\n\nMore branches add nuance but also overhead, three is usually enough.",
  },
  {
    activityId: 27,
    stepNumber: 3,
    detailedHelp:
      "**Edge cases are where decision trees earn their keep.** \"AI suggested the structure but I wrote every word\" and \"AI generated the first draft and I edited\" should land in different places on your tree. If they don't, the tree's branches aren't sharp enough.",
  },
  {
    activityId: 27,
    stepNumber: 4,
    detailedHelp:
      "**Each endpoint is a decision, not a hedge.** \"Disclose with full statement,\" \"add brief acknowledgment,\" \"no disclosure needed,\" \"escalate to department chair.\" Five well-defined endpoints beat ten ambiguous ones. See [ASU's syllabus-statements-for-GenAI page (Canvas, ~3 min)](https://canvas.asu.edu/courses/157584/pages/syllabus-statements-for-generative-ai) for sample disclosure language by context.",
  },
  {
    activityId: 27,
    stepNumber: 5,
    detailedHelp:
      "**Build the tree visually so the team can use it.** [Whimsical](https://whimsical.com) for a proper flowchart, [Excalidraw](https://excalidraw.com) for a sketchy first version, [Mermaid Live](https://mermaid.live) for text-based source-of-truth. The format that gets shared is the right format.",
  },

  // ── Activity 30: Lead a Discussion ────────────────────────────────
  {
    activityId: 30,
    stepNumber: 1,
    detailedHelp:
      "**Frame the question to invite engagement, not opinion-collection.** \"What should our department's stance on AI be?\" is sharper than \"What does everyone think about AI?\" The first invites a position; the second invites venting.",
  },
  {
    activityId: 30,
    stepNumber: 2,
    detailedHelp:
      "**Cover all five lenses or the conversation will skew.** Capability, limitation, bias, privacy, pedagogical impact. Skipping bias makes the discussion sound naive. Skipping pedagogy makes it abstract. Five evidence-backed talking points (~3 sentences each) is enough material for 15 minutes if you let the room react.\n\nFor capability vs. limitation context, [Canvas Module 1 (overview) — GPTs, terminology, capabilities (~10 min skim)](https://canvas.asu.edu/courses/157584/pages/module-1-overview-3) is a good starting source. For ethics, [Canvas Module 3 (overview) — ethical AI, fairness, transparency (~10 min skim)](https://canvas.asu.edu/courses/157584/pages/module-3-overview-2).",
  },
  {
    activityId: 30,
    stepNumber: 3,
    detailedHelp:
      "**Anticipate the predictable objections.** \"AI is just hype.\" \"AI will replace our jobs.\" \"Students are already using it anyway.\" \"We can't keep up with the changes.\" Each one has a real kernel and an unproductive overstatement, your job is to acknowledge the kernel and redirect.",
  },
  {
    activityId: 30,
    stepNumber: 4,
    detailedHelp:
      "**Practice with a colleague before facilitation.** Even a 15-minute walkthrough surfaces what you'll fumble. The first time you say a talking point out loud is also the first time you'll hear it doesn't quite work.",
  },
  {
    activityId: 30,
    stepNumber: 5,
    detailedHelp:
      "**End with a concrete next step.** \"Form a working group,\" \"draft a department statement,\" \"pilot one approach in spring courses,\" \"meet again in a month.\" Discussions without a next step rarely change anything. The discussion guide should make the next step obvious by the end.",
  },

  // ── Activity 33: Design a Novel AI Learning Experience ────────────
  {
    activityId: 33,
    stepNumber: 1,
    detailedHelp:
      "**Pick a learning goal that AI can do something with that humans can't easily simulate.** Examples: students debating an AI character with a fixed perspective they can't argue with, students fixing AI-generated wrong answers (the wrongness is feature, not bug), students using AI to model a stakeholder they don't have access to.",
  },
  {
    activityId: 33,
    stepNumber: 2,
    detailedHelp:
      "**Structurally essential means the activity collapses without AI.** A worksheet with an \"ask AI\" step bolted on is not structurally AI. An assessment where students must beat an AI-generated answer is.",
  },
  {
    activityId: 33,
    stepNumber: 3,
    detailedHelp:
      "**Student instructions need to handle the predictable AI failures.** What happens when the AI gives a wrong answer the student doesn't catch? When the AI refuses? When students try to make the AI do their thinking? Bake the answers into the activity design, not into a clarification email mid-semester.",
  },
  {
    activityId: 33,
    stepNumber: 4,
    detailedHelp:
      "**The ID-build list is what makes this feasible.** Prompts students will copy, system prompts behind any custom AI, evaluation rubric, exemplars, troubleshooting guide. If the build list is more than half a day of work, the activity is too ambitious for a first pilot.",
  },
  {
    activityId: 33,
    stepNumber: 5,
    detailedHelp:
      "**Evaluation criteria should reward what AI can't do for students.** If your rubric rewards \"correct answer\" and AI can produce a correct answer, the rubric is rewarding AI use. Reward the parts of the work AI can't do: the verification, the synthesis across sources, the application to a specific context.",
  },
  {
    activityId: 33,
    stepNumber: 6,
    detailedHelp:
      "**The pre-mortem question:** what's the most likely way this activity goes wrong, and how would you know? Common failures: half the class doesn't engage, AI's outputs are too varied to grade, students reverse-engineer the prompts to game it. Naming the failure mode lets you spot it early in the pilot.",
  },

  // ── Activity 36: Principled Innovation Case Study ─────────────────
  {
    activityId: 36,
    stepNumber: 1,
    detailedHelp:
      "**A real case beats a hypothetical one.** AI use in your department, a colleague's workflow, an institutional decision. Real cases have stakeholders with real interests, which is what the framework is for.",
  },
  {
    activityId: 36,
    stepNumber: 2,
    detailedHelp:
      "**Stakeholders include people who don't get a vote.** Students whose data goes into the system, future learners shaped by the patterns AI surfaces, colleagues whose workflows depend on consistency. The non-voting stakeholders are usually where principled-innovation tensions live.",
  },
  {
    activityId: 36,
    stepNumber: 3,
    detailedHelp:
      "**The four ASU PI principles often pull in different directions:**\n\n*Curiosity* says \"try the new thing.\"\n*Care* says \"protect those affected.\"\n*Clarity* says \"make the trade-off visible.\"\n*Intentionality* says \"choose deliberately, not reactively.\"\n\nA case worth analyzing is one where two principles point in different directions.",
  },
  {
    activityId: 36,
    stepNumber: 4,
    detailedHelp:
      "**Name the tension explicitly, don't paper over it.** \"Curiosity wants us to pilot AI grading, care wants us to protect students from inconsistent feedback, clarity wants us to be honest about what AI can't do, intentionality wants us to commit to a position rather than drift.\" That's the tension, naming it is half the analysis.",
  },
  {
    activityId: 36,
    stepNumber: 5,
    detailedHelp:
      "**The proposed approach should defend itself against each principle.** A path forward that honors curiosity but ignores care fails the framework. The case study earns its keep when the proposal acknowledges what it's trading off.",
  },
  {
    activityId: 36,
    stepNumber: 6,
    detailedHelp:
      "**Colleague feedback exposes blind spots fast.** A 15-minute conversation with someone outside the immediate context often surfaces stakeholder groups you missed and tensions you minimized. Capture the feedback in the case study, even (especially) the parts you disagreed with.",
  },

  // ── Activity 39: Curate a Team Brief ──────────────────────────────
  {
    activityId: 39,
    stepNumber: 1,
    detailedHelp:
      "**The audience determines the curation.** A brief for ID staff is different from a brief for faculty is different from a brief for leadership. Pick one audience, write for them.",
  },
  {
    activityId: 39,
    stepNumber: 2,
    detailedHelp:
      "**Three to five items is the right size.** Fewer feels thin, more is unread. The cut you make is more useful than the items you include, what you decided wasn't worth the team's time tells them what kind of brief this is.",
  },
  {
    activityId: 39,
    stepNumber: 3,
    detailedHelp:
      "**Plain-language summaries beat curated quotes.** The reader shouldn't have to follow the link to know whether it matters. Two sentences: what changed, why it matters for this team.",
  },
  {
    activityId: 39,
    stepNumber: 4,
    detailedHelp:
      "**Relevance tags compress the brief into something scannable.** \"For ID team only,\" \"For faculty in pilot courses,\" \"For everyone.\" Readers learn to skim by tag.",
  },
  {
    activityId: 39,
    stepNumber: 5,
    detailedHelp:
      "**The 'try this' action item is what makes briefs feel useful.** Without it, the brief is a reading list. With it, it's a small ongoing experiment. Examples: \"Try this prompt in Compare AI,\" \"Read [linked article] before next week,\" \"Note one place you'd use this and bring it Monday.\"",
  },
  {
    activityId: 39,
    stepNumber: 6,
    detailedHelp:
      "**Build a reusable template you can sustain.** Same structure every issue, same delivery channel, same predictable cadence. Briefs that read consistently get read consistently.",
  },

  // ── Activity 42: Meta-Learning Protocol ───────────────────────────
  {
    activityId: 42,
    stepNumber: 1,
    detailedHelp:
      "**Step 1, ask AI to explain the capability.** \"Walk me through what [feature/capability] does, what it's good for, and where it usually fails.\" Capture the answer, you'll cross-check it later.",
  },
  {
    activityId: 42,
    stepNumber: 2,
    detailedHelp:
      "**Step 2, ask for an example.** A worked example forces the AI past abstraction. If the example doesn't quite fit your context, that's a signal the capability may not transfer.",
  },
  {
    activityId: 42,
    stepNumber: 3,
    detailedHelp:
      "**Step 3, try it on a low-stakes task.** Real attempt on something where being wrong has minimal cost, the only way to find out where the AI's explanation broke down. Real tasks always reveal more than tutorial walkthroughs.",
  },
  {
    activityId: 42,
    stepNumber: 4,
    detailedHelp:
      "**Step 4, ask AI to evaluate your attempt.** \"Here's what I produced. What would you change? What did I miss?\" The AI's critique often catches things its initial explanation glossed over.",
  },
  {
    activityId: 42,
    stepNumber: 5,
    detailedHelp:
      "**Step 5, cross-check against documentation.** Official docs are current; AI's answer is months or years stale. Where they disagree, the docs win. Note the disagreement, it's signal about the AI's blind spots in this area.",
  },
  {
    activityId: 42,
    stepNumber: 6,
    detailedHelp:
      "**Test the protocol on an unfamiliar capability.** The protocol that works on something you already half-knew may not work on something genuinely new. The unfamiliar test is the protocol's stress test.",
  },
];

// Last-step deliverable references on the IA reflective steps where the
// "deliverable" is essentially a written reflection.
type LastStepUpdate = { activityId: number; stepNumber: number; instruction: string };

const LAST_STEP_UPDATES: LastStepUpdate[] = [
  // 9 step 5: research workflow writeup
  {
    activityId: 9,
    stepNumber: 5,
    instruction:
      "Write up where AI added value (speed, breadth, connections you missed) and where it introduced risk. Capture this in the deliverable box at the bottom of this page.",
  },
  // 15 step 6: refinement-loop progression notes already point at writeup; reinforce
  {
    activityId: 15,
    stepNumber: 6,
    instruction:
      "Annotate the four-version progression: what improved at each pass and what only you (not the AI) could fix. Capture the annotated progression in the deliverable box at the bottom of this page.",
  },
  // 30 step 5: discussion next step
  {
    activityId: 30,
    stepNumber: 5,
    instruction:
      "Land on a concrete next step the group can act on. Capture the full discussion guide (framing question, talking points, anticipated objections, proposed next step) in the deliverable box at the bottom of this page.",
  },
  // 36 step 6: case study with feedback
  {
    activityId: 36,
    stepNumber: 6,
    instruction:
      "Capture the structured case study (context, stakeholders, PI analysis, tensions, proposed approach, colleague feedback notes) in the deliverable box at the bottom of this page.",
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  for (const p of patches) {
    const patch: Database["public"]["Tables"]["activity_guide_steps"]["Update"] = {};
    if (p.detailedHelp !== undefined) patch.detailed_help = p.detailedHelp;
    if (p.instruction !== undefined) patch.instruction = p.instruction;
    if (p.showAsuResources !== undefined)
      patch.show_asu_resources = p.showAsuResources;
    if (p.interactiveType !== undefined) patch.interactive_type = p.interactiveType;
    if (p.interactiveData !== undefined) patch.interactive_data = p.interactiveData;
    const { error } = await sb
      .from("activity_guide_steps")
      .update(patch)
      .eq("activity_id", p.activityId)
      .eq("step_number", p.stepNumber);
    if (error)
      console.error(`  x ${p.activityId}/${p.stepNumber}:`, error.message);
  }
  console.log(`patched ${patches.length} IA steps`);

  for (const u of LAST_STEP_UPDATES) {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({ instruction: u.instruction })
      .eq("activity_id", u.activityId)
      .eq("step_number", u.stepNumber);
    if (error)
      console.error(`  x ${u.activityId}/${u.stepNumber}:`, error.message);
  }
  console.log(
    `deliverable-box references on ${LAST_STEP_UPDATES.length} IA last steps`
  );

  console.log("\nDone.");
}

main();
