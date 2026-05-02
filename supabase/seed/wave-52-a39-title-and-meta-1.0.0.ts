/**
 * wave-52-a39-title-and-meta-1.0.0.ts
 *
 * Finish the A39 pivot started in wave-51. The description and steps
 * pivoted to "build an auto-curating news agent," but the title,
 * value_add, and objectives still read for the old hand-drafted
 * newsletter framing. This wave aligns those:
 *
 *   - title:       "Curate a Team Brief" → "Build an Auto-Curating
 *                  AI News Agent"
 *   - value_add:   the time-saving angle moves from "you do triage
 *                  faster" to "the agent does triage so you can stop"
 *   - objectives:  rewritten to the agent-build outcomes (pick a
 *                  stack, wire integrations, system-prompt the
 *                  curation, ship a sustainable cadence)
 *   - time_estimate bumped from 30 min → 60-90 min to match the new
 *                  scope (this is now an actual integration build,
 *                  not a writing exercise)
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

  await sb
    .from("level_up_activities")
    .update({
      title: "Build an Auto-Curating AI News Agent",
      value_add:
        "Your team can't read everything; you can't either. An agent that does the triage and writes the brief on a cadence is the difference between staying current and pretending to. The setup is real work; the recurring cost is approximately zero.",
      objectives: [
        "Pick a workable AI tool × destination × cadence stack for your team.",
        "Use AI to map and execute the integration steps for that specific stack.",
        "Author a system prompt that produces a tight, on-voice brief every issue.",
        "Ship a working scheduled agent + a recipe a colleague could fork.",
      ],
      time_estimate: "60-90 min",
    })
    .eq("id", 39);
  console.log(
    "✓ A39 title / value_add / objectives / time_estimate aligned with the agent pivot"
  );
}

main();
