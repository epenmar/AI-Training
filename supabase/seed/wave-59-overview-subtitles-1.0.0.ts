/**
 * wave-59-overview-subtitles-1.0.0.ts
 *
 * Phase 2 of the alignment plan. Rewrite every active activity's
 * description so that the core summary:
 *   1. starts with "Overview:"
 *   2. is written in future tense ("In this activity, you will…")
 *
 * The existing "Optional extension:" block is preserved verbatim —
 * this wave only touches the headline summary. Where the existing
 * summary had small count contradictions (A6 said "two angles" but
 * the steps use three; A18 said "one input" but tests three), the
 * Overview is written against what the steps actually do.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

// Keyed by activity_id. Each value is the new core summary (no
// trailing whitespace, no "Optional extension:" block — that gets
// re-attached from the current DB row).
const OVERVIEWS: Record<number, string> = {
  1: "Overview: In this activity, you will explore three different AI chat tools by giving each one the same simple prompt and comparing what comes back.",

  2: "Overview: In this activity, you will work through three real teaching scenarios. For each, you'll pick the AI tool you'd recommend AND one you'd avoid — with reasons for both. You'll test one scenario for real, revise the matrix, then run it through two different slide or image AIs to see which produces the better visual for this kind of comparison.",

  3: "Overview: In this activity, you will audit one AI tool your department is considering. You'll check three things — VITRA status, what it does with your data, and whether it's actually good at the task you'd use it for — then have AI draft a one-slide audit card from your verified notes.",

  4: "Overview: In this activity, you will have a five-turn back-and-forth conversation with an AI tool on a topic you know well. After each AI response you'll ask a follow-up question rather than starting a new topic, to feel how the conversation builds across turns.",

  5: "Overview: In this activity, you will ask AI to brainstorm five ideas for a course activity, then deliberately push it off its initial direction — by assigning it a contrarian perspective, adding a constraint (\"no technology allowed\"), or asking what someone who disagrees with all of its ideas would suggest.",

  6: "Overview: In this activity, you will brainstorm the same problem from three contrasting angles — asking AI as a student, then as a skeptical colleague, then through a Tree-of-Thought prompt that forces parallel reasoning paths. You'll synthesize across all three angles to see which ideas only emerged from one of them.",

  7: "Overview: In this activity, you will ask an AI tool to recommend three articles on a topic you already know well. For each one, you'll search for it in Google Scholar (or another peer-reviewed index) and note which sources are real and which aren't.",

  8: "Overview: In this activity, you will ask AI to write a paragraph with citations on a topic in your field, then verify every claim — does the article exist, and does it actually say what the AI claims? You'll produce a visually annotated version of the paragraph with green / yellow / red markup.",

  12: "Overview: In this activity, you will take a real piece of AI-generated content you've used and run it through the RACCCA framework (Relevance, Accuracy, Currency, Credibility, Coverage, Audience), scoring each dimension with evidence. You'll produce a six-cell scorecard with a final verdict: use as-is, revise, or discard.",

  13: "Overview: In this activity, you will ask AI to draft a short email or announcement for a real task you have. You'll read it aloud, highlight every sentence that doesn't sound like you, and rewrite those parts by hand.",

  14: "Overview: In this activity, you will paste a sample of your own writing and ask AI to describe your style, then have it redraft a short piece in that voice. You'll fix what's still off by hand and produce a single comparison visual showing the three versions and where AI fell short.",

  15: "Overview: In this activity, you will use a multi-pass refinement workflow — generate a draft, ask AI to critique it against criteria you set, ask it to revise, then make your own final edits. You'll compare a small slice of the original to the same slice of your final accepted version and highlight what changed.",

  17: "Overview: In this activity, you will pick a repetitive multi-step workflow from your role and map it as an agent blueprint — Goal, Trigger, Steps (each tagged Me / AI / Either), Decisions, Human checkpoints, Tools, and Risks — using the in-page builder pinned to the right. This activity is the paper design; you won't build the agent yet.",

  18: "Overview: In this activity, you will take an agent design and turn it into a working agent on a platform that supports persistent instructions or custom agents. You'll test it across three inputs — clean, edge case, and broken — and capture a screen recording or screenshots of the agent in action.",

  19: "Overview: In this activity, you will take a simple, non-sensitive dataset (e.g., course enrollments by semester, a public dataset) and ask AI to describe what it sees — trends, outliers, summary statistics. Then you'll spot-check the AI's claims against the raw data.",

  20: "Overview: In this activity, you will take de-identified open-ended responses (or use the synthetic CSV linked in step 1), read them yourself first, and capture 3-5 themes on your own. Then you'll ask AI to cluster the same responses and place your themes against AI's themes in a Venn — the differences are where the real findings live.",

  21: "Overview: In this activity, you will design a five-gate privacy-first workflow for analyzing student data with AI — de-identify, verify the tool is approved, prompt, review the output, log the run. You'll leave with a reusable checklist a colleague could pick up and follow.",

  22: "Overview: In this activity, you will pick a concept you teach and describe it to an AI image or diagram tool. You'll see what it produces and note what's usable as-is versus what needs human correction before it's ready to use with learners.",

  25: "Overview: In this activity, you will locate ASU's current policy on AI disclosure for faculty work and the disclosure policy for one journal or funder in your field. You'll write a one-sentence summary of each and note how they differ.",

  26: "Overview: In this activity, you will draft three different AI disclosure statements for three contexts — a syllabus, a conference presentation, and a grant proposal. Each statement will describe what AI was used for and how the content was verified.",

  27: "Overview: In this activity, you will sketch a short decision tree for AI disclosure — what type of work, what audience, what level of disclosure — keeping it to 4-5 branches. You'll then use AI to clean it into a visual flowchart your team could actually pick up and use.",

  28: "Overview: In this activity, you will predict three things you think AI can do well and three things you think it can't, based on what you've seen so far. Then you'll test each prediction by actually trying it with an AI tool and notice where your mental model was off.",

  31: "Overview: In this activity, you will take a routine task from your work (writing a meeting agenda, drafting a status email) and ask AI to do it in an unexpected way — as a choose-your-own-adventure, a poem, a set of interview questions. You'll see what happens when you give AI creative latitude and notice which parts of the unusual output are actually useful.",

  32: "Overview: In this activity, you will take one existing assignment and use AI to generate three creative alternatives that meet the same learning objective differently — at least one treating AI as a student-facing tool. You'll pick your favorite and use AI to draft the actual student-facing assignment description page.",

  33: "Overview: In this activity, you will sketch a new learning activity that couldn't exist without AI — not a traditional task with AI bolted on. You'll use AI to draft a visual concept card showing the idea, the learning objective, and how AI is structurally essential, and you'll propose a Canvas-embeddable artifact so the design ships as something students can actually touch.",

  35: "Overview: In this activity, you will write a personal decision framework for when you will and won't use AI. You'll articulate the factors you consider, where the line falls between \"helpful shortcut\" and \"I should do this myself,\" and include at least one ethical consideration and one practical one.",

  36: "Overview: In this activity, you will pick one real AI use case from your work and apply ASU's Principled Innovation framework — naming the stakeholders, the tension between curiosity and care, and the intent. You'll use AI to draft a visual stakeholder map and propose a path forward you could defend to a colleague.",

  37: "Overview: In this activity, you will find and bookmark three reliable sources for AI in education — one institutional (e.g., ASU's AI hub), one practitioner or researcher, and one tool-focused. You'll read one item from each as you build a personal starter kit you can sustain.",

  38: "Overview: In this activity, you will pull five recent AI articles or posts from different sources. For each, you'll write a one-sentence verdict — hype or substance — and assemble a five-item visual scorecard you could paste into a team channel.",

  39: "Overview: In this activity, you will build an AI agent that auto-curates AI development news for your team and pushes a fresh issue into Coda, Google Docs, Notion, or your destination of choice on a cadence you set (daily, weekly, biweekly). You'll use AI itself to walk you through the integration path, because every tool combo has a different setup.",

  40: "Overview: In this activity, you will open an AI tool and ask it: \"I'm brand new to AI. What are the three most important things I should understand before I start using you for work?\" You'll read the answer critically and compare it against what you've already heard from colleagues, training, or articles.",

  41: "Overview: In this activity, you will pick an AI feature you haven't tried (uploading a document, using custom instructions, creating a custom agent) and ask the AI itself to teach you how to use it step by step. You'll follow its directions and evaluate where they broke down — skipped steps, wrong UI, vague pointers.",

  42: "Overview: In this activity, you will sketch a reusable five-step protocol for learning any new AI capability — ask AI to explain it, get a worked example, try it on a low-stakes task, ask AI to evaluate your attempt, cross-check against real docs. Then you'll stress-test the protocol on something genuinely unfamiliar.",

  43: "Overview: In this activity, you will ask AI to generate two outputs that should be equivalent — same achievements, same context, only the subject's name or background differs. You'll compare them side-by-side and identify subtle differences in word choice, framing, or detail.",

  44: "Overview: In this activity, you will take a real AI workflow you already use and add a bias-check pass — running the AI's output through a structured check before you ship it. You'll triage what the check surfaces and decide whether to revise the output, adjust the prompt, or switch tools.",

  45: "Overview: In this activity, you will audit a real artifact — a class set of AI-assisted feedback, a curated reading list, a syllabus — for systematic bias. You'll use AI to surface patterns you might miss, verify each finding manually against the source, and write a short audit memo with revision recommendations.",
};

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data: activities } = await sb
    .from("level_up_activities")
    .select("id, title, description")
    .eq("is_active", true)
    .order("id");
  if (!activities) throw new Error("no activities");

  let updated = 0;
  let missing = 0;
  for (const a of activities) {
    const overview = OVERVIEWS[a.id];
    if (!overview) {
      console.warn(`(skip) A${a.id} ${a.title} — no Overview defined`);
      missing++;
      continue;
    }
    // Preserve the existing "Optional extension:" block verbatim. The
    // page renders the extension as a separate callout when it's split
    // on "\n\nOptional extension: ".
    const current = a.description ?? "";
    const extIdx = current.indexOf("\n\nOptional extension:");
    const extensionBlock = extIdx >= 0 ? current.slice(extIdx) : "";
    const next = overview + extensionBlock;
    if (next === current) {
      // No change needed (already in the Overview format somehow).
      continue;
    }
    await sb
      .from("level_up_activities")
      .update({ description: next })
      .eq("id", a.id);
    updated++;
    console.log(`✓ A${a.id} — ${a.title}`);
  }
  console.log(`\nUpdated: ${updated}.  Skipped (no Overview defined): ${missing}.`);
}

main();
