/**
 * wave-19-sources-sweep-1.0.0.ts
 *
 *   Across all activities: extract embedded source links from step
 *   detailed_help and move them into the per-activity extra_sources
 *   field. The link markdown becomes plain bold text inline; the
 *   actual URL surfaces only through the Explore the Sources
 *   accordion at the bottom of the activity page.
 *
 *   Source patterns we treat as "underlying material" (move to
 *   extra_sources):
 *     - https://canvas.asu.edu/courses/...
 *     - https://rise.articulate.com/...
 *     - /pdf/... (the in-app PDF wrapper)
 *     - https://drive.google.com/file/...
 *     - lx.asu.edu/ai...
 *     - aix-framework.lei-tech.org
 *     - nmu.edu/ctl/...
 *     - ttu.edu/accessibility/...
 *     - guides.libraries.uc.edu/...
 *
 *   Tools, utilities, and in-context links (Excalidraw, Mermaid,
 *   Google Scholar, ASU AI tools list, ai.asu.edu/ai-tools) stay in
 *   the prose since users need them to do the activity.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

function isSourceUrl(url: string): boolean {
  return (
    url.startsWith("https://canvas.asu.edu/courses/") ||
    url.startsWith("https://rise.articulate.com/") ||
    url.startsWith("/pdf/") ||
    url.startsWith("https://drive.google.com/file/") ||
    url.includes("lx.asu.edu/ai") ||
    url.includes("aix-framework.lei-tech.org") ||
    url.includes("nmu.edu/ctl/") ||
    url.includes("ttu.edu/accessibility/") ||
    url.includes("guides.libraries.uc.edu/")
  );
}

function inferSource(url: string): string {
  if (url.startsWith("https://canvas.asu.edu/courses/"))
    return "Canvas (ASU GenAI course)";
  if (url.startsWith("https://rise.articulate.com/")) return "Articulate Rise";
  if (url.startsWith("/pdf/") || url.includes("drive.google.com/file/"))
    return "ASU GenAI training PDF";
  if (url.includes("lx.asu.edu/ai")) return "ASU AI Creative Learning Lab";
  if (url.includes("aix-framework.lei-tech.org")) return "AI-X Framework";
  if (url.includes("nmu.edu/ctl/")) return "NMU CTL";
  if (url.includes("ttu.edu/accessibility/")) return "TTU Accessibility";
  if (url.includes("guides.libraries.uc.edu/")) return "UC Library";
  return "External reference";
}

type ExtraSource = {
  title: string;
  url: string;
  source: string;
  meta: string;
  where: string;
};

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data: steps, error } = await sb
    .from("activity_guide_steps")
    .select("id,activity_id,step_number,detailed_help");
  if (error) throw error;

  const { data: activities } = await sb
    .from("level_up_activities")
    .select("id,extra_sources");
  const existingExtras = new Map<number, ExtraSource[]>();
  for (const a of activities ?? []) {
    const e = Array.isArray(a.extra_sources)
      ? (a.extra_sources as ExtraSource[])
      : [];
    existingExtras.set(a.id, e);
  }

  // Per-activity collected extras (ordered, deduped by URL).
  const collected = new Map<number, ExtraSource[]>();
  // Per-step rewritten detailed_help.
  const stepRewrites = new Map<
    number,
    { id: number; activityId: number; nextHelp: string }
  >();

  for (const s of steps ?? []) {
    if (!s.detailed_help) continue;
    let modified = false;
    const newHelp = s.detailed_help.replace(linkRegex, (full, label, url) => {
      if (!isSourceUrl(url)) return full;
      modified = true;
      const list = collected.get(s.activity_id) ?? [];
      if (!list.some((x) => x.url === url)) {
        list.push({
          title: label,
          url,
          source: inferSource(url),
          meta: "",
          where: "",
        });
        collected.set(s.activity_id, list);
      }
      // Replace inline with bold text only; the live link is in the Sources
      // accordion below.
      return `**${label}**`;
    });
    if (modified) {
      stepRewrites.set(s.id, {
        id: s.id,
        activityId: s.activity_id,
        nextHelp: newHelp,
      });
    }
  }

  // Apply step rewrites.
  for (const r of stepRewrites.values()) {
    const { error: e } = await sb
      .from("activity_guide_steps")
      .update({ detailed_help: r.nextHelp })
      .eq("id", r.id);
    if (e) console.error(`  x step ${r.id}:`, e.message);
  }
  console.log(`✓ rewrote detailed_help on ${stepRewrites.size} steps`);

  // Merge extras into existing.
  for (const [activityId, newExtras] of collected.entries()) {
    const existing = existingExtras.get(activityId) ?? [];
    const merged = [...existing];
    for (const x of newExtras) {
      if (!merged.some((m) => m.url === x.url)) {
        merged.push(x);
      }
    }
    const { error: e } = await sb
      .from("level_up_activities")
      .update({ extra_sources: merged })
      .eq("id", activityId);
    if (e) console.error(`  x activity ${activityId}:`, e.message);
  }
  console.log(
    `✓ extra_sources populated on ${collected.size} activities`
  );

  console.log("\nDone.");
}

main();
