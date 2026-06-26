/**
 * wave-77-a45-prompt-fill-1.0.0.ts
 *
 * A45 step 2 -> step 3 copy-over (Skill 8 reviewer note: "wish I could
 * copy and paste the items on the buttons since they go into my
 * prompt"). PromptSandbox now supports `fillFrom` — it reads the
 * chip_selector selection at a storageKey and substitutes it for a token
 * in the starter, live, until the learner edits the prompt.
 *
 * Wire A45 step 3's prompt to step 2's bias-dimension picker
 * (storageKey activity-45-dimensions). Token must match the starter
 * exactly.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const TOKEN =
  "[list the dimensions you picked in step 2 — e.g., gender, age, cultural]";

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const starter =
    "Role: bias auditor for a [artifact type] used by a higher-ed audience.\n\n" +
    `Audit the artifact below for systematic bias along these dimensions: ${TOKEN}.\n\n` +
    "For each potential pattern you find:\n" +
    "1. Quote the specific phrase or item (verbatim).\n" +
    "2. Name the bias dimension.\n" +
    "3. Rate the pattern's apparent severity (subtle / moderate / overt).\n" +
    "4. Note whether the pattern repeats across the artifact or appears once.\n\n" +
    "Do NOT rewrite the artifact. Identify only — verification happens in step 4.\n\n" +
    "Artifact:\n[paste or attach the artifact here]";

  await sb
    .from("activity_guide_steps")
    .update({
      interactive_data: {
        hint: "Your step-2 dimensions drop in automatically. Edit [artifact type], attach or paste the artifact, and tweak anything else — your edits stick.",
        starter,
        fillFrom: {
          storageKey: "activity-45-dimensions",
          token: TOKEN,
        },
      },
    })
    .eq("activity_id", 45)
    .eq("step_number", 3);
  console.log("✓ A45 step 3 — prompt now auto-fills the bias dimensions from step 2");
}

main();
