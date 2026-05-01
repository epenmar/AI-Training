/**
 * wave-29-research-deliverable-and-download-1.0.0.ts
 *
 *   - Activity 9 step 4: was an open writing prompt, now refers users
 *     to the deliverable box at the bottom of the page.
 *   - Activity 9 step 5: was "package the workflow yourself", now an
 *     in-page downloadable infographic of the 5-stage workflow that
 *     users can pass to colleagues. Hosted at
 *     /infographics/ai-research-workflow.png.
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

  // Step 4 → point at deliverable box
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Capture your write-up in the deliverable box at the bottom of this page. What did AI add to your step-1 question (speed, breadth, connections you might have missed), and where did it introduce risk?",
      detailed_help:
        "**Honest write-up beats favorable.** \"AI added value at stage 1 (breadth of initial sources) and stage 4 (synthesis structure). It introduced risk at stage 1 (5 of 12 sources didn't exist) and stage 4 (synthesized findings the source papers didn't actually claim).\" That's the kind of note that transfers to the next research question.\n\nThe deliverable box is the persistent record — it stays attached to your activity completion so you can refer back when you next set up a similar workflow.",
      interactive_type: null,
      interactive_data: null,
    })
    .eq("activity_id", 9)
    .eq("step_number", 4);
  console.log("✓ step 4 → deliverable-box pointer");

  // Step 5 → downloadable infographic
  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Download the 5-stage workflow infographic below and pass it to a colleague (or yourself, six months from now) who could benefit from running this workflow. The diagram is the reusable template — no need to redraw it.",
      detailed_help:
        "**Why a ready-made infographic.** Asking you to author a one-page workflow guide would be busy work — the diagram already exists, and your colleagues benefit from the same structure regardless of which research question they're tackling. Send the file directly, or annotate it with your team's local conventions before passing it on.",
      interactive_type: "downloadable_asset",
      interactive_data: {
        url: "/infographics/ai-research-workflow.png",
        filename: "ai-research-workflow.png",
        title: "5-stage AI + human research workflow",
        description:
          "A one-page infographic of the workflow stages with the fresh-chats rule and the skip-a-stage warnings. PNG, ~1.5 MB.",
        previewAlt:
          "5-stage AI + human research workflow infographic showing the alternating AI prompt and human verification stages with their outputs.",
        buttonLabel: "Download infographic",
      },
    })
    .eq("activity_id", 9)
    .eq("step_number", 5);
  console.log("✓ step 5 → downloadable infographic");
}

main();
