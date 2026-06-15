/**
 * wave-65-skill1-rise-deeplinks-1.0.0.ts
 *
 * Source precision for Skill 1 (Critical AI judgment). Canvas pages in
 * our source data have no deeper URLs (each module is one overview
 * page), but Articulate Rise lessons have real per-lesson deep links.
 * Add the bullseye Rise lessons to the two activities where one
 * matches exactly, prepended so the specific source leads:
 *
 *   A28 (Three Things AI Can and Can't Do) ← Rise "Do you know what AI
 *     can do?" (Module 2, Foundational).
 *   A36 (Principled Innovation Case Study) ← Rise "Leading with
 *     principled innovation" (Module 3, Advanced).
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type Source = {
  title: string;
  url: string;
  source?: string;
  meta?: string;
  where?: string;
};

const ADDITIONS: Record<number, Source> = {
  28: {
    title: "Module 2, Lesson — Do you know what AI can do?",
    url: "https://rise.articulate.com/share/fRP7fjoWsWuSXljLxc2dF011IycTdmdL#/lessons/_3dr-VqskB18C8sq3TPuSG2e-zUIxdTC",
    source: "Articulate Rise",
    meta: "Foundational · ~10 min",
  },
  36: {
    title: "Module 3, Lesson — Leading with principled innovation",
    url: "https://rise.articulate.com/share/LZmZZ-KMIhK7vDZxyC2e8ThCFkfQ5T01#/lessons/lfOOxPLD3C0RdcvLPrswna-zhRy-Bd9b",
    source: "Articulate Rise",
    meta: "Advanced · ~10 min",
  },
};

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  for (const [idStr, addition] of Object.entries(ADDITIONS)) {
    const id = Number(idStr);
    const { data: a } = await sb
      .from("level_up_activities")
      .select("extra_sources")
      .eq("id", id)
      .single();
    const existing: Source[] = Array.isArray(a?.extra_sources)
      ? (a!.extra_sources as Source[])
      : [];
    if (
      existing.some(
        (s) => s.url.trim().toLowerCase() === addition.url.toLowerCase()
      )
    ) {
      console.log(`(skip) A${id} already has the deep link`);
      continue;
    }
    const next = [addition, ...existing].slice(0, 6);
    await sb
      .from("level_up_activities")
      .update({ extra_sources: next })
      .eq("id", id);
    console.log(`✓ A${id} — prepended Rise deep link "${addition.title}"`);
  }
}

main();
