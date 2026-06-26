/**
 * wave-76-skill8-content-1.0.0.ts
 *
 * Skill 8 (Spot the Bias) reviewer notes from the Google Doc. Clean
 * mapping: A43 = New→Foundational, A44 = Foundational→Intermediate,
 * A45 = Intermediate→Advanced.
 *
 * The highlighter toolbar relabel + the "auto-load on sync" fix are in
 * the components (already shipped / this batch). Remaining widget/infra
 * items NOT here: chip-selector copyable labels (A45 step 2) and the
 * "share to look book" error (A45) — flagged separately.
 *
 * A43 — Spot the Bias
 *   Step 1: "tighten — I compared a faculty member and a TA and saw
 *     little difference; false sense of assurance" -> steer to identity
 *     contrasts (gender/race/age/name), not role/seniority.
 *   Step 2: "add the Compare AI URL"; "comparing 2 subjects across all
 *     models = 12 versions, too much" -> hold the model constant, vary
 *     the subject; add compare.aiml.asu.edu; explain Compare AI compares
 *     models, not subjects.
 *   Step 4: "no highlight/notes ability like Activity 7" -> convert the
 *     paste step (3) to a side-by-side highlighter so differences can be
 *     marked; step 4 now names the dimension per highlight.
 *   Step 5: "refers to 'Skill 11 FI activity', I don't know what that is"
 *     -> drop the stale cross-reference.
 *
 * A44 — Bias Check Pass
 *   Step 2: "unclear why an AI-generated artifact would be used — privacy?"
 *     -> clarify the artifact is AI's own workflow output, checked before
 *        it ships.
 *   Step 3: clarify the step-3/step-4 relationship (you paste here, you
 *     highlight in step 4; same text carries over).
 *
 * A45 — Systematic Bias Audit
 *   Step 4: "might need an example of the verification process" -> add a
 *     worked verification example.
 *   Step 5: "I had AI write the memo, maybe too well — where's the human
 *     in the loop?" -> add a human-in-the-loop note.
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

  // ===================== A43 — Spot the Bias =====================

  // Step 1 — steer to identity contrasts, not role/seniority.
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "**The contrast has to be an *identity* attribute, not a role.** Faculty-vs-TA or senior-vs-junior won't surface much — the AI treats those as job facts. Bias shows up along gender, race/ethnicity, name origin, age, or dialect. Hold *everything else* identical and change only that.\n\n" +
        "**Pick a task where tone does the heavy lifting** — a recommendation letter, a performance summary, a speaker bio. These invite warmth/competence framing, which is exactly where bias hides (\"warm and nurturing\" vs \"sharp and authoritative\" for identical accomplishments).\n\n" +
        "**Two matched subjects:** same achievements, same context, different identity. Examples:\n" +
        "• \"Sam Chen\" vs \"Mary Johnson\" (gender + name origin)\n" +
        "• \"Dr. Patel\" vs \"Dr. Smith\" (gendered / cultural name assumptions)\n" +
        "• \"a 28-year-old\" vs \"a 58-year-old\" (age)\n\n" +
        "Document the achievements you'll attribute to both — the AI sees these the same; only the identity changes. If your first run shows almost no difference, the contrast was probably too weak; push it to a stronger identity pairing.",
    })
    .eq("activity_id", 43)
    .eq("step_number", 1);
  console.log("✓ A43 step 1 — identity-contrast guidance tightened");

  // Step 2 — hold the model constant; add the Compare AI URL; kill overload.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Run the same prompt twice in the *same* AI model — once for subject 1, once for subject 2 — and compare the two outputs. Keeping the model fixed means any difference comes from the identity, not the tool.",
      detailed_help:
        "**Hold the model constant; vary only the subject.** This activity compares two *subjects*, not two models. Pick one model and run each subject in its own fresh chat (so one conversation's memory doesn't bleed into the other), then line the two outputs up.\n\n" +
        "**A note on Compare AI.** [ASU's Compare AI](https://compare.aiml.asu.edu) is built to compare *models* side by side, so running both subjects across several models at once leaves you with a wall of outputs (two subjects × several models) — too much to read. For this activity, either use Compare AI with a single model selected, or just use two fresh chats in one tool. Both keep the comparison clean.\n\n" +
        "**Same achievements in both runs.** Only the subject's identity changes.",
    })
    .eq("activity_id", 43)
    .eq("step_number", 2);
  console.log("✓ A43 step 2 — model held constant, Compare AI URL added, overload removed");

  // Step 3 — convert paste step to a side-by-side highlighter.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "side_by_side_highlighter",
      instruction:
        "Paste both outputs below — subject 1 on the left, subject 2 on the right — then highlight the wording that differs. Mark red where a difference looks like bias, yellow where you're not sure.",
      detailed_help:
        "**What to look for as you read:** word-choice differences (\"warm\" vs \"competent\"), qualifications mentioned (\"gentle\" vs \"professional\"), level of specificity, what gets praised vs taken for granted, what the AI proactively warns or hedges about. Highlight those, then name the pattern in step 4.",
      interactive_data: {
        prompt:
          "Paste each output verbatim, then highlight the differences. Red = looks like bias; yellow = a difference you're unsure about.",
        leftHeading: "Subject 1 — AI output",
        rightHeading: "Subject 2 — AI output",
        left: {
          storageKey: "activity-43-mark-left",
          placeholder:
            "Paste subject 1's full AI output, then highlight the telling differences.",
          legend: [
            { color: "red", label: "Looks like bias" },
            { color: "yellow", label: "Difference — unsure" },
          ],
        },
        right: {
          storageKey: "activity-43-mark-right",
          placeholder:
            "Paste subject 2's full AI output, then highlight the telling differences.",
          legend: [
            { color: "red", label: "Looks like bias" },
            { color: "yellow", label: "Difference — unsure" },
          ],
        },
      },
    })
    .eq("activity_id", 43)
    .eq("step_number", 3);
  console.log("✓ A43 step 3 — converted to side-by-side highlighter");

  // Step 4 — name the dimension per highlighted difference.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "For each difference you highlighted in step 3, name the bias dimension it points to (gender, race, age, dialect, ability, etc.) and whether it's overt, subtle, or possibly just noise.",
      detailed_help:
        "**Naming the dimension is what turns a \"difference\" into a finding.** \"Subject 1 got 'nurturing' and subject 2 got 'rigorous' for the same record\" → gender framing. A difference you can't tie to any identity dimension is probably noise — say so, and move on.",
    })
    .eq("activity_id", 43)
    .eq("step_number", 4);
  console.log("✓ A43 step 4 — reworded to name dimensions from the highlights");

  // Step 5 — drop the stale "Skill 11 FI activity" cross-reference.
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "**The takeaway is the workflow change.** \"AI generates these well\" → use it. \"AI subtly biases against [group]\" → don't use it for high-stakes versions of this task without a deliberate bias-check pass first.",
    })
    .eq("activity_id", 43)
    .eq("step_number", 5);
  console.log("✓ A43 step 5 — stale cross-reference removed");

  // ===================== A44 — Bias Check Pass =====================

  // Step 2 — clarify the artifact is AI's own output (not privacy).
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "**A useful bias-check prompt structure:**\n\n" +
        "*\"Review the following [type of artifact] for potential bias against [list of groups relevant to your context — e.g., gender, dialect, ability status, cultural references]. For each potential issue, quote the specific phrase, name the bias dimension, and rate the severity (subtle / moderate / overt). Also flag where the artifact treats one group as default and others as exceptions. Do not rewrite — just identify.\"*\n\n" +
        "Separating identification from rewriting lets you decide what to act on instead of accepting the AI's autocorrect.\n\n" +
        "**What you're checking is AI's own work.** The \"[artifact]\" is whatever your workflow's AI just produced — the draft you were about to use. The bias check runs on that output before it ships. It isn't about privacy; it's about catching bias in AI's product before it reaches your audience.",
    })
    .eq("activity_id", 44)
    .eq("step_number", 2);
  console.log("✓ A44 step 2 — clarified the artifact is AI's own output");

  // Step 3 — clarify the step-3/step-4 relationship.
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "**You paste here; you triage by highlighting in step 4 — same text, carried over.** Run your real workflow, then run the bias-check prompt on its output, and paste the bias-check's flags into the box. Step 4 shows this exact text so you can color each flag. (You do the highlighting — the AI flagged things in words; you decide which are real.)",
    })
    .eq("activity_id", 44)
    .eq("step_number", 3);
  console.log("✓ A44 step 3 — clarified the step 3 → step 4 relationship");

  // ===================== A45 — Systematic Bias Audit =====================

  // Step 4 — add a worked verification example.
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "**The verification rule:** if you can't find verbatim evidence in the artifact for a flagged pattern, drop it from the audit. Audit memos that include unverified AI flags will fail review under any scrutiny.\n\n" +
        "**Worked example.** Say the AI flags: \"feedback to female students used 'effort' language ('hardworking') while male students got 'ability' language ('brilliant').\" To verify, pull the actual notes, search those words, and count. If 8 of 10 \"hardworking\" notes went to women and \"brilliant\" skews male, the pattern holds — quote two real examples. If the words barely appear, drop the flag. Verification is counting and quoting, not vibes.",
    })
    .eq("activity_id", 45)
    .eq("step_number", 4);
  console.log("✓ A45 step 4 — verification worked example added");

  // Step 5 — human-in-the-loop emphasis.
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "**Memo structure:**\n\n" +
        "*Context.* What artifact, who produced it, who reads it.\n" +
        "*Audit dimensions.* Which biases you looked for and why.\n" +
        "*Findings.* For each, the pattern + verbatim evidence + bias dimension + severity.\n" +
        "*Recommendation.* What to change, who owns the change, by when.\n\n" +
        "**Where you stay in the loop.** AI can draft the memo's prose, but the findings are only as trustworthy as *your* verification in step 4, and the recommendation is *your* professional call — what changes, who owns it, by when. A memo that reads well but whose findings you didn't verify is unaudited claims under your name. Draft with AI; own the verification and the recommendation.\n\n" +
        "**Audience matters.** A memo for the artifact's author is different from one for leadership; calibrate accordingly.",
    })
    .eq("activity_id", 45)
    .eq("step_number", 5);
  console.log("✓ A45 step 5 — human-in-the-loop note added");

  // ===================== Resolve open notes on A43/A44/A45 =====================
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .in("activity_id", [43, 44, 45]);
  const rowIds = ["43", "44", "45", ...(steps ?? []).map((s) => String(s.id))];
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
  else console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A43/A44/A45`);
}

main();
