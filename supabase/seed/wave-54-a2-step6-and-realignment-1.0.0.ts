/**
 * wave-54-a2-step6-and-realignment-1.0.0.ts
 *
 * Three follow-ups on A2 (Tool Selection Matrix):
 *
 *   1. wave-53 tried to add step 6 via upsert with onConflict on
 *      (activity_id, step_number); no matching unique constraint
 *      exists, so the upsert silently no-op'd. Insert step 6
 *      explicitly this time after a defensive delete.
 *
 *   2. Step 6's framing pivots: instead of "make a slide and post,"
 *      the move is "export the matrix as CSV, run it through TWO
 *      different image/slide AIs, decide which one produced the
 *      better visual for this kind of comparison." That meta-exercise
 *      addresses the existing two objectives at a higher level
 *      (matching tools to tasks, articulating trade-offs) — so the
 *      added "Convert a structured matrix..." objective comes back
 *      out, and the deliverable becomes the comparison writeup +
 *      the better visual.
 *
 *   3. Step 4 mentioned Compare AI twice (in instruction and again in
 *      detailed_help) and pointed back at the Tool Safari activity.
 *      Drop the duplicate + the cross-activity reference; learners
 *      shouldn't need to remember whether they did A1 to use the
 *      Compare AI hint here.
 *
 *   4. Optional extension pivots from "add a fourth scenario" (more
 *      of the same) to "compare *different types* of output tools" —
 *      podcast / video / slide / audio summary using free tools,
 *      which type best fits this kind of comparison content.
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

  // ---- 1+4: description, objectives, deliverable, optional extension ----
  const description =
    "Three real teaching scenarios. For each, pick the AI tool you'd recommend AND one you'd avoid — with reasons for both. Test one scenario for real, revise the matrix, then run the matrix through two different slide / image AIs to see which one produces the better visual for this kind of comparison.\n\n" +
    "Optional extension: Take your matrix to a *different type* of output — generate a short podcast clip, a video, or an audio summary using a free AI tool (NotebookLM Audio Overview, ElevenLabs, Synthesia, etc.). Which output type best fits a tool-comparison story, and why?";

  await sb
    .from("level_up_activities")
    .update({
      description,
      // Drop the "Convert a structured matrix into a polished visual"
      // objective — running the matrix through two slide AIs in step 6
      // is itself a tool-comparison exercise that re-uses the existing
      // objectives at a higher level.
      objectives: [
        "Match tools to tasks based on real strengths, not familiarity.",
        "Articulate trade-offs by naming what each scenario's *not*-recommended tool gets wrong.",
        "Catch limitations before they bite you in a real workflow.",
      ],
      deliverable:
        "A short writeup capturing: (1) your final matrix, (2) the better of the two AI-generated comparison visuals, and (3) one line on which slide/image AI worked best for this kind of comparison and why. Posted to the Look Book.",
    })
    .eq("id", 2);
  console.log(
    "✓ A2 description / objectives (drop #4) / deliverable / extension realigned"
  );

  // ---- 3: step 4 — drop duplicate Compare AI + cross-activity reference ----
  const step4Instruction =
    "For at least one scenario, actually try the task in your recommended tool. Does reality match your prediction? Capture what you learned.";
  const step4Help =
    "Pick the scenario you're least confident about — that's where the test run will teach you the most. The point isn't to validate your matrix; it's to find out where your prediction was off.\n\n" +
    "**What \"actually try the task\" means:** spend 10 minutes doing the real version with the tool you picked. If you said \"Tool X is best for summarizing readings,\" actually have it summarize a real reading. If the result is unusable in 30 seconds, that's a finding — capture it.\n\n" +
    "If you want to run the same prompt against 2-3 candidate tools side-by-side, [Compare AI](https://compare.aiml.asu.edu) is the most direct way to do it. One prompt, multiple models, no tab-juggling.";
  await sb
    .from("activity_guide_steps")
    .update({ instruction: step4Instruction, detailed_help: step4Help })
    .eq("activity_id", 2)
    .eq("step_number", 4);
  console.log("✓ A2 step 4 — Compare AI mentioned once; A1 cross-ref dropped");

  // ---- 2: insert step 6 (explicitly, since wave-53's upsert no-op'd) ----
  // Defensive delete in case a stub did get inserted somewhere.
  await sb
    .from("activity_guide_steps")
    .delete()
    .eq("activity_id", 2)
    .eq("step_number", 6);

  const step6Instruction =
    "Export your matrix as CSV (button below the table in step 3). Run it through TWO different image / slide-generating AI tools and compare what each produces. Capture the better visual + one line on which tool worked best — and why — in the deliverable box at the bottom of this page.";
  const step6Help =
    "**Why two tools instead of one.** The matrix is also a *test artifact*: feeding the same CSV into two different slide AIs reveals the kind of comparison content each handles well. That's the same skill the matrix itself trains — match the tool to the task — applied one level up.\n\n" +
    "**Suggested prompt to give whichever slide AI you pick:**\n\n" +
    "> Make a single 16:9 slide titled \"Tool Selection Matrix — [my topic].\" Three horizontal color-coded sections, one per scenario. In each section: the scenario name as the header, the *Recommended tool + reason* on top, the *Not recommended tool + reason* directly below. Total text under 150 words. Soft maroon, blue, and gold for the three sections. Minimal decoration.\n\n" +
    "**Common slide / image AIs to try:** Gamma, Canva AI, Tome, Decktopus, Google Slides + Gemini, ChatGPT (ask for an image with the same brief). Use the Suggest tools button below for matched options.\n\n" +
    "**What to capture in the deliverable:**\n" +
    "- Which two tools you tried\n" +
    "- The better visual (screenshot, PDF, or link)\n" +
    "- One line on which one fit this kind of content best, and why";
  const { error: insertErr } = await sb
    .from("activity_guide_steps")
    .insert({
      activity_id: 2,
      step_number: 6,
      instruction: step6Instruction,
      detailed_help: step6Help,
      show_external_tools: true,
    });
  if (insertErr) throw insertErr;
  console.log("✓ A2 step 6 — explicitly inserted (compare two slide AIs)");

  // Verify step 6 exists.
  const { data: check } = await sb
    .from("activity_guide_steps")
    .select("step_number")
    .eq("activity_id", 2)
    .order("step_number");
  console.log(
    "Final step numbers:",
    (check ?? []).map((s) => s.step_number).join(", ")
  );
}

main();
