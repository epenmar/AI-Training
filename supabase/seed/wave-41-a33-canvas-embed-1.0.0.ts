/**
 * wave-41-a33-canvas-embed-1.0.0.ts
 *
 * A33 (Design a Novel AI Learning Experience): work the "ask AI to
 * create an interactive activity that can be embedded into Canvas"
 * move into the activity at two natural attachment points so it lands
 * for both learners who scan examples and learners who follow the
 * design prompt verbatim.
 *
 *   - Step 2 brainstorm examples: add a 4th bullet about asking AI to
 *     produce an interactive (H5P, embeddable widget, etc.) that drops
 *     directly into Canvas.
 *   - Step 4 starter prompt: add a "Canvas-embeddable artifact"
 *     section to the AI design ask — what to ship, what format, what
 *     embed pathway — so the AI's draft already proposes the embed
 *     route rather than leaving it as an afterthought.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // Step 2: add a fourth example bullet about Canvas-embeddable interactives.
  const newStep2Instruction =
    "Brainstorm 3 possibilities. Examples to spark ideas:\n" +
    "• Students interrogate an AI playing a historical figure, then critique where the AI's responses diverge from the historical record.\n" +
    "• AI generates intentionally flawed work that students must diagnose and fix.\n" +
    "• AI plays the role of a demanding client who keeps changing requirements.\n" +
    "• Ask AI to create an interactive activity (a self-check, a branching scenario, a drag-and-drop sort) that you can embed directly into Canvas — e.g., an H5P module or a small embeddable widget the AI generates the markup for.";
  const newStep2Help =
    "**Structurally essential means the activity collapses without AI.** A worksheet with an \"ask AI\" step bolted on is not structurally AI. An assessment where students must beat an AI-generated answer is.\n\n**On the Canvas-embeddable option:** Canvas accepts HTML embeds, iframes, and H5P content. Asking AI to produce the artifact in one of those formats means the activity ships as a real, runnable thing students touch — not a description of what could be built.";
  await sb
    .from("activity_guide_steps")
    .update({ instruction: newStep2Instruction, detailed_help: newStep2Help })
    .eq("activity_id", 33)
    .eq("step_number", 2);
  console.log("✓ A33 step 2 — added Canvas-embed example + supporting note");

  // Step 4: extend the starter prompt with a Canvas-embeddable section.
  const newStep4Data = {
    hint: "Edit the bracketed sections, then send. Evaluate: does each section actually achieve what it claims?",
    starter:
      "Role: learning experience designer drafting an AI-essential activity.\n\n" +
      "Learning objective: [the specific objective]\n" +
      "Discipline / course context: [details]\n" +
      "Student population: [who they are; what they bring]\n\n" +
      "Draft an activity design with these sections:\n\n" +
      "## How AI is structurally used\n" +
      "(One paragraph. AI must be essential; if you can imagine the activity without AI, the design isn't strong enough.)\n\n" +
      "## Student-facing instructions\n" +
      "(Numbered, in order. Include how students should handle predictable AI failures.)\n\n" +
      "## ID build list\n" +
      "(Prompts to write, system prompts, rubric, exemplars, troubleshooting.)\n\n" +
      "## Evaluation criteria\n" +
      "(Three criteria. Each must reward something AI can't do for the student.)\n\n" +
      "## Pre-mortem\n" +
      "(Three likely failure modes + how the instructor would notice each.)\n\n" +
      "## Canvas-embeddable artifact\n" +
      "(Propose an interactive component that can be embedded directly into Canvas — H5P module, iframe widget, or small embeddable HTML page. Specify the format, what students do with it, and the rough embed pathway.)\n\n" +
      "Return structured plain text. No commentary outside the sections.",
  };
  const newStep4Help =
    "**Why AI drafts here.** Activity design templates have predictable bones: objective, AI's structural role, student instructions, ID artifacts, evaluation criteria. AI can produce a usable scaffold; the design judgment is in *evaluating* the draft.\n\n**What you'll still own.** Whether the activity is actually structurally AI-dependent (vs. AI-bolted-on), whether the predicted failure modes match what would actually happen in your classroom, and the rubric that rewards what AI can't do for students.\n\n**About the Canvas-embeddable section.** Asking AI to propose the embeddable artifact up front (not after the design is locked) keeps the artifact-shape and the activity-shape in conversation. If the AI can't propose a clean embed for the activity you've described, that's a signal to either reshape the activity or pick a different artifact format.";
  await sb
    .from("activity_guide_steps")
    .update({ interactive_data: newStep4Data, detailed_help: newStep4Help })
    .eq("activity_id", 33)
    .eq("step_number", 4);
  console.log("✓ A33 step 4 — Canvas-embeddable artifact section added to prompt + help");
}

main();
