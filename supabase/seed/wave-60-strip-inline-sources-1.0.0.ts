/**
 * wave-60-strip-inline-sources-1.0.0.ts
 *
 * Sources should live ONLY in the green "Explore Sources and
 * Resources" callout. The audit found 4 activities with inline
 * source-content links / paragraphs inside step bodies that were
 * duplicating with the callout (the user flagged A28 step 4's
 * "Sources for going deeper" paragraph in a screenshot).
 *
 * Operational links — tools to *use* (Mermaid Live, Google Scholar,
 * Compare AI, etc.) — stay. Source-content links (Canvas modules,
 * Articulate Rise lessons, lx.asu.edu pages, drive.google.com PDFs)
 * leave the step body and live only in the callout.
 *
 * The four locations cleaned here:
 *   - A21 step 1 (detailed_help): VITRA reference link → callout
 *   - A25 step 1 (instruction + help): two links + supplementary
 *     "Module 3 overview" mention → callout
 *   - A28 step 4 (help): "Sources for going deeper." paragraph
 *     containing Module 1 + Module 2 overview links → deleted
 *   - A37 step 4 (help): "worth bookmarking alongside your three
 *     sources" sentence with Cheat Sheet + Support & Community
 *     links → deleted
 *
 * Each activity's extra_sources already contains the URLs being
 * removed (verified during wave-38 / wave-58 backfills), so the
 * content stays accessible through the callout.
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

  // ---- A21 step 1 detailed_help — drop the VITRA inline link ----
  const a21s1Help =
    "**Identify the dataset before you build the workflow.** A workflow designed without a real dataset always misses something. Even a synthetic-but-realistic dataset is better than abstract design.\n\n" +
    "**Sensitivity drives tool choice.** If the dataset is FERPA-applicable (most student data is) or otherwise sensitive, you can only run it through a {{VITRA:Vendor IT Risk Assessment — ASU's required process for vetting third-party tools (especially AI ones) before they can be used with student or other sensitive data.}}-cleared AI tool. The institutional VITRA reference is linked in the Sources and Resources callout below. Capture the sensitivity profile so the next steps can match the tool to the data.";
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: a21s1Help })
    .eq("activity_id", 21)
    .eq("step_number", 1);
  console.log("✓ A21 step 1 — VITRA inline link removed; pointer to callout");

  // ---- A25 step 1 — strip inline links from instruction + help ----
  const a25s1Instruction =
    "Look up ASU's current guidance on disclosing AI use in faculty or staff work. Two good starting points — ASU's AI hub and the Syllabus statements for generative AI page on Canvas — are linked in the Sources and Resources callout below. Save what you find here, and write a one-sentence summary.";
  const a25s1Help =
    "**Why disclosure matters:** disclosure is what separates using AI as a tool (legitimate, widely accepted) from passing off AI output as your own (misconduct). Policies exist so there's a shared expectation of where the line is.\n\n" +
    "**Where to look at ASU:** start with the Provost's AI page or ASU's main AI hub. The policy landscape is evolving — different colleges and units sometimes have more specific guidance than the university-wide statement. The Module 3 overview in the Teaching and Learning with Generative AI Canvas course is a useful companion if you want to understand what the policies are protecting against — also linked in the Sources and Resources callout below.\n\n" +
    "**Save the URL where you'll find it again.** Bookmark it in your browser or save it here by pasting it below.";
  await sb
    .from("activity_guide_steps")
    .update({ instruction: a25s1Instruction, detailed_help: a25s1Help })
    .eq("activity_id", 25)
    .eq("step_number", 1);
  console.log("✓ A25 step 1 — instruction + help inline links removed");

  // ---- A28 step 4 help — drop the "Sources for going deeper" paragraph ----
  // The Module 1 + Module 2 overview links remain in A28's extra_sources
  // (verified during wave-38 backfill).
  {
    const { data: cur } = await sb
      .from("activity_guide_steps")
      .select("detailed_help")
      .eq("activity_id", 28)
      .eq("step_number", 4)
      .single();
    let h = cur?.detailed_help ?? "";
    // Strip from "**Sources for going deeper.**" through the end of
    // its paragraph (terminated by \n\n or end of string).
    h = h.replace(
      /\n*\*\*Sources for going deeper\.?\*\*[\s\S]*?(?=\n\n|$)/i,
      ""
    );
    h = h.replace(/\s+$/, "");
    await sb
      .from("activity_guide_steps")
      .update({ detailed_help: h })
      .eq("activity_id", 28)
      .eq("step_number", 4);
    console.log("✓ A28 step 4 — \"Sources for going deeper\" paragraph deleted");
  }

  // ---- A37 step 4 help — drop the "worth bookmarking" sentence ----
  // The three linked items already live in A37's extra_sources (Course
  // Glossary, Cheat Sheet, Support & Community page).
  {
    const { data: cur } = await sb
      .from("activity_guide_steps")
      .select("detailed_help")
      .eq("activity_id", 37)
      .eq("step_number", 4)
      .single();
    let h = cur?.detailed_help ?? "";
    // The sentence may be preceded by other prose. Strip the sentence
    // that begins with "The [Course Glossary…" or "The [Quick Reference…"
    // through "worth bookmarking alongside your three sources." Use a
    // wide regex that covers the linked-text pattern variations.
    h = h.replace(
      /(\n+)?The \[Course Glossary[\s\S]*?worth bookmarking alongside your three sources\.?/,
      ""
    );
    h = h.replace(/\s+$/, "");
    await sb
      .from("activity_guide_steps")
      .update({ detailed_help: h })
      .eq("activity_id", 37)
      .eq("step_number", 4);
    console.log("✓ A37 step 4 — \"worth bookmarking\" sentence deleted");
  }
}

main();
