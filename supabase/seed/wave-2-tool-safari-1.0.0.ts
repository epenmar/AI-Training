/**
 * wave-2-tool-safari-1.0.0.ts
 *
 * Rewrite Activity 1 (AI Tool Safari) around ASU's Compare AI
 * interface. Three tools, one prompt, one page, side-by-side output.
 *
 *   - Steps 1-3 reframe the flow.
 *   - Step 5 becomes the combined observe + reflect table (replaces
 *     the old steps 5 + 6 reflection).
 *   - Step 6 is deleted by id.
 *   - Step 2's prompt_sandbox stays.
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

  type Patch =
    Database["public"]["Tables"]["activity_guide_steps"]["Update"];

  const updates: Array<{ stepNumber: number; patch: Patch }> = [
    {
      stepNumber: 1,
      patch: {
        instruction:
          "Open ASU's Compare AI and pick three different models from the list (e.g., GPT-5, Claude Sonnet, Gemini Pro). The Compare AI interface lets you run one prompt across all three at once and watch their answers stream side-by-side.",
        detailed_help:
          "**What Compare AI is.** ASU's hosted comparison tool: one prompt, multiple models, real-time output streaming in three columns. It's the fastest way to see how different AI tools handle the same task without bouncing between three browser tabs.\n\n**Which three to pick.** Different model families if you can: a GPT-family model, an Anthropic Claude model, a Google Gemini model. Same-family models often produce similar output, the comparison gets more interesting across families. The dropdowns inside Compare AI list everything ASU has access to right now.\n\n**Don't send anything yet.** Get all three columns waiting on the same prompt screen, you'll paste the prompt in the next step.",
        show_asu_resources: true,
      },
    },
    {
      stepNumber: 2,
      patch: {
        instruction:
          "Paste the prompt below into Compare AI's single prompt box and run it. All three models will start generating at once.",
        detailed_help:
          "**Why a single prompt across three tools.** This is a controlled test: same input, see how outputs differ. If you tweak the prompt between models you're no longer comparing tools, you're comparing prompts.\n\n**What you're doing is called zero-shot prompting.** You give the AI a task without showing it any examples of what a good answer looks like. Just the ask. This is how most people use AI tools day-to-day, so it's a useful baseline.",
        // The prompt sandbox stays from earlier seed.
      },
    },
    {
      stepNumber: 3,
      patch: {
        instruction:
          "Watch the three columns stream. The point isn't to read every word, it's to feel the differences in real time: who finishes first, who pads, who edits aggressively.",
        detailed_help:
          "**Real-time streaming is its own information.** The model that finishes first isn't necessarily the best, but speed says something about how the model thinks: terse vs. verbose, decisive vs. hedging.\n\n**Read the finished outputs side-by-side once they're done.** Don't scroll one at a time, the value is in the parallel comparison.",
      },
    },
    {
      stepNumber: 4,
      patch: {
        instruction:
          "Notice four things in each tool's output: length, tone, constraint-following, and accuracy.",
        detailed_help:
          "**Length.** Did it stick to three sentences, or did it pad?\n\n**Tone.** Would you put this in a syllabus as-is, or does it read like a marketing brochure?\n\n**Constraint-following.** The prompt said three sentences. Some tools treat that as a hard rule, others as a loose suggestion.\n\n**Accuracy.** Anything that sounds factually off? Active learning has been written about for decades, AI shouldn't be inventing things here.\n\nNo tool will be best on all four. That's the point.",
      },
    },
    {
      stepNumber: 5,
      patch: {
        instruction:
          "Capture your observations across the three tools in the table below. The final row is the one decision worth making: which tool did you find most useful, and why? Save this in the deliverable box at the bottom of this page when you're done.",
        detailed_help:
          "**Five rows per tool.** First row is the tool's name (so you remember in 6 months). Next four are the dimensions you just noticed.\n\n**The reflection at the end is the transferable insight.** \"I liked Claude\" is a starting point. \"Claude held the three-sentence constraint and matched a syllabus voice\" is a reason that transfers to your next decision.\n\nThe table saves in your browser, so you can come back to it later. When you're done, copy your reflection into the deliverable box at the bottom of this page.",
        interactive_type: "text_list_entry",
        interactive_data: {
          storageKey: "activity-1-comparison",
          prompt:
            "One column per tool, five rows each. Type whatever you noticed.",
          groups: [
            {
              id: "tool1",
              label: "Tool 1",
              placeholder:
                "1) name, 2) length, 3) tone, 4) constraint, 5) accuracy",
              count: 5,
            },
            {
              id: "tool2",
              label: "Tool 2",
              placeholder:
                "1) name, 2) length, 3) tone, 4) constraint, 5) accuracy",
              count: 5,
            },
            {
              id: "tool3",
              label: "Tool 3",
              placeholder:
                "1) name, 2) length, 3) tone, 4) constraint, 5) accuracy",
              count: 5,
            },
            {
              id: "pick",
              label: "Your pick + why",
              placeholder:
                "Which would you reach for first next time, and what made you pick it?",
              count: 1,
            },
          ],
        },
        show_asu_resources: false,
      },
    },
  ];

  for (const u of updates) {
    const { error } = await sb
      .from("activity_guide_steps")
      .update(u.patch)
      .eq("activity_id", 1)
      .eq("step_number", u.stepNumber);
    if (error) console.error(`  x step ${u.stepNumber}:`, error.message);
    else console.log(`✓ activity 1 step ${u.stepNumber} updated`);
  }

  // Drop the old step 6.
  const { error: delErr } = await sb
    .from("activity_guide_steps")
    .delete()
    .eq("activity_id", 1)
    .eq("step_number", 6);
  if (delErr) console.error("  x delete step 6:", delErr.message);
  else console.log("✓ activity 1 step 6 deleted");

  console.log("\nDone.");
}

main();
