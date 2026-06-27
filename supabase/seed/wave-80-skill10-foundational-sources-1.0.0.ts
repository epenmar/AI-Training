/**
 * wave-80-skill10-foundational-sources-1.0.0.ts
 *
 * Skill 10 reviewer note (A17 + A18): "the Sources/Resources are all
 * technical guides or AI tools — we need foundational knowledge-building
 * content for this lesson."
 *
 * We DO have it. The ASU GenAI 101 take-home reference PDF (already
 * hosted at /pdfs/genai101-takehome-reference.pdf and cited by other
 * activities) has an agents section: p.7 "How to build a system prompt,"
 * p.8 "AI progression: prompts → agents / what makes an agent different,"
 * p.9 "Agent risks & controls." Plus ASU LX's "Building Custom Bots and
 * AI Agents" page (verified live).
 *
 * Prepend these foundational sources so they sit ABOVE the tool docs in
 * the Explore Sources box.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type ExtraSource = {
  title: string;
  url: string;
  meta?: string;
  source?: string;
  where?: string;
};

const PDF = "/pdfs/genai101-takehome-reference.pdf";
const PDF_SOURCE = "ASU GenAI 101 take-home reference (PDF)";

const CONCEPT: ExtraSource = {
  title: "AI agents: from prompts to agents",
  url: `${PDF}#page=8`,
  meta: "Foundational · Concept · PDF p. 8",
  source: PDF_SOURCE,
};
const RISKS: ExtraSource = {
  title: "Agent risks & controls",
  url: `${PDF}#page=9`,
  meta: "Reference · PDF p. 9",
  source: PDF_SOURCE,
};
const SYSTEM_PROMPT: ExtraSource = {
  title: "How to build a system prompt (4 steps)",
  url: `${PDF}#page=7`,
  meta: "Reference · PDF p. 7",
  source: PDF_SOURCE,
};
const LX_BOTS: ExtraSource = {
  title: "Building custom bots & AI agents",
  url: "https://lx.asu.edu/ai/ai-enhanced-learning",
  meta: "ASU LX · learning page",
  source: "ASU LX",
};

// A17 (Design an Agent): concept + risks + the ASU LX page.
const A17_PREPEND = [CONCEPT, RISKS, LX_BOTS];
// A18 (Build and Test): system-prompt build + concept + risks + LX.
const A18_PREPEND = [SYSTEM_PROMPT, CONCEPT, RISKS, LX_BOTS];

async function prepend(
  sb: ReturnType<typeof createClient<Database>>,
  id: number,
  additions: ExtraSource[]
) {
  const { data: row } = await sb
    .from("level_up_activities")
    .select("extra_sources")
    .eq("id", id)
    .single();
  const existing = Array.isArray(row?.extra_sources)
    ? (row!.extra_sources as ExtraSource[])
    : [];
  // Don't double-add if re-run: drop any existing entry with the same url.
  const addUrls = new Set(additions.map((a) => a.url));
  const kept = existing.filter((e) => !addUrls.has(e.url));
  const next = [...additions, ...kept];
  await sb
    .from("level_up_activities")
    .update({ extra_sources: next })
    .eq("id", id);
  console.log(`✓ A${id} — prepended ${additions.length} foundational sources (now ${next.length})`);
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);
  await prepend(sb, 17, A17_PREPEND);
  await prepend(sb, 18, A18_PREPEND);
}

main();
