/**
 * wave-46-a21-privacy-workflow-1.0.0.ts
 *
 * A21 (Privacy-First Data Analysis Workflow) — four edits:
 *
 *   - Step 1 (Identify dataset): introduce VITRA where it actually
 *     matters — when the learner is reading the dataset's sensitivity.
 *     Add the {{VITRA:...}} clickable AND a direct link to the
 *     institutional VITRA reference page (Canvas).
 *   - Step 2 (De-identification): drop the bolded "ASU's VITRA
 *     process" sentence. Step 1 now carries the term + reference.
 *   - Step 4 (Analysis): the instruction asks the learner to "save
 *     the prompt and the output." Provide a text_list_entry with two
 *     fields so they actually have somewhere to do that — and so it
 *     persists into later steps that build the audit log.
 *   - Step 7 (Package as reusable checklist): instead of asking the
 *     learner to assemble it from notes, ship a real, downloadable
 *     5-section privacy-first checklist (Markdown / plain text /
 *     HTML / Print-as-PDF). The new ChecklistDownload widget
 *     generates each format client-side from one source.
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

const VITRA_VOCAB =
  "{{VITRA:Vendor IT Risk Assessment — ASU's required process for vetting third-party tools (especially AI ones) before they can be used with student or other sensitive data.}}";
const VITRA_PAGE =
  "https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // -------- Step 1: introduce VITRA + direct link --------
  const newStep1Help =
    `**Identify the dataset before you build the workflow.** A workflow designed without a real dataset always misses something. Even a synthetic-but-realistic dataset is better than abstract design.\n\n` +
    `**Sensitivity drives tool choice.** If the dataset is FERPA-applicable (most student data is) or otherwise sensitive, you can only run it through a ${VITRA_VOCAB}-cleared AI tool. Read the institutional reference: [ASU's VITRA process page](${VITRA_PAGE}). Capture the sensitivity profile below so the next steps can match the tool to the data.\n\n` +
    `**Where this comes from.** The Foundational → Intermediate activity for this skill, [Theme Finder](/activities/20), is where the AI-vs-manual comparison habit comes from. The privacy-first workflow scales that habit to real student data.`;
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: newStep1Help })
    .eq("activity_id", 21)
    .eq("step_number", 1);
  console.log("✓ A21 step 1 — VITRA clickable + direct link added");

  // -------- Step 2: drop the bolded VITRA reference --------
  const newStep2Help =
    `**The de-identification checklist is the first gate.** Names, IDs, course-specific identifiers, anything in the response that identifies a person. If your dataset has free-text responses, scan for accidental identifiers ("as a senior in your honors section…").\n\n` +
    `**De-identify into a separate copy.** Don't edit the source — you may need the un-redacted original to follow up. Work on a working copy from here on.`;
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: newStep2Help })
    .eq("activity_id", 21)
    .eq("step_number", 2);
  console.log("✓ A21 step 2 — VITRA reference dropped (covered in step 1)");

  // -------- Step 4: provide space to save prompt + output --------
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-21-analysis",
        prompt: "Save the exact prompt and the AI's output verbatim — both go into the audit log later.",
        groups: [
          {
            id: "prompt",
            count: 1,
            label: "Prompt you ran",
            placeholder:
              "Paste the exact prompt — wording matters for the audit log.",
          },
          {
            id: "output",
            count: 1,
            label: "AI output (verbatim)",
            placeholder:
              "Paste the AI's response. Don't summarize — the snapshot is what's defensible.",
          },
          {
            id: "context",
            count: 1,
            label: "Tool, model, date",
            placeholder:
              "e.g., Create AI · Claude Sonnet · 2026-05-01",
          },
        ],
      },
    })
    .eq("activity_id", 21)
    .eq("step_number", 4);
  console.log("✓ A21 step 4 — text_list_entry for prompt + output + context");

  // -------- Step 7: provide the downloadable checklist --------
  const checklist = {
    title: "Privacy-First AI Data Analysis — Reusable Checklist",
    description:
      "Run this checklist every time you analyze student or sensitive data with AI. Five gates, in order: de-identify, verify the tool, run the analysis, verify the output, log the run. Adapt the wording to your team's conventions; do not skip the gates.",
    filenameBase: "privacy-first-ai-data-analysis-checklist",
    sections: [
      {
        heading: "1. De-identification",
        items: [
          "Work on a copy. Do not edit the source dataset.",
          "Remove names, student IDs, email addresses, phone numbers.",
          "Remove course-specific identifiers (section numbers, dorm names, advisor names).",
          "Scan free-text responses for accidental identifiers (\"as a senior in your honors section…\").",
          "If the dataset still feels identifiable after redaction, treat it as identified.",
        ],
      },
      {
        heading: "2. Tool verification (VITRA)",
        items: [
          "Confirm the AI tool is VITRA-cleared for the data sensitivity level you have.",
          "Vendor compliance claims (\"FERPA-compliant\") are NOT the same as institutional clearance.",
          "Document the exact tool name, vendor, and model/version you used.",
          "If no cleared tool exists for this data type, stop and escalate.",
        ],
      },
      {
        heading: "3. Analysis",
        items: [
          "Save the exact prompt verbatim.",
          "Save the AI's output verbatim — do not paraphrase before logging.",
          "Note the tool, model, and date the run was made.",
          "If you run multiple iterations, save each prompt + output pair.",
        ],
      },
      {
        heading: "4. Verification",
        items: [
          "Spot-check at least 3 specific claims against the raw data.",
          "Flag any fabricated themes, mis-attributed responses, or invented numbers.",
          "Re-read the output as a skeptic before using it.",
          "If verification reveals systematic errors, discard the run and revise the prompt.",
        ],
      },
      {
        heading: "5. Audit log",
        items: [
          "Log: date, dataset name, sensitivity level, de-identification scope.",
          "Log: tool, model/version, exact prompt, output snapshot.",
          "Log: decisions made, exceptions, signed-off-by.",
          "Store the log somewhere your team can find it (shared drive, audit folder).",
          "Keep the log for as long as your institutional retention policy requires.",
        ],
      },
    ],
  };
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Use the reusable privacy-first checklist below. It has the five gates assembled from the workflow you just walked through; download it in whichever format fits how your team works (Markdown, plain text, HTML, or Print-as-PDF).",
      detailed_help:
        "**One source, four formats.** Markdown for repos and team wikis. Plain text for emails or drop-into-anything copies. HTML for an interactive checkbox version you can fill in browser-side or save. Print-as-PDF when you want a physical handout.\n\n**Adapt, don't rewrite.** The checklist is a starting bar; your team's actual workflow might add steps (e.g., a peer review gate before publication). Edit the file you download to match.\n\n**The deliverable** is the checklist applied to your dataset — capture the run + any adaptations in the deliverable box at the bottom of this page.",
      interactive_type: "checklist_download",
      interactive_data: checklist,
    })
    .eq("activity_id", 21)
    .eq("step_number", 7);
  console.log("✓ A21 step 7 — ChecklistDownload widget seeded");
}

main();
