/**
 * wave-36-tool-safari-step4-1.0.0.ts
 *
 * Activity 1 (AI Tool Safari) step 4:
 *   - Inline-vocab all four dimensions (length, tone,
 *     constraint-following, accuracy) so each is a clickable reveal,
 *     not just "tone".
 *   - Transpose the comparison_table so it's taller-than-wide:
 *     rows = the four dimensions, columns = the three tools. Reads
 *     better as a portrait-shaped table than landscape.
 *   - Bump the storageKey since the row/column shape changes —
 *     prevents stale data from a different shape rendering oddly.
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

  const newInstruction =
    'Notice four things in each tool\'s output and capture them in the table below: ' +
    "{{length:Did it stick to three sentences, or did it pad? Some models treat a numeric constraint as a hard rule, others as a loose suggestion.}}, " +
    '{{tone:How formal or casual the writing feels. Would you put this in a syllabus as-is, or does it read like a marketing brochure?}}, ' +
    "{{constraint-following:The prompt said three sentences. Did the tool hold the cap as a hard rule, or did it drift past it?}}, and " +
    '{{accuracy:Anything that sounds factually off? Active learning has been written about for decades — the AI shouldn\'t be inventing things here.}}.';

  const newDetailedHelp =
    "Tap each bolded term in the instruction above to see what to look for. The four together give you a working comparison vocabulary you can re-use on any model output, not just this one.\n\nThree tools, four dimensions. Edit the column labels to the actual model names you used in Compare AI. No tool will be best on all four — that's the point.";

  await sb
    .from("activity_guide_steps")
    .update({
      instruction: newInstruction,
      detailed_help: newDetailedHelp,
      interactive_type: "comparison_table",
      interactive_data: {
        // Bump key since shape changed: rows are now dimensions, cols are tools.
        storageKey: "activity-1-comparison-table-v2",
        rowHeader: "Dimension",
        rowsReadOnly: true,
        editableColumnLabels: true,
        rows: [
          { id: "length", label: "1. Length" },
          { id: "tone", label: "2. Tone" },
          { id: "constraint", label: "3. Constraint-following" },
          { id: "accuracy", label: "4. Accuracy" },
        ],
        columns: [
          { id: "tool1", label: "Tool 1", placeholder: "e.g., GPT-5" },
          { id: "tool2", label: "Tool 2", placeholder: "e.g., Claude Sonnet" },
          { id: "tool3", label: "Tool 3", placeholder: "e.g., Gemini Pro" },
        ],
        cellPlaceholder: "Short note",
      },
    })
    .eq("activity_id", 1)
    .eq("step_number", 4);

  console.log(
    "✓ activity 1 step 4 — inline vocab on all four dimensions + transposed table"
  );
}

main();
