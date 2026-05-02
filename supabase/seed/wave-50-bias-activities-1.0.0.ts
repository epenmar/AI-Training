/**
 * wave-50-bias-activities-1.0.0.ts
 *
 * A43 (Spot the Bias) — give learners a real workspace:
 *   - Step 1: text_list_entry for the task + the two matched subjects.
 *   - Step 2: turn on show_asu_resources (Compare AI is the natural
 *     surface for running both prompts side-by-side). Reframe the
 *     instruction since Compare AI runs both at once — no need for
 *     two fresh chats.
 *   - Step 3: text_list_entry with two equal-count groups so the
 *     subject 1 / subject 2 outputs render side-by-side via the
 *     paired-row grid.
 *
 * A44 (Bias Check Pass):
 *   - Step 1: chip_selector with the example workflows + an Other
 *     chip; follow-up textareas for audience and risk profile so the
 *     "capture workflow + audience + risk" ask is fulfilled in one
 *     widget.
 *   - Step 2: prompt_sandbox with the bias-check prompt that was
 *     previously only in detailed_help (the instruction said "in the
 *     prompt sandbox below" but no sandbox was rendered).
 *   - Step 3: turn on show_asu_resources + use highlighter_workspace
 *     so the AI output gets pasted in. Bias-triage legend on the
 *     workspace.
 *   - Step 4: highlighter_workspace with the SAME storageKey as
 *     step 3, so the text "clones" automatically. Same triage
 *     legend — this step is where the learner actually applies the
 *     colors (true signal / false positive / noise).
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
  // A43 (Spot the Bias)
  // ====================================================================

  // Step 1: capture task + the two matched subjects.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-43-setup",
        prompt:
          "Lock in the task and the two matched subjects. Same achievements, only the identity differs.",
        groups: [
          {
            id: "task",
            count: 1,
            label: "Generative task",
            placeholder:
              "e.g., recommendation letter for a candidate with these achievements: …",
          },
          {
            id: "subject1",
            count: 1,
            label: "Subject 1 (identity)",
            placeholder:
              "e.g., Sam Chen, 28, computer-science instructor",
          },
          {
            id: "subject2",
            count: 1,
            label: "Subject 2 (identity)",
            placeholder:
              "e.g., Mary Johnson, 28, computer-science instructor",
          },
        ],
      },
    })
    .eq("activity_id", 43)
    .eq("step_number", 1);
  console.log("✓ A43 step 1 — text_list_entry for task + two subjects");

  // Step 2: surface Create AI / Compare Models; reframe instruction.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Use ASU's Compare AI to run the same prompt for both subjects side-by-side. Use the Create AI / Compare Models callout below to open the tool — same achievements in both runs, only the subject identity differs.",
      detailed_help:
        "**Why Compare AI for this.** Two columns, one prompt — the bias surfaces in the diff. You don't need two browser tabs or two fresh chats; the side-by-side is built into the interface.\n\n**If you'd rather use a different tool:** any AI chat works, but use a fresh conversation for each subject so the AI's working memory in one chat doesn't bleed into the other.",
      show_asu_resources: true,
    })
    .eq("activity_id", 43)
    .eq("step_number", 2);
  console.log("✓ A43 step 2 — Compare AI callout on; instruction reframed");

  // Step 3: paired text_list_entry for side-by-side outputs.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-43-outputs",
        prompt:
          "Paste each AI output verbatim — subject 1 left, subject 2 right. Step 4 marks the differences.",
        groups: [
          {
            id: "out1",
            count: 1,
            label: "Subject 1 — AI output",
            placeholder: "Paste the full output for subject 1",
          },
          {
            id: "out2",
            count: 1,
            label: "Subject 2 — AI output",
            placeholder: "Paste the full output for subject 2",
          },
        ],
      },
    })
    .eq("activity_id", 43)
    .eq("step_number", 3);
  console.log(
    "✓ A43 step 3 — paired text_list_entry (side-by-side outputs)"
  );

  // ====================================================================
  // A44 (Bias Check Pass)
  // ====================================================================

  // Step 1: chips for example workflows + Other; follow-ups for audience + risk.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "chip_selector",
      interactive_data: {
        storageKey: "activity-44-workflow",
        prompt:
          "Pick one of the example workflows below or describe your own, then capture the audience and risk profile.",
        chipsLabel: "Workflow",
        singleSelect: true,
        allowOther: true,
        otherLabel: "Other",
        otherPlaceholder: "Describe the AI workflow you use regularly.",
        options: [
          {
            id: "feedback",
            label: "Drafting feedback notes for a class",
          },
          { id: "quiz", label: "Generating quiz items" },
          {
            id: "survey",
            label: "Summarizing student survey responses",
          },
          { id: "email", label: "Writing emails to colleagues" },
          {
            id: "course-desc",
            label: "Drafting course descriptions",
          },
        ],
        followUps: [
          {
            id: "audience",
            label: "Audience",
            placeholder:
              "Who reads / receives the artifact? (students, peers, public, etc.)",
          },
          {
            id: "risk",
            label: "Risk profile",
            placeholder:
              "Internal-only draft? Student-facing? High reputational cost if wrong?",
          },
        ],
      },
    })
    .eq("activity_id", 44)
    .eq("step_number", 1);
  console.log(
    "✓ A44 step 1 — chip_selector for workflow + audience/risk follow-ups"
  );

  // Step 2: prompt_sandbox with the bias-check prompt the help mentions.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "prompt_sandbox",
      interactive_data: {
        hint: "Edit the bracketed sections to match your workflow's artifact type and the groups relevant to your audience.",
        starter:
          "Review the following [type of artifact] for potential bias against [list of groups relevant to your context — e.g., gender, dialect, ability status, cultural references]. For each potential issue, quote the specific phrase, name the bias dimension, and rate the severity (subtle / moderate / overt). Also flag where the artifact treats one group as default and others as exceptions. Do not rewrite — just identify.\n\n[Paste the AI-generated artifact here]",
      },
    })
    .eq("activity_id", 44)
    .eq("step_number", 2);
  console.log("✓ A44 step 2 — prompt_sandbox with bias-check starter");

  // Step 3: Compare Models callout + highlighter_workspace for the output.
  const a44SharedStorageKey = "activity-44-bias-check-output";
  const a44TriageLegend = [
    { color: "green", label: "True signal — fix this" },
    { color: "yellow", label: "False positive — overcautious" },
    { color: "red", label: "Noise — not actionable" },
  ];
  await sb
    .from("activity_guide_steps")
    .update({
      show_asu_resources: true,
      interactive_type: "highlighter_workspace",
      interactive_data: {
        storageKey: a44SharedStorageKey,
        prompt:
          "Paste the bias-check output here. Step 4 keeps the same text and lets you triage each item by highlighting.",
        placeholder:
          "Paste the AI's bias-check output (the flagged items, severities, and quoted phrases).",
        legend: a44TriageLegend,
      },
    })
    .eq("activity_id", 44)
    .eq("step_number", 3);
  console.log(
    "✓ A44 step 3 — Compare Models callout + highlighter_workspace (paste output)"
  );

  // Step 4: SAME storageKey so step 3's text appears here automatically;
  // bias-triage legend is the active toolset here.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "highlighter_workspace",
      interactive_data: {
        storageKey: a44SharedStorageKey,
        prompt:
          "Triage each flag by highlighting: green (true signal), yellow (false positive), red (noise). Same text as step 3.",
        placeholder:
          "If empty, paste the bias-check output in step 3 first — it'll appear here automatically.",
        legend: a44TriageLegend,
      },
    })
    .eq("activity_id", 44)
    .eq("step_number", 4);
  console.log(
    "✓ A44 step 4 — highlighter_workspace cloned from step 3 (triage view)"
  );
}

main();
