/**
 * wave-43-strip-everyday-vocab-1.0.0.ts
 *
 * Apply the sharpened clickable-vocab principle: a term gets a
 * `{{term:def}}` clickable ONLY if its meaning in tech/AI is different
 * from what a college-educated reader would expect from everyday
 * English. Audience knows what "verification," "disclosure,"
 * "attribution," and "cadence" mean.
 *
 * Strip these (same meaning in tech and everyday English):
 *   verification (10), Verification (1)
 *   disclosure (3)
 *   cadence (1)
 *   attribution (1), attributions (1)
 *   substantive use (1)
 *
 * Keep these (genuinely disambiguated by tech context):
 *   prompt / Prompt / prompts (AI input, not the verb)
 *   VITRA, RACCCA, Principled Innovation (acronyms / framework names)
 *   trigger (event that kicks off an agent)
 *   multi-turn conversation, context windows (AI-specific)
 *   step skipping / wrong UI / vague pointer (A41-coined failure modes)
 *   human checkpoint (agent-design pattern)
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Terms to strip. Case-insensitive on the marker side; the replacement
// preserves the term as it appeared in the source.
const STRIP_TERMS = [
  "verification",
  "disclosure",
  "cadence",
  "attribution",
  "attributions",
  "substantive use",
];

function stripVocab(text: string | null): string | null {
  if (text == null) return null;
  // Definitions never contain `}` in current content.
  let out = text;
  for (const term of STRIP_TERMS) {
    // Escape regex special chars in the term (only space here, but be safe).
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const re = new RegExp(`\\{\\{(${escaped}):[^}]*\\}\\}`, "gi");
    out = out.replace(re, (_, captured) => captured);
  }
  return out;
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id, activity_id, step_number, instruction, detailed_help");

  let changed = 0;
  for (const s of steps ?? []) {
    const newInstr: string | null = stripVocab(s.instruction);
    const newHelp: string | null = stripVocab(s.detailed_help);
    if (newInstr === s.instruction && newHelp === s.detailed_help) continue;
    const patch: { instruction?: string; detailed_help?: string | null } = {};
    if (newInstr !== s.instruction && newInstr !== null) patch.instruction = newInstr;
    if (newHelp !== s.detailed_help) patch.detailed_help = newHelp;
    await sb.from("activity_guide_steps").update(patch).eq("id", s.id);
    changed++;
    console.log(`  · A${s.activity_id} step ${s.step_number} (id=${s.id})`);
  }
  console.log(`\n✓ Stripped everyday-English vocab from ${changed} steps`);
}

main();
