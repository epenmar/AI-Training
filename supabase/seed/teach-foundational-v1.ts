/**
 * Rewrites detailed_help on foundational-tier activity steps to teach
 * concepts inline — term definitions, "why this matters" framings, and
 * clickable links to source content from lesson_flow.
 *
 * Rendering: the activity detail page parses [text](url) and **bold**
 * in detailed_help. Do not use other markdown; it will render literally.
 *
 * Run with: npx tsx --env-file=.env.local supabase/seed/teach-foundational-v1.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type StepHelp = { step_number: number; detailed_help: string };
type ActivityUpdate = { activity_id: number; steps: StepHelp[] };

const updates: ActivityUpdate[] = [
  // =========================================================================
  // Activity 1: AI Tool Safari (Skill 1 — choose the right tool)
  // =========================================================================
  {
    activity_id: 1,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**What an AI chat tool is:** a program where you type a question or request in plain English and the AI types back. ChatGPT, Microsoft Copilot, Claude, and Google Gemini are the most common ones.\n\nYou're opening three at once because the whole point here is comparison. Each tool was trained differently and has different defaults — one might be chatty, another terse, another cautious. You won't notice any of that unless you see them side-by-side.\n\n**Which three to pick:** the easiest starting point is the **Suggest tools** button above — it gives you a short list of free, accessible tools matched to this activity. ASU's [vetted AI tool list](https://ai.asu.edu/ai-tools) shows the enterprise options cleared through VITRA (the vendor risk assessment) if you want to use something ASU has formally approved.\n\n**What ready looks like:** each tool shows an empty chat box. Don't send anything yet — just get all three waiting.",
      },
      {
        step_number: 2,
        detailed_help:
          "**What a prompt is:** the thing you type to the AI. Any question, request, or instruction you send counts as a prompt.\n\nWhat you're doing in this activity is called **zero-shot prompting** — you give the AI a task without showing it any examples of what a good answer looks like. Just the ask. This is how most people use AI tools in practice, so it's a useful baseline. More on the concept in the [Zero-Shot Prompting reference (PDF, p. 2)](https://drive.google.com/file/d/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-/view#page=2).\n\nUse the prompt exactly as written — \"Write a 3-sentence explanation of active learning suitable for a course syllabus.\" Copy, don't retype; even tiny wording differences can change what comes back.",
      },
      {
        step_number: 3,
        detailed_help:
          "**Why identical wording matters:** if you tweak the prompt between tools, you're no longer comparing the tools — you're comparing your prompts. The goal is a controlled test: same input, see how the outputs differ.\n\nResist the urge to edit based on what Tool 1 gave you. If a tool asks a clarifying question or offers suggestions before answering, that's useful data — note it down, but still send the original prompt. You can always iterate later; this step is just the baseline capture.",
      },
      {
        step_number: 4,
        detailed_help:
          "Four things to notice in each response:\n\n**Length.** Did it stick to three sentences, or did it pad the answer?\n\n**Tone.** How formal is it? Would you put this in a syllabus as-is, or does it read like a marketing brochure? Tone = word choice + sentence rhythm + how directly it addresses the reader.\n\n**Constraint-following.** The prompt said three sentences. Some tools treat that as a hard rule, others as a loose suggestion. That tells you how literal or flexible each one is.\n\n**Accuracy.** Do the claims sound right to you? Any definitions of active learning that seem off? You don't need to fact-check exhaustively yet — just flag anything that surprised you. ([Key terms for evaluating AI outputs](https://canvas.asu.edu/courses/157584/pages/module-5-overview-2) has more on what to look for.)\n\nNo tool will be best on all four. That's the point.",
      },
      {
        step_number: 5,
        detailed_help:
          "You're not writing a review — just capturing what each tool *did*, specifically enough that you could predict how it'd behave next time.\n\n**Good observation:** \"ChatGPT gave five sentences, ignored the constraint, and used jargon like student-centered pedagogy.\"\n\n**Weak observation:** \"ChatGPT was good.\"\n\nThe more specific your notes, the more useful this is six months from now when you're picking a tool for a different task.",
      },
      {
        step_number: 6,
        detailed_help:
          "**The underlying skill:** learning to pick a tool based on the task, not on brand recognition. \"I liked Claude\" is a starting point; \"Claude held the three-sentence constraint and matched a syllabus voice\" is a reason that transfers to the next decision.\n\nAs you use more tools, you'll develop a mental map: which one to reach for when you need concise, when you need structure, when you want to be pushed back on. That map is what \"choosing the right tool\" actually means.\n\nGo deeper: [Module 1 — Experimenting with GenAI at ASU](https://rise.articulate.com/share/3lU5J_haoXgNR9QKQORI67zuM2Qix_sv#/lessons/J4bNGWxtic5oznXuy5BC_gwfhfAMsE1A) covers the ASU-specific tool landscape in ~15 minutes, and [Module 2 — Do you know what AI can do?](https://rise.articulate.com/share/fRP7fjoWsWuSXljLxc2dF011IycTdmdL#/lessons/_3dr-VqskB18C8sq3TPuSG2e-zUIxdTC) walks through capabilities you just observed in action.",
      },
    ],
  },

  // =========================================================================
  // Activity 4: My First AI Conversation (Skill 2 — prompting & iteration)
  // =========================================================================
  {
    activity_id: 4,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**Why a topic you know well:** you need to be able to tell when the AI is right, wrong, or hand-waving. On unfamiliar territory, everything sounds plausible — that's a recipe for absorbing misinformation without noticing. Start on home turf so your BS detector can actually work.\n\nAny AI chat tool is fine. Use the **Suggest tools** button above for options, or pick from ASU's [vetted tool list](https://ai.asu.edu/ai-tools).",
      },
      {
        step_number: 2,
        detailed_help:
          "**What makes a good opening prompt:** it's specific enough that the AI can give you something useful, but open enough that there's somewhere to go next. \"What is photosynthesis?\" is a closed question — one answer, conversation over. \"How would you explain photosynthesis to a student who already understands cell respiration?\" has an angle and leaves room.\n\nThe [Input quality = output quality reference (PDF, p. 2)](https://drive.google.com/file/d/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-/view#page=2) has the core principle; [Module 4 — Steps for an effective prompt](https://rise.articulate.com/share/Ih949hPlICDdUyw0OtVdBtg6EWYn0V3n#/lessons/K0OMFl0s_2SIUThBCuYlAR63-lF5xI9P) walks through the structure in ~10 minutes.",
      },
      {
        step_number: 3,
        detailed_help:
          "**What \"multi-turn conversation\" means:** after each reply, the AI remembers what you both just said and uses it as context for the next response. This is what makes chat tools different from search engines — you can build on answers instead of starting over.\n\n**Why follow up instead of starting a new topic:** starting fresh treats the AI like a search bar. The whole point of a conversation is that each turn deepens what came before. A follow-up might ask for an example, push on something that felt incomplete, or redirect based on what the AI said. Don't worry about whether your question is \"good enough\" — just keep going.",
      },
      {
        step_number: 4,
        detailed_help:
          "**Why push deeper:** AI responses often start generic and get more specific as you narrow in. The first answer is what the model produces for an average reader. Turn five, after you've challenged and redirected, is what it produces for *you*.\n\nFour types of follow-ups that usually move the conversation forward:\n\n**Ask why.** \"Why does that approach work better than X?\" Surfaces reasoning the AI glossed over.\n\n**Request an example.** \"Can you show me a concrete case?\" Forces the AI off abstractions.\n\n**Challenge something.** \"That contradicts what I've read in Y — how would you reconcile?\" Tests whether the AI holds up.\n\n**Change perspective.** \"How would someone who disagrees frame this?\" Reveals the shape of the argument.",
      },
      {
        step_number: 5,
        detailed_help:
          "**What you're looking for:** the difference between turn 1 and turn 5 is the difference between what AI gives *anyone* on this topic and what it gives *you* after your steering.\n\nMaybe the final response uses a specific example you asked for. Maybe it concedes a point. Maybe it's more nuanced, or more confident. Maybe it still sounds canned — that's also useful data about this tool's ceiling.\n\nOne sentence is enough. The observation is the point, not the write-up.",
      },
      {
        step_number: 6,
        detailed_help:
          "**The underlying skill:** treating AI as a thinking partner rather than an answer machine. One-shot prompts get you the surface; conversations get you somewhere you couldn't have gone alone.\n\nThis doesn't happen by accident. It happens because you push — asking why, asking for examples, redirecting. Next time you're tempted to take the first answer, remember how different turn 5 was.",
      },
    ],
  },

  // =========================================================================
  // Activity 7: Source Check Challenge (Skill 3 — evaluate AI outputs)
  // =========================================================================
  {
    activity_id: 7,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**What's about to happen:** the AI will likely give you three official-looking citations — author names, journal titles, years, page numbers. Some will be real. Some will be partially real (real authors, real journal, wrong combination). Some will be entirely invented.\n\nThese are called **hallucinations** — content the AI generates that sounds authoritative but isn't true. They happen because the model is trained to produce *plausible* text, not *accurate* text, and citations follow very regular patterns that are easy to imitate. More on what to watch for in the Canvas [Key terms for evaluating GenAI outputs](https://canvas.asu.edu/courses/157584/pages/module-5-overview-2) page.\n\nPick a topic in your field so you can spot problems. Ask exactly as written.",
      },
      {
        step_number: 2,
        detailed_help:
          "Paste the citations verbatim — including any quirks like unusual capitalization or missing punctuation. Those details sometimes reveal fabrication on their own (real journals have strict house styles).\n\nDon't skip ones that feel \"obviously right.\" The convincing ones are exactly what you need to test. The whole point is to check your own instincts, not just confirm them.",
      },
      {
        step_number: 3,
        detailed_help:
          "**Why Google Scholar:** it indexes peer-reviewed articles and books, and it's free. If an article exists in a real journal, Scholar usually knows about it.\n\nSearch by **exact title** first, in quotation marks. If nothing comes up, search the title without quotes. If still nothing, try the author name plus a distinctive phrase from the title. If none of that surfaces anything, the article likely doesn't exist.",
      },
      {
        step_number: 4,
        detailed_help:
          "Three patterns you'll probably see:\n\n**Real.** Title, author, journal, year all match.\n\n**Frankenstein.** Real author, real journal, but the specific paper doesn't exist — the AI assembled a plausible combination from its training data.\n\n**Fully invented.** No trace of the article. Sometimes the author doesn't exist either.\n\nThe middle category is the dangerous one. It passes a sniff test, and it'll fool anyone who only checks whether the journal is real. [ASU's ChatGPT resources guide](https://canvas.asu.edu/courses/157584/pages/maximizing-teaching-efficacy-with-asus-chatgpt-resources) gets into why AI fabricates these patterns.",
      },
      {
        step_number: 5,
        detailed_help:
          "The number matters less than the habit. Even one fake citation in three means \"verify every citation the AI gives you, always.\"\n\n**Why this is the skill:** AI-generated citations are the single most common way AI misinformation enters academic work. Not because people are lazy — because the fakes are convincing. The defense isn't skepticism (you'd never finish anything); it's a mechanical verification step. Search every title. Every time.",
      },
    ],
  },

  // =========================================================================
  // Activity 10: Spot the Fake (Skill 4 — hallucination detection)
  // =========================================================================
  {
    activity_id: 10,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**Why a topic you actually know:** you're training your own detection instincts, not the AI's. On a familiar topic, you can tell when something is subtly off in a way you can't when you're learning.\n\nYour institution's history, a course you teach, a hobby you're deep in — all good choices. You want enough background that a confident-sounding wrong claim would strike you as wrong.",
      },
      {
        step_number: 2,
        detailed_help:
          "Ask exactly that — \"Tell me 5 interesting facts about [topic]\" — not \"5 verified facts\" or \"5 well-known facts.\" Part of the exercise is seeing what AI offers when you give it latitude.\n\nYou may notice the AI reaches for \"interesting\" claims: surprising dates, little-known connections, unexpected origins. That's exactly where fabrication concentrates — the more novel a claim sounds, the more likely it was stitched together.",
      },
      {
        step_number: 3,
        detailed_help:
          "**What a hallucination is:** content the AI produces that sounds authoritative but isn't true — a made-up statistic, a fabricated quote, an invented connection between real things. They feel real because the AI was trained to produce convincing text, not truthful text.\n\n**Don't search yet.** The point here is to see how well your existing knowledge can detect them. If you immediately Google everything, you never test your own instinct — and outside this activity, you won't have time to verify every claim.\n\nThree marks: ✅ I know this, ❓ unsure, ❌ this smells wrong. Use your gut. The [Key terms for evaluating GenAI outputs](https://canvas.asu.edu/courses/157584/pages/module-5-overview-2) Canvas page has language for the specific patterns you're spotting.",
      },
      {
        step_number: 4,
        detailed_help:
          "**Why put words to it:** \"feels off\" is useful but hard to transfer. \"The date is 40 years before that technology existed\" is a rule you can apply next time.\n\nCommon patterns in wrong facts:\n- Mashes together real people/dates that don't actually connect\n- States numbers with implausible precision (\"73.4% of students\")\n- Claims causation where you know the history is more complicated\n- Invents specific quotes or speeches",
      },
      {
        step_number: 5,
        detailed_help:
          "Now verify. How did you do?\n\n**If you caught the fakes:** great — and notice what specifically flagged them. Was it a date? A name? A claim that was too tidy?\n\n**If something fooled you:** even better data point. That's the shape of your blind spots. \"I'd believe made-up quotes from real historical figures\" is worth knowing.\n\n**If everything was actually true:** run the exercise again on a different topic. AI rarely gives five consecutive perfectly accurate interesting facts — if it did, try asking for more obscure or surprising ones next time.",
      },
      {
        step_number: 6,
        detailed_help:
          "**The common thread in convincing fakes:** specificity + plausibility + nothing to contradict them in the reader's head. The AI doesn't invent wild claims — it invents *boring-sounding* ones. Specific years, middling statistics, reasonable-sounding quotes. That's what makes hallucinations dangerous: they look like the kind of factoid nobody would make up.\n\nGoing forward, when AI gives you a specific claim you don't already know, treat that as the place to verify — not the confident-sounding general statements.",
      },
    ],
  },

  // =========================================================================
  // Activity 13: Before & After (Skill 5 — AI as a drafting partner)
  // =========================================================================
  {
    activity_id: 13,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "Pick something with real stakes — a message you're actually sending, not a hypothetical. The stakes are what make the voice check matter. You can live with an AI-sounding practice draft; you can't send an AI-sounding email to your dean.\n\nA 100–300 word task is ideal. Short enough to finish in 20 minutes, long enough that voice actually matters.",
      },
      {
        step_number: 2,
        detailed_help:
          "**A useful prompt structure** — sometimes called the **RTF framework**: Role, Task, Format.\n\n- **Role:** who should the AI be writing as? (\"You're a university instructor writing to her students.\")\n- **Task:** what's the message doing? (\"Announce that next week's class is moving online.\")\n- **Format:** what form should the output take? (\"A short email, friendly but professional, around 100 words.\")\n\nFull RTF reference in the [Role-Task-Format PDF (p. 5)](https://drive.google.com/file/d/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-/view#page=5); the broader [Module 4 — Steps for an effective prompt](https://rise.articulate.com/share/Ih949hPlICDdUyw0OtVdBtg6EWYn0V3n#/lessons/K0OMFl0s_2SIUThBCuYlAR63-lF5xI9P) has the full reasoning.",
      },
      {
        step_number: 3,
        detailed_help:
          "**Why read aloud:** your ears catch what your eyes miss. Phrases you'd never say out loud stand out immediately. AI drafts tend to have a specific rhythm — slightly formal, slightly hedged, slightly over-structured — that looks fine on the page but sounds off when you speak it.\n\nListen for:\n- **Words you don't use** (\"leverage,\" \"facilitate,\" \"navigate this transition\")\n- **Three-part lists where you'd use one item**\n- **Openings that delay the point** (\"I wanted to reach out to let you know that...\")\n- **Sign-offs that don't sound like you**",
      },
      {
        step_number: 4,
        detailed_help:
          "**Don't polish — rewrite.** Polishing keeps the AI scaffolding and layers your voice on top. Rewriting forces you to think about what you'd actually say.\n\n**Why AI drafts sound generic:** they're optimized for \"works for most readers\" — that's the opposite of voice. Your voice is the specific choices you make that mark text as yours: the words you reach for, the rhythm, how much you hedge or don't, your sign-off. The [Input quality = output quality reference (PDF, p. 2)](https://drive.google.com/file/d/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-/view#page=2) covers why prompt phrasing shapes tone.",
      },
      {
        step_number: 5,
        detailed_help:
          "Writing it out makes the pattern visible.\n\n**What AI usually gets right:** structure (greeting, body, close), basic information, hitting the obvious points.\n\n**What AI usually misses:** your voice. The specific warmth, dryness, directness, or humor that tells the reader it's from you. Inside jokes. Knowing what to leave out. How much hedging this specific recipient needs.\n\nThe payoff of this exercise: next time you get an AI draft, you skim for structure (keep), then rewrite for voice (replace).",
      },
    ],
  },

  // =========================================================================
  // Activity 16: Agent vs. Prompt — What's the Difference? (Skill 6)
  // =========================================================================
  {
    activity_id: 16,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "Read [AI progression: prompts → agents (PDF, pp. 8–9)](https://drive.google.com/file/d/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-/view#page=8). The short version you'll see expanded there:\n\n**A chatbot** responds to what you just typed. Each turn is independent (except for remembering the conversation).\n\n**An agent** is given a goal and takes multiple steps on its own to reach it — planning sub-tasks, calling tools (web search, code execution, file access), sometimes checking its own work before handing back.\n\nThe gap between them is the difference between asking for help and asking someone to handle something. Read before you try the next step so you have a reference point.",
      },
      {
        step_number: 2,
        detailed_help:
          "The prompt is intentionally multi-part. You're seeing whether the tool treats it as one big request or breaks it into pieces.\n\nPaste it in whole — don't guide it through step-by-step. The experiment is what the tool does when you *don't* hand-hold.",
      },
      {
        step_number: 3,
        detailed_help:
          "Three things to watch for:\n\n**Coverage.** Did it address all three parts (theme per day, session titles, invitation email), or drop one?\n\n**Coherence.** Do the session titles fit the themes? Does the email reference what it just designed? Or does each piece live in its own bubble?\n\n**Initiative.** Did it ask clarifying questions (\"what's your audience?\"), offer alternatives, or flag assumptions? Or did it just produce?\n\nMost chatbots handle the content but don't connect the pieces. That's what a real agent would do differently.",
      },
      {
        step_number: 4,
        detailed_help:
          "The reflection is the learning. Three questions:\n\n**1) What did it handle on its own?** Usually: generating the content.\n\n**2) Where did you have to guide it?** Usually: connecting pieces, catching gaps, deciding what to keep.\n\n**3) What would make this feel like an agent?** Hint: agents plan, use tools, check their own work, and handle feedback loops without you retyping. A chatbot writes you an invitation; an agent drafts it, pulls the actual calendar availability, and asks whether to send.\n\nThis distinction matters because \"agentic AI\" is where the next wave of tools is going — Copilot taking actions in Office, custom agents that do research end-to-end. Understanding the difference now keeps you from mistaking a clever chatbot for something it isn't.",
      },
    ],
  },

  // =========================================================================
  // Activity 19: AI Meets Your Spreadsheet (Skill 7 — data & privacy)
  // =========================================================================
  {
    activity_id: 19,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**Why non-sensitive matters:** anything you paste into an AI tool leaves your machine. Depending on the tool's terms, it may be stored, used for training, or accessible to the vendor. That makes student-identifying data (names, grades, ID numbers) a hard no for most consumer tools.\n\n**FERPA** is the federal law that protects education records — it covers names tied to grades, attendance, enrollment, performance, and other identifiable academic info. The [NMU guide to FERPA and generative AI](https://nmu.edu/ctl/understanding-ferpa-context-generative-ai-guide-faculty) explains the practical implications for faculty.\n\nFor this activity, use public data: city open-data portals, data.gov, aggregated enrollment numbers from IR reports, or a synthetic CSV you make up.",
      },
      {
        step_number: 2,
        detailed_help:
          "**What \"read data\" means here:** most modern AI chat tools can accept a pasted table or an uploaded CSV and reason about it directly. ChatGPT, Claude, and Copilot all handle this natively.\n\nA few tools run analysis code under the hood — notably ChatGPT's data-analysis mode — which can be more reliable for numeric claims. But for a simple spreadsheet summary, a regular chat window is fine.\n\nIf you're unsure which tool to use, the **Suggest tools** button above has options matched to this activity.",
      },
      {
        step_number: 3,
        detailed_help:
          "That exact question — \"trends, outliers, summary statistics\" — is deliberately specific enough that the AI has to show you its reading of the data, not just a generic \"here's what's in the file.\"\n\nIf the AI asks clarifying questions first (\"do you want per-column stats or overall?\"), answer and let it produce something. The goal is to get it to commit to an analysis so you can then check whether it's actually correct.",
      },
      {
        step_number: 4,
        detailed_help:
          "**Why spot-check:** AI can misread spreadsheets in surprising ways — column alignment errors, misreading decimals, confidently stating an average that's off by 10x. The confident tone is the same whether it's right or wrong. Manual verification is the only way to know.\n\nOpen the raw file. Pick 2–3 specific claims the AI made — a \"the average is X,\" a \"the highest value is Y,\" a \"there's a trend upward.\" For each, check whether it's actually true. Don't try to verify everything; pattern-sampling is enough.",
      },
      {
        step_number: 5,
        detailed_help:
          "The trust question is real. For summary *this dataset in ways that match your manual check* — probably yes. For *data you haven't looked at yourself* — that's the risky use case. You have no way to catch the confident misreads unless you already know what the answer should be.\n\n**The practical rule:** AI is fine for speeding up analysis on data you already understand; it's unreliable as your only read of data you don't. And even in the former case, keep sensitive data out of tools that aren't ASU-approved. ASU's [vetted tool list](https://ai.asu.edu/ai-tools) lists which tools have been through VITRA and are cleared for low-risk FERPA use.",
      },
    ],
  },

  // =========================================================================
  // Activity 22: Describe It, See It (Skill 8 — AI visuals)
  // =========================================================================
  {
    activity_id: 22,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**Why a concept you already explain:** you already know what a good version looks like. That gives you an evaluation baseline. When the AI produces something off, you'll see immediately what's missing.\n\nGood candidates: a process (like how peer review works), a comparison (like inductive vs. deductive reasoning), or a hierarchy (like Bloom's taxonomy). Avoid anything with precise technical relationships — AI diagram tools are still rough at subject-matter accuracy.",
      },
      {
        step_number: 2,
        detailed_help:
          "**Why this exact structure:**\n\n- **Diagram type** (flowchart, comparison, hierarchy) tells the tool what shape you want.\n- **Key elements** tells it what labels to include.\n- **Relationships** (arrows, grouping, order) tells it how to connect them.\n\nAI visual tools lean on your description for everything — they can't infer structure from \"make me a diagram of peer review.\" The more you specify, the less you'll need to fix.\n\nRealistic example: \"Create a flowchart for the peer review process. Include: submission, editor assignment, reviewer invitation, review, revision, final decision. Show it as a top-to-bottom flow with decision points where papers can be rejected or sent back.\"",
      },
      {
        step_number: 3,
        detailed_help:
          "There are several kinds of tools for this:\n\n**Diagram-native** (Napkin, Whimsical AI, Mermaid via an LLM) — produce structured diagrams with labeled boxes and arrows. Best for flowcharts and hierarchies.\n\n**Image-generation** (Firefly, Midjourney, ChatGPT's image mode) — produce illustrations. Best for concept imagery, worst for anything with text labels.\n\n**Chat tools with diagram output** — most will output Mermaid or a text description if asked.\n\nThe **Suggest tools** button above has current options. The [UC Library AI Tools for Presentations guide](https://guides.libraries.uc.edu/ai-education/presentation) has a useful comparison if you want more background.",
      },
      {
        step_number: 4,
        detailed_help:
          "Common issues to check:\n\n**Labels.** Are they spelled correctly? Do they match your field's terminology? (AI frequently \"smooths\" specialist terms into more generic versions.)\n\n**Relationships.** Do the arrows point the right way? Are the groupings logical?\n\n**Completeness.** Did it include everything you asked for? Did it add things you didn't?\n\n**Accessibility.** Is there enough color contrast? Are shapes distinguishable without relying on color alone? The [Texas Tech accessible presentations guide](https://www.ttu.edu/accessibility/digital-accessibility/docs/accessible-powerpoint-guide.html) covers the core rules — most AI-generated visuals need adjustment here.",
      },
      {
        step_number: 5,
        detailed_help:
          "Being specific about which bucket each piece falls into is the whole point. It prevents the trap of \"I'll just use this, it's fine\" when actually three labels are wrong.\n\n**Usable as-is:** rare, but it happens — typically for simple structures.\n\n**Needs minor fixes:** most common — a label wrong, an arrow reversed, colors tweaked.\n\n**Would need to redo manually:** the structure is off in ways that can't be patched, or the tool missed what you were going for.\n\nGoing forward: for anything more complex than a simple chart, AI gives you 70% of a diagram. The remaining 30% is yours.",
      },
    ],
  },

  // =========================================================================
  // Activity 25: Find the Policy (Skill 9 — disclosure & attribution)
  // =========================================================================
  {
    activity_id: 25,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**Why disclosure matters:** disclosure is what separates using AI as a tool (legitimate, widely accepted) from passing off AI output as your own (misconduct). Policies exist so there's a shared expectation of where the line is.\n\n**Where to look at ASU:** start with the Provost's AI page or ASU's main AI hub. The policy landscape is evolving — different colleges and units sometimes have more specific guidance than the university-wide statement. The Canvas [Ethical AI key terms](https://canvas.asu.edu/courses/157584/pages/module-3-overview-2) page is a useful companion if you want to understand what the policies are actually protecting against.\n\nBookmark whatever you find. This is the reference you'll reach for most.",
      },
      {
        step_number: 2,
        detailed_help:
          "**Why external policies diverge wildly:** some journals require disclosure in a specific section. Some require it in acknowledgments. Some ban AI-written text entirely. Some ban only AI-generated images. Funders often require disclosure of AI use in proposal preparation.\n\nPick something that actually applies to you — a journal you've published in, a funder you're writing to, a professional society you belong to. The specifics are what make this useful next time you're writing something.",
      },
      {
        step_number: 3,
        detailed_help:
          "**If they don't have a policy:** that's real information. It means (a) you have discretion, (b) the rules may change while your work is under review, and (c) being proactive about disclosure costs nothing and protects you.\n\nOne sentence is enough. You're building a reference, not writing a memo. \"Nature requires disclosure of AI use in a dedicated Methods section\" is more useful than three paragraphs of detail you'll never reread.",
      },
      {
        step_number: 4,
        detailed_help:
          "**Why a reference card:** disclosure policies are the kind of thing you forget existed until you're one sentence away from submitting something. A card you can find in 10 seconds means you'll actually check.\n\nAnywhere durable works: a bookmark folder, a pinned note, a line in your lab notebook, a shared team doc. What matters is that you can find it from whichever device you're writing on. [Module 3 — Core values for AI use](https://rise.articulate.com/share/LZmZZ-KMIhK7vDZxyC2e8ThCFkfQ5T01#/lessons/tai1yFyVRajyPWKuEhr_OV74I_C6iUok) goes deeper into the \"why\" behind disclosure if you want more context for your card.",
      },
    ],
  },

  // =========================================================================
  // Activity 28: Three Things AI Can and Can't Do (Skill 10 — mental model)
  // =========================================================================
  {
    activity_id: 28,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**What a mental model is:** the rough picture in your head of how something works. Good mental models make you faster and safer; wrong ones make you overtrust or underuse.\n\nThis activity forces your current mental model into writing — before testing it — so you can see which parts were accurate and which weren't. Paper, doc, whiteboard — any two-column format works.",
      },
      {
        step_number: 2,
        detailed_help:
          "**Why predict first:** predictions are only interesting if you commit to them before seeing the answer. If you test and list at the same time, you'll tailor your list to what you just saw. Writing first locks in your current understanding.\n\nDon't overthink it. Three items per column, based on what you currently believe. Your gut is exactly what we're testing.",
      },
      {
        step_number: 3,
        detailed_help:
          "**What generative AI actually is:** a system trained on huge amounts of text (and sometimes images, audio, code) to predict what should come next. It's shockingly good at producing fluent language, capturing the *shape* of answers, and imitating styles. It's less reliable at arithmetic, citing sources, factual recall of obscure details, and anything requiring real-time information.\n\nThat context helps you interpret results. A brief primer: the [Intro to Generative AI video](https://www.youtube.com/watch?v=gqoi5jme188) and [Module 1 — Fundamentals of Generative AI](https://rise.articulate.com/share/3lU5J_haoXgNR9QKQORI67zuM2Qix_sv#/lessons/XiDuial6n3OEWUwXuc4n5UiKh0Wbhb-S). Run your tests briskly — a few minutes per item is plenty.",
      },
      {
        step_number: 4,
        detailed_help:
          "Four places people commonly get their mental model wrong:\n\n- **Arithmetic.** Newer models are better, older ones are unreliable. If the tool didn't use a calculator tool under the hood, don't trust the number.\n- **Citations.** AI will fabricate convincingly. \"Can't do this reliably\" is a safer default.\n- **Creative writing.** Often better than expected at *imitating* styles, worse at *originality*.\n- **Current events.** Models have a training cutoff. Anything after that cutoff is either missing or being guessed.\n\nMark which of your predictions were surprised — those are the places your mental model needed updating.",
      },
      {
        step_number: 5,
        detailed_help:
          "**Why this reflection is the point:** every AI decision you'll make going forward routes through your mental model. If that model is wrong, you'll either (a) reach for AI when you shouldn't, or (b) avoid it when you should be using it.\n\nMore depth: [Traditional AI vs Generative AI (PDF, p. 1)](https://drive.google.com/file/d/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-/view#page=1) and [Four Layers of AI Evolution (PDF, p. 1)](https://drive.google.com/file/d/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-/view#page=1) for the broader landscape, and [Module 1 — The value of generative AI](https://rise.articulate.com/share/3lU5J_haoXgNR9QKQORI67zuM2Qix_sv#/lessons/_JUEDXqbtW3zJB6i7mWkFF3uDOOmalas) if you want a structured walkthrough.",
      },
    ],
  },

  // =========================================================================
  // Activity 31: The Unexpected Prompt (Skill 11 — creative use)
  // =========================================================================
  {
    activity_id: 31,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**Why a routine task:** the whole point is breaking the pattern on something you usually do on autopilot. Routine tasks are where habits calcify — you write the same kind of meeting agenda you always write. You want something boring enough that a weird constraint actually has somewhere to go.\n\nMeeting agendas, status emails, to-do lists, small announcements are all good candidates.",
      },
      {
        step_number: 2,
        detailed_help:
          "**Why creative constraints unlock different outputs:** when you ask an AI to write an email in the normal way, it uses its \"business email\" template. When you ask it to write the same information as a haiku or a choose-your-own-adventure, it has to figure out what actually matters (because the constraint forces compression or reframing). That re-examination is where ideas hide.\n\nPick something distinctly different from your usual form. Some that work:\n- A meeting agenda as a choose-your-own-adventure\n- A to-do list as a series of haiku\n- An email as a dialogue between two people\n- A project update as a nature documentary narration",
      },
      {
        step_number: 3,
        detailed_help:
          "**Read critically, not defensively.** The output is going to be silly. That's expected. The question isn't \"is this silly?\" — it's \"did the silly form surface anything real?\"\n\nThings to look for:\n- A framing of a task that you hadn't considered\n- A priority order different from your default\n- Something the constraint forced the AI to drop — which might be something you habitually include but don't need\n- A tone that turns out to be better-suited than your usual one",
      },
      {
        step_number: 4,
        detailed_help:
          "**What this tells you:** creative prompting isn't just a party trick. Changing the form of a request changes what the AI reaches for. If \"write me a meeting agenda\" gives you the same predictable output every time, trying \"write me an agenda as if each item were a small mystery to solve\" can produce genuinely different structure — because the AI has to think about the agenda differently to fit the frame.\n\nMore on the underlying mechanic: [Module 4 — Importance of well-crafted prompts](https://canvas.asu.edu/courses/157584/pages/module-4-overview-2), and the [AI Creative Learning Lab](https://lx.asu.edu/ai) is worth a bookmark for when you want to explore further.",
      },
    ],
  },

  // =========================================================================
  // Activity 34: My AI Decision Journal (Skill 12 — reflective practice)
  // =========================================================================
  {
    activity_id: 34,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**The goal is low friction:** the log only works if you'll actually reach for it in the moment. Don't overdesign. A note in your phone, a sticky on your monitor, a single spreadsheet row per day — any of them beat a beautiful system you'll stop using by Wednesday.\n\nThe simplest format: Date | Task | Used AI? | Why/why not. Four columns, one line per entry.",
      },
      {
        step_number: 2,
        detailed_help:
          "**What counts as \"considering AI\":** any moment you think \"I could use AI for this\" — whether you actually do or don't. That's the decision point you're trying to surface.\n\nThe \"why\" is the most valuable column. \"It would have been faster\" is different from \"I didn't want to spend the time formatting the prompt\" is different from \"the data was sensitive.\" These are the patterns that reveal your real criteria.\n\nThe **AI-X Framework** is a structured way to think about these decisions if you want to go deeper later — see [AI-X Framework overview](https://aix-framework.lei-tech.org/home).",
      },
      {
        step_number: 3,
        detailed_help:
          "**Why no judgment:** the moment you start grading entries (\"was this a good decision?\"), you'll stop writing honestly. You'll start curating.\n\nThe log is not a report card. It's a field recording of your actual behavior — including the lazy choices, the impulsive ones, the overcautious ones. All data.",
      },
      {
        step_number: 4,
        detailed_help:
          "**What patterns to look for:**\n\n- **Always-AI tasks.** What type of work do you delegate to AI without a second thought? Is that a good habit?\n- **Never-AI tasks.** What do you refuse to use AI for? Is the reason still valid, or is it old-habit inertia?\n- **Hard decisions.** Which ones felt ambiguous? Those are the interesting ones — the place where your criteria need sharpening.\n\nThe [AI-X Toolkit](https://aix-framework.lei-tech.org/aix-toolkit-home) organizes this thinking into four stages — Challenge, Creation, Implementation, Investigation — each with its own [getting started guide](https://aix-framework.lei-tech.org/aix-toolkit/challenge-getting-started).",
      },
      {
        step_number: 5,
        detailed_help:
          "**Three sentences is plenty.** The goal isn't a dissertation on your relationship with AI — it's naming one thing about your own decision-making clearly enough that you can adjust.\n\nUseful framings:\n- \"I default to AI for X even when Y would be faster.\"\n- \"I avoid AI for Z, but my reasons are weaker than I thought.\"\n- \"I make the call on stakes/privacy/accuracy, but I couldn't actually say what my rule is.\"\n\nFor the broader framing: [Principled Innovation](https://aix-framework.lei-tech.org/principled-innovation) has ASU's values-based approach to these decisions.",
      },
    ],
  },

  // =========================================================================
  // Activity 37: Build Your Starter Kit (Skill 13 — ongoing learning)
  // =========================================================================
  {
    activity_id: 37,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "**Why three types of sources:** each gives you something the others can't.\n\n**Institutional** — what your employer actually sanctions, and what's expected of you. Start with the ASU hub at [lx.asu.edu/ai](https://lx.asu.edu/ai) (this course's home) or the [About this course](https://canvas.asu.edu/courses/157584/pages/about-this-course) and [How to use this course](https://canvas.asu.edu/courses/157584/pages/how-to-use-this-course) pages.\n\n**Practitioner or researcher** — someone who's using AI in their own teaching or research, not just covering it. A blog, newsletter, or LinkedIn feed works. Look for people whose actual work overlaps with yours.\n\n**Tool-focused** — sources that track when tools update, what's new, what's broken. Without one of these, you'll be a year behind on capabilities you could already use.",
      },
      {
        step_number: 2,
        detailed_help:
          "Bookmark them somewhere you'll actually check — a dedicated folder in your browser, a pinned tab, or an RSS reader if you use one.\n\nThe friction of finding a source later is exactly the thing that kills follow-through. Ten seconds of setup now saves the \"I should read that thing but where was it\" loop later.",
      },
      {
        step_number: 3,
        detailed_help:
          "**Read one thing from each, right now.** The activity works because you're doing it in-session, not bookmarking for later and never returning.\n\nYou're not trying to absorb everything — you're testing whether the source is actually worth your time. Some sources are great in theory but terrible in practice (paywalled, too dense, too hype-y). Better to find that out in 5 minutes than after a month of guilt-bookmarking.",
      },
      {
        step_number: 4,
        detailed_help:
          "**Two useful sentences per source:**\n\n1. What is it good for? (\"Weekly summary of AI tool updates — skim format, no deep analysis.\")\n2. One takeaway from today? (\"Microsoft Copilot just added X — worth trying next week.\")\n\nThe first helps you decide what to use each source for going forward. The second makes today's reading immediately useful.\n\nFor ongoing reference as you build your practice: the [Course Glossary of key terms](https://canvas.asu.edu/courses/157584/pages/look-up-key-terms-in-the-course-glossary-2), the [Quick Reference Cheat Sheet (PDF, p. 10)](https://drive.google.com/file/d/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-/view#page=10), and the [Support & Community page](https://lx.asu.edu/ai/community) are worth bookmarking alongside your three sources.",
      },
    ],
  },

  // =========================================================================
  // Activity 40: Ask AI About AI (Skill 14 — meta-learning)
  // =========================================================================
  {
    activity_id: 40,
    steps: [
      {
        step_number: 1,
        detailed_help:
          "Any general-purpose AI chat tool works. If you're not sure which to open, the **Suggest tools** button above has matched options, or ASU's [vetted tool list](https://ai.asu.edu/ai-tools) shows which ones have been cleared for enterprise use. [ASU's ChatGPT resources for faculty](https://canvas.asu.edu/courses/157584/pages/maximizing-teaching-efficacy-with-asus-chatgpt-resources) walks through how to access the ASU-specific environment if you haven't already.",
      },
      {
        step_number: 2,
        detailed_help:
          "**Why this works:** AI chat tools are trained on large amounts of text about using AI, including best-practices guides, cautionary posts, and tutorials. That means they're genuinely informed on the question \"how should someone use me?\" — at least at a conventional-wisdom level.\n\n**What this doesn't mean:** the AI is not an authority on itself. It gives you the aggregated consensus of what's been written about AI tools, which is usually reasonable, sometimes outdated, occasionally wrong. Treat the answer as \"a reasonable starting take,\" not \"ground truth.\"\n\nUse the prompt exactly as written — the \"brand new\" framing matters. It signals the AI to pitch for a beginner, not a prompt engineer.",
      },
      {
        step_number: 3,
        detailed_help:
          "**What to compare against:** your colleagues, articles you've read, things you've heard in training. Three patterns are common:\n\n- **Confirms what you've heard.** Good — that's shared consensus.\n- **Surfaces something new.** Worth investigating further — one data point isn't enough, but it's a lead.\n- **Contradicts what you've heard.** Most interesting. Could be that the AI is outdated, could be that the advice you heard elsewhere is outdated, could be that one source is aimed at a different use case.\n\nTwo solid overviews for comparing against: [Module 1 — Experimenting with GenAI at ASU](https://rise.articulate.com/share/3lU5J_haoXgNR9QKQORI67zuM2Qix_sv#/lessons/J4bNGWxtic5oznXuy5BC_gwfhfAMsE1A) and [Module 2 — Do you know what AI can do?](https://rise.articulate.com/share/fRP7fjoWsWuSXljLxc2dF011IycTdmdL#/lessons/_3dr-VqskB18C8sq3TPuSG2e-zUIxdTC).",
      },
      {
        step_number: 4,
        detailed_help:
          "**Why the follow-up matters:** the initial answer is the AI's pitch. The follow-up is where you find out whether it can hold up under questioning. Pick the specific thing it said that you want to probe.\n\nEffective follow-ups:\n- Ask for an example (\"What would that look like in practice for an instructor?\")\n- Push for specifics (\"You said 'be careful with data' — careful about what, specifically?\")\n- Challenge (\"A colleague told me the opposite — how would you respond?\")\n\nThe quality of your follow-up determines how much you get out of this exercise.",
      },
      {
        step_number: 5,
        detailed_help:
          "**Verify against a human or another source when:**\n\n- A specific claim affects how you'd act (use this tool, avoid that one, disclose here, don't disclose there).\n- Anything about policies — AI has no visibility into ASU's current stance.\n- Anything about specific tools' current capabilities — training cutoffs mean this info can be months out of date.\n\n**Trust the AI for:** the *shape* of advice — what categories of thinking to do, what questions to ask, where common pitfalls live. The framing tends to be solid even when specifics are off.\n\nTwo further resources worth bookmarking: [Learn Prompting](https://learnprompting.org) for a structured free tutorial, and [Google AI Essentials](https://grow.google/ai-essentials/) if you prefer a course format.",
      },
    ],
  },
];

async function run() {
  for (const { activity_id, steps } of updates) {
    for (const { step_number, detailed_help } of steps) {
      const { error } = await supabase
        .from("activity_guide_steps")
        .update({ detailed_help })
        .eq("activity_id", activity_id)
        .eq("step_number", step_number);
      if (error) {
        console.error(`A${activity_id} step ${step_number}: ${error.message}`);
      }
    }
    console.log(`Updated activity ${activity_id} (${steps.length} steps)`);
  }
  console.log("\n✅ Foundational teach pass v1 applied");
}

run();
