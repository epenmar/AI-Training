/**
 * Adds an explicit Community Look Book contribution to the Optional
 * extension of four Advanced activities whose deliverables are
 * naturally shareable artifacts — discussion guides, designed
 * learning experiences, case studies, and team briefs.
 *
 * Rationale: "building and sharing AI skills" wasn't showing up as
 * an explicit piece of the learning flow. These four activities are
 * the ones where the artifact is *for* other people, so having them
 * culminate in a community post makes the peer-learning loop
 * explicit rather than implicit.
 *
 * Run with: npx tsx --env-file=.env.local supabase/seed/add-community-sharing-extensions.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

type Update = {
  id: number;
  description: string;
};

const updates: Update[] = [
  {
    // A30 — Skill 10 — Lead a Discussion
    id: 30,
    description:
      "Prepare a 5-minute informal pitch for colleagues: 'What should our department's stance on AI be?' Use AI to draft a talking-points slide covering one capability, one limitation, one risk, and a proposed next step.\n\nOptional extension: Expand to a full 15-minute facilitated discussion guide with anticipated objections, responses, and a structured path to a team decision — then post the guide in the Community Look Book so other facilitators can borrow your structure.",
  },
  {
    // A33 — Skill 11 — Design a Novel AI Learning Experience
    id: 33,
    description:
      "Sketch a new learning activity that couldn't exist without AI — not a traditional task with AI bolted on. Use AI to draft a visual concept card: the idea, the learning objective, and how AI is structurally essential.\n\nOptional extension: Flesh it out into a complete activity design (student instructions, what you'd need to build, evaluation criteria, what could go wrong) and share it in the Community Look Book so peers can adapt it, critique it, or run it with their own students.",
  },
  {
    // A36 — Skill 12 — Principled Innovation Case Study
    id: 36,
    description:
      "Pick one real AI use case from your work. Apply Principled Innovation lightly: who are the stakeholders, where's the tension between curiosity and care, what's the intent? Use AI to draft a visual stakeholder map.\n\nOptional extension: Turn it into a full case study (context, stakeholders, full PI analysis, proposed path forward) and post it in the Community Look Book — case studies get more useful when other educators weigh in on tensions you may have missed.",
  },
  {
    // A39 — Skill 13 — Curate a Team Brief
    id: 39,
    description:
      "Draft the first issue of a monthly 'AI Update' brief for your team: pick 3 items, plain-language summaries, and one 'try this' action item. Use AI to format it as a visual newsletter page.\n\nOptional extension: Build a reusable template, add relevance tags, write a short editorial voice guide, schedule the second issue — and post the first issue in the Community Look Book so other units can fork your format.",
  },
];

async function run() {
  for (const u of updates) {
    const { error } = await supabase
      .from("level_up_activities")
      .update({ description: u.description })
      .eq("id", u.id);
    if (error) {
      console.error(`A${u.id}: ${error.message}`);
    } else {
      console.log(`Updated activity ${u.id}`);
    }
  }
  console.log("\n✅ Community sharing extensions added");
}

run();
