/**
 * wave-6-ia-interactives-1.0.0.ts
 *
 * Deeper IA pass. Every step where the learner is asked to author,
 * draft, score, or experiment now has an in-page interactive so the
 * work happens in the activity rather than in a side document.
 *
 * Conventions:
 *   - text_list_entry for templated sections (one box per section).
 *   - prompt_sandbox for steps that hand the learner a starter prompt.
 *   - Storage keys are scoped per (activity, purpose) so sibling steps
 *     can read back the same data when useful.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type StepInteractive = {
  activityId: number;
  stepNumber: number;
  type: string;
  data: unknown;
};

const interactives: StepInteractive[] = [
  // ── Activity 3: Tool Audit & Recommendation Brief ────────────────
  // Step 6: write the one-page brief. Sections inline.
  {
    activityId: 3,
    stepNumber: 6,
    type: "text_list_entry",
    data: {
      storageKey: "activity-3-brief",
      prompt:
        "Draft your one-page brief here. Each section saves in your browser; copy the final into the deliverable box when ready.",
      groups: [
        { id: "purpose", label: "Purpose", placeholder: "Why this audit; who it's for", count: 1 },
        { id: "tool", label: "Tool evaluated", placeholder: "Name, vendor, what category it sits in", count: 1 },
        { id: "vitra", label: "VITRA status", placeholder: "Approved / Under review / Not submitted; what this means", count: 1 },
        { id: "strengths", label: "Strengths (with evidence)", placeholder: "Two or three, each with a specific test result", count: 3 },
        { id: "risks", label: "Risks (with evidence)", placeholder: "Two or three, each with a specific finding", count: 3 },
        { id: "rec", label: "Recommendation", placeholder: "Adopt / Pilot / Wait / Reject — and why", count: 1 },
      ],
    },
  },

  // ── Activity 6: Structured Divergent Brainstorm ──────────────────
  {
    activityId: 6,
    stepNumber: 2,
    type: "prompt_sandbox",
    data: {
      starter:
        "You are a college student taking [course]. What assessment format would challenge you the most and help you learn, even if you had access to AI? Give me 3-5 options with a sentence on the learning each one preserves.",
      hint: "Edit [course] to your specific course. Paste into your AI of choice and copy the output into Round 1 of your brainstorm doc.",
    },
  },
  {
    activityId: 6,
    stepNumber: 3,
    type: "prompt_sandbox",
    data: {
      starter:
        "You are a faculty member who believes AI makes traditional assessments meaningless. What would you propose instead, and what are the biggest risks of that approach? Give me 3-5 alternatives with the trade-off named for each.",
      hint: "Run this in a fresh chat, not as a follow-up to step 2. Different chat = different anchor.",
    },
  },
  {
    activityId: 6,
    stepNumber: 4,
    type: "prompt_sandbox",
    data: {
      starter:
        "Generate three completely independent approaches to redesigning a midterm assessment for [course] in the age of AI. For each approach, reason through the design logic step by step before proposing the assessment. The three approaches should share no structural similarities.",
      hint: "Tree of Thought = three reasoning paths in parallel. Edit [course] before sending.",
    },
  },
  {
    activityId: 6,
    stepNumber: 6,
    type: "text_list_entry",
    data: {
      storageKey: "activity-6-shortlist",
      prompt:
        "Synthesize: 2-3 ideas worth pursuing, with the rationale for each. Save here, copy to the deliverable when ready.",
      groups: [
        {
          id: "shortlist",
          label: "Shortlist (2-3 ideas, each with rationale)",
          placeholder: "Idea + which angle surfaced it + why it's worth piloting",
          count: 3,
        },
      ],
    },
  },

  // ── Activity 9: AI-Assisted Research Workflow ────────────────────
  {
    activityId: 9,
    stepNumber: 4,
    type: "text_list_entry",
    data: {
      storageKey: "activity-9-gates",
      prompt:
        "Document at each verification gate. Five gates total, what you caught at each.",
      groups: [
        { id: "gate1", label: "Gate 1: source list verification", placeholder: "Sources fabricated / partial / clean. Counts.", count: 1 },
        { id: "gate2", label: "Gate 2: existence check (Scholar lookup)", placeholder: "How many existed; how many didn't", count: 1 },
        { id: "gate3", label: "Gate 3: abstract verification", placeholder: "AI's read vs. actual abstract — discrepancies", count: 1 },
        { id: "gate4", label: "Gate 4: synthesis check", placeholder: "Claims AI made about source content; which ones held up", count: 1 },
        { id: "gate5", label: "Gate 5: cross-source claims", placeholder: "Connections AI proposed; which were grounded vs. invented", count: 1 },
      ],
    },
  },

  // ── Activity 12: RACCCA in Practice ──────────────────────────────
  // Steps 3-8 are the per-dimension scorings. One combined widget on
  // step 9 captures all six in a single saved table.
  {
    activityId: 12,
    stepNumber: 9,
    type: "text_list_entry",
    data: {
      storageKey: "activity-12-raccca",
      prompt:
        "Capture your verdict per RACCCA dimension. Score (Strong/Adequate/Weak) plus the specific evidence.",
      groups: [
        { id: "rel", label: "Relevance", placeholder: "Strong/Adequate/Weak + evidence", count: 1 },
        { id: "acc", label: "Accuracy", placeholder: "Strong/Adequate/Weak + what you verified", count: 1 },
        { id: "cur", label: "Currency", placeholder: "Strong/Adequate/Weak + dates checked", count: 1 },
        { id: "cred", label: "Credibility", placeholder: "Strong/Adequate/Weak + sources assessed", count: 1 },
        { id: "cov", label: "Coverage", placeholder: "Strong/Adequate/Weak + what's missing", count: 1 },
        { id: "aud", label: "Audience", placeholder: "Strong/Adequate/Weak + read mismatch", count: 1 },
        { id: "verdict", label: "Final verdict", placeholder: "Use as-is / Revise / Discard — and why", count: 1 },
      ],
    },
  },

  // ── Activity 15: The Refinement Loop ─────────────────────────────
  // Pass 1, Pass 2 (self-critique), Pass 3 (revise) all get sandboxes
  // that hand the learner the prompt to use.
  {
    activityId: 15,
    stepNumber: 2,
    type: "prompt_sandbox",
    data: {
      starter:
        "Write a [length] [piece type] for [audience]. Purpose: [purpose]. Tone: [tone]. Key points to cover: [bullets]. Length cap: [N] words.",
      hint: "Fill in each bracket before sending. The square brackets remove the AI's freedom to invent context you haven't given it.",
    },
  },
  {
    activityId: 15,
    stepNumber: 3,
    type: "prompt_sandbox",
    data: {
      starter:
        "Critique the draft below against these criteria: [criteria — e.g., specificity, tone, logical flow, brevity, accuracy]. List what's strong and what needs work. Be specific. Don't rewrite yet.\n\nDraft:\n\n[paste the draft from pass 1]",
      hint: "Paste the pass-1 draft into the [paste] slot, edit [criteria] to the qualities that matter for this piece.",
    },
  },
  {
    activityId: 15,
    stepNumber: 4,
    type: "prompt_sandbox",
    data: {
      starter:
        "Revise the draft based on your own critique above. Keep what's strong. Address the weaknesses you named. Stay within [length].",
      hint: "Same chat as step 3, so the AI has its critique in context. The constraint reminder keeps the revision tight.",
    },
  },

  // ── Activity 18: Build and Test a Simple Agent ───────────────────
  {
    activityId: 18,
    stepNumber: 2,
    type: "text_list_entry",
    data: {
      storageKey: "activity-18-system-prompt",
      prompt:
        "Author the system prompt here. Each section is one block; copy them together into your platform's system-prompt field.",
      groups: [
        { id: "goal", label: "Goal (one sentence)", placeholder: "What this agent exists to do", count: 1 },
        { id: "steps", label: "Steps the agent should take", placeholder: "Numbered, in order", count: 5 },
        { id: "inputs", label: "Inputs to expect", placeholder: "What kinds of inputs you'll feed it", count: 3 },
        { id: "refuse", label: "Refusals (what it shouldn't do)", placeholder: "Cases the agent should decline", count: 3 },
      ],
    },
  },
  {
    activityId: 18,
    stepNumber: 3,
    type: "text_list_entry",
    data: {
      storageKey: "activity-18-test-cases",
      prompt:
        "Three test inputs covering clean, edge, and broken cases.",
      groups: [
        { id: "clean", label: "Clean case (baseline)", placeholder: "Typical input you expect", count: 1 },
        { id: "edge", label: "Edge case (boundary)", placeholder: "Unusual but plausible input", count: 1 },
        { id: "broken", label: "Broken case (deliberate)", placeholder: "Input that violates the agent's assumptions", count: 1 },
      ],
    },
  },

  // ── Activity 21: Privacy-First Data Analysis Workflow ────────────
  {
    activityId: 21,
    stepNumber: 6,
    type: "text_list_entry",
    data: {
      storageKey: "activity-21-audit-template",
      prompt:
        "Audit-log template. Save it as the starting point you'd hand a colleague.",
      groups: [
        { id: "deid", label: "De-identification steps", placeholder: "Names, IDs, course-specific identifiers, free-text scan…", count: 4 },
        { id: "tool", label: "Tool-approval verification", placeholder: "VITRA-cleared? Tool, date verified, link to status", count: 1 },
        { id: "prompt", label: "Prompt template", placeholder: "Exact wording, with placeholders for the data", count: 1 },
        { id: "review", label: "Output review checklist", placeholder: "What to verify against the original data", count: 4 },
        { id: "log", label: "Audit-log fields", placeholder: "Date, dataset, tool, prompt, decisions, signed-off-by…", count: 6 },
      ],
    },
  },

  // ── Activity 24: Visual Communication Audit ──────────────────────
  {
    activityId: 24,
    stepNumber: 6,
    type: "text_list_entry",
    data: {
      storageKey: "activity-24-audit-checklist",
      prompt:
        "Per-visual audit checklist. Capture what you found and the corrections you made.",
      groups: [
        { id: "labels", label: "Label / data accuracy", placeholder: "What was wrong; how you fixed it", count: 3 },
        { id: "spatial", label: "Spatial relationships", placeholder: "Where the visual implied something it shouldn't", count: 3 },
        { id: "mislead", label: "Could-mislead test (5-second glance)", placeholder: "What a colleague would walk away believing", count: 1 },
        { id: "contrast", label: "Color contrast (WCAG)", placeholder: "Pass / fail; tool used; pairs that failed", count: 1 },
        { id: "alt", label: "Alt text / text alternative", placeholder: "What the visual communicates that needs to be in alt text", count: 1 },
        { id: "color", label: "Information beyond color", placeholder: "Where color alone carried meaning; how you fixed it", count: 1 },
      ],
    },
  },

  // ── Activity 27: Disclosure Decision Tree ────────────────────────
  {
    activityId: 27,
    stepNumber: 4,
    type: "text_list_entry",
    data: {
      storageKey: "activity-27-endpoints",
      prompt:
        "Endpoint definitions. Each endpoint is a definite action a team member can take.",
      groups: [
        { id: "ep1", label: "Endpoint 1", placeholder: "Action + when this branch lands here", count: 1 },
        { id: "ep2", label: "Endpoint 2", placeholder: "Action + when this branch lands here", count: 1 },
        { id: "ep3", label: "Endpoint 3", placeholder: "Action + when this branch lands here", count: 1 },
        { id: "ep4", label: "Endpoint 4", placeholder: "Action + when this branch lands here", count: 1 },
        { id: "ep5", label: "Endpoint 5", placeholder: "Action + when this branch lands here", count: 1 },
      ],
    },
  },

  // ── Activity 30: Lead a Discussion ───────────────────────────────
  {
    activityId: 30,
    stepNumber: 2,
    type: "text_list_entry",
    data: {
      storageKey: "activity-30-talking-points",
      prompt:
        "Talking points (3-4) covering capability, limitation, bias, privacy, pedagogy. Each one short, with a concrete example.",
      groups: [
        { id: "capability", label: "Capability — what AI does well", placeholder: "Plain claim + one specific example", count: 1 },
        { id: "limitation", label: "Limitation — what AI does poorly", placeholder: "Plain claim + one specific failure", count: 1 },
        { id: "bias", label: "Bias / risk", placeholder: "Specific bias named + where it shows up", count: 1 },
        { id: "privacy", label: "Privacy / data", placeholder: "What data goes where + the institutional bar", count: 1 },
        { id: "pedagogy", label: "Pedagogical impact", placeholder: "Where it helps learning; where it short-circuits learning", count: 1 },
      ],
    },
  },
  {
    activityId: 30,
    stepNumber: 3,
    type: "text_list_entry",
    data: {
      storageKey: "activity-30-objections",
      prompt:
        "Anticipated objections + your response to each. Three to five is enough.",
      groups: [
        { id: "obj", label: "Objection / Response", placeholder: "Objection on top, your response below; one per box", count: 4 },
      ],
    },
  },

  // ── Activity 33: Design a Novel AI Learning Experience ───────────
  {
    activityId: 33,
    stepNumber: 4,
    type: "text_list_entry",
    data: {
      storageKey: "activity-33-design",
      prompt:
        "Activity design. Sections that make this buildable.",
      groups: [
        { id: "objective", label: "Learning objective", placeholder: "What students should be able to do after this activity", count: 1 },
        { id: "ai-role", label: "How AI is used (structurally)", placeholder: "Where AI is essential, not bolted-on", count: 1 },
        { id: "instructions", label: "Student-facing instructions", placeholder: "What students do, in order; how to handle AI failures", count: 5 },
        { id: "build-list", label: "ID build list", placeholder: "Prompts to write, system prompts, rubric, exemplars, troubleshooting…", count: 5 },
        { id: "rubric", label: "Evaluation criteria", placeholder: "Rewards what AI can't do for students", count: 3 },
        { id: "premortem", label: "Pre-mortem (likely failure modes)", placeholder: "How the activity goes wrong + how you'd notice", count: 3 },
      ],
    },
  },

  // ── Activity 36: Principled Innovation Case Study ────────────────
  {
    activityId: 36,
    stepNumber: 3,
    type: "text_list_entry",
    data: {
      storageKey: "activity-36-pi",
      prompt:
        "PI analysis: how does this case look through each principle?",
      groups: [
        { id: "curiosity", label: "Curiosity", placeholder: "What's the case asking us to explore?", count: 1 },
        { id: "care", label: "Care", placeholder: "Who's affected; what protections matter", count: 1 },
        { id: "clarity", label: "Clarity", placeholder: "What's the trade-off, named explicitly", count: 1 },
        { id: "intentionality", label: "Intentionality", placeholder: "What deliberate choice are we making (vs. drift)", count: 1 },
        { id: "tension", label: "Tension named", placeholder: "Where two principles pull against each other", count: 1 },
      ],
    },
  },

  // ── Activity 39: Curate a Team Brief ─────────────────────────────
  {
    activityId: 39,
    stepNumber: 2,
    type: "text_list_entry",
    data: {
      storageKey: "activity-39-brief",
      prompt:
        "Three to five items. Each one: source, plain-language summary, who it matters to.",
      groups: [
        { id: "items", label: "Brief items", placeholder: "[Source] — [2-sentence summary] — Relevant to: [tag]", count: 5 },
        { id: "trythis", label: "Try-this action item", placeholder: "One small thing the team can do in 10 minutes", count: 1 },
      ],
    },
  },

  // ── Activity 42: Meta-Learning Protocol ──────────────────────────
  {
    activityId: 42,
    stepNumber: 1,
    type: "text_list_entry",
    data: {
      storageKey: "activity-42-protocol",
      prompt:
        "Your reusable five-step protocol. Edit each step to your style; you'll test it on something unfamiliar in the next steps.",
      groups: [
        { id: "step1", label: "Step 1: ask AI to explain", placeholder: "Prompt template you'll use", count: 1 },
        { id: "step2", label: "Step 2: ask for an example", placeholder: "Prompt template you'll use", count: 1 },
        { id: "step3", label: "Step 3: try it yourself", placeholder: "How you'll define a low-stakes attempt", count: 1 },
        { id: "step4", label: "Step 4: ask AI to evaluate", placeholder: "Prompt template you'll use", count: 1 },
        { id: "step5", label: "Step 5: cross-check docs", placeholder: "Where you'll go for ground truth", count: 1 },
      ],
    },
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  for (const it of interactives) {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({ interactive_type: it.type, interactive_data: it.data })
      .eq("activity_id", it.activityId)
      .eq("step_number", it.stepNumber);
    if (error)
      console.error(`  x ${it.activityId}/${it.stepNumber}:`, error.message);
    else console.log(`✓ ${it.activityId}/${it.stepNumber}`);
  }
  console.log(`\nDone — ${interactives.length} IA interactives added.`);
}

main();
