/**
 * wave-31-build-with-ai-platforms-1.0.0.ts
 *
 * Skill 16 (Build with AI) covers agents, visuals, and technical
 * mechanics. Add explicit references to ASU-supported builders so we
 * don't have to teach how to use each one in detail:
 *   - Create AI's custom assistant builder (ASU)
 *   - ChatGPT custom GPTs (OpenAI)
 *   - Claude Projects / Claude Cowork (Anthropic)
 *
 * Each is linked to its how-to / docs page. Touches step 1 of
 * Activity 17 (Design an Agent), step 1 of Activity 18 (Build &
 * Test), and adds an extras_sources block on activity 18 so users
 * can grab the docs pages from the Explore the Sources accordion.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const PLATFORMS_NOTE =
  "**Where to actually build the agent (ASU-supported options):**\n\n• [Create AI's custom assistant builder](https://platform.aiml.asu.edu) (ASU's institutional platform — VITRA-cleared by default, the safest place to put student data).\n• [ChatGPT custom GPTs](https://help.openai.com/en/articles/8554407-gpts-faq) (OpenAI; widely used, well-documented).\n• [Claude Projects](https://support.anthropic.com/en/articles/9519177-what-are-projects) (Anthropic; strong file-attached knowledge bases and \"Cowork\" workflows).\n\nWe don't teach each platform here in detail; the linked how-to pages cover that. Pick one based on what your team already has access to and what data the agent will see.";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // Activity 17 (Design an Agent) — bridge to platform choices
  // appended into step 1's detailed_help. This activity is paper /
  // digital design; the platform call comes when you actually build.
  const { data: a17s1 } = await sb
    .from("activity_guide_steps")
    .select("detailed_help")
    .eq("activity_id", 17)
    .eq("step_number", 1)
    .single();
  if (a17s1?.detailed_help && !a17s1.detailed_help.includes("Create AI's custom assistant")) {
    await sb
      .from("activity_guide_steps")
      .update({
        detailed_help: a17s1.detailed_help + "\n\n" + PLATFORMS_NOTE,
      })
      .eq("activity_id", 17)
      .eq("step_number", 1);
    console.log("✓ activity 17 step 1 — platform refs appended");
  } else {
    console.log("- activity 17 step 1 — already has platform refs (skipped)");
  }

  // Activity 18 (Build & Test) — pin platform refs into step 1, plus
  // add an extra_sources entry on the activity itself so the docs
  // surface in the Explore the Sources accordion at the bottom.
  const { data: a18s1 } = await sb
    .from("activity_guide_steps")
    .select("detailed_help")
    .eq("activity_id", 18)
    .eq("step_number", 1)
    .single();
  if (a18s1?.detailed_help && !a18s1.detailed_help.includes("Create AI's custom assistant")) {
    await sb
      .from("activity_guide_steps")
      .update({
        detailed_help: a18s1.detailed_help + "\n\n" + PLATFORMS_NOTE,
      })
      .eq("activity_id", 18)
      .eq("step_number", 1);
    console.log("✓ activity 18 step 1 — platform refs appended");
  } else {
    console.log("- activity 18 step 1 — already has platform refs (skipped)");
  }

  await sb
    .from("level_up_activities")
    .update({
      extra_sources: [
        {
          title: "Create AI custom assistant builder",
          url: "https://platform.aiml.asu.edu",
          source: "ASU AI/ML Platform",
          meta: "Builder — ASU-supported",
          where: "Create / configure an assistant",
        },
        {
          title: "ChatGPT custom GPTs FAQ",
          url: "https://help.openai.com/en/articles/8554407-gpts-faq",
          source: "OpenAI Help Center",
          meta: "Docs — external",
          where: "How to build and configure a custom GPT",
        },
        {
          title: "Claude Projects (a.k.a. Cowork) overview",
          url: "https://support.anthropic.com/en/articles/9519177-what-are-projects",
          source: "Anthropic Support",
          meta: "Docs — external",
          where: "Workspace + knowledge-base setup",
        },
      ],
    })
    .eq("id", 18);
  console.log("✓ activity 18 extra_sources updated with platform docs");
}

main();
