/**
 * wave-24-throughline-sweep-1.0.0.ts
 *
 *   1. Activity 6 step 6: switch from text_list_entry to a
 *      ShortlistTable that pre-populates the Idea column from
 *      step 5's three rounds (read-only mirror), with editable
 *      Rationale tied to the step-1 problem.
 *
 *   2. Throughline-tightening sweep on activities where step 1
 *      defines context (a problem / dataset / audience / case)
 *      that subsequent steps reference. Each gets a step-1
 *      text_list_entry so the context is captured in-page; later
 *      steps' instructions and detailed_help reference "what you
 *      defined in step 1" explicitly. Activities touched: 9, 12,
 *      14, 17, 20, 21, 23, 24, 27, 30, 32, 33, 36, 39.
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

const ctxBox = (
  storageKey: string,
  prompt: string,
  groups: { id: string; label: string; placeholder: string; count?: number }[]
) => ({
  interactiveType: "text_list_entry" as const,
  interactiveData: {
    storageKey,
    prompt,
    groups: groups.map((g) => ({ ...g, count: g.count ?? 1 })),
  },
});

const patches: StepPatch[] = [
  // ────────────────────────────────────────────────────────────────
  // Activity 6 step 6: ShortlistTable mirroring step 5's 3 rounds
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 6,
    stepNumber: 6,
    instruction:
      "Synthesize across the three rounds in step 5. Each row below mirrors one round's output; add the rationale tying that idea to the step-1 problem. Copy your final shortlist into the deliverable box at the bottom of the page when ready.",
    interactiveType: "shortlist_table",
    interactiveData: {
      sourceStorageKey: "activity-6-rounds",
      storageKey: "activity-6-shortlist",
      prompt:
        "Three rows, one per angle. Idea pre-fills from step 5; you write the rationale.",
      ideaColumnLabel: "Idea (from step 5)",
      angleColumnLabel: "Angle",
      rationaleColumnLabel: "Rationale (tied to step 1)",
      rows: [
        {
          id: "r1",
          angleLabel: "Student perspective",
          sourceGroupId: "round1",
        },
        {
          id: "r2",
          angleLabel: "Skeptic perspective",
          sourceGroupId: "round2",
        },
        {
          id: "r3",
          angleLabel: "Tree of Thought",
          sourceGroupId: "round3",
        },
      ],
    },
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 9 (Research Workflow) — step 1 captures research question
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 9,
    stepNumber: 1,
    instruction:
      "Define a research question you're actively working on and capture it below. The workflow you design in step 2 and run in step 4 is built around this exact question.",
    ...ctxBox("activity-9-question", "The question you'll work on for the rest of this activity.", [
      {
        id: "question",
        label: "Your research question",
        placeholder:
          "e.g., How do mid-career faculty adapt assessment design when students openly use AI?",
      },
    ]),
  },
  {
    activityId: 9,
    stepNumber: 4,
    instruction:
      "Run the workflow on the question you defined in step 1. At each gate, document what you caught (fabrications, misrepresentations, missing nuance).",
  },
  {
    activityId: 9,
    stepNumber: 5,
    instruction:
      "Write up where AI added value (speed, breadth, connections you missed) and where it introduced risk against your step-1 question. Capture this in the deliverable box at the bottom of this page.",
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 12 (RACCCA) — step 1 captures the AI content being evaluated
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 12,
    stepNumber: 1,
    instruction:
      "Identify the AI-generated content you'll evaluate, and capture it (or a link to it) below. Steps 3-9 each apply one RACCCA dimension to this exact content.",
    ...ctxBox("activity-12-content", "Lock in the artifact you're evaluating.", [
      {
        id: "content",
        label: "Title or short description",
        placeholder: "e.g., AI-drafted department blurb on online learning",
      },
      {
        id: "where",
        label: "Where the content lives",
        placeholder: "Doc URL, snippet, or pasted excerpt",
      },
    ]),
  },
  {
    activityId: 12,
    stepNumber: 9,
    instruction:
      "Score each dimension (Strong / Adequate / Weak) with specific evidence pulled from your work in steps 3-8. Write a final verdict on the content from step 1: use as-is, revise with specific changes, or discard. Capture all of this in the deliverable box at the bottom of this page.",
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 14 (Style Coach) — step 1 captures the writing sample
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 14,
    stepNumber: 1,
    instruction:
      "Find a sample of your own writing you felt good about and capture it below. The AI's analysis in step 2 and its remix attempt in step 4 both work from this exact sample.",
    ...ctxBox("activity-14-sample", "Pick the sample you'll teach the AI from.", [
      {
        id: "sample",
        label: "Your writing sample",
        placeholder:
          "Paste a paragraph (around 100-200 words). Redact anything sensitive first.",
      },
      {
        id: "audience",
        label: "Who that sample was originally for",
        placeholder: "e.g., faculty colleagues; students in a 200-level course",
      },
    ]),
  },
  {
    activityId: 14,
    stepNumber: 4,
    instruction:
      "Now go back to a previous AI-generated draft and prompt the AI to rewrite it to match the writing style it just analyzed in step 2 (which came from your step-1 sample). Keep the content but match the tone, sentence length, and vocabulary.",
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 17 (Design an Agent) — step 1 captures the workflow
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 17,
    stepNumber: 1,
    instruction:
      "Identify a repetitive multi-step workflow in your role and capture its name below. Every later step in this activity refines the design of *this specific* workflow.",
    ...ctxBox(
      "activity-17-workflow",
      "Name the workflow you're going to design an agent for.",
      [
        {
          id: "workflow",
          label: "Workflow name",
          placeholder:
            "e.g., onboarding a new TA; prepping the Monday module email; reviewing submissions for completeness",
        },
        {
          id: "frequency",
          label: "How often it runs",
          placeholder: "e.g., weekly during semesters; monthly; per-cohort",
        },
      ]
    ),
  },
  {
    activityId: 17,
    stepNumber: 5,
    instruction:
      "Write the agent design for the step-1 workflow on a one-page template: Goal · Trigger event · Numbered steps (marking which are AI and which are human) · Tools the agent would need access to · Risks if it goes wrong.",
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 20 (Theme Finder) — step 1 captures dataset
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 20,
    stepNumber: 1,
    instruction:
      "Identify your dataset of open-ended responses (de-identified) and note its size and source below. Steps 2-5 work from this exact set.",
    ...ctxBox(
      "activity-20-dataset",
      "Lock in the dataset you'll cluster.",
      [
        {
          id: "source",
          label: "Source / collection context",
          placeholder:
            "e.g., end-of-term survey from a 200-student intro course",
        },
        {
          id: "size",
          label: "Approx. size",
          placeholder: "e.g., 84 responses, ~1-3 sentences each",
        },
      ]
    ),
  },
  {
    activityId: 20,
    stepNumber: 5,
    instruction:
      "Build a comparison: your themes from step 2 vs. AI's themes from step 3 against the dataset you locked in step 1. Note agreements, disagreements, and which approach found things the other missed. Capture in the deliverable box at the bottom of this page.",
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 21 (Privacy Workflow) — step 1 captures the dataset
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 21,
    stepNumber: 1,
    instruction:
      "Identify the dataset you'll design the workflow around and capture its sensitivity profile below. Every step after this references this exact dataset.",
    ...ctxBox(
      "activity-21-dataset",
      "Define the dataset whose privacy this workflow has to handle.",
      [
        {
          id: "dataset",
          label: "Dataset name and source",
          placeholder: "e.g., student support chat logs from spring term",
        },
        {
          id: "sensitivity",
          label: "Sensitivity (FERPA / HIPAA / public / mixed)",
          placeholder: "Be specific. Include any contractual constraints.",
        },
      ]
    ),
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 23 (Slide Deck) — step 1 captures topic + audience
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 23,
    stepNumber: 1,
    instruction:
      "Pick a topic, audience, and outcome for the deck and capture them below. Steps 2-6 design and refine *this specific* deck.",
    ...ctxBox(
      "activity-23-deck",
      "Lock in the deck's purpose so the AI prompt in step 2 has real context.",
      [
        {
          id: "topic",
          label: "Topic of the deck",
          placeholder: "e.g., AI in formative feedback for instructors new to it",
        },
        {
          id: "audience",
          label: "Audience",
          placeholder: "Who's in the room? Existing knowledge level?",
        },
        {
          id: "outcome",
          label: "One-sentence outcome",
          placeholder:
            "By the end, the audience can ___ / knows ___",
        },
      ]
    ),
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 24 (Visual Audit) — step 1 captures the visual
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 24,
    stepNumber: 1,
    instruction:
      "Pick the AI-generated visual you'll audit and capture what it is + why it matters below. Steps 2-6 audit *this specific* visual against accuracy, clarity, and accessibility.",
    ...ctxBox(
      "activity-24-visual",
      "Lock in the artifact you're auditing.",
      [
        {
          id: "visual",
          label: "What the visual is",
          placeholder:
            "e.g., a comparison infographic showing four assessment types",
        },
        {
          id: "stakes",
          label: "Where it would be used / why being wrong matters",
          placeholder: "e.g., department report to leadership; student handout",
        },
      ]
    ),
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 27 (Decision Tree) — step 1 captures the team / context
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 27,
    stepNumber: 1,
    instruction:
      "Pick the team and the type of work the decision tree will guide. Capture both below. Step 5's tree is shaped specifically by what you write here.",
    ...ctxBox(
      "activity-27-team",
      "Lock in who and what the tree is for.",
      [
        {
          id: "team",
          label: "Team / unit",
          placeholder: "e.g., the instructional design team in our college",
        },
        {
          id: "scope",
          label: "Type of work the tree covers",
          placeholder:
            "e.g., disclosure on course-design artifacts shared with students",
        },
      ]
    ),
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 30 (Lead Discussion) — step 1 captures the framing question
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 30,
    stepNumber: 1,
    instruction:
      "Frame the question that will anchor the discussion and capture it below. Steps 2-5 build the talking points, objections, and next step around this exact question.",
    ...ctxBox(
      "activity-30-framing",
      "The question your room will actually engage with.",
      [
        {
          id: "question",
          label: "Framing question",
          placeholder:
            "e.g., What should our department's stance on AI in graded work be by Fall?",
        },
        {
          id: "audience",
          label: "Who's in the room (and their existing positions)",
          placeholder:
            "e.g., 8 faculty, mixed comfort with AI; 2 strongly skeptical",
        },
      ]
    ),
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 32 (Reimagine Assignment) — step 1 captures the assignment
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 32,
    stepNumber: 1,
    instruction:
      "Pick one existing assignment from a course you teach or support, and capture its current form and learning objective below. Step 2's three alternatives have to honor *this specific* objective.",
    ...ctxBox(
      "activity-32-assignment",
      "Lock in the existing assignment you'll reimagine.",
      [
        {
          id: "assignment",
          label: "Current assignment (one sentence)",
          placeholder:
            "e.g., 1500-word literature review on a chosen topic, due week 7",
        },
        {
          id: "objective",
          label: "Stated learning objective",
          placeholder:
            "e.g., Students compare and contrast policy responses to a public health crisis",
        },
      ]
    ),
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 33 (Novel AI Learning) — step 1 captures the objective
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 33,
    stepNumber: 1,
    instruction:
      "Pick a learning objective AI uniquely enables, and capture it + the discipline below. The activity you design in steps 2-6 must honor *this specific* objective.",
    ...ctxBox(
      "activity-33-objective",
      "Lock in what the activity has to teach.",
      [
        {
          id: "objective",
          label: "Learning objective",
          placeholder:
            "e.g., Students recognize when AI-generated arguments rely on misleading framing",
        },
        {
          id: "discipline",
          label: "Discipline / course",
          placeholder: "e.g., upper-division comm theory",
        },
      ]
    ),
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 36 (PI Case Study) — step 1 captures the case
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 36,
    stepNumber: 1,
    instruction:
      "Pick a real AI-use case from your work and capture its context below. The PI analysis in step 3 and the proposed approach in step 5 are about *this exact* case.",
    ...ctxBox(
      "activity-36-case",
      "Lock in the case the analysis is about.",
      [
        {
          id: "case",
          label: "One-paragraph case description",
          placeholder:
            "Who's involved, what AI use is being considered, what's at stake.",
        },
      ]
    ),
  },
  {
    activityId: 36,
    stepNumber: 6,
    instruction:
      "Capture the structured case study (context from step 1, stakeholders from step 2, PI analysis from step 3, tensions from step 4, proposed approach from step 5, colleague feedback notes) in the deliverable box at the bottom of this page.",
  },

  // ────────────────────────────────────────────────────────────────
  // Activity 39 (Team Brief) — step 1 captures the audience
  // ────────────────────────────────────────────────────────────────
  {
    activityId: 39,
    stepNumber: 1,
    instruction:
      "Pick the audience for the brief and capture their context below. Steps 2-6 curate *for this audience specifically*.",
    ...ctxBox(
      "activity-39-audience",
      "Lock in the brief's audience.",
      [
        {
          id: "audience",
          label: "Audience (specific team or role)",
          placeholder:
            "e.g., 6 IDs across two colleges, mix of new-to-AI and pilot-experienced",
        },
        {
          id: "frequency",
          label: "How often this brief lands in their inbox",
          placeholder: "e.g., monthly, first Monday",
        },
      ]
    ),
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);
  for (const p of patches) {
    const patch: Database["public"]["Tables"]["activity_guide_steps"]["Update"] = {};
    if (p.instruction !== undefined) patch.instruction = p.instruction;
    if (p.detailedHelp !== undefined) patch.detailed_help = p.detailedHelp;
    if (p.interactiveType !== undefined) patch.interactive_type = p.interactiveType;
    if (p.interactiveData !== undefined) patch.interactive_data = p.interactiveData;
    const { error } = await sb
      .from("activity_guide_steps")
      .update(patch)
      .eq("activity_id", p.activityId)
      .eq("step_number", p.stepNumber);
    if (error)
      console.error(`  x ${p.activityId}/${p.stepNumber}:`, error.message);
    else console.log(`✓ ${p.activityId}/${p.stepNumber}`);
  }
  console.log(`\n${patches.length} step patches applied.`);
}

main();
