/**
 * wave-27-research-flowchart-1.0.0.ts
 *
 * Activity 9 (AI-Assisted Research Workflow):
 *
 *   - Step 2 gets a stage_flowchart interactive: 5 clickable stage
 *     chips with detail-on-click + always-visible footer notes for
 *     the "fresh chats" rationale and the "skip a stage" risk
 *     summary. Replaces the dense paragraph + the about-to-be-
 *     deleted step 3 (the "draw a diagram" step).
 *   - Step 3 (draw the diagram) is deleted. The flowchart is the
 *     diagram — drawing it again would be transcription, not
 *     learning.
 *   - Steps 4 → 3, 5 → 4, 6 → 5 renumbered. Cross-references in
 *     step 1 ("step 4") and step 4's new instruction updated.
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

  // 1. Step 1 cross-reference: was "run in step 4" → now "run in step 3"
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Define a research question you're actively working on and capture it below. The workflow you study in step 2 and run in step 3 is built around this exact question.",
    })
    .eq("activity_id", 9)
    .eq("step_number", 1);
  console.log("✓ step 1 cross-reference updated");

  // 2. Step 2: stage flowchart
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Study the 5-stage workflow below — two AI prompts in fresh chats, three human-verification stages between them. Tap each stage to see what happens and what it produces.",
      detailed_help:
        "**The diagram is the design.** Each stage is its own discrete move; together they form the workflow you'll run in the next step. The two AI stages need fresh chats because continuing the stage-1 chat means the AI still believes its fabricated sources are real (it will happily \"synthesize\" from papers that don't exist).",
      interactive_type: "stage_flowchart",
      interactive_data: {
        prompt:
          "Tap any stage to see the detail. The two footer cards explain the fresh-chats rule and what changes if you skip a stage.",
        stages: [
          {
            id: "s1",
            label: "AI prompt #1",
            title: "Generate sources",
            actor: "ai",
            detail: {
              whatHappens:
                "In a fresh chat, ask the AI for an initial list of relevant sources for your step-1 question. Example prompt: \"Give me 8 peer-reviewed articles on [topic] published in the last five years, with full citations.\"",
              output: "Initial list of sources, with citations.",
            },
          },
          {
            id: "s2",
            label: "Human verification",
            title: "Does each source actually exist?",
            actor: "human",
            detail: {
              whatHappens:
                "Search Google Scholar or your library database for each citation. Cross out any that don't exist; flag any that exist but don't match the AI's description.",
              output: "Verified list, only the sources that actually exist.",
            },
          },
          {
            id: "s3",
            label: "Human reading",
            title: "Read the actual abstracts",
            actor: "human",
            detail: {
              whatHappens:
                "Open the verified sources and read their abstracts (not the AI's summary of them). This is what produces the verified set used in stage 4.",
              output: "Verified set of abstracts you've actually read.",
            },
          },
          {
            id: "s4",
            label: "AI prompt #2",
            title: "Synthesize across the verified set only",
            actor: "ai",
            detail: {
              whatHappens:
                "Open a fresh chat. Don't continue the stage-1 chat — it still believes its fabricated sources are real. Paste in the verified-set abstracts and ask the AI for a synthesis of findings across just those.",
              output: "AI synthesis across the verified abstracts only.",
            },
          },
          {
            id: "s5",
            label: "Human verification",
            title: "Does the synthesis hold up?",
            actor: "human",
            detail: {
              whatHappens:
                "Compare the AI's synthesis to what the abstracts actually say. Mark anywhere the AI invented a connection between papers, overstated a finding, or omitted a key qualifier.",
              output:
                "Verified synthesis with what's supported, what's not, and what needs more reading.",
            },
          },
        ],
        notes: [
          {
            title: "Why fresh chats for the two AI stages?",
            body:
              "Continuing the stage-1 chat means the AI's working memory still contains the fabricated sources from stage 1; it will happily \"synthesize\" findings from papers that don't exist. A fresh chat with only the verified abstracts pasted in forces the AI to work from real material.",
          },
          {
            title: "Skip any stage and the workflow's risk profile changes",
            body:
              "No \"verify each source exists\" → fabricated citations propagate. No \"read actual abstracts\" → you cite based on AI's summary, which is often subtly wrong. No \"verify synthesis\" → AI's connections-between-papers may be plausible but unfounded.",
            tone: "warning",
          },
        ],
      },
    })
    .eq("activity_id", 9)
    .eq("step_number", 2);
  console.log("✓ step 2 flowchart wired up");

  // 3. Delete old step 3 (draw the diagram) — the flowchart IS the diagram.
  await sb
    .from("activity_guide_steps")
    .delete()
    .eq("activity_id", 9)
    .eq("step_number", 3);
  console.log("✓ step 3 (draw diagram) removed");

  // 4. Renumber 4 → 3, 5 → 4, 6 → 5. Highest first to avoid transient
  //    collisions, since (activity_id, step_number) has no unique index
  //    but adjacent renumberings could still collide if done in the
  //    wrong order.
  await sb
    .from("activity_guide_steps")
    .update({ step_number: 5 })
    .eq("activity_id", 9)
    .eq("step_number", 6);

  await sb
    .from("activity_guide_steps")
    .update({ step_number: 4 })
    .eq("activity_id", 9)
    .eq("step_number", 5);

  // The previous "step 4" becomes the new step 3 — also rewrite its
  // instruction to reference the flowchart in step 2 and the (renumbered)
  // step numbers.
  await sb
    .from("activity_guide_steps")
    .update({
      step_number: 3,
      instruction:
        "Run the 5-stage workflow from step 2 on the question you captured in step 1. Document what you catch at each verification stage (stages 2, 3, and 5 of the workflow): fabricated sources, misrepresentations, missing nuance.",
    })
    .eq("activity_id", 9)
    .eq("step_number", 4);

  console.log("✓ steps renumbered: 4→3, 5→4, 6→5");
  console.log("\nDone.");
}

main();
