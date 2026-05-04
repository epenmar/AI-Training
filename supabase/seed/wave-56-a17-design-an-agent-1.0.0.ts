/**
 * wave-56-a17-design-an-agent-1.0.0.ts
 *
 * A17 (Design an Agent) — bring the activity in line with what the
 * deliverable promises (a real visual agent blueprint), and surface
 * sample workflows learners can pick from.
 *
 *   - Step 1: chip_selector with 6 sample workflows + Other (for
 *     learners who want to bring their own). The follow-up captures
 *     a 1-line workflow name.
 *   - Step 2: workflow_builder pinned to the right side of the page.
 *     Learners assemble Goal + a vertical chain of Trigger / Step /
 *     Decision / Human checkpoint / End nodes (each tagged with an
 *     actor — Me / AI / Either) + Tools + Risks. The blueprint
 *     persists in browser storage, so it stays available as the
 *     learner scrolls through later steps.
 *     show_external_tools is on so the Suggest-tools button surfaces
 *     step-specific external options (Zoom Whiteboard, Excalidraw,
 *     Whimsical, FigJam, etc.) — no hard-coded tool names in the
 *     copy, in line with the evergreen-content rule.
 *   - Steps 3-6: tightened to refer to "the workflow you're building
 *     on the right" and to point back at the workflow_builder rather
 *     than asking for a separate map.
 *   - Optional extension (rewritten with full directions): Mermaid
 *     flowchart of the same blueprint, rendered in Mermaid Live —
 *     makes the design portable to any doc, repo, or wiki.
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

const WORKFLOW_KEY = "activity-17-workflow";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // -------- Step 1: chip_selector with sample workflows --------
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Pick a repetitive multi-step workflow from your role. Use one of the samples below or describe your own. Every later step refines the design of *this specific* workflow.",
      detailed_help:
        "**Why a real workflow.** Generic agent designs (\"summarize stuff,\" \"answer email\") are flimsy. A specific recurring task — one you'd actually want off your plate — is what makes the design honest about edge cases.\n\n" +
        "**Pick something repetitive enough that AI helping with it would compound.** A daily 5-minute task and a weekly 60-minute task are both fair game; a one-off is not.\n\n" +
        "**Where this comes from.** This activity is the paper design. The Intermediate → Advanced activity for this skill, [Build and Test a Simple Agent](/activities/18), is where this design becomes a working agent.",
      interactive_type: "chip_selector",
      interactive_data: {
        storageKey: "activity-17-workflow-pick",
        prompt:
          "Pick one to spark your thinking, or write your own. The follow-up captures the workflow you'll design.",
        chipsLabel: "Sample workflows",
        singleSelect: true,
        allowOther: true,
        otherLabel: "My own workflow",
        otherPlaceholder:
          "Describe a repetitive multi-step workflow from your role.",
        options: [
          {
            id: "submission-screen",
            label: "Screen assignment submissions for formatting + completeness",
          },
          {
            id: "module-summary",
            label: "Generate weekly module summaries from lecture notes",
          },
          {
            id: "feedback-templates",
            label: "Draft feedback notes from a rubric + a student artifact",
          },
          {
            id: "email-triage",
            label: "Sort and tag incoming student email by topic",
          },
          {
            id: "quiz-generation",
            label: "Generate a quiz set from a chapter with target Bloom levels",
          },
          {
            id: "meeting-prep",
            label: "Build a meeting agenda from the prior meeting's notes",
          },
          {
            id: "policy-lookup",
            label: "Answer a category of FAQ from a policy doc you maintain",
          },
        ],
        followUps: [
          {
            id: "name",
            label: "Your workflow (in your words)",
            placeholder:
              "e.g., \"Weekly intro-bio module summary, pulled from Friday lecture notes\"",
          },
        ],
      },
    })
    .eq("activity_id", 17)
    .eq("step_number", 1);
  console.log("✓ A17 step 1 — chip_selector with sample workflows");

  // -------- Step 2: workflow_builder pinned right --------
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Use the workflow builder on the right (or below on narrow screens) to map your agent: Goal up top, then the chain of Trigger → Steps → Decisions → Human checkpoints → End. Tag each node with the actor (Me / AI / Either). Capture the tools the agent would need access to and the risks down the bottom.",
      detailed_help:
        "**Why a structured builder, not freeform.** A blueprint that names actors per step (Me vs. AI vs. Either) and surfaces human checkpoints catches the ambiguity that kills agents in the field — \"who decides if this submission is borderline?\" needs an answer before any code exists.\n\n" +
        "**Node types and what they're for:**\n" +
        "- **Trigger** — what kicks the agent off (a time, an event, a button click, a file landing in a folder).\n" +
        "- **Step** — a discrete action the actor takes.\n" +
        "- **Decision** — a fork in the path. Add Steps under each branch.\n" +
        "- **Human checkpoint** — a pause where a person reviews before the agent continues. Belongs anywhere a mistake is hard to undo, judgment is required, or sensitive data is involved.\n" +
        "- **End** — the agent's done condition.\n\n" +
        "**Prefer the in-page builder** for capture — your design auto-saves, and step 6 will ask you to look at it again. **If you'd rather sketch in a different tool**, the Suggest-tools button below offers step-specific picks (whiteboard tools, diagram tools, even shared Coda canvases — the right answer depends on how your team already collaborates).",
      interactive_type: "workflow_builder",
      interactive_data: {
        storageKey: WORKFLOW_KEY,
        prompt: "Build your agent's blueprint.",
      },
      pin_to_side: true,
      show_external_tools: true,
    })
    .eq("activity_id", 17)
    .eq("step_number", 2);
  console.log("✓ A17 step 2 — workflow_builder pinned right + suggester on");

  // -------- Step 3 — refer to the workflow on the right --------
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Walk every node in your workflow and re-tag the actor. Could AI actually do this step (Yes / Partially / No)? For \"Partially,\" rewrite the description to spell out what the human still does.",
      detailed_help:
        "**The dropdown matters more than it looks.** \"Either\" is what you pick when you haven't decided yet; that's a design hole. By the end of this step, every node should be Me, AI, or have a sub-step underneath that splits the work.\n\n" +
        "**Common over-attributions to AI:** judgment calls (\"is this a borderline case?\"), interpretation of intent (\"what was the student trying to ask?\"), trust calls (\"is this source reliable?\"). These belong to humans.",
    })
    .eq("activity_id", 17)
    .eq("step_number", 3);
  console.log("✓ A17 step 3 — points to the right-side builder");

  // -------- Step 4 — checkpoints --------
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Identify where a Human checkpoint belongs and add one to your workflow. The four places it's non-negotiable: anything irreversible, anything involving judgment, anything touching sensitive data, anything with high reputational cost if wrong.",
      detailed_help:
        "**Drag a Human checkpoint node into the right place** — usually right *before* something irreversible (sending email, posting publicly, modifying records, deleting files). A checkpoint *after* the bad thing happened is just a postmortem.\n\n" +
        "**The pattern**: cost-of-error × reversibility. If either is high, add a human gate.",
    })
    .eq("activity_id", 17)
    .eq("step_number", 4);
  console.log("✓ A17 step 4 — checkpoint guidance points to builder");

  // -------- Step 5 — review tools + risks --------
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Fill in the Tools and Risks fields at the bottom of your blueprint. Tools = what the agent needs read or write access to. Risks = what could go wrong, and what the consequence would be.",
      detailed_help:
        "**Tools.** Be specific: \"read-only access to the course Canvas page,\" \"send-as-me email permission,\" \"the student-records database (read only).\" \"AI tools\" alone is not a tool list.\n\n" +
        "**Risks worth naming up front:** wrong-by-default actions on the irreversible side; data exposure if the agent reads sensitive records; subtle drift over time as the source content changes. The risks list is the brief you'd hand someone reviewing this design.",
    })
    .eq("activity_id", 17)
    .eq("step_number", 5);
  console.log("✓ A17 step 5 — tools + risks pointer");

  // -------- Step 6 — final design check --------
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Review the full blueprint on the right. Is there a step where a mistake would be hard to undo and there's no Human checkpoint above it? If so, add one. Then capture a screenshot of the blueprint (or a description of it) in the deliverable box at the bottom of this page.",
      detailed_help:
        "**The single most useful pass.** Walk the chain top-to-bottom and ask: \"if this step does the wrong thing, what does it cost?\" Anywhere the answer is more than \"five minutes to fix,\" there should be a Human checkpoint upstream.\n\n" +
        "**The deliverable.** A screenshot of the blueprint plus a 1-2 sentence note on what you'd build first if you ran it tomorrow. The Intermediate → Advanced activity for this skill, [Build and Test a Simple Agent](/activities/18), turns this blueprint into a working agent.",
    })
    .eq("activity_id", 17)
    .eq("step_number", 6);
  console.log("✓ A17 step 6 — final design check + deliverable pointer");

  // -------- Activity-level: description, deliverable, optional extension --------
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Pick a repetitive multi-step workflow in your role. Map it as an agent blueprint — Goal, Trigger, Steps (each tagged with Me / AI / Either), Decisions, Human checkpoints, Tools, Risks — using the in-page builder pinned to the right. Don't build it yet; the next-level activity does the build.\n\n" +
        "Optional extension — Make the blueprint portable as a Mermaid flowchart so it lives in any doc, repo, or wiki:\n\n" +
        "1. Open the chat tool you've been using.\n" +
        "2. Paste this prompt, with your blueprint filled in:\n\n" +
        "> Produce a Mermaid `flowchart TD` (top-down) of the agent design below. Use the `[ ]` shape for Steps, `{ }` for Decisions, `(( ))` for Triggers, double-bordered `[[ ]]` for Human checkpoints, and a stadium `([ ])` for End. Add `style` directives to give Human checkpoint nodes a maroon fill (`#fbf2f4`) and Trigger a soft orange (`#ffe9d9`). On each edge, label the actor — Me, AI, or Either.\n>\n> Goal: [paste from your blueprint]\n> Workflow:\n> [paste each node — Type / Actor / Description — in order]\n> Tools: [paste]\n> Risks: [paste]\n\n" +
        "3. Copy the Mermaid output and paste into [Mermaid Live](https://mermaid.live) to render the visual.\n" +
        "4. Submit the rendered diagram alongside the in-page blueprint screenshot.\n\n" +
        "What this is testing: agent designs travel poorly as text. A Mermaid version is the format that drops cleanly into team docs and survives copy-paste.",
      deliverable:
        "Your agent blueprint — a screenshot of the in-page builder, OR a Mermaid flowchart, OR a hand-drawn version photographed — with Goal, Trigger, Steps (with actor tags), Human checkpoints, Tools, and Risks all visible. Plus a 1-2 sentence note on what you'd build first if you ran it tomorrow.",
    })
    .eq("id", 17);
  console.log("✓ A17 description / deliverable / optional extension updated");
}

main();
