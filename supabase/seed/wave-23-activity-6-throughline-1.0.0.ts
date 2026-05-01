/**
 * wave-23-activity-6-throughline-1.0.0.ts
 *
 * Activity 6 (Structured Divergent Brainstorm): make the connection
 * between the step-1 problem and steps 2-4's prompts explicit. The
 * problem you define in step 1 is the same problem you push through
 * three prompt angles in steps 2-4 and synthesize in step 6 — the
 * activity only works if that thread is visible.
 *
 *   1. Step 1 captures the problem in a one-box text_list_entry.
 *   2. Steps 2-4 reference "your step 1 problem" explicitly in the
 *      instruction and show a worked example using the AI-resilient
 *      midterm scenario from step 1, so the bracketed prompt
 *      placeholders feel anchored rather than arbitrary.
 *   3. Step 5 actually gets the three-round capture interactive
 *      promised by its instruction (was missing).
 *   4. Step 6's synthesis instruction references both the step-1
 *      problem and the step-5 outputs explicitly.
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

const patches: StepPatch[] = [
  // ── Step 1: capture the problem ───────────────────────────────────
  {
    activityId: 6,
    stepNumber: 1,
    instruction:
      "Define your problem clearly in one sentence and capture it in the box below. The problem you write here is what steps 2-4 push through three different prompt angles, and what step 6 asks you to synthesize ideas for.",
    detailedHelp:
      "**One sentence, with the constraint baked in.** \"I need a new midterm\" is too open. \"I need a midterm format that lets students use AI without making the assessment trivial\" is sharp enough that the divergent prompts have something to push against.\n\n**The problem stays the same across the next four steps.** Steps 2, 3, and 4 each prompt AI from a different angle on this *exact* problem; step 6 synthesizes across the three angles. If your problem changes, come back here and update it.\n\n[The Anchoring Breaker](/activities/5) is where you first practice deliberately re-framing AI's default response. This activity adds two more prompt angles on top.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-6-problem",
      prompt:
        "Capture the problem you'll work on for the rest of this activity.",
      groups: [
        {
          id: "problem",
          label: "Your problem in one sentence",
          placeholder:
            "e.g., I need a midterm format that lets students use AI without making the assessment trivial.",
          count: 1,
        },
      ],
    },
  },

  // ── Step 2: Student perspective prompt ─────────────────────────────
  {
    activityId: 6,
    stepNumber: 2,
    instruction:
      "Build the Student-perspective prompt below using the problem you captured in step 1. Replace the bracketed [topic from step 1] with the specific problem you wrote.",
    detailedHelp:
      "**The student perspective surfaces what current AI use actually feels like in your course.** Students are often the most accurate predictors of where AI shortcuts a learning goal. The prompt's job is to get them to imagine the scenario you actually need them to engage with, not the one they could phone in.\n\n**Worked example.** If your step-1 problem was \"I need a midterm format that lets students use AI without making the assessment trivial,\" the bracketed `[topic from step 1]` becomes that exact sentence. The AI's response will be specifically about your context, not a generic college course.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "You are a college student facing this challenge: [topic from step 1].\n\nWhat assessment format or activity design would challenge you the most and help you learn, even with AI access? Be specific about why each part of your suggestion would resist the AI shortcut.",
      hint: "Replace [topic from step 1] with the problem you captured in step 1, then send to your AI of choice.",
    },
  },

  // ── Step 3: Skeptic perspective prompt ─────────────────────────────
  {
    activityId: 6,
    stepNumber: 3,
    instruction:
      "Build the Skeptic-perspective prompt below using the same problem from step 1. The skeptic surfaces failure modes you'd otherwise miss.",
    detailedHelp:
      "**The skeptic prompt forces you to see the failure modes.** Asking AI to argue against the very thing you're trying to design surfaces blind spots a confirmation-biased prompt would never reveal. The risks the skeptic names are usually the ones to design around.\n\n**Worked example.** Same problem from step 1 plugs in here too. If your problem was \"AI-resilient midterm,\" the skeptic might propose abandoning timed assessments entirely, or argue that any take-home assessment is now meaningless. Take their objections seriously even when you disagree.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "You are a deeply skeptical faculty member who believes AI makes the typical solution to this challenge meaningless: [topic from step 1].\n\nWhat would you propose as an alternative approach, and what are the biggest risks even your alternative would still face?",
      hint: "Same [topic from step 1] as in step 2 — keep the problem consistent so the angles are comparable.",
    },
  },

  // ── Step 4: Tree-of-Thought prompt ─────────────────────────────────
  {
    activityId: 6,
    stepNumber: 4,
    instruction:
      "Build the Tree-of-Thought prompt below — same problem from step 1, but now the AI must produce three structurally different approaches with reasoning for each.",
    detailedHelp:
      "**Tree of Thought is a deliberate technique, not a meta-instruction.** When the prompt forces the model to *reason through three independent approaches before proposing*, you get parallel logics rather than three flavors of the same idea. The instruction \"share no structural similarities\" is what produces real divergence; AI's default is to vary surface details only.\n\n**Worked example.** For \"AI-resilient midterm,\" the three approaches might be (1) oral defense of a written submission, (2) instructor-led debate where students respond live to AI-generated counter-arguments, (3) project-based assessment with weekly check-ins. Three categorically different formats — that's the bar.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Generate three completely independent approaches to: [topic from step 1].\n\nFor each approach, reason through the design logic step by step before proposing the final answer. The three approaches must share no structural similarities (different format, different student experience, different evaluation criteria).",
      hint: "Same [topic from step 1] across all three angles. The Tree-of-Thought instruction is what differentiates this prompt from the prior two.",
    },
  },

  // ── Step 5: capture all three rounds in one place ──────────────────
  {
    activityId: 6,
    stepNumber: 5,
    instruction:
      "Run each of the three prompts (steps 2, 3, 4) in fresh chats — don't let them cross-pollinate. Then paste each output into the matching Round below.",
    detailedHelp:
      "Run all three independently, in fresh chats. Cross-pollination ruins the comparison. The boxes below capture all three side-by-side so step 6's synthesis sees them at a glance.\n\nIf you forget where you did this work later, the **Ask AI** button on the Discussion tab can search your past activities by description.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-6-rounds",
      prompt:
        "Three rounds, one per prompt angle. Paste the AI's output into the matching round.",
      groups: [
        {
          id: "round1",
          label: "Round 1 (Student perspective)",
          placeholder: "Paste the AI's response from step 2",
          count: 1,
        },
        {
          id: "round2",
          label: "Round 2 (Skeptic perspective)",
          placeholder: "Paste the AI's response from step 3",
          count: 1,
        },
        {
          id: "round3",
          label: "Round 3 (Tree of Thought)",
          placeholder: "Paste the AI's response from step 4",
          count: 1,
        },
      ],
    },
  },

  // ── Step 6: synthesize ─────────────────────────────────────────────
  {
    activityId: 6,
    stepNumber: 6,
    instruction:
      "Synthesize across the three rounds in step 5. Capture your shortlist below — 2-3 ideas with a rationale for each — and copy it to the deliverable box at the bottom of the page when ready.",
    detailedHelp:
      "**The shortlist is the deliverable, the comparison is the work.** Look for ideas that appeared in only one angle, those are the ones a single-prompt brainstorm would have missed. Tensions between angles usually reveal a real design trade-off worth naming.\n\n**Tie back to your step-1 problem.** Each shortlisted idea should answer: how does this address the specific problem you defined in step 1? \"It's a creative idea\" doesn't count if it solves a different problem.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-6-shortlist",
      prompt:
        "Two or three ideas, each with the angle it came from and a one-line rationale.",
      groups: [
        {
          id: "shortlist",
          label: "Shortlisted ideas",
          placeholder:
            "Idea (from Student/Skeptic/ToT round): one-line rationale tied to your step-1 problem.",
          count: 3,
        },
      ],
    },
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
