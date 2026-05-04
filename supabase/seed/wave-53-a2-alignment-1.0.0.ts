/**
 * wave-53-a2-alignment-1.0.0.ts
 *
 * A2 (Tool Selection Matrix) — bring description, deliverable,
 * objectives, and steps into alignment, and add the slide-export
 * step that the description has been promising all along.
 *
 * Misalignments fixed (full audit in chat):
 *   - Description promised a 2-tool head-to-head and a 1-slide
 *     comparison posted to the Look Book, but the matrix was
 *     1-tool-per-scenario with no slide-output step.
 *   - Deliverable named a "single comparison slide" no step produced.
 *   - Objective 2 ("articulate trade-offs between competing tools")
 *     was the weakest hit — only "One Limitation" addressed it.
 *
 * The new shape:
 *   - Step 1-2 unchanged (read scenarios, sort by deciding factor).
 *   - Step 3 — restructured matrix: 6 rows = 3 scenarios × {recommended,
 *     not-recommended}, color-tinted per scenario, paired vertically.
 *     Columns: Tool, Reason. Forces an explicit "what would I avoid
 *     and why" alongside "what would I pick", which is objective 2's
 *     real exercise. CSV export enabled.
 *   - Step 4 — test one scenario in your recommended tool (kept).
 *   - Step 5 — revise the matrix (kept).
 *   - Step 6 (new) — export the matrix as CSV; drop it into a
 *     slide-generating AI; post the resulting slide to the Look Book.
 *     Step-specific external-tool suggester surfaces slide AIs.
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

  // ---------- Activity-level alignment ----------
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Three real teaching scenarios. For each, pick the AI tool you'd recommend AND one you'd avoid — with reasons for both. Test one scenario for real, revise the matrix, then export it to a slide-generating AI and post the polished single-slide visual to the Look Book.\n\nOptional extension: Add a fourth scenario from your own work and run it through the same loop.",
      value_add:
        "Most teaching and research work doesn't have one \"right\" AI tool — choices vary by task. Forcing yourself to name what you'd avoid (and why) builds tool sense faster than only naming what you'd pick.",
      objectives: [
        "Match tools to tasks based on real strengths, not familiarity.",
        "Articulate trade-offs by naming what each scenario's *not*-recommended tool gets wrong.",
        "Catch limitations before they bite you in a real workflow.",
        "Convert a structured matrix into a polished visual you'd actually share.",
      ],
      deliverable:
        "A single comparison slide (generated from your matrix CSV via a slide-AI of your choice) showing recommended vs. not-recommended tool per scenario, color-coded — posted to the Look Book.",
      time_estimate: "30-45 min",
    })
    .eq("id", 2);
  console.log("✓ A2 description / value_add / objectives / deliverable aligned");

  // ---------- Step 3: restructure to 6-row colored matrix ----------
  // Each scenario gets a group with its own color tint; under each
  // group, two rows: Recommended and Not recommended. Two columns:
  // Tool, Reason. CSV export on. Step-specific tool-suggester (the
  // existing "Suggest tools" button is wired via show_external_tools).
  const a3Help =
    "**Six rows in three colored pairs.** For each scenario, the row above is the tool you'd actually use; the row below is the one you'd avoid. Naming the avoided tool out loud is what makes the comparison sharp — \"don't use a small-context model on a 60-page report\" beats \"some tools are better at long inputs\" every time.\n\n" +
    "**What goes in each cell:**\n" +
    "- *Tool* — the specific name. \"Whatever's free\" doesn't transfer to next time.\n" +
    "- *Reason* — one or two sentences. For *Recommended*: tie the choice to a concrete property (\"handles 50+ page PDFs without truncation\"). For *Not recommended*: name the failure mode (\"context window truncates long readings; loses the second half\").\n\n" +
    "**Stuck on a tool?** Use the Suggest tools button below — it surfaces matched options for *this step's* task.\n\n" +
    "**Download CSV when you're done** — step 6 hands the CSV to a slide-AI to generate the visual.";
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Fill the matrix below. For each scenario, name the tool you'd recommend (top row) and the tool you'd avoid (bottom row), with a one-line reason for each.",
      detailed_help: a3Help,
      interactive_type: "comparison_table",
      interactive_data: {
        // Bump key — the row shape changed materially (3 rows → 6 rows + groups).
        storageKey: "activity-2-matrix-v2",
        rowHeader: "Recommendation",
        rowsReadOnly: true,
        enableCsvExport: true,
        csvFilename: "tool-selection-matrix.csv",
        prompt:
          "Three scenarios, two tools each (one to use, one to avoid). Color marks the scenario; row pairs the recommended above the not-recommended.",
        rowGroups: [
          { id: "quiz", label: "Quiz questions", color: "maroon" },
          { id: "summary", label: "Summarizing readings", color: "blue" },
          { id: "feedback", label: "Drafting feedback", color: "gold" },
        ],
        rows: [
          { id: "quiz-yes", label: "Recommended", groupId: "quiz" },
          { id: "quiz-no", label: "Not recommended", groupId: "quiz" },
          { id: "summary-yes", label: "Recommended", groupId: "summary" },
          { id: "summary-no", label: "Not recommended", groupId: "summary" },
          { id: "feedback-yes", label: "Recommended", groupId: "feedback" },
          { id: "feedback-no", label: "Not recommended", groupId: "feedback" },
        ],
        columns: [
          {
            id: "tool",
            label: "Tool",
            placeholder: "Specific tool name",
          },
          {
            id: "reason",
            label: "Reason",
            placeholder:
              "One or two sentences tying the choice to a concrete property of the tool",
          },
        ],
        cellPlaceholder: "Short note",
      },
      // Step-specific tool suggester for matrix-filling.
      show_external_tools: true,
    })
    .eq("activity_id", 2)
    .eq("step_number", 3);
  console.log(
    "✓ A2 step 3 — colored 6-row matrix (recommended / not-recommended × 3 scenarios) + CSV export"
  );

  // ---------- Add new step 6: export to slide-AI, post to Look Book ----------
  await sb.from("activity_guide_steps").upsert(
    {
      activity_id: 2,
      step_number: 6,
      instruction:
        "Export your matrix as CSV using the button below the table in step 3. Drop the CSV into a slide-generating AI and ask it to make a single comparison slide — three colored sections (one per scenario), recommended tool on top, not-recommended below, reasons short. Polish what you'd post, then share it to the Look Book.",
      detailed_help:
        "**Why a slide-AI for the visual.** Your matrix has the structure; a slide-AI gives you the polish (typography, color blocks, spacing) without you opening Keynote. Most slide-AIs accept a CSV upload or a pasted table.\n\n" +
        "**Use the Suggest tools button below** for slide-AIs matched to this task. Common options include Gamma, Canva AI, Decktopus, Tome, or Google Slides + Gemini.\n\n" +
        "**Suggested prompt to give the slide-AI:**\n\n" +
        "> Make a single 16:9 slide titled \"Tool Selection Matrix — [my topic].\" Three horizontal color-coded sections (one per scenario). In each section: the scenario name as the header, the *Recommended tool + reason* on top, the *Not recommended tool + reason* directly below. Keep total text on the slide under 150 words. Soft maroon, blue, and gold for the three sections. Minimal decoration.\n\n" +
        "**Before posting:** sanity-check the slide against your matrix — slide-AIs sometimes drop or smooth content during conversion. The matrix is the source of truth.",
      show_external_tools: true,
    },
    { onConflict: "activity_id,step_number" }
  );
  console.log("✓ A2 step 6 (new) — export CSV → slide AI → Look Book");
}

main();
