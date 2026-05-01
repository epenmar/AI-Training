/**
 * wave-1-fixes-1.0.0.ts
 *
 *   1. Replace "Suggest tools button above" / "use the button above"
 *      / "the resources above" with their "below" equivalents in
 *      every step's detailed_help and instruction. The ASU resources
 *      panel now sits *inside* the per-step accordion, so it's
 *      visually below the help text, not above the page.
 *   2. Surface explicit page numbers in any link text for Drive PDFs,
 *      since Google Drive's viewer ignores #page=N anchors. Users at
 *      least see "open to page 2" in the link label.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const ABOVE_TO_BELOW: [string | RegExp, string][] = [
  ["Suggest tools** button above", "Suggest tools** button below"],
  ["**Suggest tools** button above", "**Suggest tools** button below"],
  ["Use the **Suggest tools** button above", "Use the **Suggest tools** button below"],
  ["use the **Suggest tools** button above", "use the **Suggest tools** button below"],
  ["the resources above", "the resources below"],
  ["resources above", "resources below"],
  ["the **Suggest tools** button above", "the **Suggest tools** button below"],
  ["the resources panel above", "the resources panel below"],
  ["from the resources above", "from the resources below"],
  ["from the resources panel above", "from the resources panel below"],
  // Generic fallback for "Suggest tools" with no markdown bold
  ["Suggest tools button above", "Suggest tools button below"],
];

function rewriteAboveBelow(text: string): string {
  let out = text;
  for (const [find, replace] of ABOVE_TO_BELOW) {
    if (typeof find === "string") {
      out = out.replaceAll(find, replace);
    } else {
      out = out.replace(find, replace);
    }
  }
  return out;
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data, error } = await sb
    .from("activity_guide_steps")
    .select("id,instruction,detailed_help");
  if (error) throw error;

  let touched = 0;
  for (const row of data ?? []) {
    const patch: Database["public"]["Tables"]["activity_guide_steps"]["Update"] = {};
    if (row.instruction) {
      const next = rewriteAboveBelow(row.instruction);
      if (next !== row.instruction) patch.instruction = next;
    }
    if (row.detailed_help) {
      const next = rewriteAboveBelow(row.detailed_help);
      if (next !== row.detailed_help) patch.detailed_help = next;
    }
    if (Object.keys(patch).length === 0) continue;
    const { error: uErr } = await sb
      .from("activity_guide_steps")
      .update(patch)
      .eq("id", row.id);
    if (uErr) console.error(`  x step ${row.id}:`, uErr.message);
    else touched++;
  }
  console.log(`above->below rewrite: ${touched} steps updated`);

  // 2. Drive PDF page hints. Google Drive's web viewer ignores #page=N,
  //    so we make sure the link text says "open to page N" so users at
  //    least know what to scroll to.
  const { data: rows } = await sb
    .from("activity_guide_steps")
    .select("id,detailed_help");
  let pdfPatched = 0;
  for (const r of rows ?? []) {
    if (!r.detailed_help) continue;
    const next = r.detailed_help.replace(
      /\[([^\]]+)\]\((https:\/\/drive\.google\.com\/file\/d\/[^/)]+\/view#page=(\d+))\)/g,
      (_full, label, url, page) => {
        // If the label already mentions the page, leave alone.
        if (/\bp\.?\s*\d/i.test(label) || /page\s*\d/i.test(label))
          return `[${label}](${url})`;
        return `[${label} (PDF, open to page ${page})](${url})`;
      }
    );
    if (next === r.detailed_help) continue;
    const { error: uErr } = await sb
      .from("activity_guide_steps")
      .update({ detailed_help: next })
      .eq("id", r.id);
    if (uErr) console.error(`  x step ${r.id}:`, uErr.message);
    else pdfPatched++;
  }
  console.log(`PDF page hints: ${pdfPatched} steps updated`);

  console.log("\nDone.");
}

main();
