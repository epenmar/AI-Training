/**
 * wave-47-a22-a18-fixes-1.0.0.ts
 *
 * A22 (Describe It, See It):
 *   - Combine current steps 2 ("write description prompt") and 3
 *     ("try it in an AI tool") into one merged step that does both.
 *     The prompt_sandbox stays; the tool-picking guidance from step 3
 *     moves into the merged step's detailed_help. The "Suggest tools"
 *     button is already on the merged step (was on step 2).
 *   - Delete the now-redundant step 3 (id=138). Renumber 4→3 (id=139)
 *     and 5→4 (id=140) by primary key.
 *   - Old step 5 (now step 4): add a text_list_entry for the
 *     "usable as-is / minor fixes / redo manually" buckets the
 *     instruction asks the learner to fill in. Strip the dangling
 *     forward-bridge to "Slide Deck Draft" (/activities/23) — that
 *     activity was deactivated in the 12-skill restructure.
 *   - A22.description: add an Optional extension that absorbs the
 *     slide-deck-draft idea, so the scaling move still has a home
 *     for learners who want to push past the single-visual scope.
 *
 * A18 (Build and Test a Simple Agent):
 *   - Step 1 currently assumes the learner has done the prerequisite
 *     paper-design activity (A17). Rewrite to "draft a workflow in
 *     the space below, OR visit Design an Agent for the step-by-step
 *     guide" — and provide a text_list_entry for the workflow draft.
 *     Strip the inline platform list from detailed_help.
 *   - Step 1: turn off show_asu_resources (the Create AI callout is
 *     premature here — the user is still drafting on paper).
 *   - Step 2: turn ON show_asu_resources + show_external_tools so the
 *     Create AI callout and the Suggest tools button appear at the
 *     point where the learner is about to actually pick a platform.
 *   - Step 7: rewrite to point at the deliverable box at the bottom
 *     of the page.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ====================================================================
  // A22 (Describe It, See It)
  // ====================================================================

  // ----- Old step 5 (id=140) → new step 4 content + interactive -----
  // Apply the content/interactive update FIRST while it's still at
  // step_number=5, then renumber later.
  const a22Step5Help =
    "Being specific about which bucket each piece falls into is the whole point. It prevents the trap of \"I'll just use this, it's fine\" when actually three labels are wrong.\n\n" +
    "**Usable as-is:** rare, but it happens — typically for simple structures.\n\n" +
    "**Needs minor fixes:** most common. A label wrong, an arrow reversed, colors tweaked.\n\n" +
    "**Would need to redo manually:** the structure is off in ways that can't be patched, or the tool missed what you were going for.\n\n" +
    "Going forward: for anything more complex than a simple chart, AI gives you 70% of a diagram. The remaining 30% is yours.";
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help: a22Step5Help,
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-22-bucket-list",
        prompt:
          "Sort each piece of the AI-generated visual into one of three buckets and explain.",
        groups: [
          {
            id: "usable",
            count: 3,
            label: "Usable as-is",
            placeholder: "What's already publication-ready",
          },
          {
            id: "minor",
            count: 3,
            label: "Needs minor fixes",
            placeholder: "Label, arrow, or color tweaks",
          },
          {
            id: "redo",
            count: 3,
            label: "Would need to redo manually",
            placeholder: "Structure / accuracy issues that can't be patched",
          },
        ],
      },
    })
    .eq("activity_id", 22)
    .eq("step_number", 5);
  console.log(
    "✓ A22 step 5 — bucket list interactive added; slide-deck bridge dropped"
  );

  // ----- Merge step 3 content into step 2 (id=137) -----
  const a22MergedInstruction =
    "Write a description prompt and run it in an AI image or diagram tool. Use the prompt_sandbox below as a starting point, then paste it into a tool that generates visuals.";
  const a22MergedHelp =
    "**Why this exact structure:**\n\n" +
    "- **Diagram type** (flowchart, comparison, hierarchy) tells the tool what shape you want.\n" +
    "- **Key elements** tells it what labels to include.\n" +
    "- **Relationships** (arrows, grouping, order) tells it how to connect them.\n\n" +
    "AI visual tools lean on your description for everything — they can't infer structure from \"make me a diagram of peer review.\" The more you specify, the less you'll need to fix.\n\n" +
    "Realistic example: \"Create a flowchart for the peer review process. Include: submission, editor assignment, reviewer invitation, review, revision, final decision. Show it as a top-to-bottom flow with decision points where papers can be rejected or sent back.\"\n\n" +
    "**Three image-style options most people start with:**\n\n" +
    "*ChatGPT with image generation* (DALL-E inside ChatGPT) for sketchy concept visuals.\n\n" +
    "*Canva AI* for slide-friendly visuals, particularly diagrams that need clean alignment.\n\n" +
    "*A text-to-diagram tool* like [Mermaid Live](https://mermaid.live) (text → diagram) or [Napkin.ai](https://www.napkin.ai) (idea → infographic) for structured visuals.\n\n" +
    "Use the **Suggest tools** button above for current options matched to this activity. If the description doesn't render what you imagined, the prompt is the issue, not the tool — try again with more specific spatial language (\"two columns side-by-side\", \"a flow with arrows pointing right\", \"dark text on a light card\").";
  await sb
    .from("activity_guide_steps")
    .update({
      instruction: a22MergedInstruction,
      detailed_help: a22MergedHelp,
    })
    .eq("activity_id", 22)
    .eq("step_number", 2);
  console.log("✓ A22 step 2 — merged with old step 3 content");

  // ----- Delete the now-redundant step 3 (id=138) -----
  await sb.from("activity_guide_steps").delete().eq("id", 138);
  console.log("✓ A22 — deleted old step 3 (id=138)");

  // ----- Renumber by primary key (avoids cascading-update bug) -----
  await sb
    .from("activity_guide_steps")
    .update({ step_number: 3 })
    .eq("id", 139);
  console.log("✓ A22 step renumber: id=139 → step 3");
  await sb
    .from("activity_guide_steps")
    .update({ step_number: 4 })
    .eq("id", 140);
  console.log("✓ A22 step renumber: id=140 → step 4");

  // ----- A22.description: add Optional extension for slide-deck scaling -----
  const a22NewDescription =
    "Pick a concept you teach and describe it to an AI image or diagram tool. See what it produces and note what's usable versus what needs human correction.\n\n" +
    "Optional extension: Scale the move from a single visual to a five-slide deck draft for the same concept. Generate each slide's visual the same way, then audience-tune the deck (does the order make sense for a learner who's seeing this for the first time? does each slide stand alone if someone joins late?).";
  await sb
    .from("level_up_activities")
    .update({ description: a22NewDescription })
    .eq("id", 22);
  console.log("✓ A22.description — Optional extension added (slide-deck draft scope)");

  // ====================================================================
  // A18 (Build and Test a Simple Agent)
  // ====================================================================

  // ----- Step 1: don't assume A17 is done; provide drafting space -----
  const a18Step1Instruction =
    "Draft the agent's purpose and workflow in the space below, OR visit [Design an Agent](/activities/17) for the step-by-step paper-design guide if you want to think through the agent's role, refusals, and human checkpoints first.";
  const a18Step1Help =
    "**You don't have to start from scratch.** If you've already done [Design an Agent](/activities/17), pull the workflow from there. If you haven't, the space below is enough to get going — a one-sentence purpose and 3-6 numbered steps will turn into a system prompt in step 2.\n\n" +
    "**Most platforms support roughly the same primitives:** a system prompt, persistent instructions, sometimes attached files or tools. The workflow you draft here maps to those primitives. Step 2 is where you turn it into the system prompt and pick the platform — the Create AI callout and the Suggest tools button there will help.";
  await sb
    .from("activity_guide_steps")
    .update({
      instruction: a18Step1Instruction,
      detailed_help: a18Step1Help,
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-18-workflow-draft",
        prompt:
          "A one-sentence purpose plus 3-6 numbered workflow steps is enough to start.",
        groups: [
          {
            id: "purpose",
            count: 1,
            label: "Agent purpose (one sentence)",
            placeholder:
              "What problem does this agent solve, and for whom?",
          },
          {
            id: "steps",
            count: 1,
            label: "Workflow steps",
            placeholder:
              "1) Receive input … 2) Categorize … 3) Reply or escalate …",
          },
        ],
      },
      show_asu_resources: false,
    })
    .eq("activity_id", 18)
    .eq("step_number", 1);
  console.log(
    "✓ A18 step 1 — workflow draft space + neutral framing; ASU callout off"
  );

  // ----- Step 2: turn ON Create AI callout + Suggest tools button -----
  await sb
    .from("activity_guide_steps")
    .update({
      show_asu_resources: true,
      show_external_tools: true,
    })
    .eq("activity_id", 18)
    .eq("step_number", 2);
  console.log("✓ A18 step 2 — Create AI callout + Suggest tools button on");

  // ----- Step 7: point at deliverable box -----
  const a18Step7Instruction =
    "Capture your evaluation in the deliverable box at the bottom of this page: what worked, where it drifted, what you'd change in the system prompt, and whether this agent is ready for a real pilot.";
  await sb
    .from("activity_guide_steps")
    .update({ instruction: a18Step7Instruction })
    .eq("activity_id", 18)
    .eq("step_number", 7);
  console.log("✓ A18 step 7 — points to deliverable box");
}

main();
