/**
 * wave-16-extrapolations-1.0.0.ts
 *
 *   1. Anchoring Breaker (Activity 5): step 4 mirrors Round 1 read-only
 *      from step 2 and adds checkbox marks to Round 2; step 5 also
 *      mirrors with marks so the user works on the same data they
 *      already entered.
 *   2. Extrapolate the Activity 3 reframe across the rest of the IA
 *      tier: where the user is asked to author boilerplate AI could
 *      generate (audit log templates, system prompts, decision trees,
 *      talking points, etc.), add a prompt_sandbox so AI drafts and
 *      the human verifies. Existing text_list_entry interactives stay
 *      so the human evaluation step still has structure.
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
  // ───────────────────────────────────────────────────────────────
  // Activity 5: Anchoring Breaker — read-only mirror + markable rows
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 5,
    stepNumber: 4,
    instruction:
      "Paste the new ideas into Round 2 below. Round 1 is mirrored from step 2 so you can compare side by side without re-typing.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-5-rounds",
      prompt:
        "Round 1 (from step 2) and Round 2 (paste new ideas). Same storage key as step 2.",
      groups: [
        {
          id: "round1",
          label: "Round 1 (anchored)",
          count: 5,
          readOnly: true,
        },
        {
          id: "round2",
          label: "Round 2 (anchor broken)",
          placeholder: "Paste each new idea here",
          count: 5,
        },
      ],
    },
  },
  {
    activityId: 5,
    stepNumber: 5,
    instruction:
      "Compare the two rounds below. Click the gold checkbox next to any Round 2 idea that only appeared after you broke the anchor — the row will highlight so the standouts are easy to spot at a glance.",
    detailedHelp:
      "**What to look for:** the ideas that *only* appeared after you broke the anchor. The gold checkbox is your quick way to flag them; the row highlights so you can see your standouts at a glance.\n\nIf any Round-2 idea makes you go \"oh, I hadn't thought of that\", that's the anchor working against you in Round 1. The more of those there are, the more the first-anchor instinct was costing you.",
    interactiveType: "text_list_entry",
    interactiveData: {
      storageKey: "activity-5-rounds",
      prompt:
        "Mark the ideas that wouldn't have surfaced without breaking the anchor. Marks save to your browser.",
      groups: [
        {
          id: "round1",
          label: "Round 1 (anchored)",
          count: 5,
          readOnly: true,
        },
        {
          id: "round2",
          label: "Round 2 (anchor broken)",
          count: 5,
          readOnly: true,
          markable: true,
          markLabel: "Anchor-break standout",
        },
      ],
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 18: Build & Test Agent — AI drafts the system prompt
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 18,
    stepNumber: 2,
    instruction:
      "Use AI to draft the system prompt from your design. Paste the prompt below into your platform of choice. The AI handles the boilerplate; you direct the goal and refine the output before testing.",
    detailedHelp:
      "**Why use AI for this.** A system prompt is structured boilerplate around a goal you've already defined. Drafting from scratch is reps; iterating on a draft is the actual skill.\n\n**Edit the bracketed sections.** Pull from the agent design you did at the previous level (Design an Agent).\n\n**What you'll still own.** The refusals list, the human-checkpoint placements, and any edge cases the AI's draft misses. Capture revisions to the prompt below.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Role: AI agent designer.\n\nDraft a system prompt for an agent with the following goal and constraints. Be concrete; keep the prompt under 300 words.\n\nGoal: [one-sentence goal of the agent]\nInputs the agent should expect: [list]\nSteps the agent should take: [numbered list, in order]\nThings the agent should refuse: [list]\nHuman checkpoints (do not skip): [list]\nTone: [direct/formal/etc.]\n\nProduce the system prompt only. No explanation, no preamble.",
      hint: "Replace each [bracket] with values from your paper design, then send.",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 21: Privacy Workflow — AI drafts the audit log template
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 21,
    stepNumber: 6,
    instruction:
      "Use AI to draft the audit-log template. Paste the prompt below into your tool of choice. AI gets you a usable starting structure; you edit it to match your team's actual workflow and verify it against ASU's privacy requirements.",
    detailedHelp:
      "**Why drafting this with AI is appropriate.** Audit-log templates are structurally similar across institutions; AI has plenty of patterns to draw from. The hard part is making it match *your* specific workflow and the institutional bar — that's the human's job.\n\n**What you'll still own.** Whether the template's de-identification steps actually catch what your dataset contains, whether the audit fields satisfy ASU's privacy requirements, and whether a colleague could run it without you in the room.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Role: data-privacy auditor for a US university (FERPA-applicable).\n\nDraft a one-page audit-log template a colleague could run without my involvement, for analyzing student-survey data with AI tools. Include these sections:\n\n• De-identification checklist (specific items to redact)\n• Tool-approval verification (how to confirm a tool is VITRA-cleared)\n• Prompt template (with placeholders for the data)\n• Output review checklist (what to verify against the original data)\n• Audit-log fields (date, dataset, tool, prompt, decisions, signed-off-by)\n\nKeep it concise. No explanations, just the template.",
      hint: "Send this to your AI of choice. Then evaluate: does the template actually catch what your dataset contains?",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 27: Disclosure Decision Tree — AI drafts the tree (Mermaid)
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 27,
    stepNumber: 5,
    instruction:
      "Use AI to draft the decision tree as Mermaid syntax. Paste the prompt below into your tool of choice, then render the result in [Mermaid Live](https://mermaid.live). Edit the branches to match your team's actual norms.",
    detailedHelp:
      "**Why Mermaid.** Mermaid Live renders text-based decision trees instantly; you can iterate without dragging shapes around. Your team can paste the source into docs, wikis, or onboarding materials.\n\n**What you'll still own.** Whether the branches reflect *your* team's reality, the edge cases the draft misses, and the language you want each endpoint to use.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Role: instructional-design consultant drafting a disclosure decision tree for a higher-ed team.\n\nProduce a Mermaid flowchart (flowchart TD syntax) that helps a team member decide what level of AI disclosure to apply, based on:\n\n• Type of work: [course material / research output / internal memo / public-facing]\n• Audience: [students / peers / public / regulators]\n• Institutional context: [ASU policy applies? Journal? Funder?]\n\nEndpoints should be specific actions, like:\n• \"Disclose with full statement\"\n• \"Add brief acknowledgment\"\n• \"No disclosure needed\"\n• \"Escalate to department chair\"\n\nReturn only the Mermaid source. No commentary.",
      hint: "Send to your AI, paste the response into Mermaid Live to render and iterate on branches.",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 30: Lead a Discussion — AI drafts talking points
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 30,
    stepNumber: 2,
    instruction:
      "Use AI to draft your talking points across all five lenses. Paste the prompt below; you'll edit the result to fit your audience, your evidence, and your voice.",
    detailedHelp:
      "**Why drafting with AI here is appropriate.** Talking points across five evidence-backed lenses is exactly the kind of structured boilerplate AI is good at. The work is in *editing* — pulling in your specific evidence, your team's vocabulary, and the framing your room actually responds to.\n\n**What you'll still own.** Whether the talking points cite real evidence (not AI-fabricated), whether the framing matches your audience, and whether you have a story to back each one up.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Role: facilitator preparing talking points for a 15-minute departmental discussion on AI use.\n\nFraming question: [your specific question]\nAudience: [who's in the room]\n\nProduce talking points covering all five of these lenses, in this order. Each should be ~3 sentences with a concrete example.\n\n1. Capability — what AI does well in our context\n2. Limitation — what AI does poorly that matters here\n3. Bias / risk — a specific bias and where it shows up\n4. Privacy / data — what data goes where; the institutional bar\n5. Pedagogical impact — where it helps learning vs. short-circuits it\n\nThen list 3-4 likely objections from the room, each with a 1-2 sentence response.\n\nReturn structured plain text. No preamble.",
      hint: "Send to your AI. Edit the result for accuracy, tone, and your specific audience.",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 33: Design Novel AI Learning — AI drafts initial design
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 33,
    stepNumber: 4,
    instruction:
      "Use AI to draft the initial activity design from your learning objective. Paste the prompt below into your tool of choice. AI gets you a starting structure; you reshape it for your context and add the failure-mode planning AI can't do.",
    detailedHelp:
      "**Why AI drafts here.** Activity design templates have predictable bones: objective, AI's structural role, student instructions, ID artifacts, evaluation criteria. AI can produce a usable scaffold; the design judgment is in *evaluating* the draft.\n\n**What you'll still own.** Whether the activity is actually structurally AI-dependent (vs. AI-bolted-on), whether the predicted failure modes match what would actually happen in your classroom, and the rubric that rewards what AI can't do for students.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Role: learning experience designer drafting an AI-essential activity.\n\nLearning objective: [the specific objective]\nDiscipline / course context: [details]\nStudent population: [who they are; what they bring]\n\nDraft an activity design with these sections:\n\n## How AI is structurally used\n(One paragraph. AI must be essential; if you can imagine the activity without AI, the design isn't strong enough.)\n\n## Student-facing instructions\n(Numbered, in order. Include how students should handle predictable AI failures.)\n\n## ID build list\n(Prompts to write, system prompts, rubric, exemplars, troubleshooting.)\n\n## Evaluation criteria\n(Three criteria. Each must reward something AI can't do for the student.)\n\n## Pre-mortem\n(Three likely failure modes + how the instructor would notice each.)\n\nReturn structured plain text. No commentary outside the sections.",
      hint: "Edit the bracketed sections, then send. Evaluate: does each section actually achieve what it claims?",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 36: PI Case Study — AI drafts initial PI analysis
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 36,
    stepNumber: 3,
    instruction:
      "Use AI to draft the initial Principled Innovation analysis from your case context. Paste the prompt below; you'll then evaluate which tensions the AI surfaced vs. missed and write the proposed approach yourself.",
    detailedHelp:
      "**Why this is appropriate AI work.** A first-pass analysis through a four-principle framework is structured enough for AI to handle. The principled-innovation thinking — the *judgment* about which tension to honor and how — has to be yours.\n\n**What you'll still own.** Naming the tensions the AI missed, evaluating whether its framing matches your stakeholders' actual experience, and writing the proposed-approach paragraph in your own voice.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Role: applying ASU's Principled Innovation framework to an AI-use decision.\n\nCase: [one-paragraph description]\nStakeholders (including non-voting): [list]\n\nProduce a structured first-pass analysis covering all four principles. Each section is 3-4 sentences with a specific stakeholder reference.\n\n## Curiosity\n(What does this case ask us to explore?)\n\n## Care\n(Who's affected; what protections matter; what's the cost of being wrong?)\n\n## Clarity\n(What's the trade-off, named explicitly?)\n\n## Intentionality\n(What deliberate choice are we making, vs. drifting?)\n\n## Tensions named\n(Where two principles pull against each other. Two tensions max, each tied to a specific stakeholder.)\n\nDo not produce a recommendation. The human author writes that.",
      hint: "Edit case + stakeholders, send, then evaluate which tensions the AI missed before writing the recommendation yourself.",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 39: Curate Team Brief — AI summarizes candidate items
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 39,
    stepNumber: 2,
    instruction:
      "Use AI to draft plain-language summaries of your candidate items. Paste the prompt below for each item. You then verify the summaries, cut the noise, and decide which 3-5 belong in the brief.",
    detailedHelp:
      "**Why AI drafts the summaries.** Two-sentence \"what changed / why it matters\" summaries are exactly the kind of synthesis AI handles well. Doing them by hand for every candidate burns time the curation should get.\n\n**What you'll still own.** Whether the summary is accurate (verify against the source), which 3-5 items to keep, the relevance tag for each, and the try-this action item AI can't tailor to your team.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Role: editor of a monthly AI brief for a higher-ed instructional-design team.\n\nFor the source below, produce a 2-sentence summary in this exact format:\n\n*What changed:* [one sentence, plain language]\n*Why it matters for an ID team:* [one sentence, specific]\n\nIf the source contains hype with no substance, say so explicitly: \"Hype, no substance.\"\n\nSource: [paste headline + URL + key paragraphs]",
      hint: "Run this for each candidate item. Verify each summary against the source before keeping it in your brief.",
    },
  },

  // ───────────────────────────────────────────────────────────────
  // Activity 42: Meta-Learning Protocol — AI drafts a starter protocol
  // ───────────────────────────────────────────────────────────────
  {
    activityId: 42,
    stepNumber: 1,
    instruction:
      "Use AI to draft a starter version of your meta-learning protocol. Paste the prompt below. You'll then customize the steps to fit your style and stress-test on something unfamiliar in step 2.",
    detailedHelp:
      "**Why AI drafts the starter.** A meta-learning protocol is a standard structure (ask → example → try → evaluate → cross-check). AI produces a usable first version; the customization is what makes it yours.\n\n**What you'll still own.** Whether each step's prompt template fits your actual style, where you'd source ground truth for the cross-check, and the failure modes the protocol should anticipate.",
    interactiveType: "prompt_sandbox",
    interactiveData: {
      starter:
        "Role: meta-learning coach.\n\nDraft a reusable five-step protocol for learning any new AI capability. Each step should include:\n\n• A short label (3-5 words)\n• A prompt template (in plain English, with [brackets] for variables)\n• A one-sentence note on why this step matters\n\nThe five steps should be:\n1. Ask AI to explain the capability\n2. Ask AI for a worked example\n3. Try the capability on a low-stakes task\n4. Ask AI to evaluate the attempt\n5. Cross-check against official documentation\n\nReturn structured plain text. No preamble.",
      hint: "Edit the prompt templates to your style after AI returns the draft.",
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
