/**
 * Patch 1.0.0 — Concise short_name for each of the 14 skills.
 *
 * The seed script derives short_name from the first clause of the
 * "I can..." statement, which produces long phrases like
 *   "explain how I balance curiosity"
 * that overflow filter dropdowns and card chips in the UI. These
 * names are tight labels (1–3 words) meant for compact display;
 * the full statement remains the canonical definition of the skill.
 *
 * Semver for this family of migrations:
 *   MAJOR — a skill is split, merged, or its meaning changes
 *   MINOR — a rename that shifts the label's emphasis
 *   PATCH — wording tweaks that preserve emphasis
 *
 * Run with: npx tsx supabase/seed/update-skills-1.0.0.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const shortNames: Record<number, string> = {
  1: "Tool choice",
  2: "Iterative dialogue",
  3: "Source verification",
  4: "Fact-checking",
  5: "Editing AI output",
  6: "AI agents",
  7: "Data & privacy",
  8: "Visuals",
  9: "Disclosure",
  10: "AI literacy",
  11: "Creative use",
  12: "Intentional use",
  13: "Staying current",
  14: "Learning with AI",
};

async function run() {
  for (const [idStr, short_name] of Object.entries(shortNames)) {
    const id = Number(idStr);
    const { error } = await supabase
      .from("skills")
      .update({ short_name })
      .eq("id", id);
    if (error) {
      console.error(`Skill ${id}: ${error.message}`);
      continue;
    }
    console.log(`Skill ${id} → ${short_name}`);
  }
  console.log("\n✅ Patch 1.0.0 applied");
}

run();
