/**
 * wave-42-fabrication-detector-sources-1.0.0.ts
 *
 * A8 (The Fabrication Detector): give learners a real toolkit for
 * finding peer-reviewed sources, not just a passing Google Scholar
 * mention.
 *
 *   - Step 3 detailed_help: expand the "Search method" section into a
 *     "Where to look for peer-reviewed sources" mini-guide. ASU
 *     library + discipline-specific indexes (PubMed, ERIC, JSTOR,
 *     IEEE Xplore, Web of Science) + Semantic Scholar. The AI can
 *     fabricate confidently; the way you catch it is by knowing
 *     which database to check first for *your* discipline.
 *   - Push three of those (ASU Library, PubMed, Semantic Scholar) into
 *     the Sources and Resources callout so they're one click away on
 *     every revisit.
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

const NEW_PEER_REVIEWED_SOURCES: Source[] = [
  {
    title: "ASU Library — Articles & Databases",
    url: "https://lib.asu.edu/databases",
    source: "ASU Library",
    meta: "Reference · Discipline-indexed databases",
  },
  {
    title: "Semantic Scholar",
    url: "https://www.semanticscholar.org/",
    source: "Allen Institute for AI",
    meta: "Reference · Multidisciplinary peer-reviewed search",
  },
  {
    title: "PubMed",
    url: "https://pubmed.ncbi.nlm.nih.gov/",
    source: "NIH / NLM",
    meta: "Reference · Biomedical & life sciences",
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // 1) Step 3 detailed_help: expand search guidance.
  const newStep3Help =
    "**Search method:** copy the *exact* citation title into [Google Scholar](https://scholar.google.com), wrapped in quotation marks. If nothing comes back, drop the quotes and try again. If still nothing, search the author's name plus a distinctive phrase from the title.\n\n" +
    "**Where to look for peer-reviewed sources** (Google Scholar is the broadest net, but discipline-specific indexes catch what it misses):\n\n" +
    "- **[ASU Library — Articles & Databases](https://lib.asu.edu/databases)** — start here. The library subscribes to most major peer-reviewed indexes for every discipline ASU teaches. Logged-in access bypasses paywalls you'd hit otherwise.\n" +
    "- **[Semantic Scholar](https://www.semanticscholar.org/)** — multidisciplinary, AI-indexed. Especially good for surfacing related work and tracking citations forward in time.\n" +
    "- **Discipline-specific indexes:**\n" +
    "  - **Biomedical / health:** [PubMed](https://pubmed.ncbi.nlm.nih.gov/)\n" +
    "  - **Education:** [ERIC](https://eric.ed.gov/)\n" +
    "  - **Humanities & social sciences:** [JSTOR](https://www.jstor.org/) (via ASU Library for full text)\n" +
    "  - **Engineering / CS:** [IEEE Xplore](https://ieeexplore.ieee.org/), [ACM Digital Library](https://dl.acm.org/)\n" +
    "  - **Multidisciplinary citation tracking:** Web of Science, Scopus (both via ASU Library)\n\n" +
    "**Three patterns to expect:**\n" +
    "• **Real:** title, author, journal, year all match. → *green*\n" +
    "• **Frankenstein:** real author + real journal, but this specific paper doesn't exist. → *red*\n" +
    "• **Fully invented:** no trace anywhere. Sometimes the author also doesn't exist. → *red*\n\n" +
    "\"Described accurately\" means the AI's summary of the article actually matches the abstract. A real paper with a wrong-summary still gets red.";

  await sb
    .from("activity_guide_steps")
    .update({ detailed_help: newStep3Help })
    .eq("activity_id", 8)
    .eq("step_number", 3);
  console.log("✓ A8 step 3 — peer-reviewed search toolkit added to detailed_help");

  // 2) Append the three peer-reviewed search anchors to A8's extra_sources,
  //    deduplicated, capped at 6 (matches the activity-detail page renderer's
  //    de facto limit).
  const { data: a } = await sb
    .from("level_up_activities")
    .select("extra_sources")
    .eq("id", 8)
    .single();
  const existing: Source[] = Array.isArray(a?.extra_sources)
    ? (a!.extra_sources as Source[]).filter(
        (e) => e && typeof e.title === "string" && typeof e.url === "string"
      )
    : [];
  const seen = new Set(existing.map((e) => e.url.trim().toLowerCase()));
  // Insert peer-reviewed anchors at the top — they're the most directly
  // useful for this activity's verification work.
  const merged: Source[] = [];
  for (const s of NEW_PEER_REVIEWED_SOURCES) {
    const key = s.url.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(s);
  }
  for (const s of existing) {
    const key = s.url.trim().toLowerCase();
    if (seen.has(key) && !merged.some((m) => m.url.toLowerCase() === key)) {
      merged.push(s);
    } else if (!seen.has(key)) {
      seen.add(key);
      merged.push(s);
    } else {
      // already pushed via NEW_PEER_REVIEWED_SOURCES path
      if (!merged.some((m) => m.url.toLowerCase() === key)) merged.push(s);
    }
  }
  const capped = merged.slice(0, 6);
  await sb
    .from("level_up_activities")
    .update({ extra_sources: capped })
    .eq("id", 8);
  console.log(
    `✓ A8 extra_sources updated — ${capped.length} entries (peer-reviewed anchors first)`
  );
}

main();
