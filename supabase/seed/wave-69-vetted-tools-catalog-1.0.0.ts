/**
 * wave-69-vetted-tools-catalog-1.0.0.ts
 *
 * Seeds the vetted_tools catalog — the grounded source the "Suggest
 * tools" feature reads live (see src/app/api/suggest-tools/route.ts).
 *
 * Requires migration 023_vetted_tools.sql applied first.
 *
 * Maintained here: to update the catalog, edit this list and re-run.
 * The seed is a clean replace (delete-all then insert) so the table
 * always matches this file exactly.
 *
 * Only genuinely ASU-vetted tools belong here (sanctioned / licensed /
 * enterprise). Public creative tools the model may still suggest stay
 * in the route's prompt tiers — they just don't get the vetted badge.
 */
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const LAST_REVIEWED = "2026-06-26";

type ToolSeed = {
  name: string;
  url: string;
  category: string;
  use_cases: string[];
  asu_status: "sanctioned" | "licensed" | "enterprise" | "external";
  department_scope?: string;
  data_sensitivity: "public" | "de-identified" | "ferpa-ok" | "unknown";
  description: string;
};

const TOOLS: ToolSeed[] = [
  {
    name: "Create AI",
    url: "https://platform.aiml.asu.edu/",
    category: "platform",
    use_cases: ["custom assistants", "agents", "reusable prompts", "drafting", "summarizing", "general reasoning"],
    asu_status: "sanctioned",
    data_sensitivity: "ferpa-ok",
    description: "ASU's institutional AI platform for building custom assistants, agents, and reusable prompts inside ASU's protected environment.",
  },
  {
    name: "Create AI Compare",
    url: "https://compare.aiml.asu.edu/",
    category: "platform",
    use_cases: ["compare models", "side-by-side outputs", "model selection", "tool choice"],
    asu_status: "sanctioned",
    data_sensitivity: "de-identified",
    description: "Run one prompt across several models side by side to compare outputs — the fastest way to feel how tools differ.",
  },
  {
    name: "Adobe Firefly",
    url: "https://firefly.adobe.com/",
    category: "image",
    use_cases: ["image generation", "graphics", "posters", "commercially-safe images"],
    asu_status: "licensed",
    data_sensitivity: "public",
    description: "AI image generation; ASU licenses the full Adobe suite. Commercially safe model — good for course and presentation visuals.",
  },
  {
    name: "Adobe Express",
    url: "https://new.express.adobe.com/",
    category: "slides",
    use_cases: ["flyers", "social graphics", "simple video", "visual design", "infographics"],
    asu_status: "licensed",
    data_sensitivity: "public",
    description: "Fast AI-assisted visual design for flyers, social graphics, simple videos, and one-page comparison visuals.",
  },
  {
    name: "NotebookLM",
    url: "https://notebooklm.google.com/",
    category: "research",
    use_cases: ["source-grounded research", "summarize sources", "audio overview", "study from documents"],
    asu_status: "enterprise",
    data_sensitivity: "de-identified",
    description: "Source-grounded research assistant with audio overviews; enterprise-available at ASU. Answers stay anchored to the documents you give it.",
  },
  {
    name: "Microsoft Copilot",
    url: "https://copilot.microsoft.com/",
    category: "general",
    use_cases: ["drafting", "summarizing", "office documents", "general reasoning"],
    asu_status: "enterprise",
    data_sensitivity: "ferpa-ok",
    description: "Enterprise assistant available org-wide; when signed in with your ASU account it carries enterprise data protections.",
  },
  {
    name: "Google Gemini",
    url: "https://gemini.google.com/",
    category: "general",
    use_cases: ["drafting", "reasoning", "multimodal", "image understanding"],
    asu_status: "enterprise",
    data_sensitivity: "de-identified",
    description: "General-purpose multimodal assistant available through ASU's Google environment.",
  },
  {
    name: "ChatGPT Enterprise",
    url: "https://chatgpt.com/enterprise",
    category: "general",
    use_cases: ["drafting", "reasoning", "analysis"],
    asu_status: "enterprise",
    department_scope: "approved projects only",
    data_sensitivity: "de-identified",
    description: "Available to approved ASU projects with enterprise data-privacy protections (e.g., via the AI Innovation Challenge).",
  },
];

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient(SUPABASE_URL!, SERVICE_ROLE_KEY!) as any;

  // Sanity: table present?
  const { error: probe } = await sb.from("vetted_tools").select("id").limit(1);
  if (probe) {
    if (probe.code === "42P01" || String(probe.message).includes("vetted_tools")) {
      console.error(
        "vetted_tools table not found. Apply migration 023_vetted_tools.sql in the Supabase dashboard first."
      );
      process.exit(1);
    }
    throw probe;
  }

  // Clean replace so the table mirrors this file exactly.
  const { error: delErr } = await sb
    .from("vetted_tools")
    .delete()
    .not("id", "is", null);
  if (delErr) throw delErr;

  const rows = TOOLS.map((t) => ({
    name: t.name,
    url: t.url,
    category: t.category,
    use_cases: t.use_cases,
    asu_status: t.asu_status,
    department_scope: t.department_scope ?? "university-wide",
    data_sensitivity: t.data_sensitivity,
    description: t.description,
    active: true,
    last_reviewed: LAST_REVIEWED,
  }));

  const { data, error } = await sb.from("vetted_tools").insert(rows).select("id");
  if (error) throw error;
  console.log(`✓ vetted_tools seeded: ${data?.length ?? 0} tools`);
}

main();
