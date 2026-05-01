/**
 * wave-7-tool-safari-table-1.0.0.ts
 *
 * Activity 1 (AI Tool Safari) step 5: replace the 5-input-per-tool
 * text_list_entry with a proper comparison table — three rows (one
 * per tool) and four columns (the four dimensions: length, tone,
 * constraint-following, accuracy). Reflection moves out of the
 * widget; users write it directly into the deliverable notes box.
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

  const { error } = await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Capture your observations across the three tools in the table below. Edit each row's tool name to whatever model you actually used. Then write your reflection — which tool would you reach for first, and why? — directly in the deliverable notes box at the bottom of this page.",
      detailed_help:
        "**Three rows, four columns.** Edit the row labels to the actual model names you used in Compare AI. Each cell is short, just enough to remind future-you what you noticed.\n\n**The four columns map to the four dimensions from step 4:**\n\n• **1, Length** — did it stick to three sentences, or did it pad?\n• **2, Tone** — formal vs. casual; would you put this in a syllabus as-is?\n• **3, Constraint-following** — did it hold the three-sentence cap as a hard rule or a loose suggestion?\n• **4, Accuracy** — anything that sounded factually off?\n\n**Your reflection lives in the deliverable box.** \"I liked Claude\" is a starting point. \"Claude held the three-sentence constraint and matched a syllabus voice\" is the kind of reason that transfers to the next decision. Write the reflection directly in the deliverable notes below the activity.",
      interactive_type: "comparison_table",
      interactive_data: {
        storageKey: "activity-1-comparison-table",
        rowHeader: "Tool",
        rows: [
          { id: "row1", label: "Tool 1", placeholder: "e.g., GPT-5" },
          { id: "row2", label: "Tool 2", placeholder: "e.g., Claude Sonnet" },
          { id: "row3", label: "Tool 3", placeholder: "e.g., Gemini Pro" },
        ],
        columns: [
          { id: "col1", label: "1. Length" },
          { id: "col2", label: "2. Tone" },
          { id: "col3", label: "3. Constraint" },
          { id: "col4", label: "4. Accuracy" },
        ],
        cellPlaceholder: "Short note",
      },
    })
    .eq("activity_id", 1)
    .eq("step_number", 5);

  if (error) {
    console.error("update failed:", error.message);
    process.exit(1);
  }
  console.log("✓ activity 1 step 5 updated to comparison_table");
}

main();
