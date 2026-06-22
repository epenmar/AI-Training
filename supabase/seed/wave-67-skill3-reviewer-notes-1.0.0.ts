/**
 * wave-67-skill3-reviewer-notes-1.0.0.ts
 *
 * Skill 3 (Tool choice) reviewer notes from the Coda feedback form,
 * approved 2026-06-22.
 *
 * Reviewer note  ->  change (decisions confirmed with owner):
 *
 * A1 — AI Tool Safari (New -> Foundational)
 *   Step 4: "Is there any value in having participants list the tokens,
 *    cost, and time ... I was surprised my Gemini 3 Flash used 432
 *    tokens while the other 2 used less than 85."
 *     -> Add an optional 5th comparison dimension, "Efficiency (tokens
 *        & speed)," with help noting Compare AI surfaces token counts
 *        and that cost/speed is itself a tool-choice signal.
 *
 * A2 — Tool Selection Matrix (Foundational -> Intermediate)
 *   Step 2 (File support): "mentions ASU's vetted tool list shows which
 *    tools support file uploads, but I couldn't find that on the site."
 *     -> Reword: the list shows what's *approved*; it won't always say
 *        which file types each tool accepts (check the tool's docs).
 *   Step 2 (Sensitive data): "'see ASU's VITRA process (Canvas, ~5 min)'
 *    but didn't link to it ... maybe say 'linked in the Explore Sources
 *    and Resources box below.'"
 *     -> Reword exactly that way (matches our no-inline-links pattern).
 *   Deliverable: "post this to the 'Look Book,' but I would remove
 *    references to the 'Look Book' ... share to the Community space."
 *     -> Drop the "Posted to the Look Book." sentence.
 *
 * A3 — reframed (Intermediate -> Advanced)
 *   "I'm not sure this activity is suitable ... decision maker on
 *    adopting a tool for the department ... IDs shouldn't have to look
 *    up VITRA (buried, 243 pages) ... reframe around recommending
 *    between two AI tools."
 *     -> Owner's reframe: recommend a tool for a chosen PURPOSE to a
 *        COLLEAGUE, where the learner actively looks up and compares two
 *        *like* tools. VITRA demoted from a gated lookup step to one
 *        comparison criterion ("approved? if unsure, de-identified
 *        only"). Six steps rewritten:
 *          1 purpose + two like tools + colleague (text_list_entry)
 *          2 AI first-pass head-to-head research (prompt_sandbox)
 *          3 actively look up & fill the head-to-head (comparison_table)
 *          4 verify the slippery claims (text_list_entry)
 *          5 AI-drafted recommendation note; you make the pick (prompt_sandbox)
 *          6 finalize the recommendation to the colleague (null)
 *   Steps 1 & 3: "info we fill in ... copied down to Step 3's prompt,
 *    but it did not copy down."
 *     -> The reframe removes the false auto-copy promise; step 2's hint
 *        now says to paste step-1 values into the brackets yourself.
 *   "I'm not sure how 'Module 1, Lesson 1 — Experimenting with GenAI at
 *    ASU' supports this activity."
 *     -> Remove that one curated source from A3's extra_sources (stays
 *        on A1/A2, where an intro lesson fits).
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

  // ========================= A1 — AI Tool Safari =========================
  // Step 4: add the optional "Efficiency (tokens & speed)" dimension.
  const a1s4Instruction =
    "Notice these dimensions in each tool's output and capture them in the table below: length, tone, constraint-following, and accuracy — and, if Compare AI shows token counts, efficiency (tokens used and how fast it finished).";
  const a1s4Help =
    "Four core lenses (plus an optional fifth), one per row in the table below.\n\n" +
    "**Length.** Did it stick to three sentences, or did it pad? Some models treat a numeric constraint as a hard rule, others as a loose suggestion.\n\n" +
    "**Tone.** How formal or casual the writing feels. Would you put this in a syllabus as-is, or does it read like a marketing brochure?\n\n" +
    "**Constraint-following.** The prompt said three sentences. Did the tool hold the cap as a hard rule, or did it drift past it?\n\n" +
    "**Accuracy.** Anything that sounds factually off? Active learning has been written about for decades — the AI shouldn't be inventing things here.\n\n" +
    "**Efficiency (optional, but telling).** Compare AI reports how many tokens each model used and how quickly it answered. Two tools can reach the same quality at very different cost — one reviewer watched a fast model burn 432 tokens on a task the others did in under 85. For low-stakes work, the lean tool is often the right default. Skip this row if your view doesn't surface token counts.\n\n" +
    "Three tools, four or five dimensions. Edit the column labels to the actual model names you used in Compare AI. No tool will be best on all of them — that's the point.";
  const a1s4Data = {
    rows: [
      { id: "length", label: "1. Length" },
      { id: "tone", label: "2. Tone" },
      { id: "constraint", label: "3. Constraint-following" },
      { id: "accuracy", label: "4. Accuracy" },
      { id: "efficiency", label: "5. Efficiency (tokens & speed) — optional" },
    ],
    columns: [
      { id: "tool1", label: "Tool 1", placeholder: "e.g., GPT-5" },
      { id: "tool2", label: "Tool 2", placeholder: "e.g., Claude Sonnet" },
      { id: "tool3", label: "Tool 3", placeholder: "e.g., Gemini Pro" },
    ],
    rowHeader: "Dimension",
    storageKey: "activity-1-comparison-table-v2",
    rowsReadOnly: true,
    cellPlaceholder: "Short note",
    editableColumnLabels: true,
  };
  await sb
    .from("activity_guide_steps")
    .update({
      instruction: a1s4Instruction,
      detailed_help: a1s4Help,
      interactive_data: a1s4Data,
    })
    .eq("activity_id", 1)
    .eq("step_number", 4);
  console.log("✓ A1 step 4 — optional Efficiency (tokens & speed) dimension added");

  // ====================== A2 — Tool Selection Matrix ======================
  // Step 2 help: fix the file-support over-promise + the unlinked VITRA pointer.
  const a2s2Help =
    "**The four questions that usually decide which tool fits:**\n\n" +
    "**Input length.** Long readings or large datasets need tools with bigger {{context windows:The amount of text the AI can hold in mind at once. Older parts of long chats start to drop off when the conversation exceeds it.}} (Claude, Gemini Pro). Short {{prompts:Anything you type into an AI to get a response — a question, an instruction, or a request.}} work anywhere.\n\n" +
    "**File support.** Does the task involve uploading PDFs, images, or spreadsheets? Not every tool accepts files — check the tool's own docs. ASU's [vetted AI tool list](https://ai.asu.edu/ai-tools) tells you which tools are *approved*; it won't always spell out which file types each one accepts.\n\n" +
    "**Sensitive data.** If student data is involved, the tool needs to be VITRA-approved before you put real data in. See **ASU's VITRA process** (linked in the Explore Sources and Resources box below). **VITRA at this level just means: if the tool isn't approved, use de-identified data only.**\n\n" +
    "**Speed of iteration.** If you'll be revising 5+ times, a fast tool with strong follow-up handling matters more than getting the perfect first draft.";
  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: a2s2Help })
    .eq("activity_id", 2)
    .eq("step_number", 2);
  console.log("✓ A2 step 2 — file-support wording fixed + VITRA pointer to Explore box");

  // Deliverable: drop the "Look Book" reference.
  const a2Deliverable =
    "A short writeup capturing: (1) your final matrix, (2) the better of the two AI-generated comparison visuals, and (3) one line on which slide/image AI worked best for this kind of comparison and why.";
  await sb
    .from("level_up_activities")
    .update({ deliverable: a2Deliverable })
    .eq("id", 2);
  console.log("✓ A2 deliverable — Look Book reference removed");

  // ============ A3 — reframe to a two-tool recommendation ============

  // Description + deliverable.
  const a3Description =
    "Overview: In this activity, you will help a colleague choose between two similar AI tools for a specific purpose. You'll define the purpose and pick two comparable tools, look them up and compare them across the criteria that actually matter, verify the claims marketing pages gloss over, then write a short, honest recommendation your colleague could act on.\n\n" +
    "Optional extension: Turn your recommendation into a one-page visual — the purpose, the two tools side by side, your pick, and the one condition that would change it — that you could drop into a team channel or email.";
  const a3Deliverable =
    "A short recommendation written to a colleague: the purpose, the two tools you compared, which one you'd pick and why, and the one thing that would change your call.";

  // Filter the Module 1 Lesson 1 source out of A3's curated extras.
  const { data: a3Row } = await sb
    .from("level_up_activities")
    .select("extra_sources")
    .eq("id", 3)
    .single();
  type ExtraSource = { title: string; url: string; [k: string]: unknown };
  const a3Extras = (Array.isArray(a3Row?.extra_sources)
    ? (a3Row!.extra_sources as ExtraSource[])
    : []
  ).filter((e) => !/Experimenting with GenAI/i.test(e?.title ?? ""));

  await sb
    .from("level_up_activities")
    .update({
      description: a3Description,
      deliverable: a3Deliverable,
      extra_sources: a3Extras,
    })
    .eq("id", 3);
  console.log(
    `✓ A3 — description/deliverable reframed; extra_sources now ${a3Extras.length} (Module 1 Lesson 1 removed)`
  );

  // ---- A3 Step 1 (id 6) — purpose + two like tools + colleague ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      instruction:
        "Pick a real purpose and two *like* tools to compare — two tools that do the same kind of job (e.g., two AI notetakers, two image generators, two transcription tools). Name the colleague you're advising. Capture it all below; step 2's prompt reads from these boxes.",
      detailed_help:
        "**Compare *like* tools.** A recommendation only means something when the two options actually compete for the same job. \"Granola vs. Otter\" or \"ChatGPT image vs. Gemini image\" is a real choice; \"ChatGPT vs. Excel\" isn't.\n\n" +
        "**Write it to a real colleague.** A recommendation aimed at the specific person who asked — what they teach, what they'd put into the tool — is sharper than a generic review. If no colleague has asked yet, picture the one most likely to.\n\n" +
        "**Note the data sensitivity now.** What would your colleague actually put in — public material, de-identified examples, or FERPA-protected student data? That one answer shapes which tool is even eligible.",
      interactive_data: {
        groups: [
          { id: "purpose", count: 1, label: "The purpose / task", placeholder: "e.g., auto-transcribing student project interviews" },
          { id: "toolA", count: 1, label: "Tool A", placeholder: "e.g., Granola" },
          { id: "toolB", count: 1, label: "Tool B", placeholder: "e.g., Otter.ai" },
          { id: "colleague", count: 1, label: "Colleague you're advising", placeholder: "e.g., a faculty member running a qualitative methods course" },
          { id: "data", count: 1, label: "Data sensitivity (what would actually go in?)", placeholder: "Public / de-identified / FERPA-protected / mixed" },
        ],
        prompt: "Lock in the purpose and the two tools. The boxes save in your browser; step 2's prompt uses them.",
        storageKey: "activity-3-context-v2",
      },
      show_external_tools: true,
    })
    .eq("activity_id", 3)
    .eq("step_number", 1);
  console.log("✓ A3 step 1 — purpose + two like tools + colleague");

  // ---- A3 Step 2 (id 7) — AI first-pass head-to-head (was vitra_infographic) ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "prompt_sandbox",
      instruction:
        "Use AI to research both tools for your purpose. Paste the prompt below into your tool of choice, swapping the bracketed bits for your step-1 values. The AI gives you a first-pass head-to-head; you'll look it up and correct it in step 3.",
      detailed_help:
        "**Let AI do the first sweep, not the final call.** Pulling together what two tools claim across several dimensions is exactly what AI is fast at. Your job is to *direct* it (tight scope, your purpose) and then *check* it — the next two steps.\n\n" +
        "**Copy your step-1 values into the brackets.** The step-1 boxes are your reference; paste the purpose, both tool names, and the data sensitivity into the matching `[brackets]` before you send. Nothing auto-fills — you control exactly what the AI sees.\n\n" +
        "**What the AI will get wrong.** Current pricing, subscription tiers, recent feature changes, and ASU-approval status. Treat every claim as a lead to verify, not a fact.",
      interactive_data: {
        hint: "Replace each [bracket] with your step-1 values, then send. Nothing copies automatically — paste them in yourself.",
        starter:
          "You are helping me compare two AI tools for a specific purpose so I can recommend one to a colleague.\n\n" +
          "Purpose: [purpose from step 1].\nTool A: [tool A].\nTool B: [tool B].\nData that would go in: [data sensitivity].\n\n" +
          "Produce a head-to-head comparison as a table with one column per tool and these rows:\n" +
          "- Fit for the purpose (concrete strengths and limits for THIS task)\n" +
          "- File / format support relevant to the purpose\n" +
          "- Data handling (storage, training-on-inputs, retention — cite the vendor's exact phrasing if you can)\n" +
          "- Cost (plans, and what the free tier allows)\n" +
          "- Accessibility (screen reader, keyboard, output accessibility)\n\n" +
          "After the table, list the three claims a careful reader should verify before trusting them. Do not recommend either tool yet — I'll make that call.",
      },
      show_external_tools: false,
    })
    .eq("activity_id", 3)
    .eq("step_number", 2);
  console.log("✓ A3 step 2 — AI first-pass head-to-head research");

  // ---- A3 Step 3 (id 8) — actively look up & fill the head-to-head (was prompt_sandbox) ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "comparison_table",
      instruction:
        "Now actively look up both tools and fill the head-to-head below — one column per tool, one row per criterion. Correct anything the AI got wrong against each tool's own site.",
      detailed_help:
        "**This is the looking-up, and it's the point.** The AI's draft is a starting grid; the learning is in opening each tool's real pages and seeing where the claims hold. Edit the column headers to your two tool names.\n\n" +
        "**The rows are the criteria that usually decide a tool choice.** Fill each cell with a short, specific note — \"handles 90-min audio; 300 min/mo on the free tier\" beats \"good for audio.\"\n\n" +
        "**Data handling / approval is where to slow down.** If your colleague would put student data in, note each tool's stance and whether it's ASU-approved. You don't need to dig the full VITRA vendor list — if a tool isn't clearly approved, the safe default is \"de-identified data only,\" and you can say exactly that in your recommendation.",
      interactive_data: {
        rows: [
          { id: "fit", label: "1. Fit for the purpose" },
          { id: "format", label: "2. File / format support" },
          { id: "data", label: "3. Data handling / approval" },
          { id: "cost", label: "4. Cost" },
          { id: "access", label: "5. Accessibility" },
        ],
        columns: [
          { id: "toolA", label: "Tool A", placeholder: "e.g., Granola" },
          { id: "toolB", label: "Tool B", placeholder: "e.g., Otter.ai" },
        ],
        rowHeader: "Criterion",
        storageKey: "activity-3-headtohead",
        rowsReadOnly: true,
        cellPlaceholder: "Short, specific note",
        editableColumnLabels: true,
      },
      show_external_tools: true,
    })
    .eq("activity_id", 3)
    .eq("step_number", 3);
  console.log("✓ A3 step 3 — head-to-head comparison table (actively look up both)");

  // ---- A3 Step 4 (id 9) — verify the slippery claims ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      instruction:
        "Spot-check the claims that matter against primary sources. Verify at least the data-handling and cost claims for both tools — those are the ones marketing pages spin.",
      detailed_help:
        "**This is the part AI can't do for you.** A recommendation your colleague acts on has to be right where it counts. The defensibility lives in this step.\n\n" +
        "**Verification checklist:**\n" +
        "• **Data handling** — open each tool's actual privacy page and check what the AI claimed about storage, training-on-inputs, and retention. Note anything that's changed or vague.\n" +
        "• **Cost** — confirm the current plans and what the free tier really includes, on each vendor's pricing page.\n" +
        "• **One more slippery claim** — pick whichever cell in step 3 felt too good to be true and check it.\n\n" +
        "**Flag any AI fabrication clearly.** One invented claim and your colleague stops trusting the whole recommendation.",
      interactive_data: {
        groups: [
          { id: "data", count: 2, label: "Data-handling check (one per tool)", placeholder: "Tool + what the privacy page actually says vs. the AI's claim" },
          { id: "cost", count: 2, label: "Cost check (one per tool)", placeholder: "Tool + current plan / free-tier limits, verified" },
          { id: "extra", count: 1, label: "One more claim you spot-checked", placeholder: "Specific claim, what you found" },
        ],
        prompt: "Track what you verified, what you flagged, and what changed.",
        storageKey: "activity-3-verify",
      },
      show_external_tools: false,
    })
    .eq("activity_id", 3)
    .eq("step_number", 4);
  console.log("✓ A3 step 4 — verification reframed for two tools");

  // ---- A3 Step 5 (id 10) — AI-drafted recommendation; you make the pick ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "prompt_sandbox",
      instruction:
        "Use AI to draft the recommendation note to your colleague from your verified comparison. Then write the actual pick — and the reason — yourself. AI doesn't choose for you.",
      detailed_help:
        "**Why the pick has to be yours.** A recommendation is a small act of judgment your colleague is trusting. AI can marshal the evidence; you stake the call.\n\n" +
        "**Paste your verified notes into the prompt.** The draft should lean only on what you confirmed in steps 3–4 — not the AI's original unchecked claims.\n\n" +
        "**Land on one of these and say why:**\n" +
        "• **Tool A** / **Tool B** — for this purpose, with the single deciding reason.\n" +
        "• **Either, with a caveat** — if they're close and the choice hinges on one factor (cost, data handling, a feature your colleague needs).",
      interactive_data: {
        hint: "Paste your step-3 head-to-head and step-4 verification notes into the bottom of the prompt before sending.",
        starter:
          "You are helping me draft a short recommendation to a colleague about which of two AI tools to use for a specific purpose.\n\n" +
          "Colleague: [colleague from step 1].\nPurpose: [purpose from step 1].\nTools compared: [tool A] vs [tool B].\n\n" +
          "Write a brief, plain-spoken recommendation note with this structure:\n\n" +
          "## The purpose\n[One line restating what they need the tool for.]\n\n" +
          "## What I compared\n[Two or three sentences on the head-to-head — the criteria that mattered most.]\n\n" +
          "## My recommendation\n[Leave this blank — I'll write the actual pick and reason myself.]\n\n" +
          "Use only the verified notes below; do not add claims that aren't here.\n\n" +
          "Head-to-head (verified):\n[paste your step-3 table]\n\n" +
          "Verification flags:\n[paste your step-4 notes]",
      },
      show_external_tools: false,
    })
    .eq("activity_id", 3)
    .eq("step_number", 5);
  console.log("✓ A3 step 5 — AI-drafted recommendation, human makes the pick");

  // ---- A3 Step 6 (id 11) — finalize the recommendation to the colleague ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: null,
      instruction:
        "Review the AI's draft, then write the recommendation paragraph yourself and capture the final note in the deliverable box at the bottom of this page.",
      detailed_help:
        "**What you're checking.** Did the AI smuggle in a claim that wasn't in your verified notes? (Cut it.) Did it hedge where you have a clear view? (Sharpen it.)\n\n" +
        "**The recommendation is the deliverable.** Three sentences, written to your colleague:\n" +
        "1. Which tool, for this purpose.\n" +
        "2. The single most important reason.\n" +
        "3. The one thing that would change your call (a price change, a data-handling concern, a feature they need).\n\n" +
        "**Keep it honest about data.** If either tool isn't clearly ASU-approved and your colleague would use real student data, say so plainly and point them to de-identified use until it's cleared.",
      interactive_data: null,
      show_external_tools: false,
    })
    .eq("activity_id", 3)
    .eq("step_number", 6);
  console.log("✓ A3 step 6 — finalize recommendation to colleague");

  // ============ Resolve any open reviewer notes on A1 / A2 / A3 ============
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .in("activity_id", [1, 2, 3]);
  const rowIds = ["1", "2", "3", ...(steps ?? []).map((s) => String(s.id))];
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
  if (error) {
    console.warn("(could not resolve notes) " + error.message);
  } else {
    console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A1/A2/A3`);
  }
}

main();
