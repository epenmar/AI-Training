/**
 * wave-61-gap-skill-materials-and-pdf-fix-1.0.0.ts
 *
 * Two things:
 *
 * 1. Fill the four skills that had zero lesson_flow rows:
 *    - Skill 17 — Critical AI judgment (5 items)
 *    - Skill 15 — Verify what AI gives you (4 items)
 *    - Skill 18 — Bias and equity in AI (4 items)
 *    - Skill 16 — Build with AI (7 items)
 *
 *    Each row gets a deep link (no home pages — the user's rule).
 *    The DB column `bloom_phase_id` is still NOT NULL even though
 *    phases are gone from the UI, so each row gets a reasonable
 *    phase assignment (most go to phase 4 "Verify & Analyze";
 *    Build-with-AI goes to phase 6 "Design AI Experiences").
 *
 * 2. PDF link fix (Option A from the approval): every entry in
 *    `extra_sources` that uses the wrapper URL pattern
 *    `/pdf/{slug}?page=N` is rewritten to `/pdfs/{slug}.pdf#page=N`,
 *    which the browser's native PDF viewer honors. The wrapper page
 *    at /pdf/[fileId] is kept for now (might rebuild on PDF.js
 *    later) but extras no longer route through it.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error(
    "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY"
  );
}

type LessonFlowInsert = {
  bloom_phase_id: number;
  item_title: string;
  link: string | null;
  source_url: string | null;
  source: string;
  learning_level: "Foundational" | "Intermediate" | "Advanced";
  modality: string;
  specific_location: string | null;
  skill_ids: number[];
  seq: number;
  original_phase: string | null;
  purpose: string | null;
  id_guidance: string | null;
};

// One row per (skill, item) we want to add. Seq is per-skill; the
// skill detail page sorts by seq ascending within each level group.
const NEW_MATERIALS: LessonFlowInsert[] = [
  // ---- Skill 17 — Critical AI judgment ----
  {
    bloom_phase_id: 4,
    item_title: "Module 1 overview — GPTs, terminology, capabilities",
    link: "https://canvas.asu.edu/courses/157584/pages/module-1-overview-3",
    source_url:
      "https://canvas.asu.edu/courses/157584/pages/module-1-overview-3",
    source: "Canvas (ASU GenAI course)",
    learning_level: "Foundational",
    modality: "Overview (~10 min)",
    specific_location: null,
    skill_ids: [17],
    seq: 1,
    original_phase: null,
    purpose:
      "Sets the baseline vocabulary and capability landscape — the prerequisite for any critical judgment about AI.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title: "Module 2 overview — types of GenAI applications and uses",
    link: "https://canvas.asu.edu/courses/157584/pages/module-2-overview-2",
    source_url:
      "https://canvas.asu.edu/courses/157584/pages/module-2-overview-2",
    source: "Canvas (ASU GenAI course)",
    learning_level: "Foundational",
    modality: "Overview (~10 min)",
    specific_location: null,
    skill_ids: [17],
    seq: 2,
    original_phase: null,
    purpose:
      "Tour of where AI actually fits across applications, so judgment is informed by what AI is being used for in practice.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title: "Principled Innovation framework",
    link: "https://aix-framework.lei-tech.org/principled-innovation",
    source_url: "https://aix-framework.lei-tech.org/principled-innovation",
    source: "AI-X / LEI (ASU-affiliated)",
    learning_level: "Intermediate",
    modality: "Framework",
    specific_location: null,
    skill_ids: [17],
    seq: 3,
    original_phase: null,
    purpose:
      "ASU's institutional decision lens: judgment held in tension between curiosity, care, clarity, and intentionality.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title: "AI as Normal Technology (essay)",
    link: "https://www.aisnakeoil.com/p/ai-as-normal-technology",
    source_url: "https://www.aisnakeoil.com/p/ai-as-normal-technology",
    source: "AI Snake Oil (Princeton CS — Narayanan & Kapoor)",
    learning_level: "Intermediate",
    modality: "Essay",
    specific_location: null,
    skill_ids: [17],
    seq: 4,
    original_phase: null,
    purpose:
      "Plain-English academic critique of overclaimed AI capabilities. Useful counterweight to vendor hype.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title: "AI Index Report (annual)",
    link: "https://aiindex.stanford.edu/report/",
    source_url: "https://aiindex.stanford.edu/report/",
    source: "Stanford HAI",
    learning_level: "Advanced",
    modality: "Annual report",
    specific_location: null,
    skill_ids: [17],
    seq: 5,
    original_phase: null,
    purpose:
      "Stanford HAI's annual state-of-AI report — the most-cited source for grounded data on what AI actually does.",
    id_guidance: null,
  },

  // ---- Skill 15 — Verify what AI gives you ----
  {
    bloom_phase_id: 4,
    item_title:
      "Module 5 overview — Key terms for evaluating GenAI outputs",
    link: "https://canvas.asu.edu/courses/157584/pages/module-5-overview-2",
    source_url:
      "https://canvas.asu.edu/courses/157584/pages/module-5-overview-2",
    source: "Canvas (ASU GenAI course)",
    learning_level: "Foundational",
    modality: "Overview (~5 min)",
    specific_location: null,
    skill_ids: [15],
    seq: 1,
    original_phase: null,
    purpose:
      "ASU's evaluation vocabulary — the verification frame the activities use.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title: "ASU Library — Research Help",
    link: "https://lib.asu.edu/research/help",
    source_url: "https://lib.asu.edu/research/help",
    source: "ASU Library",
    learning_level: "Foundational",
    modality: "Reference",
    specific_location: null,
    skill_ids: [15],
    seq: 2,
    original_phase: null,
    purpose:
      "Subject librarians and research-help paths — the direct route to vetted verification support.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title: "Civic Online Reasoning — Curriculum",
    link: "https://cor.stanford.edu/curriculum/",
    source_url: "https://cor.stanford.edu/curriculum/",
    source: "Stanford SHEG",
    learning_level: "Foundational",
    modality: "Curriculum",
    specific_location: null,
    skill_ids: [15],
    seq: 3,
    original_phase: null,
    purpose:
      "Methodology for lateral reading and source verification — directly applicable to AI-generated claims.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title: "About Semantic Scholar (how the AI-indexed search works)",
    link: "https://www.semanticscholar.org/about",
    source_url: "https://www.semanticscholar.org/about",
    source: "Allen Institute for AI",
    learning_level: "Intermediate",
    modality: "Tool overview",
    specific_location: null,
    skill_ids: [15],
    seq: 4,
    original_phase: null,
    purpose:
      "Free AI-indexed peer-reviewed search with forward-citation tracking. The About page explains how to use it for verification.",
    id_guidance: null,
  },

  // ---- Skill 18 — Bias and equity in AI ----
  {
    bloom_phase_id: 4,
    item_title:
      "Module 3 overview — ethical AI, fairness, transparency",
    link: "https://canvas.asu.edu/courses/157584/pages/module-3-overview-2",
    source_url:
      "https://canvas.asu.edu/courses/157584/pages/module-3-overview-2",
    source: "Canvas (ASU GenAI course)",
    learning_level: "Foundational",
    modality: "Overview (~10 min)",
    specific_location: null,
    skill_ids: [18],
    seq: 1,
    original_phase: null,
    purpose:
      "ASU's institutional intro to fairness and transparency framing.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title: "Algorithmic Justice League — About",
    link: "https://www.ajl.org/about",
    source_url: "https://www.ajl.org/about",
    source: "Algorithmic Justice League (Joy Buolamwini)",
    learning_level: "Foundational",
    modality: "Organization",
    specific_location: null,
    skill_ids: [18],
    seq: 2,
    original_phase: null,
    purpose:
      "Foundational research / advocacy on facial-recognition and demographic bias in AI.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title:
      "Algorithmic bias detection and mitigation: best practices and policies",
    link: "https://www.brookings.edu/articles/algorithmic-bias-detection-and-mitigation-best-practices-and-policies-to-reduce-consumer-harms/",
    source_url:
      "https://www.brookings.edu/articles/algorithmic-bias-detection-and-mitigation-best-practices-and-policies-to-reduce-consumer-harms/",
    source: "Brookings",
    learning_level: "Intermediate",
    modality: "Policy paper",
    specific_location: null,
    skill_ids: [18],
    seq: 3,
    original_phase: null,
    purpose:
      "Practical mitigation strategies in policy framing — bridges advocacy and operational practice.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 4,
    item_title:
      "Discriminating Systems: Gender, Race, and Power in AI",
    link: "https://ainowinstitute.org/publication/discriminating-systems-gender-race-and-power-in-ai-2",
    source_url:
      "https://ainowinstitute.org/publication/discriminating-systems-gender-race-and-power-in-ai-2",
    source: "AI Now Institute (NYU)",
    learning_level: "Intermediate",
    modality: "Research report",
    specific_location: null,
    skill_ids: [18],
    seq: 4,
    original_phase: null,
    purpose:
      "Landmark report on systemic / structural bias in AI from a leading academic institute.",
    id_guidance: null,
  },

  // ---- Skill 16 — Build with AI ----
  {
    bloom_phase_id: 6,
    item_title: "Create AI — institutional builder",
    link: "https://platform.aiml.asu.edu",
    source_url: "https://platform.aiml.asu.edu",
    source: "ASU AI/ML Platform",
    learning_level: "Foundational",
    modality: "Builder",
    specific_location: null,
    skill_ids: [16],
    seq: 1,
    original_phase: null,
    purpose:
      "Where ASU faculty actually build and run custom assistants — VITRA-cleared by default.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 6,
    item_title: "AI-Enhanced Learning examples",
    link: "https://lx.asu.edu/ai/ai-enhanced-learning",
    source_url: "https://lx.asu.edu/ai/ai-enhanced-learning",
    source: "ASU LX (Creative Learning Lab)",
    learning_level: "Foundational",
    modality: "Examples",
    specific_location: null,
    skill_ids: [16],
    seq: 2,
    original_phase: null,
    purpose:
      "ASU-curated examples of educator-built AI artifacts to model from.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 6,
    item_title: "Mermaid Live — text-to-diagram editor",
    link: "https://mermaid.live",
    source_url: "https://mermaid.live",
    source: "Mermaid",
    learning_level: "Foundational",
    modality: "Tool",
    specific_location: null,
    skill_ids: [16],
    seq: 3,
    original_phase: null,
    purpose:
      "Where Mermaid-syntax diagrams from agent and workflow activities actually render.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 6,
    item_title: "ChatGPT EDU — OpenAI's education platform",
    link: "https://openai.com/chatgpt/education/",
    source_url: "https://openai.com/chatgpt/education/",
    source: "OpenAI",
    learning_level: "Foundational",
    modality: "Platform",
    specific_location: null,
    skill_ids: [16],
    seq: 4,
    original_phase: null,
    purpose:
      "OpenAI's education-focused offering — what's available, what's different from consumer ChatGPT.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 6,
    item_title: "About GitHub — beginner's start guide",
    link: "https://docs.github.com/en/get-started/start-your-journey/about-github-and-git",
    source_url:
      "https://docs.github.com/en/get-started/start-your-journey/about-github-and-git",
    source: "GitHub Docs",
    learning_level: "Foundational",
    modality: "Guide",
    specific_location: null,
    skill_ids: [16],
    seq: 5,
    original_phase: null,
    purpose:
      "Prerequisite reading for the two GitHub-hosted Anthropic resources below — what GitHub is, why developer-style resources live there.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 6,
    item_title: "Anthropic prompt engineering interactive tutorial",
    link: "https://github.com/anthropics/prompt-eng-interactive-tutorial",
    source_url:
      "https://github.com/anthropics/prompt-eng-interactive-tutorial",
    source: "Anthropic (GitHub)",
    learning_level: "Intermediate",
    modality: "Tutorial",
    specific_location: null,
    skill_ids: [16],
    seq: 6,
    original_phase: null,
    purpose:
      "Hands-on prompt + agent construction patterns from Anthropic.",
    id_guidance: null,
  },
  {
    bloom_phase_id: 6,
    item_title: "Anthropic Cookbook",
    link: "https://github.com/anthropics/anthropic-cookbook",
    source_url: "https://github.com/anthropics/anthropic-cookbook",
    source: "Anthropic (GitHub)",
    learning_level: "Advanced",
    modality: "Cookbook",
    specific_location: null,
    skill_ids: [16],
    seq: 7,
    original_phase: null,
    purpose:
      "Production-grade agent patterns for educators who want to ship something durable.",
    id_guidance: null,
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ====================================================================
  // 1) Insert lesson_flow rows for the gap skills
  // ====================================================================

  // Defensive: skip rows whose (item_title, primary skill) already
  // exists, so re-runs are idempotent.
  const skillSet = new Set(NEW_MATERIALS.flatMap((m) => m.skill_ids));
  const { data: existing } = await sb
    .from("lesson_flow")
    .select("item_title, skill_ids");
  const existingKeys = new Set<string>();
  for (const row of existing ?? []) {
    for (const sid of row.skill_ids ?? []) {
      if (skillSet.has(sid)) {
        existingKeys.add(`${row.item_title}::${sid}`);
      }
    }
  }

  const toInsert = NEW_MATERIALS.filter((m) => {
    const key = `${m.item_title}::${m.skill_ids[0]}`;
    return !existingKeys.has(key);
  });

  if (toInsert.length === 0) {
    console.log("All target rows already present — no inserts needed.");
  } else {
    const { error } = await sb.from("lesson_flow").insert(toInsert);
    if (error) throw error;
    const bySkill = new Map<number, number>();
    for (const m of toInsert) {
      for (const sid of m.skill_ids) {
        bySkill.set(sid, (bySkill.get(sid) ?? 0) + 1);
      }
    }
    console.log(`✓ Inserted ${toInsert.length} lesson_flow rows`);
    for (const [sid, count] of bySkill.entries()) {
      console.log(`    skill ${sid}: +${count}`);
    }
  }

  // ====================================================================
  // 2) PDF URL fix — rewrite extra_sources URLs from the wrapper
  //    pattern to direct /pdfs/{slug}.pdf#page=N (Option A).
  // ====================================================================
  type Source = {
    title?: string;
    url?: string;
    source?: string;
    meta?: string;
    where?: string;
  };
  // Pattern: /pdf/{slug}?page=N → /pdfs/{slug}.pdf#page=N
  // Also covers /pdf/{slug} (no page param) → /pdfs/{slug}.pdf
  const WRAPPER_RE =
    /^\/pdf\/([A-Za-z0-9_-]+)(?:\?page=(\d+))?(.*)$/;

  const { data: activities } = await sb
    .from("level_up_activities")
    .select("id, extra_sources")
    .eq("is_active", true);

  let pdfFixedActivities = 0;
  let pdfFixedEntries = 0;
  for (const a of activities ?? []) {
    const sources = Array.isArray(a.extra_sources)
      ? (a.extra_sources as Source[])
      : [];
    let changedHere = false;
    const next = sources.map((s) => {
      if (!s || typeof s.url !== "string") return s;
      const m = s.url.match(WRAPPER_RE);
      if (!m) return s;
      const slug = m[1];
      const page = m[2];
      const newUrl = `/pdfs/${slug}.pdf${page ? `#page=${page}` : ""}`;
      changedHere = true;
      pdfFixedEntries++;
      return { ...s, url: newUrl };
    });
    if (changedHere) {
      await sb
        .from("level_up_activities")
        .update({ extra_sources: next })
        .eq("id", a.id);
      pdfFixedActivities++;
    }
  }
  console.log(
    `✓ PDF wrapper → direct URL: ${pdfFixedEntries} entries across ${pdfFixedActivities} activities`
  );
}

main();
