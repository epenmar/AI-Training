/**
 * wave-15-activity-3-rework-1.0.0.ts
 *
 * Reframe Activity 3 (Tool Audit & Recommendation Brief) for advanced
 * users. Don't make them do work AI could do. Have AI generate the
 * research summary and the brief draft; the human's job is to direct
 * the AI, verify its claims, and own the recommendation.
 *
 * Step 2 swaps the "read about VITRA" detailed_help for an interactive
 * three-state hotspot (Approved / Under review / Not submitted), each
 * card revealing what you can do, what you can't, and the next step.
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
  // Step 1: identify the tool + audience
  {
    activityId: 3,
    stepNumber: 1,
    instruction:
      "Identify one AI tool with a real adoption decision behind it, and name the audience for your brief (department chair? a colleague piloting? an admin asking?). Capture both below — the AI in step 3 will need this context.",
    detailedHelp:
      "**Why a real audience matters more than a real tool.** A generic \"evaluate ChatGPT\" brief reads as performative; a brief written for the actual person who's about to make a decision is sharper from the first paragraph.\n\n**A handful of bracketed details now saves rework later.** Tool name, vendor, the use case being considered, who the audience is, what data they expect to handle. The next step's interactive (and the AI prompt in step 3) all read these.\n\n**Where this comes from.** If you've worked through Tool Selection Matrix at the previous level, the four \"fit for the task\" dimensions (input length / file support / VITRA / iteration) are your warm-up. This audit goes wider: VITRA gets its own step here, and you add data handling, accessibility, and output-quality testing as full sections of the brief.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-3-context",
      prompt:
        "Lock in the context. The boxes save in your browser; the AI prompt in step 3 will use them.",
      groups: [
        {
          id: "tool",
          label: "Tool name + vendor",
          placeholder: "e.g., ChatGPT Enterprise (OpenAI)",
          count: 1,
        },
        {
          id: "use",
          label: "Use case being considered",
          placeholder:
            "e.g., faculty drafting student feedback at scale",
          count: 1,
        },
        {
          id: "audience",
          label: "Audience for the brief",
          placeholder:
            "e.g., department chair deciding whether to fund licenses",
          count: 1,
        },
        {
          id: "data",
          label: "Data sensitivity (what would users actually put in?)",
          placeholder: "Public / de-identified / FERPA-protected / mixed",
          count: 1,
        },
      ],
    },
  },

  // Step 2: VITRA infographic (replaces the text read)
  {
    activityId: 3,
    stepNumber: 2,
    instruction:
      "Look up the tool's VITRA status. Use the three cards below to figure out what your status actually allows you (and your audience) to do.",
    detailedHelp:
      "**Why this lives at step 2.** The VITRA call usually decides whether the rest of the audit is even worth doing — if the tool is rejected for the data your audience cares about, the recommendation is \"don't adopt.\"\n\nClick a card below to see what the status means for use, restrictions, and your next step. The full ASU explainer is one click further if you want it.",
    interactiveType: "vitra_infographic",
    interactiveData: {
      prompt:
        "Three states. Tap whichever matches your tool's current VITRA status.",
    },
  },

  // Step 3: USE AI to draft the research summary
  {
    activityId: 3,
    stepNumber: 3,
    instruction:
      "Use AI to draft the research portion of the audit. Paste the prompt below into your tool of choice. The AI handles the boilerplate (summarizing data handling, accessibility, output-quality findings); you direct what to research and what to ignore.",
    detailedHelp:
      "**Why use AI for the research.** This is exactly what AI is good at: synthesizing public information across multiple dimensions when you've given it tight scope. Doing it by hand isn't pedagogically valuable, the work is in *directing* the AI and *verifying* what it returns.\n\n**Edit the bracketed sections of the prompt.** Pull from your step-1 boxes for tool name, use case, audience, and data sensitivity.\n\n**What the AI will get wrong.** Vendor claims. Subscription tiers. Recent UI changes. Specific accessibility features. Plan to verify these in step 4.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Research role, AI auditor for higher-ed tool adoption.\n\nTool, [tool name + vendor].\nUse case, [use case].\nAudience, [audience].\nData sensitivity, [data sensitivity].\n\nProduce a structured research summary in this exact format:\n\n## Output quality (for this use case)\nThree concrete strengths and three concrete limitations, each tied to the use case above. Cite vendor claims; flag where claims aren't independently verifiable.\n\n## Data handling\nWhat does the vendor's privacy policy say about data storage location, training-on-inputs, third-party sharing, retention defaults, and customer-controlled storage? Cite the exact phrases. Flag any ambiguous language.\n\n## Accessibility\nDoes the tool work with screen readers? Keyboard navigation? Output accessibility? Cite vendor accessibility statements; flag anything the vendor doesn't address.\n\n## Vendor caveats\nThree open questions a careful reader would still have.\n\nDo not produce a recommendation. The human author handles that.",
      hint: "Replace each [bracket] with values from step 1, then send.",
    },
  },

  // Step 4: human verification (the actual learning)
  {
    activityId: 3,
    stepNumber: 4,
    instruction:
      "Spot-check the AI's research against primary sources. The list below is non-negotiable; pick one or two more from your step-3 output that felt slippery.",
    detailedHelp:
      "**This is the part AI can't do for you.** AI's research summary is only as good as the verification you put on top of it. The defensibility of the final brief lives here.\n\n**Verification checklist (mandatory):**\n• **Privacy policy claim** — open the vendor's actual privacy page and check at least two AI-cited phrases verbatim. Note any that don't appear or have changed.\n• **Accessibility claim** — find the vendor's accessibility statement (or VPAT if available). Verify two AI claims; flag what's vague.\n• **VITRA status** — verify what you wrote in step 2 against the actual ASU canvas page or your IT liaison.\n\n**Flag any AI fabrication clearly.** A single fabricated claim in your final brief torches the recommendation.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-3-verify",
      prompt: "Track what you verified, what you flagged, and what changed.",
      groups: [
        {
          id: "privacy",
          label: "Privacy policy verification",
          placeholder:
            "Two AI-cited phrases checked, what changed, what flagged",
          count: 2,
        },
        {
          id: "access",
          label: "Accessibility verification",
          placeholder:
            "Vendor statement found? Claims confirmed / contradicted",
          count: 2,
        },
        {
          id: "extra",
          label: "Other slippery claims you spot-checked",
          placeholder: "Specific claim, what you found",
          count: 2,
        },
      ],
    },
  },

  // Step 5: USE AI to draft the brief, then OWN the recommendation
  {
    activityId: 3,
    stepNumber: 5,
    instruction:
      "Use AI to draft the brief from your verified research. Then write the recommendation paragraph yourself. AI doesn't get the last word here.",
    detailedHelp:
      "**Why the recommendation has to be yours.** A brief is a decision tool. Outsourcing the decision to AI undermines the entire point. The AI helps you marshal evidence; you stake the call.\n\n**The prompt below produces a draft brief without a recommendation paragraph.** Paste in your step-3 research summary and your step-4 verification notes. Then write the recommendation yourself, in your own voice, with your own reasoning.\n\n**Adopt / Pilot / Wait / Reject.**\n• **Adopt:** clears VITRA, handles data acceptably, and beats whatever you're using now.\n• **Pilot:** solid candidate but you need a controlled test before institutional rollout.\n• **Wait:** promising but immature, or VITRA isn't through.\n• **Reject:** fails on data handling or accessibility in a way no workaround fixes.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Author role, you are drafting a one-page recommendation brief for [audience] about [tool name].\n\nUse the structure below. The recommendation paragraph should be left blank — the human author writes that.\n\n## Purpose\n[Restate from context.]\n\n## Tool evaluated\n[Tool name + vendor.]\n\n## VITRA status\n[Whatever the human verified in step 2 + step 4.]\n\n## Strengths (with evidence)\n[Two or three, each pulling specifically from the verified research.]\n\n## Risks (with evidence)\n[Two or three, each tied to verified findings.]\n\n## Recommendation\n[Leave blank. The human author will fill this in.]\n\nVerified research notes (use these only — do not invent):\n[paste your step-3 output]\n\nVerification flags (do not contradict these):\n[paste your step-4 verification notes]",
      hint:
        "Paste your step-3 output and step-4 notes into the bottom of the prompt before sending.",
    },
  },

  // Step 6: review the AI brief, write the recommendation, ship
  {
    activityId: 3,
    stepNumber: 6,
    instruction:
      "Review the AI's brief draft. Fix what's wrong, write the recommendation paragraph in your own voice, and capture the final version in the deliverable box at the bottom of this page.",
    detailedHelp:
      "**What you're checking.** Did the AI invent a strength or risk that wasn't in your verified research? (If yes, cut it.) Did it phrase a verified finding sloppily? (If yes, tighten it.) Did it miss a finding from your verification flags? (If yes, add it.)\n\n**The recommendation paragraph is the deliverable.** Three sentences max:\n1. Adopt / Pilot / Wait / Reject.\n2. The single most important reason.\n3. The condition under which the call would change.\n\n**Don't let AI write the recommendation.** A brief whose recommendation paragraph reads like AI is a brief no decision-maker should trust.",
    interactiveType: null,
    interactiveData: null,
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
