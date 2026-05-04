/**
 * wave-55-graphic-batch-1-1.0.0.ts
 *
 * Five-activity multimedia / alignment batch:
 *
 *   A14 (Style Coach):
 *     - Step 5 becomes "produce an infographic or slide comparing the
 *       three versions" (it was just "compare them in your head").
 *     - Optional extension reframed: voice-cloning experiment with
 *       full directions (record yourself, ask an AI voice tool to
 *       mimic your spoken voice on the AI-revised draft, compare to
 *       the written-voice match). No tool names — uses the
 *       Suggest-tools button.
 *
 *   A15 (Refinement Loop):
 *     - Step 6 pivots from "annotate the progression" to a real
 *       in-page side-by-side highlighter: pick a small slice of the
 *       original and the same slice of the final accepted version,
 *       paste them in the two panes, highlight what changed and why.
 *     - Optional extension: re-run the same generate→critique→revise
 *       loop on a multimedia output (audio, video, image, etc.).
 *       Directions provided; no tools named.
 *
 *   A20 (Theme Finder):
 *     - Step 1 adds a download link for a synthetic public-feel
 *       end-of-term feedback CSV (40 plausible responses) so
 *       learners without their own dataset can still do the activity.
 *     - Step 2 gets a text_list_entry for the themes the learner
 *       identifies on their own pre-AI read.
 *     - Step 3 gets a prompt_sandbox so the prompt is actually
 *       copyable (was just bolded text in the instruction).
 *     - Step 4 gets a venn_entry widget (mine-only / both / AI-only).
 *       Old step 5 is deleted — its work is now folded into step 4.
 *     - Optional extension: Mermaid mindmap from the merged set,
 *       directions in detailed_help, full accordion-length walkthrough.
 *
 *   A32 (Reimagine an Assignment):
 *     - Step 4 stops capturing the learner's plan in plain text.
 *       Instead the learner takes their picked alternative and asks
 *       AI to draft a student-facing assignment description page —
 *       prompt_sandbox with copyable starter.
 *     - Optional extension stays: mock up the multimedia alternative
 *       as a real student-facing artifact in the activity's natural
 *       medium.
 *
 *   A42 / count-fix (handled in code, not seed):
 *     - Activities page subtext "42 hands-on activities across 14
 *       skills" became dynamic counts in src/app/(dashboard)/
 *       activities/page.tsx and learning-paths/page.tsx (separate
 *       commit alongside this wave).
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
  // A14 — Style Coach
  // ====================================================================

  // Step 5: produce the infographic/slide.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Produce an infographic or slide comparing the three versions: (1) the original AI draft, (2) the AI's style-matched revision, (3) your manual edits on top. Add short callouts for what the AI captured and what it couldn't mimic.",
      detailed_help:
        "**Why a single visual.** The three versions side-by-side are what makes the gap visible — generic AI draft, style-attempt, your edit. Callouts on each version turn this from a comparison into a record of what AI can and can't do with your voice.\n\n" +
        "**Use the Suggest tools button** (this step) to find an AI infographic / slide generator that fits — they shift over time, so we don't pin it here. Most accept a pasted-text or markdown input and return a single visual.\n\n" +
        "**Suggested prompt to give the slide / infographic AI:**\n\n" +
        "> Make a single visual comparing three versions of the same passage, side by side. Title it \"AI's voice vs. mine.\" Three labeled columns: Original AI draft / Style-matched revision / My final edits. Below each column, add 2-3 short callouts on what worked and what didn't. Keep it on one page.",
      show_external_tools: true,
    })
    .eq("activity_id", 14)
    .eq("step_number", 5);
  console.log("✓ A14 step 5 — produce infographic/slide");

  // A14 description + deliverable kept media-flexible; optional
  // extension rewritten with full voice-cloning directions.
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Paste a sample of your own writing, ask AI to describe your style, then have it redraft a short piece in that voice. Fix what's still off by hand. Produce a single comparison visual showing the three versions and where AI fell short.\n\n" +
        "Optional extension: Try the same calibration probe on your *spoken* voice. (1) Record yourself reading 1-2 sentences in your normal voice. (2) Use an AI voice tool — the Suggest-tools button surfaces current options; many produce voice clones from short samples. (3) Have it read the AI-revised draft *as you*. (4) Compare the audio match against the written-voice match — same probe, different modality. Submit the audio file as your share if it's the more interesting artifact.",
      deliverable:
        "A three-version comparison (infographic, slide, or audio explainer) with a one-line note per version on what AI captured and what it couldn't mimic.",
    })
    .eq("id", 14);
  console.log("✓ A14 description / deliverable / optional extension updated");

  // ====================================================================
  // A15 — The Refinement Loop
  // ====================================================================

  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Pick a small slice of the original output and the same slice of your final accepted version. Paste them side-by-side below and highlight what changed — green for what improved, yellow for what's still rough, red for what got worse. The point isn't to annotate the whole thing; it's to make the pattern of *what kind of changes* mattered visible.",
      detailed_help:
        "**Why a small slice, not the whole thing.** A four-pass progression is too much to mark up cleanly. A single paragraph or 5-6 sentences side-by-side tells the same story with the changes legible.\n\n" +
        "**What to highlight:**\n" +
        "- **Green** — phrases your final version got right that the AI's first draft didn't.\n" +
        "- **Yellow** — places where it's still not great in either version (often the things only you can fix).\n" +
        "- **Red** — anything the AI's later passes made *worse* (over-revision, hedging, bloat).\n\n" +
        "The patterns you see in the highlights are the actual finding from this activity. \"Most of my green is in specifics and concrete examples; most of my yellow is on tone\" is a real, useful observation about where AI's refinement loop helps and where it doesn't.",
      interactive_type: "side_by_side_highlighter",
      interactive_data: {
        prompt:
          "Paste a small slice of each version (a paragraph, 5-6 sentences). Then highlight the patterns.",
        leftHeading: "Original AI output (Pass 1)",
        rightHeading: "Final accepted version (after your edits)",
        left: {
          storageKey: "activity-15-slice-original",
          placeholder:
            "Paste a small slice (paragraph or 5-6 sentences) of the AI's first draft.",
          legend: [
            { color: "green", label: "Final got it right" },
            { color: "yellow", label: "Still rough in either" },
            { color: "red", label: "Got worse on a later pass" },
          ],
        },
        right: {
          storageKey: "activity-15-slice-final",
          placeholder:
            "Paste the same slice of your final accepted version.",
          legend: [
            { color: "green", label: "Final got it right" },
            { color: "yellow", label: "Still rough in either" },
            { color: "red", label: "Got worse on a later pass" },
          ],
        },
      },
    })
    .eq("activity_id", 15)
    .eq("step_number", 6);
  console.log("✓ A15 step 6 — side_by_side_highlighter slice comparison");

  await sb
    .from("level_up_activities")
    .update({
      description:
        "Use a two-pass workflow: generate a draft, then ask AI to critique it against criteria you provide and revise. Compare a small slice of the original to a small slice of your final accepted version and highlight what changed.\n\n" +
        "Optional extension: Run the same generate → critique → revise loop on a *non-text* output. Pick a medium where you've never tried iteration with AI — a generated image, a synthesized audio clip, an AI-drafted slide, a short AI video. Step-by-step:\n\n" +
        "1. Pick the medium and a concrete artifact you want to make.\n" +
        "2. Use the Suggest-tools button (we don't pin specific tools — they shift) to find an AI for that medium.\n" +
        "3. Generate a first version (Pass 1).\n" +
        "4. Ask an AI to critique it against criteria you set — clarity, accuracy, audience fit, format constraints (Pass 2). For non-text media, you may need to describe the artifact or feed it back as an attachment.\n" +
        "5. Ask the AI to revise based on its own critique (Pass 3).\n" +
        "6. Make your final manual edits (Pass 4) — the AI almost always misses something only you can see.\n" +
        "7. Compare a slice of Pass 1 against your final. What kind of changes mattered? Did the AI's critique-and-revise pass actually improve it, or did it drift? Submit the final artifact + a one-line takeaway on whether iterative refinement transferred to this medium.",
      deliverable:
        "A small-slice comparison (highlighted side-by-side, slide, or annotated doc) plus a one-line note on whether the critique-and-revise pass actually improved your draft.",
    })
    .eq("id", 15);
  console.log("✓ A15 description / deliverable / optional extension updated");

  // ====================================================================
  // A20 — Theme Finder
  // ====================================================================

  // Step 1: dataset download link in detailed_help.
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "**Why de-identification first:** student data, even open-ended text, falls under FERPA. Putting it into a non-{{VITRA:Vendor IT Risk Assessment — ASU's required process for vetting third-party tools (especially AI ones) before they can be used with student or other sensitive data.}}-cleared AI tool with names attached is a violation, full stop.\n\n" +
        "**De-identification checklist:** remove names, student IDs, course-specific identifiers, anything in the response that identifies a person (\"as a senior in your honors section…\").\n\n" +
        "**Don't have your own dataset?** [Download a synthetic 40-response end-of-term feedback CSV](/datasets/end-of-term-feedback-sample.csv) — fabricated but plausible. The activity works the same way; you just won't have the back-of-the-mind sense of \"is this how my students actually sounded?\" Note that and keep going.\n\n" +
        "**Tip:** put the responses in a new doc/sheet for de-identification — don't edit the source. You'll want the original linked back if you need to follow up.\n\n" +
        "For anything beyond a quick scan, run de-identification through a VITRA-cleared tool — see [ASU's vetted AI tool list](https://ai.asu.edu/ai-tools).",
    })
    .eq("activity_id", 20)
    .eq("step_number", 1);
  console.log("✓ A20 step 1 — synthetic-dataset download link added");

  // Step 2: text_list_entry for the user's pre-AI themes.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-20-my-themes",
        prompt:
          "Read the responses yourself first; jot down 3-5 themes you notice. One per box. Saves in your browser.",
        groups: [
          {
            id: "themes",
            count: 5,
            label: "Themes I noticed",
            placeholder:
              "Short noun phrase + 1-line description (e.g., \"Time pressure — workload spiking around midterms\")",
          },
        ],
      },
    })
    .eq("activity_id", 20)
    .eq("step_number", 2);
  console.log("✓ A20 step 2 — text_list_entry for self-identified themes");

  // Step 3: prompt_sandbox so the prompt is actually copyable.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Paste the de-identified responses into your AI tool of choice along with the prompt below. The prompt enforces a structure — labels, descriptions, evidence — so the output is comparable to your own read in step 4.",
      detailed_help:
        "**The prompt below is doing real work.** It sets bounds (4-6 themes), forces labeling (give each a name), demands evidence (which responses go where), and pushes specificity (1-sentence description). If you let AI freelance with \"find themes,\" you'll get vague, overlapping clusters.\n\n" +
        "If AI returns one theme that contains 80% of responses, push back: \"That theme is too broad — split it into 2-3 sub-themes.\"\n\n" +
        "Bring the AI's output to step 4 — that's where you'll compare it against your own read.",
      interactive_type: "prompt_sandbox",
      interactive_data: {
        hint: "Copy this into your AI tool, paste the de-identified responses where indicated.",
        starter:
          "Cluster the open-ended student responses below into 4-6 themes.\n\n" +
          "For each theme:\n" +
          "1. Give it a short noun-phrase name.\n" +
          "2. Write a one-sentence description.\n" +
          "3. List the response IDs (or short verbatim phrases) that belong in it.\n" +
          "\n" +
          "If a response could fit multiple themes, name the primary one but note the secondary in parentheses. Don't drop responses to make the math clean — every response should land somewhere.\n\n" +
          "Responses:\n" +
          "[paste the de-identified responses here, one per line, numbered]",
      },
    })
    .eq("activity_id", 20)
    .eq("step_number", 3);
  console.log("✓ A20 step 3 — prompt_sandbox with copyable starter");

  // Step 4: venn_entry. Combines old step-4 ("compare") + step-5
  // ("build comparison") into one interactive.
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Map the comparison: which themes appear in both your read and the AI's, which only you found, which only the AI found. Capture in the Venn below.",
      detailed_help:
        "**Three things to look for:**\n\n" +
        "**Same themes, different names.** AI calls it \"workload concerns\"; you called it \"too much reading.\" Same content, different label — agreement.\n\n" +
        "**Themes one of you found that the other missed.** Often these are the most useful. AI catches patterns across many responses; you catch nuances that depend on context.\n\n" +
        "**Bad clusters.** Responses grouped together that don't actually fit. AI sometimes glues responses by surface vocabulary rather than meaning. Flag these — they're the cases that force you to reread the originals.\n\n" +
        "Capture your final combined theme list (the merged set) plus net findings (which approach surfaced what) in the deliverable box at the bottom of this page.\n\n" +
        "**Where this goes next.** The Intermediate → Advanced activity for this skill, [Privacy-First Data Analysis Workflow](/activities/21), wraps the AI-clustering habit in de-identification, tool-approval verification, and an audit log defensible under FERPA scrutiny.",
      interactive_type: "venn_entry",
      interactive_data: {
        storageKey: "activity-20-theme-venn",
        prompt:
          "Sort each theme into one of three regions. Saves in your browser.",
        leftCircleLabel: "You",
        rightCircleLabel: "AI",
        leftLabel: "Only YOU found",
        bothLabel: "BOTH found (different labels OK)",
        rightLabel: "Only AI found",
        leftPlaceholder:
          "Themes you caught that AI missed. One per line.",
        bothPlaceholder:
          "Themes you both caught — note if the names differ. One per line.",
        rightPlaceholder:
          "Themes AI surfaced that you didn't. One per line.",
      },
    })
    .eq("activity_id", 20)
    .eq("step_number", 4);
  console.log("✓ A20 step 4 — venn_entry (mine / both / AI)");

  // Delete old step 5 — its work is now in step 4's Venn + deliverable.
  await sb
    .from("activity_guide_steps")
    .delete()
    .eq("activity_id", 20)
    .eq("step_number", 5);
  console.log("✓ A20 step 5 — deleted (folded into step 4)");

  // A20 description / deliverable / optional extension.
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Take de-identified open-ended responses (or use the synthetic CSV linked in step 1). Read them yourself first and capture 3-5 themes. Then ask AI to cluster them and put your themes against AI's themes in a Venn. The differences are where the real findings live.\n\n" +
        "Optional extension — Theme map. Take the merged theme list from your Venn and ask AI to render it as a Mermaid mindmap.\n\n" +
        "1. Open the chat tool you've been using.\n" +
        "2. Paste this prompt, with your merged theme list filled in:\n\n" +
        "> Produce a Mermaid mindmap (`mindmap` syntax) of the following clustered themes from a student feedback dataset. Center node = \"Student feedback themes.\" One branch per theme. Under each, list 2-4 sub-points (specific patterns within the theme). Keep labels short — under 8 words each. Mark themes that surfaced in BOTH the human read and the AI read with a (✓), themes ONLY-mine with (M), themes ONLY-AI with (A).\n>\n> Themes:\n> [paste your merged theme list here, including the M/A/✓ tag from your Venn]\n\n" +
        "3. Copy the Mermaid output and paste into [Mermaid Live](https://mermaid.live) to render the visual.\n" +
        "4. Capture the rendered image (or the link) and submit it alongside your reflection.\n\n" +
        "What this is testing: the Mermaid pattern is reusable for any clustered output — interview themes, lit-review categories, team-retro patterns. If it works for student feedback, you've added a tool to your kit.",
      deliverable:
        "Your Venn comparison + a 2-3 bullet net-findings note (which approach surfaced what, where AI missed, where your read missed). Slide, doc, or screenshot are all fine.",
    })
    .eq("id", 20);
  console.log("✓ A20 description / deliverable / optional extension updated");

  // ====================================================================
  // A32 — Reimagine an Assignment
  // ====================================================================

  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Pick the alternative you'd most want to pilot. Use AI to draft the student-facing assignment description page for it — the actual page a student would read.",
      detailed_help:
        "**Why generate the student-facing page now.** Sketching an alternative on paper is one thing. Drafting the page a student would actually open is what reveals the gaps — the unclear instructions, the missing rubric, the assumptions that don't hold once you have to write them down for someone else.\n\n" +
        "**Use the Suggest-tools button** if you want an AI tool more specialized for assignment writing; the chat tool you've been using will also work.\n\n" +
        "**What you'll still own:** the rubric weighting, the timeline, the specific connection to *your* course's prior content, and any guardrails around AI use within the assignment itself.\n\n" +
        "**The deliverable** is the original + your two alternatives + the polished student-facing page for the one you'd actually pilot.",
      interactive_type: "prompt_sandbox",
      interactive_data: {
        hint: "Replace the bracketed sections with your specifics, then send.",
        starter:
          "Role: experienced course designer drafting a student-facing assignment description page.\n\n" +
          "Course context: [department / level / course name]\n" +
          "Learning objective the assignment must hit: [paste from step 1]\n" +
          "The alternative format I picked: [describe the format — e.g., podcast assignment, AI-generated case study, etc.]\n" +
          "Original assignment this replaces: [short summary]\n" +
          "Time / scope expected of students: [hours / weeks]\n" +
          "What students bring in: [prior knowledge / skills]\n\n" +
          "Draft the student-facing page with these sections:\n\n" +
          "## Assignment overview\n" +
          "(2-3 sentences. What students will do and why it matters.)\n\n" +
          "## Learning objective\n" +
          "(One sentence, plain language.)\n\n" +
          "## What you'll produce\n" +
          "(Specific deliverable description. Format, length, file type.)\n\n" +
          "## Step-by-step instructions\n" +
          "(Numbered. Include any AI-tool use rules.)\n\n" +
          "## Rubric\n" +
          "(3-5 criteria with what \"meets\" looks like for each.)\n" +
          "\n" +
          "## Submission + due date placeholder\n" +
          "(Format and location.)\n\n" +
          "Voice: clear, friendly, specific. No jargon. No filler. Return the page text only — no commentary.",
      },
    })
    .eq("activity_id", 32)
    .eq("step_number", 4);
  console.log(
    "✓ A32 step 4 — prompt_sandbox: AI drafts the student-facing page"
  );

  // A32 description / optional extension.
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Take one existing assignment. Use AI to generate two creative alternatives that meet the same learning objective differently — at least one should treat AI as a student-facing tool. Pick your favorite and use AI to draft the actual student-facing assignment description page.\n\n" +
        "Optional extension — Mock up the student artifact. Pick whichever alternative leans most multimedia and produce one actual sample of what students would create or see:\n\n" +
        "1. Identify the medium your alternative uses — image, audio, short video, or an embeddable interactive.\n" +
        "2. Use the Suggest-tools button to find a current AI tool for that medium (the landscape shifts; we don't pin specifics).\n" +
        "3. Generate one sample artifact — what a student's submission would look like, or what the assignment scaffold would look like.\n" +
        "4. Submit the sample alongside your student-facing page so reviewers can see the activity end-to-end.",
      deliverable:
        "Your two alternatives + the AI-drafted student-facing page for the one you'd pilot. Optional: a sample multimedia artifact a student would produce. Slide, doc, link, image, audio, or video — share whatever the activity produces.",
    })
    .eq("id", 32);
  console.log("✓ A32 description / deliverable / optional extension updated");
}

main();
