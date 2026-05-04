/**
 * wave-57-extension-split-fix-1.0.0.ts
 *
 * The activity detail page splits a description on the literal
 * "\n\nOptional extension: " (colon + space) to peel off the
 * extension into its own gold callout. Waves 55 and 56 wrote the
 * boundary as "\n\nOptional extension — " (em-dash) for A20 and A17,
 * which doesn't match — so the entire extension content was rendering
 * inline as part of the activity description (the wall-of-text bug
 * the user flagged on both pages).
 *
 * This wave normalizes both back to the colon delimiter, and adds
 * A17's second optional extension (demo video walkthrough using a
 * synthetic-spokesperson tool) under the same heading.
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

  // ---- A20 (Theme Finder) ----
  const a20Description =
    "Take de-identified open-ended responses (or use the synthetic CSV linked in step 1). Read them yourself first and capture 3-5 themes. Then ask AI to cluster them and put your themes against AI's themes in a Venn. The differences are where the real findings live.\n\n" +
    "Optional extension: Theme map.\n\n" +
    "Take the merged theme list from your Venn and ask AI to render it as a Mermaid mindmap.\n\n" +
    "1. Open the chat tool you've been using.\n" +
    "2. Paste this prompt, with your merged theme list filled in:\n\n" +
    "> Produce a Mermaid mindmap (`mindmap` syntax) of the following clustered themes from a student feedback dataset. Center node = \"Student feedback themes.\" One branch per theme. Under each, list 2-4 sub-points (specific patterns within the theme). Keep labels short — under 8 words each. Mark themes that surfaced in BOTH the human read and the AI read with (✓), themes ONLY-mine with (M), themes ONLY-AI with (A).\n>\n> Themes:\n> [paste your merged theme list here, including the M / A / ✓ tag from your Venn]\n\n" +
    "3. Copy the Mermaid output and paste into [Mermaid Live](https://mermaid.live) to render the visual.\n" +
    "4. Capture the rendered image (or the link) and submit it alongside your reflection.\n\n" +
    "Why this is worth doing: the Mermaid pattern is reusable for any clustered output — interview themes, lit-review categories, team-retro patterns. If it works for student feedback, you've added a tool to your kit.";
  await sb
    .from("level_up_activities")
    .update({ description: a20Description })
    .eq("id", 20);
  console.log("✓ A20 description split delimiter fixed (— → :)");

  // ---- A17 (Design an Agent) — fix split + add demo-video extension ----
  const a17Description =
    "Pick a repetitive multi-step workflow in your role. Map it as an agent blueprint — Goal, Trigger, Steps (each tagged with Me / AI / Either), Decisions, Human checkpoints, Tools, Risks — using the in-page builder pinned to the right. Don't build it yet; the next-level activity does the build.\n\n" +
    "Optional extension: Two routes — pick whichever fits how you'll use this design.\n\n" +
    "**A. Mermaid flowchart** (portable artifact for docs / repos / wikis)\n\n" +
    "1. Open the chat tool you've been using.\n" +
    "2. Paste this prompt, with your blueprint filled in:\n\n" +
    "> Produce a Mermaid `flowchart TD` (top-down) of the agent design below. Use `[ ]` for Steps, `{ }` for Decisions, `(( ))` for Triggers, double-bordered `[[ ]]` for Human checkpoints, and a stadium `([ ])` for End. Add `style` directives to give Human checkpoint nodes a maroon fill (`#fbf2f4`) and Trigger a soft orange (`#ffe9d9`). On each edge, label the actor — Me, AI, or Either.\n>\n> Goal: [paste from your blueprint]\n> Workflow:\n> [paste each node — Type / Actor / Description — in order]\n> Tools: [paste]\n> Risks: [paste]\n\n" +
    "3. Copy the Mermaid output and paste into [Mermaid Live](https://mermaid.live) to render the visual.\n" +
    "4. Submit the rendered diagram alongside the in-page blueprint screenshot.\n\n" +
    "**B. Demo video** (60-sec narrated walkthrough of an imagined run)\n\n" +
    "1. Use the Suggest-tools button on step 2 to find a current synthetic-spokesperson AI — free tiers exist that are enough for a 60-sec demo.\n" +
    "2. Write a 60-second script: start with the Trigger, walk one happy path through the Steps, name the Human checkpoint and what the human checks, end with the End condition. One sentence per node.\n" +
    "3. Generate the video. Pick a voice and an avatar that match the audience you'd actually present this to.\n" +
    "4. Test: hand the video to a colleague who hasn't seen the design. Can they tell you (a) what the agent does, (b) where the human stays in the loop, (c) what could go wrong? If yes, the design is communicable; if no, the script — or the design — needs tightening.\n\n" +
    "Why this is worth doing: agent designs travel poorly as text walls. A Mermaid version drops cleanly into team docs; a video version is what gets a stakeholder to actually watch on their phone.";
  await sb
    .from("level_up_activities")
    .update({ description: a17Description })
    .eq("id", 17);
  console.log(
    "✓ A17 description split fixed + demo-video extension route added"
  );
}

main();
