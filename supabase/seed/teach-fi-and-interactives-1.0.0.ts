/**
 * teach-fi-and-interactives-1.0.0.ts
 *
 * Three things at once:
 *   1. Author detailed_help for every step in every FI (Foundational →
 *      Intermediate) activity — same accordion treatment that NF uses.
 *   2. Replace any "do this on paper / print this out" steps with digital-first
 *      instructions and links to free or ASU-licensed tools.
 *   3. Attach interactive widgets (vocab cards, sort buckets, prompt sandbox,
 *      sequence ordering, claim quiz) to high-leverage NF + FI steps.
 *
 * Renderers known to the activity detail page:
 *   - vocab_flip_cards
 *   - sort_buckets
 *   - prompt_sandbox
 *   - sequence_order
 *   - claim_quiz
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
  interactiveType?: string | null;
  interactiveData?: unknown;
};

type ActivityPatch = {
  id: number;
  title?: string;
  description?: string;
};

// ─────────────────────────────────────────────────────────────────
// Activity-level edits (titles / descriptions where digital matters)
// ─────────────────────────────────────────────────────────────────
const activityPatches: ActivityPatch[] = [
  {
    // Drop "on Paper" — the activity is digital-first now.
    id: 17,
    title: "Design an Agent",
    description:
      "Pick a repetitive workflow in your role (e.g., reviewing assignment submissions for formatting, generating weekly module summaries). Map it out digitally — what's the goal, what steps does it need, what tools would it access, where does a human need to check in? Don't build it yet — just design it using a free whiteboard tool like Excalidraw or Whimsical.",
  },
];

// Reusable bits
const ASU_AI_HUB = "https://ai.asu.edu";
const ASU_AI_TOOLS = "https://ai.asu.edu/ai-tools";
const ASU_VITRA =
  "https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra";
const ASU_SYLLABUS =
  "https://canvas.asu.edu/courses/157584/pages/syllabus-statements-for-generative-ai";
const ASU_CHATGPT_FACULTY =
  "https://canvas.asu.edu/courses/157584/pages/maximizing-teaching-efficacy-with-asus-chatgpt-resources";
const ASU_EVAL_TERMS =
  "https://canvas.asu.edu/courses/157584/pages/module-5-overview-2";
const ASU_PROMPT_MODULE =
  "https://rise.articulate.com/share/Ih949hPlICDdUyw0OtVdBtg6EWYn0V3n#/lessons/K0OMFl0s_2SIUThBCuYlAR63-lF5xI9P";
const SCHOLAR = "https://scholar.google.com";
const EXCALIDRAW = "https://excalidraw.com";
const WHIMSICAL = "https://whimsical.com";
const GOOGLE_DRAWINGS = "https://docs.google.com/drawings/";
const MS_WHITEBOARD = "https://whiteboard.microsoft.com";
const MERMAID_LIVE = "https://mermaid.live";
const NAPKIN = "https://www.napkin.ai";
const COMPARE_AI = "https://compare.aiml.asu.edu";
const PLATFORM_AI = "https://platform.aiml.asu.edu";

const stepPatches: StepPatch[] = [
  // =========================================================================
  // NF activities — interactive embeds
  // =========================================================================

  // Activity 1 (AI Tool Safari) step 2: prompt sandbox so users can copy the
  // exact starter prompt and feel free to tweak before sending.
  {
    activityId: 1,
    stepNumber: 2,
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Write a 3-sentence explanation of active learning suitable for a course syllabus.",
      hint: "Copy this exact prompt into each tool — same input, see how outputs differ.",
    },
  },

  // Activity 4 (My First AI Conversation) step 1: vocab flip cards for the
  // core terms learners will see throughout this skill.
  {
    activityId: 4,
    stepNumber: 1,
    interactiveType: "vocab_flip_cards",
    interactiveData: {
      cards: [
        {
          term: "Prompt",
          definition:
            "Anything you type into an AI to get a response — a question, an instruction, or a request.",
        },
        {
          term: "Multi-turn conversation",
          definition:
            "A back-and-forth where the AI remembers what was said earlier in the same session and uses it as context.",
        },
        {
          term: "Anchoring",
          definition:
            "When AI locks onto its first answer's framing and treats follow-ups as variations of that framing.",
        },
        {
          term: "Context window",
          definition:
            "The amount of text the AI can hold in mind at once — older parts of long chats start to drop off.",
        },
      ],
    },
  },

  // Activity 7 (Source Check Challenge) step 4: claim quiz on common citation
  // patterns so learners can see what hallucination looks like before checking
  // their own AI's output.
  {
    activityId: 7,
    stepNumber: 4,
    interactiveType: "claim_quiz",
    interactiveData: {
      prompt:
        "Practice your eye: classify each citation pattern by what it would turn out to be after verification.",
      claims: [
        {
          id: "c1",
          text: "An AI cites 'Smith, J. (2019). Active learning in undergraduate biology. Journal of College Science Teaching, 48(3), 22–28.' — the journal, volume, year, and page range are all real, but no such article exists.",
          verdict: "false",
          explanation:
            "This is a Frankenstein citation: real journal + real format + invented article. The most dangerous kind.",
        },
        {
          id: "c2",
          text: "An AI cites 'Brown, A., & Lee, K. (2031). Generative AI in higher education. AERA Open, 9(2).' — dated four years in the future.",
          verdict: "false",
          explanation:
            "Future dates are a tell. AI sometimes invents publication years that haven't happened yet.",
        },
        {
          id: "c3",
          text: "An AI cites a peer-reviewed article that turns up in Google Scholar with matching author, title, journal, and year.",
          verdict: "true",
          explanation:
            "Verifiable in a primary index. Always confirm at least author + journal + year line up.",
        },
        {
          id: "c4",
          text: "An AI cites 'Garcia, M. (2020). The role of metacognition in learning.' — the author and topic are real, but this exact paper title doesn't appear in their publication record.",
          verdict: "mixed",
          explanation:
            "Real author working in a real area — but the specific title is fabricated. Always confirm the paper, not just the person.",
        },
      ],
    },
  },

  // Activity 10 (Spot the Fake) step 3: claim quiz with sample AI-generated
  // facts — gives learners a guided practice before doing their own.
  {
    activityId: 10,
    stepNumber: 3,
    interactiveType: "claim_quiz",
    interactiveData: {
      prompt:
        "Below are five 'facts' an AI might generate. Mark each based on what's actually true. (You won't be able to look them up — make your call from instinct, then read the explanation.)",
      claims: [
        {
          id: "c1",
          text: "ASU was founded in 1885.",
          verdict: "true",
          explanation: "ASU was founded in 1885 as the Tempe Normal School.",
        },
        {
          id: "c2",
          text: "ASU's mascot, Sparky the Sun Devil, was originally a green color before being changed to maroon and gold in the 1980s.",
          verdict: "false",
          explanation:
            "Plausible-sounding but invented. Sparky was always maroon and gold.",
        },
        {
          id: "c3",
          text: "ASU operates the largest public university campus in the United States by enrollment.",
          verdict: "mixed",
          explanation:
            "ASU is consistently among the largest US public universities by enrollment, but \"the largest\" depends on year and counting method.",
        },
        {
          id: "c4",
          text: "ASU was the first US university to offer a fully online MBA, launching it in 1997.",
          verdict: "false",
          explanation:
            "Other universities had online MBAs earlier. AI invents specific 'firsts' frequently.",
        },
        {
          id: "c5",
          text: "ASU has a campus in Phoenix, Arizona.",
          verdict: "true",
          explanation: "ASU has multiple Phoenix-metro campuses.",
        },
      ],
    },
  },

  // Activity 13 (Before & After) step 4: sort buckets — sort sentences as
  // "sounds AI" vs "sounds human" before learners do it on their own draft.
  {
    activityId: 13,
    stepNumber: 4,
    interactiveType: "sort_buckets",
    interactiveData: {
      prompt:
        "Tag each sentence — does it read like AI's default voice or like something a person would actually write?",
      buckets: [
        { id: "ai", label: "Sounds AI" },
        { id: "human", label: "Sounds human" },
      ],
      items: [
        {
          id: "1",
          text: "In today's rapidly evolving educational landscape, leveraging innovative pedagogical approaches is paramount.",
          bucketId: "ai",
          rationale:
            "Stacked filler phrases (\"rapidly evolving,\" \"leveraging,\" \"paramount\") are classic AI tells.",
        },
        {
          id: "2",
          text: "Hey — quick one. Can you send me the slide deck before our 3pm meeting? Thanks!",
          bucketId: "human",
          rationale:
            "Short, specific, with a real ask and a real time. AI almost never writes this directly.",
        },
        {
          id: "3",
          text: "It is important to consider the multifaceted nature of student engagement when designing course activities.",
          bucketId: "ai",
          rationale:
            "Vague abstractions strung together. \"Multifaceted nature of\" is a phrase only AI loves.",
        },
        {
          id: "4",
          text: "Two of the three pilot sections finished early — pulling that schedule into Module 4.",
          bucketId: "human",
          rationale:
            "Concrete numbers and a specific change to a specific module. Personal context AI can't fabricate.",
        },
      ],
    },
  },

  // Activity 16 (Agent vs. Prompt) step 2: sort buckets — chat vs agent.
  {
    activityId: 16,
    stepNumber: 2,
    interactiveType: "sort_buckets",
    interactiveData: {
      prompt:
        "For each scenario, decide: are you using the AI as a chat tool, or is it acting as an agent?",
      buckets: [
        { id: "chat", label: "Chat" },
        { id: "agent", label: "Agent" },
      ],
      items: [
        {
          id: "1",
          text: "You ask the AI to brainstorm session titles for a 3-day workshop.",
          bucketId: "chat",
          rationale:
            "One question → one answer. No autonomous steps, no tool use beyond the chat itself.",
        },
        {
          id: "2",
          text: "A program reads your inbox every morning, drafts replies for you to approve, and files messages by topic.",
          bucketId: "agent",
          rationale:
            "Triggers, multi-step actions, and tool use (email) without you typing each command.",
        },
        {
          id: "3",
          text: "You paste in a syllabus and ask 'what are 3 ways I could redesign this for active learning?'",
          bucketId: "chat",
          rationale: "Single conversation. No autonomy.",
        },
        {
          id: "4",
          text: "A custom GPT you set up watches a Google Form, summarizes new responses each week, and posts the summary to a Slack channel.",
          bucketId: "agent",
          rationale:
            "Persistent rules, scheduled trigger, and a side-effect (posting to Slack) — all the agent hallmarks.",
        },
      ],
    },
  },

  // Activity 22 (Describe It, See It) step 2: prompt sandbox so learners can
  // edit a sample concept-description prompt before sending.
  {
    activityId: 22,
    stepNumber: 2,
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Create a simple, friendly diagram that shows the difference between formative and summative assessment. Use 2 columns. Keep it minimal — no clipart, no shadows. Soft maroon and gold accents are fine.",
      hint: "Edit the concept and styling to match your own teaching context, then paste into an AI image or diagram tool.",
    },
  },

  // Activity 28 (Three Things AI Can and Can't Do) step 1: sort buckets —
  // calibrate intuitions before testing.
  {
    activityId: 28,
    stepNumber: 1,
    interactiveType: "sort_buckets",
    interactiveData: {
      prompt:
        "Predict before you test: which of these is AI usually good at, and which does it struggle with? (No right or wrong here — this is a calibration check.)",
      buckets: [
        { id: "good", label: "AI is usually good at" },
        { id: "bad", label: "AI usually struggles with" },
      ],
      items: [
        {
          id: "1",
          text: "Summarizing a long document.",
          bucketId: "good",
          rationale:
            "Summarization is a strong suit — though it can drop key nuance, so verify on important points.",
        },
        {
          id: "2",
          text: "Doing arithmetic with large numbers without a calculator tool.",
          bucketId: "bad",
          rationale:
            "AI is a language model, not a calculator. It often gets multi-digit math subtly wrong.",
        },
        {
          id: "3",
          text: "Generating real, verifiable academic citations.",
          bucketId: "bad",
          rationale:
            "Citations are the canonical hallucination risk. Always verify in Google Scholar.",
        },
        {
          id: "4",
          text: "Translating informal text between languages.",
          bucketId: "good",
          rationale:
            "Modern AI is strong on common-language translation, especially everyday usage.",
        },
      ],
    },
  },

  // =========================================================================
  // FI activities — full detailed_help + select interactive embeds
  // =========================================================================

  // ── Activity 2: Tool Selection Matrix (Skill 1) ──────────────────────────
  {
    activityId: 2,
    stepNumber: 1,
    detailedHelp:
      "**What you're building:** a 3-row × 3-column comparison matrix. Rows are the three teaching scenarios (writing quiz questions, summarizing readings, drafting feedback). Columns are: Recommended tool · Why this tool · One limitation.\n\n**Where to build it:** Google Sheets, Microsoft Excel, or a Markdown table in a doc — all work. The format matters less than the structure: forcing yourself to pick one tool per scenario and articulate why beats reading another \"top 10 tools\" list.\n\nKeep it lightweight — a few sentences per cell, not paragraphs.",
  },
  {
    activityId: 2,
    stepNumber: 2,
    detailedHelp:
      "**The four questions that usually decide which tool fits:**\n\n**Input length.** Long readings or large datasets need tools with bigger context windows (Claude, Gemini Pro). Short prompts work anywhere.\n\n**File support.** Does the task involve uploading PDFs, images, or spreadsheets? ASU's [vetted AI tool list](https://ai.asu.edu/ai-tools) shows which tools support what.\n\n**Sensitive data.** If student data is involved, the tool needs to be VITRA-approved before you put real data in. See [ASU's VITRA process](https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra). Use de-identified samples otherwise.\n\n**Speed of iteration.** If you'll be revising 5+ times, a fast tool with strong follow-up handling matters more than getting the perfect first draft.",
    interactiveType: "sort_buckets",
    interactiveData: {
      prompt:
        "For each scenario, which tool factor is the deciding constraint?",
      buckets: [
        { id: "len", label: "Long input" },
        { id: "files", label: "File support" },
        { id: "vitra", label: "VITRA / data sensitivity" },
        { id: "iter", label: "Fast iteration" },
      ],
      items: [
        {
          id: "1",
          text: "Summarizing a 60-page accreditation report.",
          bucketId: "len",
          rationale:
            "Big context window matters most — pick a tool that handles long documents in one shot.",
        },
        {
          id: "2",
          text: "Drafting feedback on a class set of student essays where names are still attached.",
          bucketId: "vitra",
          rationale:
            "Real student data — must use a VITRA-cleared tool or de-identify first.",
        },
        {
          id: "3",
          text: "Iterating on quiz wording 8 times to get the difficulty right.",
          bucketId: "iter",
          rationale:
            "Quality of follow-up handling and speed dominate when you're cycling.",
        },
        {
          id: "4",
          text: "Reading a chart you've taken a photo of and explaining it.",
          bucketId: "files",
          rationale:
            "Image input — only some tools handle vision well.",
        },
      ],
    },
  },
  {
    activityId: 2,
    stepNumber: 3,
    detailedHelp:
      "**What goes in each cell:**\n\n*Recommended tool* — name the specific tool. \"Whatever's free\" doesn't transfer to next time.\n\n*Why this tool* — one or two sentences tying the choice to a concrete property of the tool. \"Handles 50+ page PDFs without truncation\" is good. \"It's reliable\" is not.\n\n*One limitation* — what this tool can't do well for this scenario, so you remember the trade-off. Every choice has one — write it now while it's fresh.\n\nIf you're stuck on which tool to pick, the **Suggest tools** button at the top of this activity will give you AI-powered options matched to the specific task.",
  },
  {
    activityId: 2,
    stepNumber: 4,
    detailedHelp:
      "Pick the scenario you're least confident about — that's where the test run will teach you the most. The point isn't to validate your matrix; it's to find out where your prediction was off.\n\n**What \"actually try the task\" means:** spend 10 minutes doing the real version with the tool you picked. If you said \"Tool X is best for summarizing readings,\" actually have it summarize a real reading. If the result is unusable in 30 seconds, that's a finding — capture it.\n\n[Compare AI](https://compare.aiml.asu.edu) is useful here: run the same prompt across 2–3 tools at once so the comparison is direct, not from memory.",
  },
  {
    activityId: 2,
    stepNumber: 5,
    detailedHelp:
      "Update the cell — don't add a third tool, **replace** the recommendation if the test run pointed somewhere else. The matrix is meant to be wrong on first pass; that's how you build a tool sense rooted in real evidence instead of marketing copy.\n\n**Save the test-run notes** alongside the matrix. Six months from now, when you're choosing a tool for a new scenario, you'll want to remember why this one moved.",
  },

  // ── Activity 5: The Anchoring Breaker (Skill 2) ──────────────────────────
  {
    activityId: 5,
    stepNumber: 1,
    detailedHelp:
      "**Why a real problem:** invented prompts give invented results. When you brainstorm with a problem you actually need to solve, the quality of the AI's ideas matters to you — and you'll push harder when one of them doesn't land.\n\n**Specificity helps.** \"I need a new final project\" is too vague to brainstorm productively. \"I need a new final project for my intro statistics course that doesn't lend itself to AI-completion\" gives the AI a clear target.",
  },
  {
    activityId: 5,
    stepNumber: 2,
    detailedHelp:
      "**Anchoring** is what happens after this step: the AI's first 5 ideas establish a frame, and every follow-up tends to ride along it. Naming this round explicitly — \"Round 1\" — makes the contrast easier to see in step 5.\n\nKeep them in a doc, not a chat history. You'll want to look at both rounds side-by-side later, and chat scrollback gets messy.",
  },
  {
    activityId: 5,
    stepNumber: 3,
    detailedHelp:
      "**Three reliable anchor-breakers:**\n\n**Contrarian role.** \"You are a deeply skeptical colleague who thinks gamified projects are a waste of time. What 5 ideas would you suggest instead?\"\n\n**Hard constraint.** \"Same task — but the project cannot involve any technology, including computers.\" Constraints force the model out of its default solution space.\n\n**Opposing perspective.** \"What would someone who disagrees with all of those previous suggestions propose?\" This often surfaces the assumption the AI was running on.\n\nSee the [prompt engineering Canvas module](https://canvas.asu.edu/courses/157584/pages/module-4-overview-2) for more re-prompting patterns.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "You are a deeply skeptical colleague who thinks the previous 5 ideas are too predictable. Propose 5 alternatives that take the opposite approach. Be specific.",
      hint: "Edit this anchor-breaker to fit your scenario, then paste it as your next message after Round 1.",
    },
  },
  {
    activityId: 5,
    stepNumber: 4,
    detailedHelp:
      "Same doc, new label. You're not picking a winner yet — just capturing what came out of the broken frame so you can compare.\n\nIf Round 2 looks suspiciously similar to Round 1, the anchor wasn't actually broken. Try a stronger move: a more pointed contrarian role, a tighter constraint, or a totally different perspective.",
  },
  {
    activityId: 5,
    stepNumber: 5,
    detailedHelp:
      "**What to look for:** the ideas that *only* appeared after you broke the anchor. Highlight those in the doc.\n\nIf any Round-2 idea makes you go \"oh, I hadn't thought of that\" — that's the anchor working against you in Round 1. The more of those there are, the more the first-anchor instinct was costing you.",
  },
  {
    activityId: 5,
    stepNumber: 6,
    detailedHelp:
      "**The transferable insight:** AI's first answer is what it gives an average user. Your good ideas often live in turns 3–5 after a redirect. Naming what the anchor was for *this* problem makes you faster to break it on the next one.\n\nKeep the doc. Future you, on a different problem, will recognize the same anchor pattern.",
  },

  // ── Activity 8: The Fabrication Detector (Skill 3) ───────────────────────
  {
    activityId: 8,
    stepNumber: 1,
    detailedHelp:
      "**Pick a topic you'll need to verify.** Niche enough that the AI's training data is thin (good — fabrications surface faster). Familiar enough that you can spot when the framing is off.\n\n**The two-paragraph constraint matters.** Long enough that the AI has to commit to multiple claims; short enough that you can verify all of them in 20 minutes.\n\n**Citations and reference list both.** Don't accept just in-text — make the AI commit to a full reference. That's where the fabrications concentrate.",
  },
  {
    activityId: 8,
    // Replace the print/highlighters instruction with digital markup.
    stepNumber: 2,
    instruction:
      "Paste the AI output into a Google Doc or Word doc you can mark up digitally. Plan three colors of highlight: green, yellow, red.",
    detailedHelp:
      "**Why digital markup over print:** you'll need to copy-paste citation strings into Google Scholar in step 3, and you'll likely revise the markup as you verify. Both go faster digitally.\n\n**How to highlight digitally:**\n• **Google Docs:** select text → highlight icon in the toolbar → pick a color.\n• **Microsoft Word:** select text → home tab → text highlight color.\n• **Markdown / Notion:** wrap with `==text==` or use a built-in highlight.\n\nIf you'd rather work visually, [Excalidraw](https://excalidraw.com) lets you screenshot the paragraph, drop it on the canvas, and circle claims with colored pens.",
  },
  {
    activityId: 8,
    stepNumber: 3,
    detailedHelp:
      "**Search method:** copy the *exact* citation title into [Google Scholar](https://scholar.google.com), wrapped in quotation marks. If nothing comes back, drop the quotes and try again. If still nothing, search the author's name plus a distinctive phrase from the title.\n\n**Three patterns to expect:**\n• **Real:** title, author, journal, year all match. Highlight green.\n• **Frankenstein:** real author + real journal, but this specific paper doesn't exist. Highlight red.\n• **Fully invented:** no trace anywhere. Sometimes the author also doesn't exist. Highlight red.\n\n\"Described accurately\" means the AI's summary of the article actually matches the abstract. A real paper with a wrong-summary still gets red.",
  },
  {
    activityId: 8,
    stepNumber: 4,
    detailedHelp:
      "**For non-citation factual claims** — dates, statistics, attributions, definitions — your bar is whatever a careful reader would expect.\n\n**Yellow (partially accurate):** the gist is right but the specifics are off. \"Active learning emerged in the 1990s\" when the term traces to Bonwell & Eison's 1991 ASHE-ERIC report — close, but compresses a longer history.\n\n**Red (fabricated):** the claim is presented as fact but isn't. \"75% of universities have adopted X\" with no source you can find.\n\nIf you can't quickly find a primary source, that's a yellow at best — \"plausibly true but unverified\" still belongs in the doubt column.",
  },
  {
    activityId: 8,
    stepNumber: 5,
    detailedHelp:
      "Tally and divide — exact percentage matters less than the order of magnitude. 80% green tells a different story than 30% green.\n\n**Patterns to watch for:**\n• Are the fabrications clustered in *citations* (most common) or in *general claims*?\n• Did the AI fabricate *more* on niche subtopics or *more* on broad ones?\n• Did it invent specific numbers more often than qualitative claims?\n\nThis is where the skill becomes general. The patterns you find here will repeat next time you read AI output.",
  },
  {
    activityId: 8,
    stepNumber: 6,
    detailedHelp:
      "**The verification habit you're building:** for any AI-generated content that goes into work, the citations and statistics get verified before you use them. Every time, not when you remember.\n\nIf that feels slow, the alternative is publishing fabrications under your name. The verification habit is non-negotiable; the speed comes with practice.\n\nMore on what to look for in [ASU's GenAI evaluation page](https://canvas.asu.edu/courses/157584/pages/module-5-overview-2).",
  },

  // ── Activity 11: The Confidence Trap (Skill 4) ───────────────────────────
  {
    activityId: 11,
    stepNumber: 1,
    detailedHelp:
      "**Three categories where AI is most likely to bluff:**\n\n**Niche topics** — small subdisciplines, regional history, internal-to-an-organization details. Training data is thin; AI fills the gap with plausible-sounding invention.\n\n**Recent events** — anything in the last 6–12 months. Models have a knowledge cutoff and will confidently make things up about what \"recently\" happened.\n\n**Common misconceptions** — things \"everyone knows\" that aren't actually true. AI repeats the misconception with the same confidence as a verified fact.\n\nPick a topic in one of these zones where you have ground-truth knowledge to check against.",
  },
  {
    activityId: 11,
    stepNumber: 2,
    detailedHelp:
      "**Watch for the confidence cues:** \"Definitely,\" \"It's well-known that,\" \"The standard view is,\" specific dates, specific numbers, specific names.\n\nThe more confident the language, the more important the verification. AI rarely sounds *uncertain* — even when it should.\n\nNote your gut reaction *before* you check anything. \"That sounds right\" or \"that sounds off\" — the gap between your gut and the verified answer is the lesson.",
  },
  {
    activityId: 11,
    stepNumber: 3,
    detailedHelp:
      "**The personal knowledge check is fast and underused.** You know more than you think — and your brain is still better than AI at \"that doesn't sound right\" on familiar territory.\n\nThree honest answers:\n• \"Matches what I know\" — proceed to step 2 anyway, but with less suspicion.\n• \"Contradicts what I know\" — high alert, primary source check next.\n• \"I don't actually know\" — the AI's answer might be filling a gap you didn't realize you had. That's the most dangerous case.",
  },
  {
    activityId: 11,
    stepNumber: 4,
    detailedHelp:
      "**Primary sources rank above secondary sources every time.**\n\nFor university policy: the official `*.edu` policy page, not a third-party blog summary.\nFor research findings: the original paper, not a journalist's writeup.\nFor government data: the agency's website, not an aggregator.\n\nIf the only confirmation is another AI-generated source, you haven't actually verified anything — you've just found the AI agreeing with itself in two places.",
  },
  {
    activityId: 11,
    stepNumber: 5,
    detailedHelp:
      "**The consistency check is the cleverest of the three** — it's how you catch AI bluffing on something *you* don't know.\n\nAsk the same question in three different ways:\n• \"What's the answer to X?\"\n• \"Some people say Y about X — is that right?\"\n• \"Argue for the opposite of what you just told me.\"\n\nIf the AI flips between answers, the topic is uncertain (or invented). If it stays consistent across all three, you've at least confirmed the model isn't holding a contradictory view internally — though that's still not the same as verified.",
  },
  {
    activityId: 11,
    stepNumber: 6,
    detailedHelp:
      "**What goes in the walkthrough:**\n• The original AI claim, verbatim.\n• Your gut reaction (step 1 result).\n• What the primary source said (step 2 result).\n• Whether the AI flipped (step 3 result).\n• The verdict and what it taught you about this kind of claim.\n\nThe write-up turns a one-time check into a transferable habit. Future you can hand this to a colleague who needs to learn the same instinct.",
  },

  // ── Activity 14: The Style Coach (Skill 5) ───────────────────────────────
  {
    activityId: 14,
    stepNumber: 1,
    detailedHelp:
      "**Pick something you wrote and felt good about.** A recent email that landed well. A syllabus section a student actually read. A report paragraph you remember being proud of.\n\n**One sample is enough to start.** More samples help if you have them, but you can train an AI's voice off a single high-quality paragraph.\n\nRedact anything sensitive (names, identifiers) before pasting if the tool isn't VITRA-cleared. See [ASU's VITRA process](https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra) if you're not sure.",
    interactiveType: "vocab_flip_cards",
    interactiveData: {
      cards: [
        {
          term: "Tone",
          definition:
            "How formal/casual the writing feels — \"Could you possibly\" vs. \"Hey — quick one.\"",
        },
        {
          term: "Register",
          definition:
            "The contextual norms a piece of writing follows — academic register is dense and citation-heavy; email register is short and direct.",
        },
        {
          term: "Voice",
          definition:
            "The recognizable fingerprint of how someone writes — word choices, sentence rhythms, what they leave out.",
        },
        {
          term: "Cadence",
          definition:
            "Sentence length pattern — short, short, then long. AI often defaults to medium-medium-medium, which feels generic.",
        },
      ],
    },
  },
  {
    activityId: 14,
    stepNumber: 2,
    detailedHelp:
      "**Why ask the AI to analyze before you ask it to mimic:** the analysis surfaces what the AI *thinks* your style is, which lets you correct misreads before they propagate into a draft.\n\n**Push for specifics in the analysis:** if the AI says \"your tone is professional,\" that's too vague to mimic. \"Your tone is direct, slightly informal, prefers short sentences over long ones\" is something the AI can act on.",
  },
  {
    activityId: 14,
    stepNumber: 3,
    detailedHelp:
      "**Three things to check:**\n\n**Did it pick up your sentence rhythm?** Look at the sample and the analysis side by side — if you tend toward short, punchy sentences and the analysis says \"complex\" — flag it.\n\n**Did it spot your characteristic word choices?** If you avoid jargon and the analysis missed that, you'll need to add it back.\n\n**Did it catch what's *not* there?** \"You don't use exclamation points\" or \"you avoid hedging language\" are the kind of negative-space observations that make a real difference in mimicry.",
  },
  {
    activityId: 14,
    stepNumber: 4,
    detailedHelp:
      "**The remix prompt:** include the analysis verbatim in your instruction. Don't paraphrase — paraphrasing loses the specific guidance the AI just generated.\n\n**Compare the new draft to your original sample.** Where did the style transfer? Where did it slip back to AI-default? The slips are usually in connective tissue — \"In addition,\" \"Furthermore,\" \"It is important to note that.\"",
  },
  {
    activityId: 14,
    stepNumber: 5,
    detailedHelp:
      "**Three-version review:**\n\n*Original AI draft* — generic AI-voice baseline.\n*Style-matched revision* — what the AI could mimic about you.\n*Your manual edits on top* — what only you could fix.\n\nThe gap between version 2 and version 3 is the part of your voice the AI couldn't capture. Often it's something specific: a phrase you'd never use, a structural move you reach for instinctively, a way of opening that signals \"this is me.\"\n\nThat gap is your stylistic fingerprint. Knowing what it is means you can edit AI output toward it on the next draft, without going through this whole process again.",
  },

  // ── Activity 17: Design an Agent (Skill 6) ───────────────────────────────
  {
    activityId: 17,
    stepNumber: 1,
    instruction:
      "Identify a repetitive multi-step workflow in your role (examples: onboarding a new TA, prepping a weekly module, reviewing submissions for completeness).",
    detailedHelp:
      "**The right kind of workflow for an agent:**\n\n**Repetitive** — happens at least monthly. One-off work doesn't pay back the design cost.\n\n**Multi-step** — at least 3 distinct sub-tasks. Single-step \"agents\" are just chats.\n\n**Stable** — the steps don't change much month to month. If the workflow is constantly being redesigned, the agent will be too.\n\n**Low-stakes for a first try.** Pick something where a mistake is easy to catch and fix. Not student grades, not sensitive comms — start with something internal.",
  },
  {
    activityId: 17,
    stepNumber: 2,
    instruction:
      "Map the workflow digitally — list every step in order, from trigger to completion. Use a free whiteboard tool: [Excalidraw](https://excalidraw.com) (no account needed), [Whimsical](https://whimsical.com), [Google Drawings](https://docs.google.com/drawings/), or [Microsoft Whiteboard](https://whiteboard.microsoft.com) (ASU-licensed). For text-only mapping, a numbered list in any doc works.",
    detailedHelp:
      "**Why digital, not paper:** you'll want to share the design with a colleague (step 6) and re-arrange steps as you go. Both are easier digitally.\n\n**Excalidraw is the fastest start** — open the link, drag rectangles for steps, draw arrows between them. No sign-up, no learning curve. Save the canvas as a PNG when you're done.\n\n**Whimsical** is better for proper flowcharts with branching logic. Free tier covers this.\n\n**Mermaid** ([live editor](https://mermaid.live)) is best if you'd rather write the diagram as text — `flowchart TD; A[trigger]-->B[step 1]-->C[step 2]` — and have it rendered.\n\n**The mapping itself:** each step gets its own node. \"Receive submission\" → \"Check formatting\" → \"Note errors\" → \"Reply to student\" → \"File submission.\"",
    interactiveType: "vocab_flip_cards",
    interactiveData: {
      cards: [
        {
          term: "Trigger",
          definition:
            "The event that kicks off the agent — a new email, a scheduled time, a button click, a file landing in a folder.",
        },
        {
          term: "Step",
          definition:
            "One discrete action the agent takes — read X, classify Y, send Z. Each should fit on one line.",
        },
        {
          term: "Tool",
          definition:
            "Anything the agent has to access or use to do its job — email, calendar, a database, a file.",
        },
        {
          term: "Human checkpoint",
          definition:
            "A pause where a person reviews/approves before the agent continues. Belongs anywhere a mistake would be hard to undo.",
        },
      ],
    },
  },
  {
    activityId: 17,
    stepNumber: 3,
    detailedHelp:
      "**The three-bucket call:**\n\n**Yes** — AI can do this autonomously without a human watching. \"Check whether the file has the required header.\"\n\n**Partially** — AI can draft or attempt, but a human has to review. \"Draft a reply to the student\" — yes, but a human reads before sending.\n\n**No** — keep this entirely with a human. \"Decide whether the student's situation warrants an extension.\" Judgment calls live here.\n\nMost workflows end up with a healthy mix — that's normal. A pure-Yes workflow is suspicious; a pure-No workflow doesn't need an agent.",
  },
  {
    activityId: 17,
    stepNumber: 4,
    detailedHelp:
      "**The four places a human checkpoint is non-negotiable:**\n\n**Anything irreversible** — sending email, posting publicly, deleting files, modifying records.\n\n**Anything involving judgment** — \"is this submission acceptable?\" or \"should this case be escalated?\"\n\n**Anything touching sensitive data** — student records, FERPA-protected info, personnel decisions.\n\n**Anything with high reputational cost if wrong** — a rude or off-tone message attributed to you.\n\nThe pattern: cost-of-error × reversibility. High either, human gate.",
  },
  {
    activityId: 17,
    stepNumber: 5,
    detailedHelp:
      "**One-page agent design template:**\n\n*Goal:* What this agent exists to accomplish, in one sentence.\n*Trigger:* What kicks it off.\n*Steps (numbered):* Each step, marked AI / Human / Both.\n*Tools:* Every system the agent needs access to.\n*Risks:* What goes wrong if a step fails — and how a human would catch it.\n\nKeep it on one page. If it doesn't fit, the agent is too ambitious for a first build.",
  },
  {
    activityId: 17,
    stepNumber: 6,
    detailedHelp:
      "**The pre-mortem question:** \"If this agent ran wild for a week before anyone noticed, what's the worst thing that could happen?\"\n\nIf the answer involves real damage — wrong info to students, sent emails you can't unsend, mis-graded work — add a human gate at the step that produces those outputs.\n\nGood agents are conservative on their first deployment. You can always relax human gates later, once you have evidence the AI is reliable on this task.",
  },

  // ── Activity 20: Theme Finder (Skill 7) ──────────────────────────────────
  {
    activityId: 20,
    stepNumber: 1,
    detailedHelp:
      "**Why de-identification first:** student data — even open-ended text — falls under FERPA. Putting it into a non-VITRA-cleared AI tool with names attached is a violation, full stop.\n\n**De-identification checklist:** remove names, student IDs, course-specific identifiers, anything in the response that identifies a person (\"as a senior in your honors section…\").\n\n**Tip:** put the responses in a new doc/sheet for de-identification — don't edit the source. You'll want the original linked back if you need to follow up.\n\nFor anything beyond a quick scan, run de-identification through a VITRA-cleared tool — see [ASU's vetted AI tool list](https://ai.asu.edu/ai-tools).",
  },
  {
    activityId: 20,
    stepNumber: 2,
    detailedHelp:
      "**Why your read first:** if you skip ahead and let the AI cluster first, you'll anchor on its themes. The point of comparison in step 4 only works if your read is independent.\n\n**Don't agonize.** A loose 3–5 themes after 5 minutes is enough. \"Time pressure,\" \"tech frustration,\" \"liked the group work,\" \"wanted more practice,\" \"didn't understand the rubric.\" That kind of grain.\n\nWrite each theme as a short noun phrase plus a one-line description. You'll be comparing these against AI's labels in a few minutes.",
  },
  {
    activityId: 20,
    stepNumber: 3,
    detailedHelp:
      "**The prompt is doing real work** — it's setting bounds (4–6 themes), forcing labeling (give each a name), demanding evidence (which responses go where), and pushing to specificity (1-sentence description, not a paragraph).\n\nIf you let the AI freelance with \"find themes,\" you'll get vague, overlapping clusters. The constraints make the output usable.\n\nIf the AI returns something where one theme contains 80% of responses, push back: \"That theme is too broad — split it into 2–3 sub-themes.\"",
  },
  {
    activityId: 20,
    stepNumber: 4,
    detailedHelp:
      "**Three things you're looking for:**\n\n**Same themes, different names.** AI calls it \"workload concerns\"; you called it \"too much reading.\" Same content, different label — agreement.\n\n**Themes one of you found that the other missed.** Often these are the most useful — AI catches patterns across many responses; you catch nuances that depend on context.\n\n**Bad clusters.** Responses grouped together that don't actually fit. AI sometimes glues responses by surface vocabulary rather than meaning. Flag these — they're the cases that force you to reread the originals.",
  },
  {
    activityId: 20,
    stepNumber: 5,
    detailedHelp:
      "**Comparison table format:**\n\n| Your theme | AI theme | Same? | Notes |\n|---|---|---|---|\n| Time pressure | Workload concerns | ✓ | Same content, different label |\n| Tech frustration | (not found) | — | AI missed this — appears in 4 responses |\n| (not found) | Group dynamics | — | I missed this — AI surfaced it across 6 responses |\n\nAt the bottom: **net findings** — which approach surfaced what, and what your real combined theme list is.",
  },

  // ── Activity 23: Slide Deck Draft (Skill 8) ──────────────────────────────
  {
    activityId: 23,
    stepNumber: 1,
    detailedHelp:
      "**Pick something concrete and upcoming.** A workshop next month. A guest lecture. A training. The deck has to actually be useful, not hypothetical — that's how you'll know which AI suggestions land vs. which are generic.\n\n**Know your audience already.** \"Faculty who already use AI casually\" vs. \"Department chairs who haven't tried it\" lead to wildly different decks. Have an audience in mind before the prompt.",
  },
  {
    activityId: 23,
    stepNumber: 2,
    detailedHelp:
      "**The outline prompt should include:**\n• The audience and their existing knowledge level.\n• The duration of the talk.\n• The one outcome you want — \"By the end, the audience can do X\" or \"by the end, the audience knows Y.\"\n• Format: 5 slides with content + visual description for each.\n\nAsk for visual descriptions, not finished visuals — the description tells you whether the AI's interpretation matches yours before you spend time generating images.",
  },
  {
    activityId: 23,
    stepNumber: 3,
    detailedHelp:
      "**Two paths from outline to slides:**\n\n**You build them.** Faster for short decks. Open Google Slides, Keynote, or PowerPoint and create the slides from the outline, copy-pasting content where it works.\n\n**AI builds them.** Slower to set up, faster after. Tools like [Gamma](https://gamma.app) or [Beautiful.AI](https://www.beautiful.ai) take a prompt and produce a full deck. Best when the outline is solid and the visual style needs to be consistent.\n\nFor diagrams that the AI suggests but doesn't draw, [Napkin.ai](https://www.napkin.ai) or [Mermaid Live](https://mermaid.live) can render them in seconds.",
  },
  {
    activityId: 23,
    stepNumber: 4,
    detailedHelp:
      "**Four-question audit per slide:**\n\n**Does the structure make sense for *this* audience?** Generic AI decks often start with \"What is X?\" — fine for newbies, condescending for experts.\n\n**Is visual hierarchy clear?** Largest text → most important point. AI sometimes dumps text at one size.\n\n**What context is missing that only you know?** The example from your team. The metric you actually have. The internal vocabulary your audience uses.\n\n**Does the deck match the slot?** Five slides for 10 minutes is a reasonable density. Five slides for 60 minutes is too thin.",
  },
  {
    activityId: 23,
    stepNumber: 5,
    detailedHelp:
      "**Three categories of revision:**\n\n**Structure** — re-order, merge, or split slides. \"Slide 4 should be slide 2; slide 3 isn't earning its place.\"\n\n**Content** — replace generic stand-ins with your actual examples and data. This is where the deck becomes usable.\n\n**Visuals** — swap clip-art-y suggestions for charts you already have, or for diagrams you build in [Excalidraw](https://excalidraw.com) or [Napkin.ai](https://www.napkin.ai).\n\n**Save both versions.** The AI draft is a baseline you can show — and quick reference for next time.",
  },
  {
    activityId: 23,
    stepNumber: 6,
    detailedHelp:
      "**The comparison note answers: what time did the AI save you, and what did you have to add that it couldn't have known?**\n\n*What you kept:* the AI's contributions that survived. Often: structural skeleton, slide count, intro framing.\n*What you changed:* the AI's stand-ins that needed your real material. Often: examples, specifics, internal vocab.\n*What only you knew:* audience nuance, recent context, internal politics. AI can't see any of this.\n\nThis pattern repeats every time. Knowing what AI can do for you (skeleton) and can't (your specifics) makes you faster across every future deck.",
  },

  // ── Activity 26: Write Your Disclosure Statement (Skill 9) ───────────────
  {
    activityId: 26,
    stepNumber: 1,
    detailedHelp:
      "**The syllabus disclosure has two audiences and two jobs.**\n\n*To students:* sets expectation — what's allowed, what's not, what's encouraged. Without it, students guess.\n\n*To you, in writing:* a reference you can point to in a conflict. \"This is what we said in the syllabus.\"\n\n**Three sentences is plenty:**\n• Sentence 1: how *you* used AI in creating course materials.\n• Sentence 2: how students may (or may not) use AI on assignments.\n• Sentence 3: what the verification or attribution expectation is.\n\nASU keeps a [Syllabus statements for generative AI](https://canvas.asu.edu/courses/157584/pages/syllabus-statements-for-generative-ai) reference page with sample language you can adapt.",
  },
  {
    activityId: 26,
    stepNumber: 2,
    detailedHelp:
      "**Conference disclosures live in slide acknowledgments or speaker notes.**\n\nThey're shorter than syllabus statements — usually 1–2 sentences — but should still cover: what tool, what task, how verified.\n\n**Sample:** *Slide structure and initial caption text were drafted with [tool name]; all data, claims, and citations were verified against primary sources by the author.*\n\nIf the conference has a formal AI disclosure policy, follow theirs first. If it doesn't, the syllabus pattern transfers.",
  },
  {
    activityId: 26,
    stepNumber: 3,
    detailedHelp:
      "**Grant proposal disclosures live in the methods section or an acknowledgments line.**\n\nMost funders now require some form of AI disclosure. Check your funder's specific guidance first — NIH, NSF, and major foundations all have published policies, and they're not identical.\n\n**Default pattern (if no funder guidance):** *Generative AI tools were used to [task]; all [outputs/citations/data] were independently verified by the principal investigator.*\n\n**What not to disclose:** routine spell-check, grammar suggestions, search summaries. Disclosure is for substantive use that shaped the document — drafting, summarizing, ideating, citing.",
  },
  {
    activityId: 26,
    stepNumber: 4,
    detailedHelp:
      "**The three-question audit:**\n\n**What tool?** Specific name. \"AI\" is too vague. \"ChatGPT-4o\" or \"ASU Create AI\" is right.\n\n**What task?** Drafting? Summarizing? Coding? Brainstorming? Be specific enough that the reader knows what AI did and didn't do.\n\n**How verified?** \"All citations checked against primary sources.\" \"Data tables hand-verified against the original spreadsheet.\" \"Author edited every paragraph.\" Without this, the disclosure feels nervous rather than confident.",
    interactiveType: "vocab_flip_cards",
    interactiveData: {
      cards: [
        {
          term: "Disclosure",
          definition:
            "Telling your audience that AI was used and what it did — required by most journals, funders, and increasingly courses.",
        },
        {
          term: "Attribution",
          definition:
            "Crediting AI as a tool used in the work. Different from authorship — most policies say AI cannot be an author.",
        },
        {
          term: "Verification",
          definition:
            "The human-checked confirmation that AI output is accurate. The thing that turns AI assistance from risk into asset.",
        },
        {
          term: "Substantive use",
          definition:
            "AI use that shaped the document beyond cosmetic editing — drafting, ideating, summarizing, citing. The bar for required disclosure.",
        },
      ],
    },
  },
  {
    activityId: 26,
    stepNumber: 5,
    detailedHelp:
      "**Read each statement back from the audience's perspective.** A grant reviewer reads your methods section asking \"what did this person do, and what did the AI do?\" If the disclosure leaves them uncertain, it's failing.\n\n**Two failure modes to look for:**\n\n*Too vague:* \"AI assisted in this work.\" — Doesn't tell anyone anything.\n\n*Too specific:* \"ChatGPT-4o was used to generate sentence 3 of paragraph 2 in section 1.4…\" — Performative; nobody needs that level.\n\nThe sweet spot is a sentence or two that names tool, task, and verification clearly enough that a reader couldn't misunderstand your role.",
  },

  // ── Activity 29: The Nuanced Take (Skill 10) ─────────────────────────────
  {
    activityId: 29,
    stepNumber: 1,
    detailedHelp:
      "**Find a real claim, not a strawman.** Pick something a colleague has actually said, or that you've seen in a real article. The point is to practice on the kind of overstatement you'll encounter, not on the easiest version of it.\n\n**Claims that work well:** specific, confident, and have a kernel of truth wrapped in overstatement. \"AI can grade essays as well as humans\" is real (some studies show high agreement on rubric scores) and over-broad (graders disagree on which essays get high scores; AI inherits that).",
  },
  {
    activityId: 29,
    stepNumber: 2,
    detailedHelp:
      "**The four-part structure is doing real work — it forces nuance.**\n\n**Kernel of truth.** Show you've actually engaged with the claim. \"There's evidence AI matches human inter-rater reliability on rubric scores at the aggregate level.\"\n\n**Two specific limitations.** Concrete, not generic. \"It struggles with non-standard writing patterns; it inherits whatever bias is in the training set.\"\n\n**A bias or risk they haven't considered.** Often the most interesting move. \"AI grading at scale could homogenize what counts as 'good writing' — every essay rewarded for sounding like the training corpus.\"\n\n**More nuanced framing.** Not \"AI can't do it\" — \"AI can support grading at the rubric-checking level; it can't substitute for the conversation a human grader has with a piece of writing.\"",
  },
  {
    activityId: 29,
    stepNumber: 3,
    detailedHelp:
      "**Citing where you learned it makes the response sturdier.**\n\nFor each limitation or bias, one of: a course module, an article you read, a personal experience, a specific tool's documentation, a reputable source.\n\nIf you can't cite anything, the claim is intuition — fine to share, but mark it as such.\n\n[ASU's Module 3 — Ethical AI](https://canvas.asu.edu/courses/157584/pages/module-3-overview-2) is a useful starting source for bias and ethical considerations, and [the AI capabilities discussions](https://canvas.asu.edu/courses/157584/pages/module-1-overview-3) cover the limit edges.",
  },
  {
    activityId: 29,
    stepNumber: 4,
    detailedHelp:
      "**Reading aloud is the cheapest test.** What sounds nuanced on the page sometimes sounds defensive or smug out loud. The ear catches what the eye glides past.\n\n**Two failure tests:**\n\n*Did I just argue against the claim?* If yes, you skipped the kernel-of-truth step. Add it back.\n\n*Did I sound smarter than the claimant?* If yes, your tone is doing more work than your content. Practiced nuance doesn't preen.\n\nRevise until the response sounds like it's continuing a conversation, not winning one.",
  },

  // ── Activity 32: Reimagine an Assignment (Skill 11) ──────────────────────
  {
    activityId: 32,
    stepNumber: 1,
    detailedHelp:
      "**The learning objective is the constraint that keeps the alternatives honest.**\n\n*Vague objective:* \"Students will engage with the material.\" — Too loose; anything goes.\n*Specific objective:* \"Students will compare and contrast two policy responses to a public health crisis.\" — Now you can tell whether an alternative actually achieves it.\n\nIf the existing assignment doesn't have a stated objective, write one before you reimagine. The reimagining is going to be only as sharp as the objective is.",
  },
  {
    activityId: 32,
    stepNumber: 2,
    detailedHelp:
      "**Why the prompt explicitly asks for structurally different alternatives.** Without that, AI tends to give you three near-variants of the original. \"Same essay, but on a different topic\" doesn't count.\n\n**Structurally different examples:**\n• An essay → an oral debate.\n• A research paper → a stakeholder interview series.\n• A multiple-choice quiz → a misconception-design challenge.\n• A reflection journal → a critique-and-revise workshop with peers.\n\n**The AI-as-tool requirement** forces at least one alternative where AI is part of the activity — students using it, students critiquing it, students competing with it.",
  },
  {
    activityId: 32,
    stepNumber: 3,
    detailedHelp:
      "**Four-question evaluation per alternative:**\n\n**Feasible?** Can you actually run this in your context? (Scheduling, tools, scale.)\n\n**Hits the objective?** Be honest. \"Sounds like it should\" isn't enough — trace the activity back to the learning outcome.\n\n**What could go wrong?** Logistical (\"students don't show up to peer review\"), pedagogical (\"this rewards students who already think out loud\"), technological (\"the AI tool isn't VITRA-approved\").\n\n**What's exciting about it?** The reason this version would be better than the original. If you can't name something, this isn't the alternative to pilot.",
  },
  {
    activityId: 32,
    stepNumber: 4,
    detailedHelp:
      "**Three things in the pilot plan:**\n\n*What you'd build:* every artifact you'd need before students could start. Rubric, instructions, sample, AI prompt template, anything else.\n\n*What you'd tell students:* the framing — what they're doing, why it's different, what's expected.\n\n*What you'd assess:* the rubric or evaluation criteria. If you can't articulate this in two sentences, the assignment isn't ready.\n\nKeep the plan to one page. Pilots that take more than a page to plan usually don't get run.",
  },

  // ── Activity 35: The Decision Framework Draft (Skill 12) ─────────────────
  {
    activityId: 35,
    stepNumber: 1,
    detailedHelp:
      "**The header is doing real work.** \"When I will and won't use AI\" is a forcing function — you have to commit to both directions. \"Guidelines\" lets you weasel.\n\n**Format suggestion:** a Google Doc or Notion page you can revise. This isn't a one-time exercise; you'll add to it as your AI use evolves.",
    interactiveType: "sort_buckets",
    interactiveData: {
      prompt:
        "Quick gut check before you draft: which bucket would you put each task in?",
      buckets: [
        { id: "yes", label: "Default to AI" },
        { id: "review", label: "AI with human review" },
        { id: "no", label: "Do it yourself" },
      ],
      items: [
        {
          id: "1",
          text: "Drafting a quick reply to a colleague's logistics question.",
          bucketId: "yes",
          rationale:
            "Low stakes, repetitive, AI is fast. A solid \"default to AI\" case.",
        },
        {
          id: "2",
          text: "Writing the introductory paragraph of a personal recommendation letter.",
          bucketId: "no",
          rationale:
            "The personal voice and the human relationship are the point. AI undermines both.",
        },
        {
          id: "3",
          text: "Summarizing 30 student survey responses for a faculty meeting.",
          bucketId: "review",
          rationale:
            "AI can compress quickly, but you need to verify themes against the originals before presenting.",
        },
        {
          id: "4",
          text: "Working through a tricky idea you're trying to understand for yourself.",
          bucketId: "no",
          rationale:
            "Productive struggle is the *point*. AI shortcuts what you're trying to build.",
        },
      ],
    },
  },
  {
    activityId: 35,
    stepNumber: 2,
    detailedHelp:
      "**Common criteria worth including:**\n\n*Stakes.* Going to students or external audience → higher bar. Internal-to-me → lower.\n*Cognitive value.* Does the task benefit from my own thinking, or am I just producing output?\n*Data sensitivity.* Student records, FERPA, personnel — VITRA-cleared tools only. Public info — anywhere.\n*Time pressure.* Real deadline + low stakes = AI default. No deadline + high stakes = do it yourself.\n*Verification cost.* If verifying AI output takes longer than just writing it, AI is the slow path.\n\nFour to six is the sweet spot. Two is too few; eight starts feeling like a checklist nobody runs.",
  },
  {
    activityId: 35,
    stepNumber: 3,
    detailedHelp:
      "**Examples turn the framework from theory into a decision tool.**\n\nFor each criterion, write a real moment when it pushed you toward AI and a real moment it pushed you away. *\"Stakes\" pushed me toward AI when drafting an internal status update; it pushed me away when writing a recommendation letter.*\n\nThe specific examples are what make the framework usable next time. Without them, it's just words you wrote down.",
  },
  {
    activityId: 35,
    stepNumber: 4,
    detailedHelp:
      "**Why one of each:**\n\n**Ethical** keeps you honest about *whether* you should use AI for this — even when it'd be effective. \"Will using AI here mean a student doesn't practice a skill they need?\" is the kind of question that doesn't get asked enough.\n\n**Practical** keeps you honest about *whether AI actually helps* — even when you've decided it's allowed. \"Is this faster, or am I just avoiding the part I don't want to do?\" sometimes the answer is no.\n\nFrameworks that are all ethical end up unused; frameworks that are all practical drift into uncritical AI use. Both keep the tool sharp.",
  },
  {
    activityId: 35,
    stepNumber: 5,
    detailedHelp:
      "**The honesty test:** would you actually follow this framework, or did you write down what you think you *should* believe?\n\n**Add a final note** on what you're still uncertain about. \"I don't know where I stand on AI for student feedback yet — I'll come back to this in 3 months.\" Acknowledging uncertainty makes the framework durable; pretending you've figured it all out makes it brittle.\n\nRevisit this doc every six months. Your AI use will evolve faster than you expect, and the framework will need updating.",
  },

  // ── Activity 38: Signal vs. Noise Filter (Skill 13) ──────────────────────
  {
    activityId: 38,
    stepNumber: 1,
    detailedHelp:
      "**Five sources, varied.** Mix social media (LinkedIn, X), news (major outlets, niche newsletters), and institutional/academic (Inside Higher Ed, EDUCAUSE, university blogs).\n\n**Why varied:** the calibration only works if the sample reflects what you'll actually encounter. If all five are LinkedIn posts, your filter will only handle LinkedIn.\n\nSave each as a link in a doc — you'll want to revisit them in step 2.",
  },
  {
    activityId: 38,
    stepNumber: 2,
    detailedHelp:
      "**Three triage questions per item:**\n\n**Hype or substance?** Hype = strong claim, weak evidence, urgency framing (\"AI changes everything!\"). Substance = specific finding, named source, qualified claim.\n\n**Does it affect *my* work?** Generic AI news rarely does. Specific finds — a tool now FERPA-compliant, a study on AI grading bias — sometimes do.\n\n**What actually changed?** New capability? New policy? New evidence? Or just a recapped headline?\n\nIf the answer to all three is \"vague / probably not / nothing new\" — it's noise.",
    interactiveType: "claim_quiz",
    interactiveData: {
      prompt:
        "Calibrate: hype, substance, or partly both?",
      claims: [
        {
          id: "c1",
          text: "Headline: '5 ways AI will revolutionize higher education by 2026.'",
          verdict: "false",
          explanation:
            "Hype-shaped. Generic verbs (\"revolutionize\"), round-number listicle, ambiguous timeline. No source likely.",
        },
        {
          id: "c2",
          text: "Headline: 'University adopts policy requiring disclosure of AI use in graded work; 12-month implementation timeline.'",
          verdict: "true",
          explanation:
            "Substance: specific action, specific timeframe, verifiable.",
        },
        {
          id: "c3",
          text: "Headline: 'New study finds AI tutors increase grades — but only for students already in the top quartile.'",
          verdict: "mixed",
          explanation:
            "Specific and qualified, but the headline itself buries the more important finding (that AI tutoring may widen gaps). Worth reading the source.",
        },
      ],
    },
  },
  {
    activityId: 38,
    stepNumber: 3,
    detailedHelp:
      "**One sentence per item is enough.** The discipline is the point — forcing yourself to decide and commit before moving on.\n\n**Good verdicts are specific:** \"Mostly hype — no underlying study, just commentary on a tool launch.\" or \"Real finding, but applies only to specific course types.\"\n\n**Bad verdicts are vague:** \"Interesting.\" \"Worth a read.\" — These don't help future you.",
  },
  {
    activityId: 38,
    stepNumber: 4,
    detailedHelp:
      "**Five-column table format:**\n\n| Source | Headline | Hype/Substance | Relevance | Takeaway |\n|---|---|---|---|---|\n| LinkedIn — A. Author | \"AI changes everything\" | Hype | Low | Skip |\n| Inside Higher Ed | \"University X adopts AI policy\" | Substance | Medium | Watch for ASU's response |\n\nGoogle Sheets, Notion, or any spreadsheet works. Keeping it in one place builds your personal triage history.",
  },
  {
    activityId: 38,
    stepNumber: 5,
    detailedHelp:
      "**The calibration is the takeaway.** If your reflexes for sorting hype from substance got better — even slightly — this exercise is doing its job.\n\n**Two questions to write down:**\n• Did anything you'd have *normally* read turn out to be hype?\n• Did anything you'd have *normally* skipped turn out to be substantive?\n\nThe gap between your default reading habits and what's actually substantive is what you're closing.",
  },

  // ── Activity 41: Teach Me a Feature (Skill 14) ───────────────────────────
  {
    activityId: 41,
    stepNumber: 1,
    detailedHelp:
      "**Four good candidates:**\n\n**Document upload + analysis.** Most chat tools support it; few users use it. Try uploading a PDF and asking for a structured summary.\n\n**Custom instructions / system prompts.** ChatGPT calls them custom instructions; Claude calls them styles or projects. Configure once, every conversation starts with your context built in.\n\n**Custom GPT or Project.** A persistent agent with its own instructions and (sometimes) attached files.\n\n**Image generation or editing.** DALL-E inside ChatGPT, image features in Gemini, etc.\n\nPick something you've heard about but haven't actually tried.",
  },
  {
    activityId: 41,
    stepNumber: 2,
    detailedHelp:
      "**The teaching prompt is doing two things:** asking for a step-by-step (so you can follow), and asking the AI to assume zero knowledge (so it doesn't skip the obvious).\n\n**Push for specificity:** if the AI says \"go to settings,\" ask \"where is settings — top right? Left sidebar? What does it look like?\" Get the AI to describe the actual UI rather than handwave.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "I want to learn how to [feature you picked] in [tool you're using]. Walk me through it step by step, assuming I've never done it before. Be specific about exactly where to click, what to type, and what to expect to see.",
      hint: "Replace [feature] and [tool] with your specifics, then paste this into the AI you want to teach you.",
    },
  },
  {
    activityId: 41,
    stepNumber: 3,
    detailedHelp:
      "**Follow exactly — even if you can guess what's next.** The point isn't to learn the feature; the point is to learn where AI's instructions break down.\n\n**Three failure modes to watch:**\n\n*Step skipping.* AI assumes you know how to do something obvious (\"open the app\") that's actually different in the version you're using.\n\n*Wrong UI.* AI describes a button that doesn't exist in the current interface — UIs change faster than training data.\n\n*Vague pointer.* \"Go to the menu\" without saying which menu.",
  },
  {
    activityId: 41,
    stepNumber: 4,
    detailedHelp:
      "**Telling the AI what happened is the meta-skill.**\n\nIf it failed: \"I followed step 3 but I don't see the button you mentioned.\" The AI will often correct itself with surprising specificity. Sometimes it'll ask what version you're using.\n\nIf it succeeded: \"Worked — but step 4 wasn't necessary.\" Now you have a tighter walkthrough than the original.",
  },
  {
    activityId: 41,
    stepNumber: 5,
    detailedHelp:
      "**Why verify against documentation:** AI's training data is months or years old. Features change, UIs redesign, defaults shift. Official documentation is current.\n\n**Where to find the docs:**\n• OpenAI: [help.openai.com](https://help.openai.com)\n• Anthropic: [docs.anthropic.com](https://docs.anthropic.com) and [support.anthropic.com](https://support.anthropic.com)\n• Google AI: [support.google.com/gemini](https://support.google.com/gemini)\n• Microsoft Copilot: [support.microsoft.com](https://support.microsoft.com)\n\nNote any discrepancies — these are the places where blindly trusting AI's instructions would have led you wrong.",
  },
  {
    activityId: 41,
    stepNumber: 6,
    detailedHelp:
      "**The tested walkthrough is more valuable than the AI's original.** It has three things AI's original didn't:\n\n**Your real environment.** Not a generic \"the menu,\" but exactly where the option lives in the version you're using.\n\n**The corrections.** What the AI got wrong, fixed in place.\n\n**Confidence.** You ran it. It works. The next person who follows it doesn't need to verify.\n\nKeep this in your own knowledge base. The next time you (or a colleague) wants to learn the same feature, the walkthrough is already done.",
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  for (const a of activityPatches) {
    const patch: Database["public"]["Tables"]["level_up_activities"]["Update"] =
      {};
    if (a.title !== undefined) patch.title = a.title;
    if (a.description !== undefined) patch.description = a.description;
    const { error } = await sb
      .from("level_up_activities")
      .update(patch)
      .eq("id", a.id);
    if (error) console.error(`activity ${a.id}:`, error.message);
    else console.log(`✓ activity ${a.id} patched`);
  }

  for (const s of stepPatches) {
    const patch: Database["public"]["Tables"]["activity_guide_steps"]["Update"] =
      {};
    if (s.instruction !== undefined) patch.instruction = s.instruction;
    if (s.detailedHelp !== undefined) patch.detailed_help = s.detailedHelp;
    if (s.interactiveType !== undefined) patch.interactive_type = s.interactiveType;
    if (s.interactiveData !== undefined) patch.interactive_data = s.interactiveData;
    const { error } = await sb
      .from("activity_guide_steps")
      .update(patch)
      .eq("activity_id", s.activityId)
      .eq("step_number", s.stepNumber);
    if (error)
      console.error(`step ${s.activityId}/${s.stepNumber}:`, error.message);
    else console.log(`✓ step ${s.activityId}/${s.stepNumber} patched`);
  }

  console.log(
    `\nDone — ${activityPatches.length} activities + ${stepPatches.length} step patches.`
  );
}

main();
