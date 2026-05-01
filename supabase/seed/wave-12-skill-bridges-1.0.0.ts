/**
 * wave-12-skill-bridges-1.0.0.ts
 *
 * Cross-level scaffolding bridges for Skills 2-14 (Skill 1 was done in
 * wave-8). For each skill the script appends a "Where this goes next"
 * line to the NF activity's last step and the FI activity's last step,
 * naming the next-level activity. IA activities get a backward "Where
 * this comes from" line on step 1.
 *
 * Skill 6 IA (Activity 18 Build and Test an Agent) already has its
 * own forward-from-paper-design line; we still touch step 1's bridge
 * for consistency.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type Bridge = {
  activityId: number;
  stepNumber: number;
  appendHelp: string;
};

const FORWARD = (
  band: "fi" | "ia",
  title: string,
  hook: string
): string => {
  const bandLabel =
    band === "fi" ? "Foundational → Intermediate" : "Intermediate → Advanced";
  return `\n\n**Where this goes next.** The ${bandLabel} activity for this skill, **${title}**, ${hook}`;
};

const BACKWARD = (title: string, hook: string): string =>
  `\n\n**Where this comes from.** The Foundational → Intermediate activity for this skill, **${title}**, ${hook}`;

const bridges: Bridge[] = [
  // ── Skill 2: Iterative conversation & anchoring (NF=4, FI=5, IA=6) ──
  {
    activityId: 4,
    stepNumber: 6,
    appendHelp: FORWARD(
      "fi",
      "The Anchoring Breaker",
      "uses the multi-turn habit you just built to deliberately push AI off its first answer."
    ),
  },
  {
    activityId: 5,
    stepNumber: 6,
    appendHelp: FORWARD(
      "ia",
      "Structured Divergent Brainstorm",
      "scales the anchor-break move into a multi-prompt strategy where three independent prompts surface different idea spaces."
    ),
  },
  {
    activityId: 6,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "The Anchoring Breaker",
      "is where you first practice deliberately re-framing AI's default response. This activity adds two more prompt angles on top."
    ),
  },

  // ── Skill 3: Research & verify sources (NF=7, FI=8, IA=9) ──
  {
    activityId: 7,
    stepNumber: 5,
    appendHelp: FORWARD(
      "fi",
      "The Fabrication Detector",
      "extends the citation-check habit to a full AI-generated literature paragraph, color-coded for what's real, partial, and invented."
    ),
  },
  {
    activityId: 8,
    stepNumber: 6,
    appendHelp: FORWARD(
      "ia",
      "AI-Assisted Research Workflow",
      "turns the verification habit into a documented multi-step workflow with explicit verification gates between each AI step."
    ),
  },
  {
    activityId: 9,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "The Fabrication Detector",
      "trains the per-claim verification reflex this workflow depends on. If your fabrication-detection eye is rusty, that activity is the warm-up."
    ),
  },

  // ── Skill 4: Fact-check hallucinations (NF=10, FI=11, IA=12) ──
  {
    activityId: 10,
    stepNumber: 6,
    appendHelp: FORWARD(
      "fi",
      "The Confidence Trap",
      "applies a 3-step verification check (personal knowledge / primary source / consistency) when the AI sounds certain about something you don't actually know."
    ),
  },
  {
    activityId: 11,
    stepNumber: 6,
    appendHelp: FORWARD(
      "ia",
      "RACCCA in Practice",
      "promotes the verification reflex into a six-dimension evaluation memo (Relevance, Accuracy, Currency, Credibility, Coverage, Audience) you'd be willing to publish."
    ),
  },
  {
    activityId: 12,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "The Confidence Trap",
      "builds the per-claim verification habit RACCCA's Accuracy dimension depends on."
    ),
  },

  // ── Skill 5: Edit & refine AI output (NF=13, FI=14, IA=15) ──
  {
    activityId: 13,
    stepNumber: 5,
    appendHelp: FORWARD(
      "fi",
      "The Style Coach",
      "teaches the AI your voice from a sample, then asks it to mimic that voice on a draft, and you compare what it gets right vs. wrong."
    ),
  },
  {
    activityId: 14,
    stepNumber: 5,
    appendHelp: FORWARD(
      "ia",
      "The Refinement Loop",
      "scales the edit habit into a four-pass cycle: generate, AI self-critique, AI revise, your final manual edit."
    ),
  },
  {
    activityId: 15,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "The Style Coach",
      "builds the voice-mimicry skill the Refinement Loop's revision passes leverage."
    ),
  },

  // ── Skill 6: Build & deploy simple agents (NF=16, FI=17, IA=18) ──
  {
    activityId: 16,
    stepNumber: 4,
    appendHelp: FORWARD(
      "fi",
      "Design an Agent",
      "translates the agent-vs-chat distinction you just clarified into a real paper design for a workflow in your role."
    ),
  },
  {
    activityId: 17,
    stepNumber: 6,
    appendHelp: FORWARD(
      "ia",
      "Build and Test a Simple Agent",
      "takes your paper design and turns it into a working agent on Claude Projects, GPT custom instructions, or similar — with three real test cases."
    ),
  },
  {
    activityId: 18,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "Design an Agent",
      "is the paper design this build step turns into something running. If your design is fuzzy, sharpen it there before pasting it into a system prompt."
    ),
  },

  // ── Skill 7: Analyze data with AI (NF=19, FI=20, IA=21) ──
  {
    activityId: 19,
    stepNumber: 5,
    appendHelp: FORWARD(
      "fi",
      "Theme Finder",
      "uses the calibrated trust you just built to compare AI clustering of open-ended responses against your own manual themes."
    ),
  },
  {
    activityId: 20,
    stepNumber: 5,
    appendHelp: FORWARD(
      "ia",
      "Privacy-First Data Analysis Workflow",
      "wraps the AI-clustering habit in de-identification, tool-approval verification, and an audit log defensible under FERPA scrutiny."
    ),
  },
  {
    activityId: 21,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "Theme Finder",
      "is where the AI-vs-manual comparison habit comes from. The privacy-first workflow scales that habit to real student data."
    ),
  },

  // ── Skill 8: Create visuals with AI (NF=22, FI=23, IA=24) ──
  {
    activityId: 22,
    stepNumber: 5,
    appendHelp: FORWARD(
      "fi",
      "Slide Deck Draft",
      "scales the describe-it-see-it skill from a single visual to a five-slide deck draft and audience-tuned revision."
    ),
  },
  {
    activityId: 23,
    stepNumber: 6,
    appendHelp: FORWARD(
      "ia",
      "Visual Communication Audit",
      "applies a systematic audit (accuracy, clarity, accessibility) to a complex visual before you'd ever publish it."
    ),
  },
  {
    activityId: 24,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "Slide Deck Draft",
      "builds the muscle of comparing AI-generated visuals against what your audience actually needs. The audit step here goes deeper on accuracy and accessibility."
    ),
  },

  // ── Skill 9: Disclose & attribute AI use (NF=25, FI=26, IA=27) ──
  {
    activityId: 25,
    stepNumber: 4,
    appendHelp: FORWARD(
      "fi",
      "Write Your Disclosure Statement",
      "moves from finding policies to drafting three reusable disclosure statements you can drop into syllabi, conferences, and grants."
    ),
  },
  {
    activityId: 26,
    stepNumber: 5,
    appendHelp: FORWARD(
      "ia",
      "Disclosure Decision Tree",
      "builds your team's reusable rules for when and how to disclose AI use, including the edge cases reasonable people disagree on."
    ),
  },
  {
    activityId: 27,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "Write Your Disclosure Statement",
      "drafts the kind of disclosure language this decision tree maps the right action onto."
    ),
  },

  // ── Skill 10: Discuss AI possibilities & limitations (NF=28, FI=29, IA=30) ──
  {
    activityId: 28,
    stepNumber: 4,
    appendHelp: FORWARD(
      "fi",
      "The Nuanced Take",
      "asks you to respond to a strong claim about AI in a way that acknowledges the kernel of truth without flattening the limitations."
    ),
  },
  {
    activityId: 29,
    stepNumber: 4,
    appendHelp: FORWARD(
      "ia",
      "Lead a Discussion",
      "scales the nuanced take from a paragraph into a 15-minute facilitated conversation with prepared talking points and anticipated objections."
    ),
  },
  {
    activityId: 30,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "The Nuanced Take",
      "builds the kind of evidence-backed claim you'll lean on multiple times in this 15-minute discussion."
    ),
  },

  // ── Skill 11: Use AI creatively (NF=31, FI=32, IA=33) ──
  {
    activityId: 31,
    stepNumber: 4,
    appendHelp: FORWARD(
      "fi",
      "Reimagine an Assignment",
      "uses the playful-prompt habit you just tried to generate three structurally different alternatives to an existing assignment."
    ),
  },
  {
    activityId: 32,
    stepNumber: 4,
    appendHelp: FORWARD(
      "ia",
      "Design a Novel AI Learning Experience",
      "takes the redesign habit further, creating an activity that couldn't exist without AI as a structural element."
    ),
  },
  {
    activityId: 33,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "Reimagine an Assignment",
      "is where the AI-as-redesign-trigger move comes from. This activity goes farther: not redesigning an existing assignment, but designing one AI uniquely enables."
    ),
  },

  // ── Skill 12: Balance curiosity, care, clarity, intentionality (NF=34, FI=35, IA=36) ──
  {
    activityId: 34,
    stepNumber: 5,
    appendHelp: FORWARD(
      "fi",
      "The Decision Framework Draft",
      "turns the patterns you noticed in the journal into a written personal framework for when you will and won't use AI."
    ),
  },
  {
    activityId: 35,
    stepNumber: 5,
    appendHelp: FORWARD(
      "ia",
      "Principled Innovation Case Study",
      "applies your personal framework — and ASU's full Principled Innovation framework — to a real AI use decision with stakeholder tensions."
    ),
  },
  {
    activityId: 36,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "The Decision Framework Draft",
      "is the personal version of this analysis. The case study scales the same principled-innovation logic to a stakeholder-laden situation."
    ),
  },

  // ── Skill 13: Stay current with reliable resources (NF=37, FI=38, IA=39) ──
  {
    activityId: 37,
    stepNumber: 4,
    appendHelp: FORWARD(
      "fi",
      "Signal vs. Noise Filter",
      "builds the rubric for evaluating new AI content as it lands so your starter kit stays useful instead of stale."
    ),
  },
  {
    activityId: 38,
    stepNumber: 5,
    appendHelp: FORWARD(
      "ia",
      "Curate a Team Brief",
      "turns the personal triage rubric into a monthly brief the rest of the team will actually read."
    ),
  },
  {
    activityId: 39,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "Signal vs. Noise Filter",
      "is the personal triage habit this brief curates from. If your filter is loose, the brief will be too."
    ),
  },

  // ── Skill 14: Use AI to learn AI (NF=40, FI=41, IA=42) ──
  {
    activityId: 40,
    stepNumber: 5,
    appendHelp: FORWARD(
      "fi",
      "Teach Me a Feature",
      "uses the same meta move (ask AI about AI) on a specific feature you haven't used yet — and stress-tests the AI's instructions."
    ),
  },
  {
    activityId: 41,
    stepNumber: 6,
    appendHelp: FORWARD(
      "ia",
      "Meta-Learning Protocol",
      "abstracts the feature-learning loop you just ran into a reusable five-step protocol for any new AI capability."
    ),
  },
  {
    activityId: 42,
    stepNumber: 1,
    appendHelp: BACKWARD(
      "Teach Me a Feature",
      "is the worked example this protocol generalizes. If the protocol's steps feel abstract, run that activity first."
    ),
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  for (const b of bridges) {
    const { data: row, error: getErr } = await sb
      .from("activity_guide_steps")
      .select("id,detailed_help")
      .eq("activity_id", b.activityId)
      .eq("step_number", b.stepNumber)
      .maybeSingle();
    if (getErr) {
      console.error(
        `  x ${b.activityId}/${b.stepNumber}:`,
        getErr.message
      );
      continue;
    }
    if (!row) {
      console.error(`  x ${b.activityId}/${b.stepNumber}: row not found`);
      continue;
    }
    const current = row.detailed_help ?? "";
    // Skip if a bridge for this activity is already in there.
    if (
      current.includes("Where this goes next.") ||
      current.includes("Where this comes from.")
    ) {
      console.log(
        `  - ${b.activityId}/${b.stepNumber} already has a bridge, skipping`
      );
      continue;
    }
    const next = (current.trim() + b.appendHelp).trim();
    const { error: uErr } = await sb
      .from("activity_guide_steps")
      .update({ detailed_help: next })
      .eq("id", row.id);
    if (uErr)
      console.error(`  x ${b.activityId}/${b.stepNumber}:`, uErr.message);
    else console.log(`✓ ${b.activityId}/${b.stepNumber}`);
  }
  console.log(`\n${bridges.length} bridge entries processed.`);
}

main();
