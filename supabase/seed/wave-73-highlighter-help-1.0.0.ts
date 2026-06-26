/**
 * wave-73-highlighter-help-1.0.0.ts
 *
 * Copy follow-up to the HighlighterWorkspace toolbar relabel (Skill 7/8
 * reviewer UX fixes). The toolbar button "Replace text" was renamed to
 * "Start over" (now with a confirm step), so the one help string that
 * referenced the old label is updated to match.
 *
 * Only A8 step 2 referenced it (confirmed via DB scan).
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

  const a8s2Help =
    "**The workspace stays visible** as you scroll through the rest of the steps, so you don't have to flip back and forth. Select text and click a color in the toolbar to mark it.\n\n" +
    "**Three colors:** *green* for verified-and-accurate, *yellow* for partially accurate or unsure, *red* for wrong or fabricated. The percentages update live as you go.\n\n" +
    "**Erase highlight** removes the color from whatever you've selected; **Clear all highlights** removes every color but keeps your text. To paste a different AI output, use **Start over** — it asks you to confirm first, since it clears the text and all highlights.";

  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: a8s2Help })
    .eq("activity_id", 8)
    .eq("step_number", 2);
  console.log("✓ A8 step 2 — help updated to match the new highlighter toolbar labels");
}

main();
