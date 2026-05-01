/**
 * wave-21-pdf-localize-1.0.0.ts
 *
 *   Replace Drive PDF aliases in extra_sources with the friendly local
 *   slug. The PDF wrapper page accepts both forms (the legacy Drive
 *   file ID still resolves to the local file via a redirect map), but
 *   the slug version is the canonical reference going forward.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const DRIVE_ID = "1eoJvnLNMY-nW18z8hkWRq8gNqRpoGaO-";
const SLUG = "genai101-takehome-reference";

type ExtraSource = {
  title: string;
  url: string;
  source: string;
  meta: string;
  where: string;
};

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data: rows, error } = await sb
    .from("level_up_activities")
    .select("id,extra_sources")
    .neq("extra_sources", "[]");
  if (error) throw error;

  let updated = 0;
  for (const a of rows ?? []) {
    const list = Array.isArray(a.extra_sources)
      ? (a.extra_sources as ExtraSource[])
      : [];
    let touched = false;
    const next = list.map((x) => {
      if (typeof x.url === "string" && x.url.includes(`/pdf/${DRIVE_ID}`)) {
        touched = true;
        return {
          ...x,
          url: x.url.replace(`/pdf/${DRIVE_ID}`, `/pdf/${SLUG}`),
          source: "ASU GenAI 101 take-home reference (PDF)",
        };
      }
      return x;
    });
    if (!touched) continue;
    const { error: e } = await sb
      .from("level_up_activities")
      .update({ extra_sources: next })
      .eq("id", a.id);
    if (e) console.error(`  x activity ${a.id}:`, e.message);
    else updated++;
  }
  console.log(`✓ extra_sources Drive→slug rewrite: ${updated} activities`);
}

main();
