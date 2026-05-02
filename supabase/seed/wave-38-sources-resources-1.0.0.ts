/**
 * wave-38-sources-resources-1.0.0.ts
 *
 * Goal: every active activity gets a populated `extra_sources` so the
 * "Explore Sources and Resources" callout always appears with at least
 * 2-3 vetted reading anchors.
 *
 * Strategy:
 *   1. Per-skill anchor list — pulled from lesson_flow rows that match
 *      the skill (which already encode Elisa's curation), plus a small
 *      hand-curated outside fill for skills that have no lesson_flow
 *      coverage (15 Verify, 16 Build, 17 Critical judgment, 18 Bias).
 *   2. For each active activity, set extra_sources = (existing extras,
 *      preserved in order) + (skill anchors, deduped by URL), capped at
 *      6 entries so the callout stays digestible.
 *   3. Strip the inline "Two further resources worth bookmarking..."
 *      paragraph from Activity 40 step 4 — Learn Prompting + Google AI
 *      Essentials now live in the callout instead.
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

const MAX_SOURCES = 6;

// Per-skill anchor sources. Order = display order. Skills not listed
// here will fall back to their existing extras only.
const SKILL_ANCHORS: Record<number, Source[]> = {
  // 1 — Tool choice
  1: [
    {
      title: "AI Tools at ASU",
      url: "https://lx.asu.edu/ai/foundations",
      source: "ASU LX",
      meta: "Foundational · Reference",
    },
    {
      title: "ASU's ChatGPT-for-faculty page",
      url: "https://canvas.asu.edu/courses/157584/pages/maximizing-teaching-efficacy-with-asus-chatgpt-resources",
      source: "Canvas (ASU GenAI course)",
      meta: "Foundational · ~5 min skim",
    },
    {
      title: "Module 1, Lesson 1 — Experimenting with GenAI at ASU",
      url: "https://rise.articulate.com/share/3lU5J_haoXgNR9QKQORI67zuM2Qix_sv#/lessons/J4bNGWxtic5oznXuy5BC_gwfhfAMsE1A",
      source: "Articulate Rise",
      meta: "Foundational · ~10 min",
    },
    {
      title: "Vendor IT Risk Assessment (VITRA)",
      url: "https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra",
      source: "Canvas (ASU GenAI course)",
      meta: "Intermediate · Process · ~5 min",
    },
  ],
  // 2 — Iterative dialogue
  2: [
    {
      title: "Module 4, Lesson 1 — Steps for an effective prompt",
      url: "https://rise.articulate.com/share/Ih949hPlICDdUyw0OtVdBtg6EWYn0V3n#/lessons/K0OMFl0s_2SIUThBCuYlAR63-lF5xI9P",
      source: "Articulate Rise",
      meta: "Foundational · Lesson · ~10 min",
    },
    {
      title: "Input quality = output quality (Cheat Sheet)",
      url: "/pdf/genai101-takehome-reference?page=2",
      source: "ASU GenAI 101 take-home reference (PDF)",
      meta: "Foundational · Reference · p. 2",
    },
    {
      title: "RTF Framework: Role-Task-Format (Cheat Sheet)",
      url: "/pdf/genai101-takehome-reference?page=5",
      source: "ASU GenAI 101 take-home reference (PDF)",
      meta: "Foundational · Reference · p. 5",
    },
    {
      title: "Few-Shot Prompting (Cheat Sheet)",
      url: "/pdf/genai101-takehome-reference?page=2",
      source: "ASU GenAI 101 take-home reference (PDF)",
      meta: "Intermediate · Reference",
    },
  ],
  // 5 — Editing AI output
  5: [
    {
      title: "Module 4, Lesson 1 — Steps for an effective prompt",
      url: "https://rise.articulate.com/share/Ih949hPlICDdUyw0OtVdBtg6EWYn0V3n#/lessons/K0OMFl0s_2SIUThBCuYlAR63-lF5xI9P",
      source: "Articulate Rise",
      meta: "Foundational · ~10 min",
    },
    {
      title: "Faculty panel: voices on GenAI in teaching",
      url: "https://canvas.asu.edu/courses/157584/pages/meet-our-panel",
      source: "Canvas (ASU GenAI course)",
      meta: "Foundational · Voices",
    },
    {
      title: "RTF Framework: Role-Task-Format (Cheat Sheet)",
      url: "/pdf/genai101-takehome-reference?page=5",
      source: "ASU GenAI 101 take-home reference (PDF)",
      meta: "Foundational · Reference",
    },
  ],
  // 7 — Data & privacy
  7: [
    {
      title: "Understanding FERPA in the Context of Generative AI",
      url: "https://nmu.edu/ctl/understanding-ferpa-context-generative-ai-guide-faculty",
      source: "NMU CTL",
      meta: "Foundational · Guide",
    },
    {
      title: "Vendor IT Risk Assessment (VITRA)",
      url: "https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra",
      source: "Canvas (ASU GenAI course)",
      meta: "Intermediate · Process",
    },
    {
      title: "Microsoft 365 Copilot — Data Privacy and Security",
      url: "https://learn.microsoft.com/en-us/copilot/microsoft-365/microsoft-365-copilot-privacy",
      source: "Microsoft Learn",
      meta: "Intermediate · Docs",
    },
    {
      title: "Generative AI in Google Workspace — Privacy Hub",
      url: "https://support.google.com/a/answer/15706919",
      source: "Google Workspace",
      meta: "Intermediate · Docs",
    },
  ],
  // 9 — Disclosure
  9: [
    {
      title: "Syllabus statements for generative AI",
      url: "https://canvas.asu.edu/courses/157584/pages/syllabus-statements-for-generative-ai",
      source: "Canvas (ASU GenAI course)",
      meta: "Foundational · ~3 min",
    },
    {
      title: "Module 3, Lesson 1 — Core values for AI use",
      url: "https://rise.articulate.com/share/LZmZZ-KMIhK7vDZxyC2e8ThCFkfQ5T01#/lessons/tai1yFyVRajyPWKuEhr_OV74I_C6iUok",
      source: "Articulate Rise",
      meta: "Foundational · ~10 min",
    },
    {
      title: "Principled Innovation framework",
      url: "https://aix-framework.lei-tech.org/principled-innovation",
      source: "AI-X / LEI",
      meta: "Foundational · Framework",
    },
    {
      title: "Canvas Module 3 (overview) — ethical AI, fairness, transparency",
      url: "https://canvas.asu.edu/courses/157584/pages/module-3-overview-2",
      source: "Canvas (ASU GenAI course)",
      meta: "Intermediate · ~10 min",
    },
  ],
  // 11 — Creative use
  11: [
    {
      title: "AI Creative Learning Lab",
      url: "https://lx.asu.edu/ai",
      source: "ASU AI Creative Learning Lab",
      meta: "Foundational · Hub",
    },
    {
      title: "AI-Enhanced Assignments",
      url: "https://lx.asu.edu/ai/ai-enhanced-learning",
      source: "ASU AI Creative Learning Lab",
      meta: "Intermediate · Examples",
    },
    {
      title: "Module 6 — Streamlining lesson planning with AI",
      url: "https://rise.articulate.com/share/AzCFyWdS4FDAY-5TT4YStVaHmxMUFNfE#/lessons/KKbpjYxZVBe3q-3uuyie4Q8Aum181Ulq",
      source: "Articulate Rise",
      meta: "Intermediate · ~10 min",
    },
    {
      title: "Course design that fosters AI fluency",
      url: "https://canvas.asu.edu/courses/157584/pages/module-6-overview-2",
      source: "Canvas (ASU GenAI course)",
      meta: "Advanced · Overview",
    },
  ],
  // 13 — Staying current
  13: [
    {
      title: "ASU course glossary of GenAI terms",
      url: "https://canvas.asu.edu/courses/157584/pages/look-up-key-terms-in-the-course-glossary-2",
      source: "Canvas (ASU GenAI course)",
      meta: "Reference",
    },
    {
      title: "GenAI 101 Quick Reference Cheat Sheet",
      url: "/pdf/genai101-takehome-reference?page=10",
      source: "ASU GenAI 101 take-home reference (PDF)",
      meta: "Foundational · Reference · p. 10",
    },
    {
      title: "ASU AI Support & Community",
      url: "https://lx.asu.edu/ai/community",
      source: "ASU AI Creative Learning Lab",
      meta: "Reference · Community",
    },
    {
      title: "AI Creative Learning Lab",
      url: "https://lx.asu.edu/ai",
      source: "ASU AI Creative Learning Lab",
      meta: "Hub",
    },
  ],
  // 14 — Learning with AI
  14: [
    {
      title: "Learn Prompting — Your Guide to Communicating with AI",
      url: "https://learnprompting.org",
      source: "Learn Prompting",
      meta: "Foundational · Free tutorial",
    },
    {
      title: "Google AI Essentials",
      url: "https://grow.google/ai-essentials/",
      source: "Grow with Google",
      meta: "Foundational · Course",
    },
    {
      title: "Anthropic Interactive Prompt Engineering Tutorial",
      url: "https://github.com/anthropics/prompt-eng-interactive-tutorial",
      source: "Anthropic",
      meta: "Intermediate · Tutorial",
    },
    {
      title: "Prompt Engineering Guide (DAIR.AI)",
      url: "https://www.promptingguide.ai/",
      source: "DAIR.AI",
      meta: "Intermediate · Guide",
    },
  ],
  // 15 — Verify what AI gives you (no lesson_flow rows; outside fill)
  15: [
    {
      title: "Canvas Module 5, Lesson 2 — Key terms for evaluating GenAI outputs",
      url: "https://canvas.asu.edu/courses/157584/pages/module-5-overview-2",
      source: "Canvas (ASU GenAI course)",
      meta: "Foundational · ~5 min",
    },
    {
      title: "Civic Online Reasoning (Stanford SHEG)",
      url: "https://cor.stanford.edu/",
      source: "Stanford SHEG",
      meta: "Foundational · Curriculum",
    },
    {
      title: "Checkology — News Literacy Project",
      url: "https://newslit.org/educators/checkology/",
      source: "News Literacy Project",
      meta: "Intermediate · Free platform",
    },
  ],
  // 16 — Build with AI: agents, visuals, mechanics (no lesson_flow; outside fill)
  16: [
    {
      title: "Create AI custom assistant builder",
      url: "https://platform.aiml.asu.edu",
      source: "ASU AI/ML Platform",
      meta: "Builder · ASU-supported",
    },
    {
      title: "ChatGPT custom GPTs FAQ",
      url: "https://help.openai.com/en/articles/8554407-gpts-faq",
      source: "OpenAI Help Center",
      meta: "Docs · External",
    },
    {
      title: "Claude Projects overview",
      url: "https://support.anthropic.com/en/articles/9519177-what-are-projects",
      source: "Anthropic Support",
      meta: "Docs · External",
    },
    {
      title: "Mermaid.js — text-to-diagrams",
      url: "https://mermaid.js.org/",
      source: "Mermaid",
      meta: "Intermediate · Tool",
    },
  ],
  // 17 — Critical AI judgment (no lesson_flow rows; outside fill)
  17: [
    {
      title: "Canvas Module 1 (overview) — GPTs, terminology, capabilities",
      url: "https://canvas.asu.edu/courses/157584/pages/module-1-overview-3",
      source: "Canvas (ASU GenAI course)",
      meta: "Foundational · ~10 min",
    },
    {
      title: "Canvas Module 2 (overview) — types of GenAI applications and uses",
      url: "https://canvas.asu.edu/courses/157584/pages/module-2-overview-2",
      source: "Canvas (ASU GenAI course)",
      meta: "Foundational · ~10 min",
    },
    {
      title: "Principled Innovation framework",
      url: "https://aix-framework.lei-tech.org/principled-innovation",
      source: "AI-X / LEI",
      meta: "Framework",
    },
  ],
  // 18 — Bias and equity in AI (new skill, no lesson_flow; outside fill)
  18: [
    {
      title: "Algorithmic Justice League",
      url: "https://www.ajl.org/about",
      source: "Algorithmic Justice League",
      meta: "Foundational · Org",
    },
    {
      title: "Algorithmic bias detection and mitigation (Brookings)",
      url: "https://www.brookings.edu/articles/algorithmic-bias-detection-and-mitigation-best-practices-and-policies-to-reduce-consumer-harms/",
      source: "Brookings",
      meta: "Intermediate · Policy paper",
    },
    {
      title: "Fairness, security, transparency in AI use",
      url: "https://canvas.asu.edu/courses/157584/pages/module-3-overview-2",
      source: "Canvas (ASU GenAI course)",
      meta: "Foundational · ~10 min",
    },
  ],
};

function dedupeAndCap(sources: Source[]): Source[] {
  const seen = new Set<string>();
  const out: Source[] = [];
  for (const s of sources) {
    const key = s.url.trim().toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(s);
    if (out.length >= MAX_SOURCES) break;
  }
  return out;
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data: activities, error } = await sb
    .from("level_up_activities")
    .select("id, skill_id, title, extra_sources")
    .eq("is_active", true);
  if (error) throw error;
  if (!activities) throw new Error("no activities");

  let updated = 0;
  for (const a of activities) {
    const existing: Source[] = Array.isArray(a.extra_sources)
      ? (a.extra_sources as Source[]).filter(
          (e) => e && typeof e.title === "string" && typeof e.url === "string"
        )
      : [];
    const anchors = (a.skill_id != null && SKILL_ANCHORS[a.skill_id]) || [];
    const merged = dedupeAndCap([...existing, ...anchors]);

    const { error: e2 } = await sb
      .from("level_up_activities")
      .update({ extra_sources: merged })
      .eq("id", a.id);
    if (e2) throw e2;
    updated++;
    console.log(
      `✓ A${a.id} (skill ${a.skill_id}) — ${merged.length} sources (${a.title})`
    );
  }
  console.log(`\nUpdated ${updated} activities.`);

  // Strip the inline "Two further resources worth bookmarking..." paragraph
  // from Activity 40 step 4 — Learn Prompting + Google AI Essentials are
  // now in the callout via skill 14 anchors.
  const newA40Step4Help =
    "**Verify against a human or another source when:**\n\n" +
    "- A specific claim affects how you'd act (use this tool, avoid that one, disclose here, don't disclose there).\n" +
    "- Anything about policies, AI has no visibility into ASU's current stance.\n" +
    "- Anything about specific tools' current capabilities, training cutoffs mean this info can be months out of date.\n\n" +
    "**Trust the AI for:** the *shape* of advice, what categories of thinking to do, what questions to ask, where common pitfalls live. The framing tends to be solid even when specifics are off.\n\n" +
    "**Where this goes next.** The Foundational → Intermediate activity for this skill, [Teach Me a Feature](/activities/41), uses the same meta move (ask AI about AI) on a specific feature you haven't used yet — and stress-tests the AI's instructions.";

  const { error: e3 } = await sb
    .from("activity_guide_steps")
    .update({ detailed_help: newA40Step4Help })
    .eq("activity_id", 40)
    .eq("step_number", 4);
  if (e3) throw e3;
  console.log("✓ Stripped inline bookmark paragraph from A40 step 4");
}

main();
