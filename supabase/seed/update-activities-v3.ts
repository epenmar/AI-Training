/**
 * update-activities-v3.ts
 *
 * Strip hard-coded tool names from activity descriptions, deliverables, and
 * step instructions. The per-activity "Suggest tools" button on the activity
 * detail page replaces these references — keeps upkeep low as tools change.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const MARK = "\n\nOptional extension: ";

type ActivityUpdate = {
  id: number;
  description?: string;
  deliverable?: string;
};

type StepUpdate = {
  activityId: number;
  stepNumber: number;
  instruction: string;
};

const activityUpdates: ActivityUpdate[] = [
  {
    id: 1,
    description:
      "Explore three different AI chat tools. Give each one the same simple prompt and compare what comes back.",
  },
  {
    id: 9,
    description:
      "Sketch a short research workflow that uses AI for literature discovery with verification gates (AI suggests → you spot-check → you read). Test it on one real research question. Use AI to turn your sketch into a clean workflow diagram or slide." +
      MARK +
      "Document a full worked example showing what AI found, what you verified, what you caught, and expand the diagram into a one-page process guide you could hand to a colleague.",
    deliverable:
      "A workflow diagram (slide or flowchart) showing the steps and verification gates, plus a one-line note on what your test run surfaced.",
  },
  {
    id: 16,
    description:
      "Read the PDF section on AI agents (pages 8–9). Then have a conversation with an AI chat tool where you ask it to do a simple multi-step task (e.g., 'Plan a 3-day workshop agenda and draft an invitation email'). Note where it handles steps on its own versus where you have to manually guide each step.",
  },
  {
    id: 18,
    description:
      "Using a platform you have access to that supports persistent instructions or custom agents, turn your paper design into a working agent. Test with one input and capture a short screen recording or screenshots." +
      MARK +
      "Test with two more inputs, tighten the system prompt based on what drifted, and write a short evaluation of when you'd trust this agent unsupervised.",
  },
  {
    id: 22,
    description:
      "Pick a concept you teach and describe it to an AI image or diagram tool. See what it produces and note what's usable versus what needs human correction.",
  },
  {
    id: 41,
    description:
      "Pick an AI feature you haven't tried (e.g., uploading a document, using custom instructions, creating a custom agent). Ask the AI itself to teach you how to use it step by step. Follow its instructions, then evaluate: did it skip steps? Was anything wrong?",
  },
];

const stepUpdates: StepUpdate[] = [
  {
    activityId: 1,
    stepNumber: 1,
    instruction:
      "Open three AI chat tools you have access to. (Use the 'Suggest tools' button above if you're not sure which to try.)",
  },
  {
    activityId: 3,
    stepNumber: 6,
    instruction:
      "Use an AI tool that generates visuals or slides to draft a 1-slide audit card from your notes: tool name, VITRA status, strengths, risks, recommendation. Review every fact against your own findings, fix what's wrong, polish the layout, then share it in the Look Book.",
  },
  {
    activityId: 16,
    stepNumber: 2,
    instruction:
      "Open an AI chat tool and give it a multi-step task: 'Plan a 3-day faculty workshop on AI in teaching. Include: a theme for each day, 3 session titles per day, and a draft invitation email.'",
  },
  {
    activityId: 18,
    stepNumber: 2,
    instruction:
      "Pick your platform: any AI tool that supports persistent instructions or custom agents. (Use the 'Suggest tools' button above if you're not sure what's available.)",
  },
  {
    activityId: 19,
    stepNumber: 2,
    instruction:
      "Open an AI tool that can read data. Paste in or upload the data.",
  },
  {
    activityId: 22,
    stepNumber: 3,
    instruction:
      "Try it in an AI tool that generates visuals or diagrams. (Use the 'Suggest tools' button above for current options.)",
  },
  {
    activityId: 27,
    stepNumber: 5,
    instruction:
      "Draw or build the tree as a visual (flowchart tool, whiteboard, or an AI-generated diagram).",
  },
  {
    activityId: 41,
    stepNumber: 1,
    instruction:
      "Pick an AI feature you haven't tried yet. Examples: uploading a document for analysis, using custom instructions/system prompts, creating a custom agent, using image generation.",
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  for (const u of activityUpdates) {
    const patch: { description?: string; deliverable?: string } = {};
    if (u.description !== undefined) patch.description = u.description;
    if (u.deliverable !== undefined) patch.deliverable = u.deliverable;
    const { error } = await sb
      .from("level_up_activities")
      .update(patch)
      .eq("id", u.id);
    if (error) {
      console.error(`Activity #${u.id} failed:`, error.message);
    } else {
      console.log(`✓ Activity #${u.id} updated`);
    }
  }

  for (const s of stepUpdates) {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({ instruction: s.instruction })
      .eq("activity_id", s.activityId)
      .eq("step_number", s.stepNumber);
    if (error) {
      console.error(
        `Step #${s.stepNumber} of activity #${s.activityId} failed:`,
        error.message
      );
    } else {
      console.log(
        `✓ Step ${s.stepNumber} of activity #${s.activityId} updated`
      );
    }
  }

  console.log("\nDone.");
}

main();
