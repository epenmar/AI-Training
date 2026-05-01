/**
 * wave-9-pdf-rewrap-1.0.0.ts
 *
 * Rewrite Drive-PDF links in step detailed_help so they go through the
 * in-app /pdf/{fileId}?page=N wrapper. The wrapper embeds Drive's
 * /preview URL inside an iframe, which honors the ?page=N param and
 * actually deep-links the user to the right page (Drive's /view URL
 * ignores #page=N).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// Match: https://drive.google.com/file/d/<id>/view#page=<n>
// or:    https://drive.google.com/file/d/<id>/view  (no page anchor)
const DRIVE_REGEX =
  /https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]+)\/view(?:#page=(\d+))?/g;

function rewriteDriveLinks(text: string): string {
  return text.replace(DRIVE_REGEX, (_full, id, page) => {
    const qs = page ? `?page=${page}` : "";
    return `/pdf/${id}${qs}`;
  });
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data, error } = await sb
    .from("activity_guide_steps")
    .select("id,detailed_help");
  if (error) throw error;

  let touched = 0;
  for (const row of data ?? []) {
    if (!row.detailed_help) continue;
    const next = rewriteDriveLinks(row.detailed_help);
    if (next === row.detailed_help) continue;
    const { error: uErr } = await sb
      .from("activity_guide_steps")
      .update({ detailed_help: next })
      .eq("id", row.id);
    if (uErr) console.error(`  x step ${row.id}:`, uErr.message);
    else touched++;
  }
  console.log(`Drive PDF link rewrite: ${touched} steps updated`);
}

main();
