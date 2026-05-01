/**
 * wave-18-fixes-1.0.0.ts
 *
 *   Move embedded source links out of Activity 4's step 2 detailed_help
 *   and into the activity's extra_sources field, so they show up only
 *   in the (now collapsible) Explore the Sources accordion at the
 *   bottom. Pattern to apply to other activities later.
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

  // Activity 4 step 2: strip the two embedded source links.
  const newStep2Help =
    '**What makes a good opening prompt:** it\'s specific enough that the AI can give you something useful, but open enough that there\'s somewhere to go next. "What is photosynthesis?" is a closed question, one answer, conversation over. "How would you explain photosynthesis to a student who already understands cell respiration?" has an angle and leaves room.\n\nIf you want to read the underlying material on what makes a prompt land, the **Explore the Sources** accordion at the bottom of the page has both ASU\'s reference PDF and the Articulate Rise lesson on prompt construction.';

  const { error: stepErr } = await sb
    .from("activity_guide_steps")
    .update({ detailed_help: newStep2Help })
    .eq("activity_id", 4)
    .eq("step_number", 2);
  if (stepErr) console.error("step 4/2:", stepErr.message);
  else console.log("✓ activity 4 step 2 detailed_help cleaned");

  // Add extras to activity 4's extra_sources.
  const extras = [
    {
      title: "Input quality = output quality reference (PDF, p. 2)",
      url: "/pdf/1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-?page=2",
      source: "ASU GenAI training PDF",
      meta: "Foundational · Reference",
      where: "Page 2",
    },
    {
      title: "Module 4, Lesson 1 — Steps for an effective prompt",
      url: "https://rise.articulate.com/share/Ih949hPlICDdUyw0OtVdBtg6EWYn0V3n#/lessons/K0OMFl0s_2SIUThBCuYlAR63-lF5xI9P",
      source: "Articulate Rise",
      meta: "Foundational · Lesson · ~10 min",
      where: "",
    },
  ];

  const { error: actErr } = await sb
    .from("level_up_activities")
    .update({ extra_sources: extras })
    .eq("id", 4);
  if (actErr) console.error("activity 4:", actErr.message);
  else console.log("✓ activity 4 extra_sources populated");
}

main();
