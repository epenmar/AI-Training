/**
 * Cap every level-up activity at 30 minutes. Advanced tiers keep their
 * depth via an "optional extension" that is NOT counted in time_estimate.
 *
 * Convention: descriptions with an optional extension use a literal
 * "\n\nOptional extension: ..." suffix. The activity detail page parses
 * this marker and renders the extension in its own callout.
 *
 * Run with:
 *   NEXT_PUBLIC_SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... \
 *     npx tsx supabase/seed/update-activities.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Update = {
  id: number;
  time_estimate: string;
  description: string;
  deliverable?: string;
};

const MARK = "\n\nOptional extension: ";

const updates: Update[] = [
  // Skill 1: Tool evaluation
  {
    id: 2,
    time_estimate: "30 min",
    description:
      "Pick one realistic teaching task (say, writing quiz questions). Try it in two different AI tools and jot down which one fit better and why — think about output quality, data handling, and how much editing you'd do.",
    deliverable:
      "A short note: the task you tried, the two tools compared, which one you'd use again, and one limitation of the winner.",
  },
  {
    id: 3,
    time_estimate: "30 min",
    description:
      "Audit one AI tool your department is considering. Spend the time checking just three things: its VITRA status, what it does with your data, and whether it's actually good at the specific task you'd use it for." +
      MARK +
      "Turn your audit into a one-page recommendation brief (Purpose, Tool, VITRA status, Strengths, Risks, Recommendation) you could share with a dean or director.",
    deliverable:
      "Three short bullet answers — one per audit question — plus a one-line recommendation: use, revisit later, or pass.",
  },

  // Skill 2: Brainstorming
  {
    id: 6,
    time_estimate: "30 min",
    description:
      "Brainstorm from two contrasting angles on the same problem: ask the AI once as a student, once as a skeptical colleague. Compare what each prompt surfaces." +
      MARK +
      "Add a third angle using a 'Tree of Thought' prompt that forces parallel reasoning paths, then synthesize a final shortlist with rationale.",
    deliverable:
      "A short doc with the two prompts, the ideas each produced, and which ideas only emerged from one angle.",
  },

  // Skill 3: Research
  {
    id: 8,
    time_estimate: "30 min",
    description:
      "Ask AI to write one paragraph with citations on a topic in your field. Verify every citation — does the article exist, and does it actually say what the AI claims?",
    deliverable:
      "The paragraph with color-coded markup: green (verified), yellow (partially accurate), red (fabricated or misrepresented).",
  },
  {
    id: 9,
    time_estimate: "30 min",
    description:
      "Sketch a short research workflow that uses AI for literature discovery with verification gates (e.g., AI suggests sources → you spot-check in Scholar → you read the verified ones). Test it on one real research question." +
      MARK +
      "Document a full worked example showing what the AI found, what you verified, what you caught, and turn the sketch into a one-page workflow diagram you could hand to a colleague.",
    deliverable:
      "A half-page workflow sketch with verification gates and notes from one test run — what worked, what you had to catch.",
  },

  // Skill 4: Verification
  {
    id: 12,
    time_estimate: "30 min",
    description:
      "Take a real piece of AI-generated content you've used or considered using. Run the RACCCA framework (Relevance, Accuracy, Currency, Credibility, Coverage, Audience) but keep it to one sentence per dimension." +
      MARK +
      "Expand each line into a fuller evaluation memo with evidence per dimension and a formal recommendation (use as-is / revise / discard).",
    deliverable:
      "A six-line RACCCA quick-check with a final call: use as-is, revise, or discard.",
  },

  // Skill 5: Writing quality
  {
    id: 14,
    time_estimate: "30 min",
    description:
      "Paste a sample of your own writing and ask the AI to describe your style. Then have it redraft a short piece in that style. Fix what it still gets wrong by hand.",
    deliverable:
      "The generic AI draft, the style-matched revision, and your final edit — with a note on what the AI captured well and what it couldn't mimic.",
  },
  {
    id: 15,
    time_estimate: "30 min",
    description:
      "Use a two-pass workflow: generate a draft, then ask the AI to critique it against criteria you provide and revise. Compare the two versions." +
      MARK +
      "Add a fourth step — your own manual edit — and document what improved at each stage, calling out what only a human could fix.",
    deliverable:
      "Two versions (original and revised) with a short note on whether the critique-and-revise pass actually improved it.",
  },

  // Skill 6: Agents
  {
    id: 17,
    time_estimate: "30 min",
    description:
      "Pick a repetitive workflow in your role. Sketch it on paper: the goal, 3–5 steps, the tools it would need, and where a human needs to check in. Don't build it.",
    deliverable:
      "A one-page paper sketch: Goal, Trigger, Steps, Tools, Human checkpoints, Risks.",
  },
  {
    id: 18,
    time_estimate: "30 min",
    description:
      "Using a platform you already have access to (Claude Projects, Gemini Gems, GPT custom instructions), turn your paper design into a system prompt. Test it with one input and note where it drifts." +
      MARK +
      "Test with two more inputs, tighten the system prompt based on what you saw, and write a short evaluation of when you'd trust this agent unsupervised.",
    deliverable:
      "The system prompt plus a short note on the one test run — where it stayed on-task and where it drifted.",
  },

  // Skill 7: Data / privacy
  {
    id: 20,
    time_estimate: "30 min",
    description:
      "Take de-identified open-ended survey responses (or a public dataset if you don't have one). Ask AI to cluster them into 3–5 themes. Spot-check against your own read.",
    deliverable:
      "A short comparison: AI-generated themes vs. your own read, and one example of something each approach caught that the other missed.",
  },
  {
    id: 21,
    time_estimate: "30 min",
    description:
      "Draft a privacy-first checklist for analyzing student data with AI: de-identify → verify the tool is approved → prompt → review → log. Run it once on a sample." +
      MARK +
      "Turn the checklist into a reusable workflow document with an audit log template and run it on a real de-identified dataset, documenting each decision point.",
    deliverable:
      "A 5-step checklist you'd actually use, with notes from one test run of it on a sample.",
  },

  // Skill 8: Visuals
  {
    id: 23,
    time_estimate: "30 min",
    description:
      "Use AI to generate a first draft of a 3-slide mini deck on something you teach. Evaluate what it got right about structure and what it missed about your audience.",
    deliverable:
      "The AI draft alongside your revised version, with notes on what you kept, what you changed, and what the AI couldn't know about your context.",
  },
  {
    id: 24,
    time_estimate: "30 min",
    description:
      "Generate one complex visual (comparison infographic or process diagram) with AI, then audit it: labels accurate, accessible color contrast, alt text written?" +
      MARK +
      "Expand the audit into a reusable checklist covering accuracy, clarity, accessibility, and bias, and apply it to a second visual from a different tool.",
    deliverable:
      "The final visual plus a short audit list of what you fixed post-generation (labels, contrast, alt text, etc.).",
  },

  // Skill 9: Disclosure
  {
    id: 27,
    time_estimate: "30 min",
    description:
      "Sketch a short decision tree for AI disclosure: what type of work, what audience, what level of disclosure? Keep it to 4–5 branches." +
      MARK +
      "Expand it into a full visual flowchart with edge cases ('AI suggested structure but I wrote every word,' 'AI generated a draft I then rewrote') and rationale for each endpoint.",
    deliverable:
      "A simple 4–5 branch decision sketch (paper or digital) you could share with your team.",
  },

  // Skill 10: Capabilities/limitations
  {
    id: 30,
    time_estimate: "30 min",
    description:
      "Prepare a 5-minute informal pitch for colleagues: 'What should our department's stance on AI be?' Cover one capability, one limitation, one risk, and a proposed next step." +
      MARK +
      "Expand to a full 15-minute facilitated discussion guide with anticipated objections, responses, and a structured path to a team decision.",
    deliverable:
      "A 5-bullet talking-points card: framing, capability, limitation, risk, next step.",
  },

  // Skill 11: Creativity
  {
    id: 32,
    time_estimate: "30 min",
    description:
      "Take one existing assignment. Use AI to generate two creative alternatives that meet the same learning objective differently. At least one should use AI as a student-facing tool.",
    deliverable:
      "The original plus two alternatives, with a one-line note on which you'd actually pilot and why.",
  },
  {
    id: 33,
    time_estimate: "30 min",
    description:
      "Sketch a new learning activity that couldn't exist without AI — not a traditional task with AI bolted on. Pick the idea, write the learning objective, and describe how AI is structurally essential." +
      MARK +
      "Flesh it out into a complete activity design: student instructions, what you'd need to build, evaluation criteria, and a note on what could go wrong.",
    deliverable:
      "A half-page sketch: the activity idea, learning objective, and two sentences on how AI is structurally essential (not just useful).",
  },

  // Skill 12: Principled use
  {
    id: 36,
    time_estimate: "30 min",
    description:
      "Pick one real AI use case from your work. Apply Principled Innovation lightly: who are the stakeholders, where's the tension between curiosity and care, what's the intent?" +
      MARK +
      "Write it up as a full case study (context, stakeholders, full PI analysis, proposed path forward) and share it with a colleague for feedback before revising.",
    deliverable:
      "A half-page reflection with stakeholders named, the tension articulated in one line, and your proposed approach.",
  },

  // Skill 13: Staying informed
  {
    id: 38,
    time_estimate: "30 min",
    description:
      "Pull 5 recent AI articles or posts from different sources. For each, write a one-sentence verdict: hype or substance? Does it affect my work?",
    deliverable:
      "A 5-item table: Source, Headline, Hype/Substance verdict, Relevance (High/Med/Low), one-sentence takeaway.",
  },
  {
    id: 39,
    time_estimate: "30 min",
    description:
      "Draft the first issue of a monthly 'AI Update' brief for your team: pick 3 items, write plain-language summaries, and add one 'try this' action item." +
      MARK +
      "Build a reusable template, add tags for relevance, write a light editorial voice guide, and schedule the second issue.",
    deliverable:
      "One short AI Update brief, ready to share with your team.",
  },

  // Skill 14: Meta-learning
  {
    id: 42,
    time_estimate: "30 min",
    description:
      "Sketch a reusable protocol for learning any new AI capability: ask the AI to explain it, try it on a low-stakes task, cross-check against real docs. Test it on something unfamiliar to you." +
      MARK +
      "Expand to a 5-step protocol (explain → example → try → AI critiques your attempt → cross-check) with a worked example and notes on where the AI was helpful vs. where you needed external sources.",
    deliverable:
      "A 3-step protocol you tested once, with a sentence on where the AI was useful and where you had to go elsewhere.",
  },
];

async function run() {
  for (const u of updates) {
    const payload: Record<string, string> = {
      time_estimate: u.time_estimate,
      description: u.description,
    };
    if (u.deliverable) payload.deliverable = u.deliverable;

    const { error } = await supabase
      .from("level_up_activities")
      .update(payload)
      .eq("id", u.id);
    if (error) {
      console.error(`#${u.id} failed: ${error.message}`);
    } else {
      console.log(`Updated #${u.id}`);
    }
  }
  console.log("\n✅ All activities updated to ≤30 min core");
}

run();
