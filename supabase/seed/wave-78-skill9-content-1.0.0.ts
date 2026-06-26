/**
 * wave-78-skill9-content-1.0.0.ts
 *
 * Skill 9 (Data & privacy) reviewer notes from the Google Doc.
 * A19 = New→Foundational, A20 = Foundational→Intermediate,
 * A21 = Intermediate→Advanced.
 *
 * A19 — AI Meets Your Spreadsheet
 *   Overview: "'course enrollments' begs PII" -> say aggregate/no-PII.
 *   Step 1: "NMU FERPA guide — could it link to a new window?" -> point
 *     to the Explore Sources box (opens new tab).
 *   Step 2: "describe what file types DON'T work (Numbers -> csv)".
 *   Step 5: "explain what data can go into ASU's vetted products" ->
 *     note the data-classification ceiling.
 *
 * A20 — Theme Finder
 *   Step 1: "VITRA definition and approved list could be closer
 *     together" -> put them in the same sentence.
 *   Step 2: synthetic CSV was hard to theme -> acknowledge + reassure.
 *   Step 4: "some AI themes seemed conflated; reflect on the AI's themes
 *     too" -> add an over-merge reflection.
 *   Optional extension (Mermaid): "Mermaid Live requires sign-in" ->
 *     clarify no account is needed to render (only to save), and note
 *     many chat tools preview Mermaid directly.
 *
 * A21 — Privacy-First Data Analysis Workflow
 *   General: "only student data? or other types (webinar attendance)?"
 *     -> broaden to any sensitive/PII data.
 *   Step 1: add concrete PII examples + data-type examples.
 *   Step 2 (de-id): "suggested-tools list shouldn't be here (de-id is
 *     pre-AI)" -> turn tools OFF; add direct/quasi-identifier detail.
 *   Step 3 (tool verification): "give a list of tools" -> turn tools ON
 *     here + link the vetted list (moved from the de-id step).
 *   "steps 2-5 are misrepresented" (guide-step N labeled "Step N-1") ->
 *     relabel the five gates "Gate 1..5" so they don't collide with the
 *     guide's step numbers.
 *   Step 4 (analysis): "no prompt guidance — past levels gave prompts"
 *     -> note this level is design-your-own + brief guidance.
 *   Step 5 (verification): "doesn't require action" -> add concrete action.
 *   Steps 6-7 "redundant / should lead": REFRAME (not reorder) — the walk
 *     -through teaches the gates; the checklist is the takeaway artifact.
 *     (Full reorder available on request.)
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

async function setStep(
  sb: ReturnType<typeof createClient<Database>>,
  activityId: number,
  stepNumber: number,
  fields: Record<string, unknown>
) {
  await sb
    .from("activity_guide_steps")
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .update(fields as any)
    .eq("activity_id", activityId)
    .eq("step_number", stepNumber);
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ===================== A19 — AI Meets Your Spreadsheet =====================
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Overview: In this activity, you will take a simple, non-sensitive dataset — aggregate counts with no student names or IDs (e.g., enrollment totals by department, a public dataset) — and ask AI to describe what it sees: trends, outliers, summary statistics. Then you'll spot-check the AI's claims against the raw data.",
    })
    .eq("id", 19);

  await setStep(sb, 19, 1, {
    detailed_help:
      "**Why non-sensitive matters:** anything you paste into an AI tool leaves your machine. Depending on the tool's terms, it may be stored, used for training, or accessible to the vendor. That makes student-identifying data (names, grades, ID numbers) a hard no for most consumer tools.\n\n" +
      "**FERPA** is the federal law that protects education records — it covers names tied to grades, attendance, enrollment, performance, and other identifiable academic info. The **NMU guide to FERPA and generative AI** (in the Explore Sources and Resources box below — opens in a new tab) walks through the practical implications for faculty.\n\n" +
      "For this activity, use public or fully aggregated data: city open-data portals, data.gov, department-level enrollment totals from IR reports, or a synthetic CSV you make up.",
  });

  await setStep(sb, 19, 2, {
    detailed_help:
      "**What \"read data\" means here:** most modern AI chat tools can accept a pasted table or an uploaded CSV and reason about it directly. ChatGPT, Claude, and Copilot all handle this natively.\n\n" +
      "**What won't work:** proprietary formats like Apple Numbers (`.numbers`) or a screenshot/photo of a table — export to CSV (or paste the values as text) first. Very large files may get silently truncated; if your file is big, sample it down so the AI sees all of it.\n\n" +
      "A few tools run analysis code under the hood — notably ChatGPT's data-analysis mode — which can be more reliable for numeric claims. But for a simple spreadsheet summary, a regular chat window is fine. If you're unsure which tool to use, the **Suggest tools** button below has options matched to this activity.",
  });

  await setStep(sb, 19, 5, {
    detailed_help:
      "The trust question is real. For a summary of *this dataset in ways that match your manual check*, probably yes. For *data you haven't looked at yourself*, that's the risky use case — you have no way to catch the confident misreads unless you already know what the answer should be.\n\n" +
      "**The practical rule:** AI is fine for speeding up analysis on data you already understand; it's unreliable as your only read of data you don't. And keep sensitive data out of tools that aren't ASU-approved. ASU's [vetted tool list](https://ai.asu.edu/ai-tools) shows which tools have passed {{VITRA:Vendor IT Risk Assessment — ASU's required process for vetting third-party tools (especially AI ones) before they can be used with student or other sensitive data.}}.\n\n" +
      "**\"Vetted\" still has a ceiling.** VITRA clears a tool for a *specific* data classification — usually low-risk / directory-level info, not full student records. \"On the approved list\" doesn't mean \"anything goes\": check what data class the tool is cleared for before you put anything sensitive in it.",
  });
  console.log("✓ A19 — overview PII, NMU pointer, file-format limits, vetted-data ceiling");

  // ===================== A20 — Theme Finder =====================
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Overview: In this activity, you will take de-identified open-ended responses (or use the synthetic CSV linked in step 1), read them yourself first, and capture 3-5 themes on your own. Then you'll ask AI to cluster the same responses and place your themes against AI's themes in a Venn — the differences are where the real findings live.\n\n" +
        "Optional extension: Theme map.\n\n" +
        "Take the merged theme list from your Venn and ask AI to render it as a Mermaid mindmap.\n\n" +
        "1. Open the chat tool you've been using.\n" +
        "2. Paste this prompt, with your merged theme list filled in:\n\n" +
        "> Produce a Mermaid mindmap (`mindmap` syntax) of the following clustered themes from a student feedback dataset. Center node = \"Student feedback themes.\" One branch per theme. Under each, list 2-4 sub-points (specific patterns within the theme). Keep labels short — under 8 words each. Mark themes that surfaced in BOTH the human read and the AI read with (✓), themes ONLY-mine with (M), themes ONLY-AI with (A).\n>\n" +
        "> Themes:\n> [paste your merged theme list here, including the M / A / ✓ tag from your Venn]\n\n" +
        "3. To see it rendered, paste the Mermaid code into a free renderer like [Mermaid Live](https://mermaid.live) — you do not need an account; it renders as you paste, and you only sign in if you want to save it. Many AI chat tools will also preview Mermaid directly, so you may not need a separate renderer at all.\n" +
        "4. Capture the rendered image (or the link) and submit it alongside your reflection.\n\n" +
        "Why this is worth doing: the Mermaid pattern is reusable for any clustered output — interview themes, lit-review categories, team-retro patterns. If it works for student feedback, you've added a tool to your kit.",
    })
    .eq("id", 20);

  await setStep(sb, 20, 1, {
    detailed_help:
      "**Why de-identification first:** student data, even open-ended text, falls under FERPA. Putting it into an AI tool that hasn't passed {{VITRA:Vendor IT Risk Assessment — ASU's required process for vetting third-party tools (especially AI ones) before they can be used with student or other sensitive data.}} with names attached is a violation, full stop — so for anything beyond a quick scan, work in a VITRA-cleared tool ([ASU's vetted AI tool list](https://ai.asu.edu/ai-tools) shows which ones qualify).\n\n" +
      "**De-identification checklist:** remove names, student IDs, course-specific identifiers, anything in the response that identifies a person (\"as a senior in your honors section…\").\n\n" +
      "**Don't have your own dataset?** [Download a synthetic 40-response end-of-term feedback CSV](/datasets/end-of-term-feedback-sample.csv) — fabricated but plausible. The activity works the same way; you just won't have the back-of-the-mind sense of \"is this how my students actually sounded?\" Note that and keep going.\n\n" +
      "**Tip:** put the responses in a new doc/sheet for de-identification — don't edit the source. You'll want the original linked back if you need to follow up.",
  });

  await setStep(sb, 20, 2, {
    detailed_help:
      "**Why your read first:** if you skip ahead and let the AI cluster first, you'll anchor on its themes. The point of comparison in step 4 only works if your read is independent.\n\n" +
      "**Don't agonize.** A loose 3–5 themes after 5 minutes is enough. \"Time pressure,\" \"tech frustration,\" \"liked the group work,\" \"wanted more practice,\" \"didn't understand the rubric.\" That kind of grain.\n\n" +
      "**Using the synthetic CSV?** Someone else's responses feel flatter than your own students' voices, and the themes can be harder to spot — that's expected, not a you-problem. Pull 3–5 loose themes anyway; the comparison in step 4 still works.\n\n" +
      "Write each theme as a short noun phrase plus a one-line description. You'll be comparing these against AI's labels in a few minutes.",
  });

  await setStep(sb, 20, 4, {
    detailed_help:
      "**Three things to look for:**\n\n" +
      "**Same themes, different names.** AI calls it \"workload concerns\"; you called it \"too much reading.\" Same content, different label — agreement.\n\n" +
      "**Themes one of you found that the other missed.** Often these are the most useful. AI catches patterns across many responses; you catch nuances that depend on context.\n\n" +
      "**Bad clusters.** Responses grouped together that don't actually fit. AI sometimes glues responses by surface vocabulary rather than meaning. Flag these — they're the cases that force you to reread the originals.\n\n" +
      "**Reflect on the AI's labels, too.** If two of its themes are really the same thing wearing different names, or one theme quietly swallows three of yours, note it — over-merging is the most common way AI clustering misleads.\n\n" +
      "Capture your final combined theme list (the merged set) plus net findings (which approach surfaced what) in the deliverable box at the bottom of this page.",
  });
  console.log("✓ A20 — VITRA/list proximity, synthetic-data note, AI-theme reflection, Mermaid no-signin");

  // ===================== A21 — Privacy-First Data Analysis Workflow =====================
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Overview: In this activity, you will design a five-gate privacy-first workflow for analyzing sensitive data with AI — de-identify, verify the tool is approved, prompt, review the output, log the run. Student data is the running example, but the same gates apply to any sensitive or personally identifiable data (webinar attendance, HR records, research-participant data). You'll leave with a reusable checklist a colleague could pick up and follow.\n\n" +
        "Optional extension: Build out the checklist into a reusable workflow document with an audit log template and run it on a real de-identified dataset, documenting each decision point.",
    })
    .eq("id", 21);

  await setStep(sb, 21, 1, {
    detailed_help:
      "**Identify the dataset before you build the workflow.** A workflow designed without a real dataset always misses something. Even a synthetic-but-realistic dataset is better than abstract design.\n\n" +
      "**It doesn't have to be student data.** Any data tied to identifiable people belongs in this workflow — student records, webinar/attendance lists, HR data, research-participant responses.\n\n" +
      "**Personally identifiable info (PII) to watch for:** names, student or employee IDs, email addresses, phone numbers, dates of birth, home addresses, IP addresses, and *quasi-identifiers* that re-identify in combination (e.g., \"the only veteran in the night section\").\n\n" +
      "**Sensitivity drives tool choice.** If the dataset is FERPA-applicable (most student data is) or otherwise sensitive, you can only run it through a {{VITRA:Vendor IT Risk Assessment — ASU's required process for vetting third-party tools (especially AI ones) before they can be used with student or other sensitive data.}}-cleared AI tool. The institutional VITRA reference is in the Sources and Resources callout below.",
  });

  // Gate 1 — De-identification: tools OFF (de-id is pre-AI); add identifier detail.
  await setStep(sb, 21, 2, {
    instruction:
      "Gate 1 — De-identification: Before touching any AI tool, create a de-identified copy. Document what you removed and how.",
    detailed_help:
      "**De-identification is the first gate, and it happens before any AI tool is involved.** That's why there are no tool suggestions on this step — you do this in your own spreadsheet/editor first.\n\n" +
      "**Two kinds of identifier to remove:**\n" +
      "• *Direct identifiers* — names, IDs, emails, phone numbers: strip these outright.\n" +
      "• *Quasi-identifiers* — details that re-identify someone in combination (\"as a senior in your honors section…,\" \"the only TA who's also a parent\"). Generalize or drop them.\n\n" +
      "**De-identify into a separate copy.** Don't edit the source — you may need the un-redacted original to follow up. Work on the copy from here on.",
    show_external_tools: false,
  });

  // Gate 2 — Tool verification: tools ON here + the vetted list (moved here).
  await setStep(sb, 21, 3, {
    instruction:
      "Gate 2 — Tool verification: Confirm the AI tool you'll use is approved for the type of data you have. Document the tool name and its approval status.",
    detailed_help:
      "**Tool-approval verification means VITRA-cleared, not vendor-claimed.** Vendors will tell you their tool is FERPA-compliant. The institution's {{VITRA:Vendor IT Risk Assessment — ASU's required process for vetting third-party tools (especially AI ones) before they can be used with student or other sensitive data.}} process is the source of truth for whether you can use it with sensitive data.\n\n" +
      "**Check the actual list.** [ASU's vetted AI tool list](https://ai.asu.edu/ai-tools) shows which tools have passed VITRA and for what data class. The **Suggest tools** button below also surfaces ASU-vetted options for this kind of analysis — confirm the one you pick is cleared for *your* data's sensitivity, not just \"approved\" in general.",
    show_external_tools: true,
  });

  // Gate 3 — Analysis: note design-your-own prompt (advanced).
  await setStep(sb, 21, 4, {
    instruction:
      "Gate 3 — Analysis: Run your analysis with a clear, documented prompt. Save the prompt and the output.",
    detailed_help:
      "**At this level you design the prompt — earlier levels handed you one.** That's deliberate: a privacy-first workflow has to work for *your* analysis question, so writing the prompt is part of the skill. A good documented analysis prompt names the artifact, the specific question, the output structure you want, and any constraint (\"don't infer anything not present in the data\").\n\n" +
      "**The exact prompt belongs in the audit log.** Future-you needs to know what was asked, when. Generic notes like \"summarized survey data\" don't pass an audit if the question comes up later.",
  });

  // Gate 4 — Verification: add concrete action.
  await setStep(sb, 21, 5, {
    instruction:
      "Gate 4 — Verification: Spot-check the AI's analysis against your own manual review. Pick 2-3 specific claims, confirm each against the de-identified data, and note any that were wrong.",
    detailed_help:
      "**The output review is where most workflows fail.** AI can fabricate themes, mis-attribute responses, invent numbers. Reviewing AI output against the actual data is non-negotiable, even when it slows you down.\n\n" +
      "**The action, concretely:** pull 2-3 of the AI's specific claims (a count, a \"most students said…,\" a flagged theme), find the supporting rows in your de-identified copy, and confirm or correct each. Log what you checked and what you found — that record is part of the audit trail.",
  });

  // Gate 5 — Log the run (the audit-log template step).
  await setStep(sb, 21, 6, {
    instruction:
      "Gate 5 — Log the run: Use AI to draft an audit-log template, then make it yours. Paste the prompt below into your tool of choice.",
    detailed_help:
      "**The fifth gate is the paper trail.** A privacy-first workflow you can't reconstruct later isn't defensible. This step produces the log that captures the other four gates — what data, which tool + approval status, the exact prompt, and your verification notes.\n\n" +
      "**Why drafting it with AI is appropriate.** Audit-log templates are structurally similar across institutions; AI has plenty of patterns to draw from. The hard part is making it match *your* workflow and the institutional bar — that's the human's job.\n\n" +
      "**What you'll still own.** Whether the template's de-identification fields actually catch what your dataset contains, whether the audit fields satisfy ASU's privacy requirements, and whether a colleague could run it without you in the room.",
  });

  // Step 7 — the checklist is the takeaway artifact (reframe, not reorder).
  await setStep(sb, 21, 7, {
    instruction:
      "Your takeaway: the reusable privacy-first checklist below assembles the five gates you just walked through. Download it in whichever format fits your team (Markdown, plain text, HTML, or Print-as-PDF) and keep it for next time.",
    detailed_help:
      "**Walking the gates was the learning; this checklist is the artifact you keep.** You worked each gate by hand so you understand *why* it's there — now the checklist captures that as something you (or a colleague) can run again without rebuilding it from scratch.\n\n" +
      "**One source, four formats.** Markdown for repos and team wikis. Plain text for emails. HTML for an interactive checkbox version you fill in the browser. Print-as-PDF for a handout.\n\n" +
      "**Adapt, don't rewrite.** The checklist is a starting bar; your team's actual workflow might add a gate (e.g., a peer-review step before publication). Edit the file you download to match.\n\n" +
      "**The deliverable** is this checklist applied to your dataset — capture the run + any adaptations in the deliverable box at the bottom of this page.",
  });
  console.log("✓ A21 — broadened scope, PII detail, gates relabeled, tools moved, prompt/verify guidance, checklist reframed");

  // ===================== Resolve open notes on A19/A20/A21 =====================
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .in("activity_id", [19, 20, 21]);
  const rowIds = ["19", "20", "21", ...(steps ?? []).map((s) => String(s.id))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sbAny = sb as any;
  const { data: resolved, error } = await sbAny
    .from("admin_edit_comments")
    .update({
      status: "resolved",
      resolved_by: admin?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("status", "open")
    .in("row_id", rowIds)
    .select("id");
  if (error) console.warn("(could not resolve notes) " + error.message);
  else console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A19/A20/A21`);
}

main();
