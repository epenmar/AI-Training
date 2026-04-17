/**
 * Reshape activity deliverables toward visual, AI-assisted artifacts
 * people actually want to share in the Look Book. No more one-page
 * briefs or memos — swap prose-heavy outputs for slides, diagrams,
 * annotated visuals, and comparison cards drafted with AI and
 * reviewed by human eyes.
 *
 * Convention (carried over from update-activities.ts):
 *   "\n\nOptional extension: " marker splits the core 30-min task
 *   from stretch content that isn't counted in time_estimate.
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx supabase/seed/update-activities-v2.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MARK = "\n\nOptional extension: ";

type Update = {
  id: number;
  description: string;
  deliverable: string;
};

const updates: Update[] = [
  {
    id: 2,
    description:
      "Pick one realistic teaching task (say, writing quiz questions). Try it in two different AI tools. Use AI to draft a 1-slide comparison — columns for each tool, rows for output quality, data handling, and ease of use. Review every claim, fix what's off, and post the slide to the Look Book.",
    deliverable:
      "A single comparison slide: two tools, three criteria (quality / privacy / ease of use), and a one-line 'my pick' at the bottom.",
  },
  {
    id: 3,
    description:
      "Audit one AI tool your department is considering. Check three things: VITRA status, what it does with your data, and whether it's actually good at the task you'd use it for. Have AI draft a 1-slide audit card from your notes; review every fact before sharing." +
      MARK +
      "Turn the card into a fuller visual one-pager with sections for Purpose, Strengths, Risks, and Recommendation you could hand a dean or director.",
    deliverable:
      "A single audit card (slide or visual one-pager) showing the tool name, VITRA status, strengths, risks, and your recommendation — shared to the Look Book.",
  },
  {
    id: 6,
    description:
      "Brainstorm from two contrasting angles on the same problem: ask AI once as a student, once as a skeptical colleague. Use AI to format both lists into a side-by-side visual card showing which ideas only emerged from one angle." +
      MARK +
      "Add a third angle using a 'Tree of Thought' prompt that forces parallel reasoning paths and synthesize a final shortlist with rationale.",
    deliverable:
      "A side-by-side visual card (slide or graphic) showing the two idea sets and which ideas only emerged from one angle.",
  },
  {
    id: 8,
    description:
      "Ask AI to write one paragraph with citations on a topic in your field. Verify every citation — does the article exist, and does it actually say what the AI claims? Produce a visually annotated version of the paragraph with green / yellow / red markup.",
    deliverable:
      "An annotated paragraph (slide, screenshot, or PDF) with green / yellow / red highlights for verified, partially accurate, and fabricated claims.",
  },
  {
    id: 9,
    description:
      "Sketch a short research workflow that uses AI for literature discovery with verification gates (AI suggests → you spot-check in Scholar → you read). Test it on one real research question. Use AI to turn your sketch into a clean workflow diagram (Mermaid, Lucid, or a slide)." +
      MARK +
      "Document a full worked example showing what AI found, what you verified, what you caught, and expand the diagram into a one-page process guide you could hand to a colleague.",
    deliverable:
      "A workflow diagram (slide, Mermaid chart, or flowchart) showing the steps and verification gates, plus a one-line note on what your test run surfaced.",
  },
  {
    id: 12,
    description:
      "Take a real piece of AI-generated content you've used. Run the RACCCA framework (Relevance, Accuracy, Currency, Credibility, Coverage, Audience), one sentence per dimension. Use AI to assemble a visual 6-cell scorecard." +
      MARK +
      "Fill in evidence per dimension and expand the scorecard into a full evaluation with a formal recommendation (use as-is / revise / discard).",
    deliverable:
      "A visual RACCCA scorecard (6-cell grid, slide, or graphic) with a verdict per dimension and a final call: use as-is, revise, or discard.",
  },
  {
    id: 14,
    description:
      "Paste a sample of your own writing, ask AI to describe your style, then have it redraft a short piece in that voice. Fix what's still off by hand. Use AI to assemble the three versions into a comparison slide.",
    deliverable:
      "A three-version comparison slide (generic AI draft, style-matched revision, your final edit) with callouts for what the AI captured and what it couldn't mimic.",
  },
  {
    id: 15,
    description:
      "Use a two-pass workflow: generate a draft, then ask AI to critique it against criteria you provide and revise. Assemble the before/after as a visual card showing what changed." +
      MARK +
      "Add a fourth step — your own manual edit — and document what improved at each stage, calling out what only a human could fix.",
    deliverable:
      "A before/after visual card (slide or graphic) with the two versions and a one-line note on whether the critique-and-revise pass actually improved it.",
  },
  {
    id: 17,
    description:
      "Pick a repetitive workflow in your role. Sketch it: the goal, 3–5 steps, tools it would need, and where a human checks in. Don't build it — just use AI to turn the sketch into a clean agent blueprint diagram.",
    deliverable:
      "A visual agent blueprint (flowchart or labeled diagram) with Goal, Trigger, Steps, Tools, Human checkpoints, and Risks.",
  },
  {
    id: 18,
    description:
      "Using a platform you already have access to (Claude Projects, Gemini Gems, GPT custom instructions), turn your paper design into a working agent. Test with one input and capture a short screen recording or screenshots." +
      MARK +
      "Test with two more inputs, tighten the system prompt based on what drifted, and write a short evaluation of when you'd trust this agent unsupervised.",
    deliverable:
      "A short screen capture or screenshot set of your agent working, with a caption covering the system prompt and where it drifted.",
  },
  {
    id: 20,
    description:
      "Take de-identified open-ended survey responses (or a public dataset if you don't have one). Ask AI to cluster them into 3–5 themes. Spot-check against your own read. Use AI to turn the themes into a visual map (bubble chart, word cloud, or themed grid).",
    deliverable:
      "A visual theme map (slide or graphic) showing the AI-generated themes plus callouts for what each approach caught that the other missed.",
  },
  {
    id: 21,
    description:
      "Draft a privacy-first checklist for analyzing student data with AI: de-identify → verify the tool is approved → prompt → review → log. Use AI to turn it into a visual infographic you could pin in your workspace." +
      MARK +
      "Build out the checklist into a reusable workflow document with an audit log template and run it on a real de-identified dataset, documenting each decision point.",
    deliverable:
      "A visual 5-step privacy-first checklist infographic (slide or graphic) you'd actually use.",
  },
  {
    id: 23,
    description:
      "Use AI to generate a first draft of a 3-slide mini deck on something you're preparing to teach. Evaluate what it got right about structure and what it missed about your audience. Post your revised final deck.",
    deliverable:
      "The final 3-slide mini deck with a one-line note on what you changed from the AI draft and why.",
  },
  {
    id: 24,
    description:
      "Generate one complex visual (comparison infographic or process diagram) with AI, then audit it: labels accurate, accessible color contrast, alt text written, any misleading spatial relationships?" +
      MARK +
      "Expand the audit into a reusable checklist covering accuracy, clarity, accessibility, and bias, and apply it to a second visual from a different tool.",
    deliverable:
      "The final polished visual with visible audit annotations (or a caption) describing what you fixed post-generation.",
  },
  {
    id: 27,
    description:
      "Sketch a short decision tree for AI disclosure: what type of work, what audience, what level of disclosure? Keep it to 4–5 branches. Use AI to clean it into a visual flowchart your team could actually use." +
      MARK +
      "Expand it into a full flowchart with edge cases ('AI suggested structure but I wrote every word,' 'AI generated a draft I rewrote') and rationale for each endpoint.",
    deliverable:
      "A visual decision tree / flowchart (slide or graphic) with 4–5 branches you could share with your team.",
  },
  {
    id: 30,
    description:
      "Prepare a 5-minute informal pitch for colleagues: 'What should our department's stance on AI be?' Use AI to draft a talking-points slide covering one capability, one limitation, one risk, and a proposed next step." +
      MARK +
      "Expand to a full 15-minute facilitated discussion guide with anticipated objections, responses, and a structured path to a team decision.",
    deliverable:
      "A talking-points slide or visual one-pager: framing question, capability, limitation, risk, next step.",
  },
  {
    id: 32,
    description:
      "Take one existing assignment. Use AI to generate two creative alternatives that meet the same learning objective differently. At least one should use AI as a student-facing tool. Use AI to assemble a before/after visual comparing the three.",
    deliverable:
      "A before/after visual (slide or graphic) showing the original plus two alternatives, with a one-line note on which you'd actually pilot.",
  },
  {
    id: 33,
    description:
      "Sketch a new learning activity that couldn't exist without AI — not a traditional task with AI bolted on. Use AI to draft a visual concept card: the idea, the learning objective, and how AI is structurally essential." +
      MARK +
      "Flesh it out into a complete activity design: student instructions, what you'd need to build, evaluation criteria, and a note on what could go wrong.",
    deliverable:
      "A visual concept card (slide or graphic) showing the activity idea, learning objective, and two sentences on how AI is structurally essential (not just useful).",
  },
  {
    id: 36,
    description:
      "Pick one real AI use case from your work. Apply Principled Innovation lightly: who are the stakeholders, where's the tension between curiosity and care, what's the intent? Use AI to draft a visual stakeholder map." +
      MARK +
      "Turn it into a full case study (context, stakeholders, full PI analysis, proposed path forward) and share it with a colleague for feedback before revising.",
    deliverable:
      "A visual stakeholder map or one-pager with stakeholders named, the tension articulated in one line, and your proposed approach.",
  },
  {
    id: 38,
    description:
      "Pull 5 recent AI articles or posts from different sources. For each, write a one-sentence verdict: hype or substance? Use AI to assemble a visual scorecard.",
    deliverable:
      "A 5-item visual scorecard (slide, table, or graphic): Source, Headline, Hype/Substance, Relevance, one-line takeaway.",
  },
  {
    id: 39,
    description:
      "Draft the first issue of a monthly 'AI Update' brief for your team: pick 3 items, plain-language summaries, and one 'try this' action item. Use AI to format it as a visual newsletter page." +
      MARK +
      "Build a reusable template, add relevance tags, write a short editorial voice guide, and schedule the second issue.",
    deliverable:
      "One visual AI Update issue (newsletter layout, slide, or graphic) ready to share with your team.",
  },
  {
    id: 42,
    description:
      "Sketch a reusable protocol for learning any new AI capability: ask AI to explain it, try it on a low-stakes task, cross-check against real docs. Test it on something unfamiliar. Use AI to turn the protocol into a visual flow diagram." +
      MARK +
      "Expand to a 5-step protocol (explain → example → try → AI critiques your attempt → cross-check) with a worked example and notes on where the AI was helpful vs. where you needed external sources.",
    deliverable:
      "A visual flow diagram of your meta-learning protocol, with a one-line note on where AI was useful and where you had to look elsewhere.",
  },
];

// Replace the last step of activity #3 ("Write your one-page brief") with
// an AI-drafted visual audit card that can go to the Look Book.
const stepRewrite = {
  activityId: 3,
  stepNumber: 6,
  newInstruction:
    "Use an AI tool that generates visuals (Gamma, Canva AI, ChatGPT with image output, or similar) to draft a 1-slide audit card from your notes: tool name, VITRA status, strengths, risks, recommendation. Review every fact against your own findings, fix what's wrong, polish the layout, then share it in the Look Book.",
};

async function run() {
  for (const u of updates) {
    const { error } = await supabase
      .from("level_up_activities")
      .update({ description: u.description, deliverable: u.deliverable })
      .eq("id", u.id);
    if (error) {
      console.error(`#${u.id} failed: ${error.message}`);
    } else {
      console.log(`Updated #${u.id}`);
    }
  }

  const { error: stepErr } = await supabase
    .from("activity_guide_steps")
    .update({ instruction: stepRewrite.newInstruction })
    .eq("activity_id", stepRewrite.activityId)
    .eq("step_number", stepRewrite.stepNumber);
  if (stepErr) {
    console.error(`Step rewrite failed: ${stepErr.message}`);
  } else {
    console.log(`Rewrote step ${stepRewrite.stepNumber} of #${stepRewrite.activityId}`);
  }

  console.log("\n✅ All deliverables reshaped toward visual, shareable artifacts");
}

run();
