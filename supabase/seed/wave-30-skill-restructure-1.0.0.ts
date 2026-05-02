/**
 * wave-30-skill-restructure-1.0.0.ts
 *
 * Reshape the curriculum from Maynard's 14 skills into a 12-skill set:
 *   - merge 3 (Source verification) + 4 (Fact-checking) → new skill 15
 *     "Verify what AI gives you"
 *   - merge 6 (AI agents) + 8 (Visuals) + new technical-literacy
 *     content → new skill 16 "Build with AI: agents, visuals,
 *     mechanics"
 *   - merge 10 (AI literacy) + 12 (Intentional use) → new skill 17
 *     "Critical AI judgment"
 *   - new skill 18 "Bias and equity in AI" (gap fill)
 *
 * Skills 3, 4, 6, 8, 10, 12 stay in the database for historical
 * reference but is_active=false. The user-facing "Skill N" labels
 * use display_order, not raw id.
 *
 * Activity reassignment:
 *   - skill 15 (Verify): A7, A8, A12 stay; A9, A10, A11 retire
 *   - skill 16 (Build):  A22, A17, A18 stay; A16, A23, A24 retire
 *   - skill 17 (Judge):  A28, A35, A36 stay; A29, A30, A34 retire
 *   - skill 18 (Bias):   3 brand-new activities (B1, B2, B3) inserted
 *
 * Assessment: 6 questions for retired skills marked inactive; 4 new
 * questions inserted for new skills with their option sets.
 *
 * Display-order rationale (start active, build judgment, end with
 * sustaining practice):
 *   1. Iterative dialogue, 2. Tool choice, 3. Use AI to learn AI,
 *   4. Editing AI output, 5. Creative use, 6. Verify what AI gives
 *   you, 7. Analyze data with AI, 8. Build with AI, 9. Disclosure,
 *   10. Critical AI judgment, 11. Bias and equity, 12. Stay current.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type SkillSpec = {
  id: number;
  short_name: string;
  statement: string;
  bloom_phase_id: number;
  display_order: number;
  derivation_note: string;
};

const NEW_SKILLS: SkillSpec[] = [
  {
    id: 15,
    short_name: "Verify what AI gives you",
    statement:
      "I can verify AI-generated outputs — citations, factual claims, sources, and reasoning — using systematic checks before relying on them in my work.",
    bloom_phase_id: 5,
    display_order: 6,
    derivation_note:
      "Adapted by merging Maynard's Skills 3 (Source verification) and 4 (Fact-checking) into a single skill — they teach the same underlying move: don't trust AI output blindly.",
  },
  {
    id: 16,
    short_name: "Build with AI: agents, visuals, mechanics",
    statement:
      "I can build AI artifacts (agents, custom assistants, visuals) using ASU-supported tools, and I understand the technical mechanics underneath (tokens, file formats, prompt-injection risk) well enough to ship something defensible.",
    bloom_phase_id: 6,
    display_order: 8,
    derivation_note:
      "Adapted by merging Maynard's Skills 6 (AI agents) and 8 (Visuals) and adding the technical-literacy gap (tokens, markdown / structured formats, prompt-injection awareness). All three live closer together in real production work than the original split implied.",
  },
  {
    id: 17,
    short_name: "Critical AI judgment",
    statement:
      "I can hold a balanced position on when, where, and how to use AI — articulate trade-offs to colleagues, apply Principled Innovation to real decisions, and commit to a stance that's defensible.",
    bloom_phase_id: 6,
    display_order: 10,
    derivation_note:
      "Adapted by merging Maynard's Skills 10 (AI literacy / discuss possibilities and limitations) and 12 (Balance curiosity, care, clarity, intentionality). Both ask the user to take a thoughtful stance on AI — outward (10) and inward (12) — and the activities ladder cleanly together.",
  },
  {
    id: 18,
    short_name: "Bias and equity in AI",
    statement:
      "I can recognize bias in AI-generated outputs (gender, dialect, cultural, accessibility) and design workflow steps that catch it before AI artifacts reach students, colleagues, or the public.",
    bloom_phase_id: 3,
    display_order: 11,
    derivation_note:
      "New skill, not in Maynard's original 14. Bias recognition is touched in Skill 17 (Critical AI judgment) but no original skill teaches the specific pattern-recognition or workflow-design moves needed.",
  },
];

// display_order for the 8 kept Maynard skills.
const KEPT_SKILL_ORDER: Record<number, number> = {
  2: 1, // Iterative dialogue
  1: 2, // Tool choice
  14: 3, // Use AI to learn AI
  5: 4, // Editing AI output
  11: 5, // Creative use
  // 15 (Verify) → 6
  7: 7, // Analyze data with AI
  // 16 (Build) → 8
  9: 9, // Disclosure
  // 17 (Judgment) → 10
  // 18 (Bias) → 11
  13: 12, // Stay current
};

const RETIRED_SKILL_IDS = [3, 4, 6, 8, 10, 12] as const;

// ─────────────────────────────────────────────────────────────────
// Activity reassignment + retirement
// ─────────────────────────────────────────────────────────────────
const ACTIVITY_REASSIGN: { id: number; newSkillId: number }[] = [
  // skill 15 (Verify what AI gives you)
  { id: 7, newSkillId: 15 }, // Source Check Challenge (NF)
  { id: 8, newSkillId: 15 }, // Fabrication Detector (FI)
  { id: 12, newSkillId: 15 }, // RACCCA in Practice (IA)
  // skill 16 (Build with AI)
  { id: 22, newSkillId: 16 }, // Describe It, See It (NF)
  { id: 17, newSkillId: 16 }, // Design an Agent (FI)
  { id: 18, newSkillId: 16 }, // Build and Test a Simple Agent (IA)
  // skill 17 (Critical AI judgment)
  { id: 28, newSkillId: 17 }, // Three Things AI Can/Can't (NF)
  { id: 35, newSkillId: 17 }, // Decision Framework Draft (FI)
  { id: 36, newSkillId: 17 }, // Principled Innovation Case Study (IA)
];

const ACTIVITY_RETIRE_IDS = [9, 10, 11, 16, 23, 24, 29, 30, 34] as const;

// ─────────────────────────────────────────────────────────────────
// New bias activities (skill 18)
// ─────────────────────────────────────────────────────────────────
type NewActivity = {
  id: number;
  band: string;
  title: string;
  description: string;
  time_estimate: string;
  deliverable: string;
  value_add: string;
  objectives: string[];
  community_action: string;
  linked_phase_ids: number[];
  steps: { step_number: number; instruction: string; detailed_help?: string }[];
};

const BIAS_ACTIVITIES: NewActivity[] = [
  {
    id: 43,
    band: "New → Foundational",
    title: "Spot the Bias",
    description:
      "Ask AI to generate two outputs that should be equivalent — same achievements, same context, only the subject's name or background differs. Compare side-by-side and identify subtle differences in word choice, framing, or detail.",
    time_estimate: "25 min",
    deliverable:
      "A side-by-side comparison of the two AI-generated outputs with bias differences flagged and a one-paragraph reflection on what kind of bias surfaced.",
    value_add:
      "AI bias rarely shows up as obvious slurs; it shows up as subtle differences in tone, qualifications, and what gets emphasized. The first step to catching it in your work is seeing it in a controlled test where you know everything except the subject is the same.",
    objectives: [
      "Recognize subtle bias patterns in AI-generated text (word choice, qualifications, framing).",
      "Distinguish bias from random AI variation by running matched comparisons.",
      "Build a personal sense of when AI is and isn't appropriate for a given task.",
    ],
    community_action: "observation",
    linked_phase_ids: [3],
    steps: [
      {
        step_number: 1,
        instruction:
          "Pick a generative task that should produce equivalent outputs for different subjects. Capture the task and your two subjects below.",
        detailed_help:
          "**Good tasks for this exercise:** recommendation letter, performance summary, course feedback, intro paragraph for a speaker bio. Anything where the *content* about the subject should be the same and only the subject's identity differs.\n\n**Two matched subjects:** same achievements, same context, different names / backgrounds / attributes. Examples:\n• \"Sam Chen\" vs \"Mary Johnson\" (gender + ethnicity)\n• \"Dr. Patel\" vs \"Dr. Smith\" (gendered honorific assumptions, cultural names)\n• \"a 24-year-old\" vs \"a 58-year-old\" (age)\n\nDocument the achievements you'll attribute to both — the AI sees these the same; only the identity changes.",
      },
      {
        step_number: 2,
        instruction:
          "Ask the AI to produce the output for subject 1 in a fresh chat. Then in another fresh chat, ask for the same output for subject 2. Same achievements, same prompt — only the subject identity differs.",
        detailed_help:
          "**Fresh chats matter.** The AI's working memory in a single chat will start to align outputs across turns; you want truly independent generations to compare. Use Compare AI if available so you can run both prompts side by side in one interface.",
      },
      {
        step_number: 3,
        instruction:
          "Paste both outputs into the comparison workspace below — subject 1 on the left, subject 2 on the right.",
        detailed_help:
          "**What to look for as you read:** word choice differences (\"warm\" vs \"competent\"), qualifications mentioned (\"gentle\" vs \"professional\"), level of specificity, what gets praised vs taken for granted, what the AI proactively warns or hedges about.",
      },
      {
        step_number: 4,
        instruction:
          "Mark the differences. For each, note the bias dimension (gender, race, age, dialect, ability, etc.) and whether it's overt, subtle, or possibly noise.",
      },
      {
        step_number: 5,
        instruction:
          "Capture your reflection in the deliverable box at the bottom of this page. What did you find, and what does it tell you about using AI for this kind of task in your work?",
        detailed_help:
          "**The takeaway is the workflow change.** \"AI generates these well\" → use it. \"AI subtly biases against [group]\" → don't use it for high-stakes versions of this task without a bias-check pass (Skill 11 FI activity).",
      },
    ],
  },
  {
    id: 44,
    band: "Foundational → Intermediate",
    title: "Bias Check Pass",
    description:
      "Take a real AI workflow you use and add a bias-check pass: run the AI's output through a structured check before you ship it. Document what the check surfaces and decide whether to revise, adjust the prompt, or change tools.",
    time_estimate: "30 min",
    deliverable:
      "A documented bias-check pass for one workflow, with what it caught on a real run and your decision about how to act on it.",
    value_add:
      "A bias-check pass turns bias recognition from an after-the-fact catch into a routine workflow step. The cost is one extra prompt; the payoff is that whatever ships under your name has been examined.",
    objectives: [
      "Design a bias-check prompt tailored to your workflow's stakes and audience.",
      "Distinguish true bias signals from false-positive flags AI tends to over-produce.",
      "Decide between revising output, adjusting your original prompt, or pulling AI from the workflow.",
    ],
    community_action: "observation",
    linked_phase_ids: [3],
    steps: [
      {
        step_number: 1,
        instruction:
          "Pick a real AI workflow you use regularly. Capture the workflow + audience + risk profile below.",
        detailed_help:
          "**Examples to pick from:** drafting feedback notes for a class, generating quiz items, summarizing student survey responses, writing emails to colleagues, drafting course descriptions.\n\n**Risk profile matters.** A bias-check pass on internal-to-you drafting is lighter than one for student-facing artifacts.",
      },
      {
        step_number: 2,
        instruction:
          "Design a bias-check prompt tailored to your workflow. Capture it in the prompt sandbox below.",
        detailed_help:
          "**A useful bias-check prompt structure:**\n\n*\"Review the following [type of artifact] for potential bias against [list of groups relevant to your context — e.g., gender, dialect, ability status, cultural references]. For each potential issue, quote the specific phrase, name the bias dimension, and rate the severity (subtle / moderate / overt). Also flag where the artifact treats one group as default and others as exceptions. Do not rewrite — just identify.\"*\n\nSeparating identification from rewriting lets you decide what to act on instead of accepting the AI's autocorrect.",
      },
      {
        step_number: 3,
        instruction:
          "Run the original workflow on a real input. Then run the bias-check pass on the output. Document what the check surfaced.",
      },
      {
        step_number: 4,
        instruction:
          "Triage what the check found. For each flag: true signal (something you'd want to fix), false positive (the AI being overcautious), or noise (nothing actionable).",
        detailed_help:
          "**Bias-check AI tends to over-flag.** It will sometimes flag any mention of demographic categories as potential bias even when it's appropriate context. Your job is to triage; don't take its output as gospel any more than the original.",
      },
      {
        step_number: 5,
        instruction:
          "Decide your action. Revise this output? Adjust the original prompt? Pull AI out of this workflow? Capture in the deliverable box at the bottom of this page.",
      },
    ],
  },
  {
    id: 45,
    band: "Intermediate → Advanced",
    title: "Systematic Bias Audit",
    description:
      "Audit a real artifact (a class set of AI-assisted feedback, a curated reading list, a syllabus) for systematic bias. Use AI to help surface patterns you might miss, then verify each finding manually and write a short audit memo with revision recommendations.",
    time_estimate: "60 min",
    deliverable:
      "A short audit memo on a real artifact with findings (with verbatim evidence), bias dimensions, and a concrete revision plan.",
    value_add:
      "Personal bias-checks catch one piece at a time; a systematic audit catches patterns across a body of work that no single review would surface. Departments with one person who can run this audit are departments that course-correct before harm propagates.",
    objectives: [
      "Use AI to surface bias patterns across a corpus you couldn't manually scan.",
      "Verify AI's bias flags against the source — false positives are common.",
      "Write an audit memo that names patterns, evidence, and a defensible revision plan.",
    ],
    community_action: "lookbook",
    linked_phase_ids: [3, 6],
    steps: [
      {
        step_number: 1,
        instruction:
          "Pick the artifact you'll audit. Capture what it is, who produced it, and who consumes it below.",
        detailed_help:
          "**Good candidates:** a semester's worth of AI-assisted student feedback (de-identified), a course reading list, a syllabus, a set of recommendation letters, a department web page, an assessment rubric.\n\nThe artifact has to be substantial enough that patterns can emerge — usually 10+ similar items, or one long document with multiple sections.",
      },
      {
        step_number: 2,
        instruction:
          "Define the bias dimensions you'll audit for. Capture them below — be specific to this artifact's context.",
        detailed_help:
          "**Bias dimensions worth defining up front:**\n• Gender (in pronouns, qualifications used, examples chosen)\n• Race / ethnicity (named representation, dialect framing)\n• Age (assumptions about technology fluency, life-stage)\n• Ability (accessibility of language, examples, format)\n• Cultural / regional (whose references count as universal)\n• Linguistic (assumptions about reader's first language)\n\nNot every audit needs every dimension — pick the 2-4 most relevant to this artifact's audience.",
      },
      {
        step_number: 3,
        instruction:
          "Use AI to help surface patterns. Paste the prompt below into your AI tool with the artifact attached or pasted.",
        detailed_help:
          "**Why AI helps here.** A systematic audit across hundreds of feedback notes is exactly the kind of pattern-recognition AI is good at. Your job is to direct what to look for and verify what it returns.\n\n**What to expect:** AI will flag many things. Some will be real patterns; some will be coincidence; some will be the AI being overcautious. The verification in step 4 is where the real work is.",
      },
      {
        step_number: 4,
        instruction:
          "Verify each AI-flagged pattern manually against the source. False positives are common — confirm with verbatim evidence before keeping a finding.",
        detailed_help:
          "**The verification rule:** if you can't find verbatim evidence in the artifact for a flagged pattern, drop it from the audit. Audit memos that include unverified AI flags will fail review under any scrutiny.",
      },
      {
        step_number: 5,
        instruction:
          "Write the audit memo. Capture findings, verbatim evidence, and a concrete revision plan in the deliverable box at the bottom of this page.",
        detailed_help:
          "**Memo structure:**\n\n*Context.* What artifact, who produced it, who reads it.\n*Audit dimensions.* Which biases you looked for and why.\n*Findings.* For each, the pattern + verbatim evidence + bias dimension + severity.\n*Recommendation.* What to change, who owns the change, by when.\n\n**Audience matters.** A memo for the artifact's author is different from one for leadership; calibrate accordingly.",
      },
    ],
  },
];

// ─────────────────────────────────────────────────────────────────
// New assessment questions for the 4 new skills
// ─────────────────────────────────────────────────────────────────
type AssessmentQ = {
  id: number;
  skill_id: number;
  scenario: string;
  options: { key: string; text: string; level: string; score: number }[];
};

const NEW_QUESTIONS: AssessmentQ[] = [
  {
    id: 15,
    skill_id: 15,
    scenario:
      "An AI tool just produced a 2-paragraph summary on a topic in your field, with citations and several factual claims. You want to use it in a department report. What's your verification approach?",
    options: [
      {
        key: "A",
        text: "I trust it as written; AI tools are usually accurate.",
        level: "New",
        score: 0,
      },
      {
        key: "B",
        text: "I'd skim it for anything that obviously sounds wrong, then send.",
        level: "Foundational",
        score: 1,
      },
      {
        key: "C",
        text: "I'd verify each citation in Google Scholar and spot-check a couple of factual claims against primary sources.",
        level: "Intermediate",
        score: 2,
      },
      {
        key: "D",
        text: "I'd run it through a structured framework (citation verification, fact-check on every claim, source-quality assessment) before signing off.",
        level: "Advanced",
        score: 3,
      },
    ],
  },
  {
    id: 16,
    skill_id: 16,
    scenario:
      "Your team wants a small AI tool that drafts feedback notes for student reflections. Where do you start?",
    options: [
      {
        key: "A",
        text: "I wouldn't know where to begin.",
        level: "New",
        score: 0,
      },
      {
        key: "B",
        text: "I'd write a careful prompt and use it manually for each student's reflection.",
        level: "Foundational",
        score: 1,
      },
      {
        key: "C",
        text: "I'd design a system prompt with examples, set up custom instructions, and decide where humans need to review.",
        level: "Intermediate",
        score: 2,
      },
      {
        key: "D",
        text: "I'd build a configured agent in Create AI / a custom GPT / a Claude Project with system prompt, knowledge base in markdown, and human checkpoints, then stress-test it for prompt injection from student inputs.",
        level: "Advanced",
        score: 3,
      },
    ],
  },
  {
    id: 17,
    skill_id: 17,
    scenario:
      "A colleague proposes adopting AI for grading short-answer student responses in a 100-student course. How do you respond?",
    options: [
      {
        key: "A",
        text: "I'd defer to whatever the colleague decides.",
        level: "New",
        score: 0,
      },
      {
        key: "B",
        text: "I'd ask whether AI grading is accurate enough.",
        level: "Foundational",
        score: 1,
      },
      {
        key: "C",
        text: "I'd lay out the trade-offs across capability, fairness, privacy, and pedagogical impact, and propose a small pilot.",
        level: "Intermediate",
        score: 2,
      },
      {
        key: "D",
        text: "I'd apply the Principled Innovation framework (curiosity, care, clarity, intentionality), surface the tensions, and guide the team to a defensible position with safeguards.",
        level: "Advanced",
        score: 3,
      },
    ],
  },
  {
    id: 18,
    skill_id: 18,
    scenario:
      "You ask an AI to draft recommendation letters for two students with similar academic records but different demographic backgrounds. The drafts come back with subtly different word choices. What do you do?",
    options: [
      {
        key: "A",
        text: "I'd send them as-is — the AI knows what works.",
        level: "New",
        score: 0,
      },
      {
        key: "B",
        text: "I'd notice the differences and edit them to be more similar in tone.",
        level: "Foundational",
        score: 1,
      },
      {
        key: "C",
        text: "I'd identify the specific bias patterns, edit to neutralize them, and decide whether to use AI for this task again.",
        level: "Intermediate",
        score: 2,
      },
      {
        key: "D",
        text: "I'd add a bias-check pass to my standard AI workflow, document the findings, and share guidance with my team about when this AI use is and isn't appropriate.",
        level: "Advanced",
        score: 3,
      },
    ],
  },
];

const RETIRED_QUESTION_SKILL_IDS = [3, 4, 6, 8, 10, 12] as const;

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ── 1. Insert new skills ─────────────────────────────────────────
  for (const s of NEW_SKILLS) {
    const { error } = await sb.from("skills").upsert(
      {
        id: s.id,
        statement: s.statement,
        short_name: s.short_name,
        bloom_phase_id: s.bloom_phase_id,
        is_gap: false,
        is_active: true,
        display_order: s.display_order,
        derivation_note: s.derivation_note,
      },
      { onConflict: "id" }
    );
    if (error) console.error(`  x skill ${s.id}:`, error.message);
    else console.log(`✓ inserted skill ${s.id} (${s.short_name})`);
  }

  // ── 2. Set display_order on kept skills ─────────────────────────
  for (const [skillIdStr, order] of Object.entries(KEPT_SKILL_ORDER)) {
    const { error } = await sb
      .from("skills")
      .update({ display_order: order, is_active: true })
      .eq("id", parseInt(skillIdStr, 10));
    if (error) console.error(`  x skill ${skillIdStr}:`, error.message);
  }
  console.log(`✓ display_order set on ${Object.keys(KEPT_SKILL_ORDER).length} kept skills`);

  // ── 3. Mark retired skills inactive ─────────────────────────────
  for (const id of RETIRED_SKILL_IDS) {
    const note = (() => {
      switch (id) {
        case 3:
          return "Retired by merging into Skill 15 (Verify what AI gives you). The split between source-verification and fact-checking proved too thin to maintain in practice.";
        case 4:
          return "Retired by merging into Skill 15 (Verify what AI gives you). See note on Skill 3.";
        case 6:
          return "Retired by merging into Skill 16 (Build with AI). Agent-building joins visuals + technical literacy under one production-oriented skill.";
        case 8:
          return "Retired by merging into Skill 16 (Build with AI). See note on Skill 6.";
        case 10:
          return "Retired by merging into Skill 17 (Critical AI judgment). External discussion (10) and internal decision-making (12) are facets of the same critical-judgment skill.";
        case 12:
          return "Retired by merging into Skill 17 (Critical AI judgment). See note on Skill 10.";
        default:
          return "Retired in the 12-skill restructure.";
      }
    })();
    await sb
      .from("skills")
      .update({ is_active: false, display_order: null, derivation_note: note })
      .eq("id", id);
  }
  console.log(`✓ marked ${RETIRED_SKILL_IDS.length} skills inactive`);

  // ── 4. Reassign activities to new skills ────────────────────────
  for (const r of ACTIVITY_REASSIGN) {
    const { error } = await sb
      .from("level_up_activities")
      .update({ skill_id: r.newSkillId })
      .eq("id", r.id);
    if (error) console.error(`  x activity ${r.id}:`, error.message);
  }
  console.log(`✓ reassigned ${ACTIVITY_REASSIGN.length} activities`);

  // ── 5. Mark retired activities inactive ─────────────────────────
  for (const id of ACTIVITY_RETIRE_IDS) {
    await sb
      .from("level_up_activities")
      .update({ is_active: false })
      .eq("id", id);
  }
  console.log(`✓ marked ${ACTIVITY_RETIRE_IDS.length} activities inactive`);

  // ── 6. Insert new bias activities + their steps ─────────────────
  for (const a of BIAS_ACTIVITIES) {
    await sb
      .from("level_up_activities")
      .upsert(
        {
          id: a.id,
          skill_id: 18,
          band: a.band,
          title: a.title,
          description: a.description,
          time_estimate: a.time_estimate,
          deliverable: a.deliverable,
          linked_phase_ids: a.linked_phase_ids,
          value_add: a.value_add,
          objectives: a.objectives,
          community_action: a.community_action,
          extra_sources: [],
          is_active: true,
        },
        { onConflict: "id" }
      );
    // Wipe any old steps for this id (idempotent re-run safety) and
    // insert the new ones.
    await sb.from("activity_guide_steps").delete().eq("activity_id", a.id);
    for (const step of a.steps) {
      await sb.from("activity_guide_steps").insert({
        activity_id: a.id,
        step_number: step.step_number,
        instruction: step.instruction,
        detailed_help: step.detailed_help ?? null,
      });
    }
    console.log(`✓ inserted activity ${a.id} (${a.title}) + ${a.steps.length} steps`);
  }

  // ── 7. Mark retired assessment questions inactive ───────────────
  for (const skillId of RETIRED_QUESTION_SKILL_IDS) {
    await sb
      .from("assessment_questions")
      .update({ is_active: false })
      .eq("skill_id", skillId);
  }
  console.log(`✓ marked ${RETIRED_QUESTION_SKILL_IDS.length} assessment questions inactive`);

  // ── 8. Insert new assessment questions + their options ──────────
  for (const q of NEW_QUESTIONS) {
    await sb
      .from("assessment_questions")
      .upsert(
        {
          id: q.id,
          skill_id: q.skill_id,
          scenario: q.scenario,
          is_active: true,
        },
        { onConflict: "id" }
      );
    // Re-insert options idempotently
    await sb.from("assessment_options").delete().eq("question_id", q.id);
    for (const opt of q.options) {
      await sb.from("assessment_options").insert({
        question_id: q.id,
        option_key: opt.key,
        option_text: opt.text,
        level_label: opt.level,
        score: opt.score,
      });
    }
    console.log(`✓ inserted question ${q.id} + ${q.options.length} options`);
  }

  console.log("\nDone.");
}

main();
