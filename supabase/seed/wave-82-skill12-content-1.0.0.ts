/**
 * wave-82-skill12-content-1.0.0.ts
 *
 * Skill 12 (Staying current). A37 = Build Your Starter Kit (New→Found),
 * A38 = Signal vs. Noise Filter (Found→Inter), A39 = Build an Auto-
 * Curating AI News Agent (Inter→Adv).
 *
 * A37 — Build Your Starter Kit
 *   "include ASU's AI Hub as a hyperlink" -> link lx.asu.edu/ai inline.
 *   "Step 2 boxes ask for source + what's good for, but that aligns with
 *    Step 4" -> Step 2 just bookmarks (name + link); Step 4 keeps the
 *    "what it's good for."
 *
 * A38 — Signal vs. Noise Filter
 *   Step 2: nested bold/italic "**Does it affect *my* work?**" rendered
 *     as literal asterisks -> de-nest; reword the FERPA line.
 *   Step 4: "table formatting looks broken" -> the help had a raw
 *     markdown table, which the help renderer doesn't support; replace
 *     with a plain-text example. (The real table widget is unaffected.)
 *
 * A39 — Build an Auto-Curating AI News Agent
 *   "too casual / confusing jargon (ship issue 2, recipe, fork it)" ->
 *     plain wording; "wire up the integrations" -> "set up"; "Look Book"
 *     -> Community.
 *   "big leap from intermediate; resources don't align" -> add the agent
 *     foundational sources (same PDF section + ASU LX bots page used in
 *     Skill 10) to bridge it.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type ExtraSource = { title: string; url: string; meta?: string; source?: string };
const PDF = "/pdfs/genai101-takehome-reference.pdf";
const PDF_SOURCE = "ASU GenAI 101 take-home reference (PDF)";
const A39_PREPEND: ExtraSource[] = [
  { title: "AI agents: from prompts to agents", url: `${PDF}#page=8`, meta: "Foundational · Concept · PDF p. 8", source: PDF_SOURCE },
  { title: "How to build a system prompt (4 steps)", url: `${PDF}#page=7`, meta: "Reference · PDF p. 7", source: PDF_SOURCE },
  { title: "Building custom bots & AI agents", url: "https://lx.asu.edu/ai/ai-enhanced-learning", meta: "ASU LX · learning page", source: "ASU LX" },
];

async function setStep(
  sb: ReturnType<typeof createClient<Database>>,
  activityId: number,
  stepNumber: number,
  fields: Record<string, unknown>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await sb.from("activity_guide_steps").update(fields as any).eq("activity_id", activityId).eq("step_number", stepNumber);
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ===================== A37 — Build Your Starter Kit =====================
  await setStep(sb, 37, 1, {
    instruction:
      "Open a browser and find 3 sources you could follow for AI-in-education news. You need one from each category:\n" +
      "• Institutional: [ASU's AI hub](https://lx.asu.edu/ai) or the Provost's AI page.\n" +
      "• Practitioner / researcher: a person who writes or posts about AI in higher ed (a blog, a newsletter, a LinkedIn feed).\n" +
      "• Tool-focused: a site that tracks AI tool updates or comparisons.",
    detailed_help:
      "**Why three types of sources:** each gives you something the others can't.\n\n" +
      "**Institutional** — what your employer actually sanctions, and what's expected of you. Start with [ASU's AI hub](https://lx.asu.edu/ai), this course's home.\n\n" +
      "**Practitioner or researcher** — someone using AI in their own teaching or research, not just covering it. A blog, newsletter, or LinkedIn feed works; look for people whose work overlaps with yours.\n\n" +
      "**Tool-focused** — sources that track when tools update, what's new, what's broken. Without one of these, you'll be a year behind on capabilities you could already use.",
  });

  await setStep(sb, 37, 2, {
    interactive_data: {
      groups: [
        { id: "institutional", count: 1, label: "Institutional (e.g., ASU AI hub)", placeholder: "Source name + link" },
        { id: "practitioner", count: 1, label: "Practitioner / researcher", placeholder: "Source name + link" },
        { id: "tool", count: 1, label: "Tool-focused", placeholder: "Source name + link" },
      ],
      prompt: "Lock in your three — paste the name and link for each so they're saved here. You'll write what each is good for in step 4.",
      storageKey: "activity-37-kit",
    },
  });
  console.log("✓ A37 — AI hub linked; step 2 simplified to bookmarking");

  // ===================== A38 — Signal vs. Noise Filter =====================
  await setStep(sb, 38, 2, {
    detailed_help:
      "**Three triage questions per item:**\n\n" +
      "**Hype or substance?** Hype = strong claim, weak evidence, urgency framing (\"AI changes everything!\"). Substance = specific finding, named source, qualified claim.\n\n" +
      "**Does it affect your work?** Generic AI news rarely does. Specific findings — a tool that's now FERPA-compliant, a study on AI grading bias — sometimes do.\n\n" +
      "**What actually changed?** New capability? New policy? New evidence? Or just a recapped headline?\n\n" +
      "If the answer to all three is \"vague / probably not / nothing new,\" it's noise.",
  });

  await setStep(sb, 38, 4, {
    detailed_help:
      "**Five columns, one row per item:** Source · Headline · Hype/Substance · Relevance · Takeaway.\n\n" +
      "*Example rows:*\n" +
      "• Inside Higher Ed — \"University X adopts AI policy\" — Substance — Medium — \"Watch for ASU's response.\"\n" +
      "• LinkedIn (A. Author) — \"AI changes everything\" — Hype — Low — \"Skip.\"\n\n" +
      "The table below captures all five. Keeping it in one place builds your personal triage history.",
  });
  console.log("✓ A38 — de-nested step 2 asterisks; replaced broken markdown table in step 4");

  // ===================== A39 — Build an Auto-Curating AI News Agent =====================
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Overview: In this activity, you will build an AI agent that auto-curates AI development news for your team and pushes a fresh issue into Coda, Google Docs, Notion, or your destination of choice on a cadence you set (daily, weekly, biweekly). You'll use AI itself to walk you through the integration path, because every tool combo has a different setup.\n\n" +
        "Optional extension: Produce a second issue, tighten the system prompt based on what drifted, and post your agent's setup guide to the Community space so other units can adapt it for their own teams.",
    })
    .eq("id", 39);

  await setStep(sb, 39, 3, {
    instruction:
      "Set up the integrations the AI outlined. Capture each connection below — what you authorized, where you stored credentials, and any setting you tweaked. Step 5 references this when you test.",
  });

  await setStep(sb, 39, 6, {
    detailed_help:
      "**A working agent plus a written-down setup guide is the deliverable.** The setup guide is what lets a colleague adapt your setup for their team without redoing the integration archaeology.\n\n" +
      "**Sustainable cadence beats ambitious cadence.** Better to produce a clean weekly brief that stays accurate than a daily one that quietly drifts.",
  });

  // Bridge the leap: add agent foundational sources to A39.
  {
    const { data: row } = await sb.from("level_up_activities").select("extra_sources").eq("id", 39).single();
    const existing = Array.isArray(row?.extra_sources) ? (row!.extra_sources as ExtraSource[]) : [];
    const addUrls = new Set(A39_PREPEND.map((a) => a.url));
    const kept = existing.filter((e) => !addUrls.has(e.url));
    await sb.from("level_up_activities").update({ extra_sources: [...A39_PREPEND, ...kept] }).eq("id", 39);
  }
  console.log("✓ A39 — jargon plainened, Look Book -> Community, agent foundational sources added");

  // ===================== Resolve open notes on A37/A38/A39 =====================
  const { data: admin } = await sb.from("profiles").select("id").eq("is_admin", true).limit(1).single();
  const { data: steps } = await sb.from("activity_guide_steps").select("id").in("activity_id", [37, 38, 39]);
  const rowIds = ["37", "38", "39", ...(steps ?? []).map((s) => String(s.id))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sbAny = sb as any;
  const { data: resolved, error } = await sbAny
    .from("admin_edit_comments")
    .update({ status: "resolved", resolved_by: admin?.id ?? null, resolved_at: new Date().toISOString() })
    .eq("status", "open")
    .in("row_id", rowIds)
    .select("id");
  if (error) console.warn("(could not resolve notes) " + error.message);
  else console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A37/A38/A39`);
}

main();
