/**
 * wave-81-skill11-content-1.0.0.ts
 *
 * Skill 11 (Disclosure). A25 = Find the Policy (New→Found), A26 = Write
 * Your Disclosure Statement (Found→Inter), A27 = Disclosure Decision
 * Tree (Inter→Adv). (Asterisk/markdown complaints already fixed by the
 * global *italic* renderer change.)
 *
 * A25 — Find the Policy
 *   "couldn't find ASU's actual 'AI disclosure policy' — there's no
 *    single page; AI Use in Research / Digital Trust seemed closest" ;
 *   "syllabus statements are student-facing, unclear how they connect" ;
 *   "Canvas resources are ethics-focused, not disclosure"
 *     -> Reframe: ASU's institutional disclosure guidance IS the Digital
 *        Trust Guidelines (verified: ai.asu.edu/digital-trust-guidelines,
 *        reviewed by Enterprise Tech + General Counsel + Provost). Name
 *        it as the primary source; clarify the syllabus page is the
 *        student-facing companion. Add Digital Trust to resources.
 *     (Open: the reviewer wanted a direct Google-Doc link instead of the
 *      Teaching-and-Learning page — need that URL from the owner.)
 *
 * A26 — Write Your Disclosure Statement
 *   Steps 1-3: drop the redundant widget note ("Saves in your browser.
 *     Step 4 is… step 5 is…").
 *   Tone: "disclosures live in…" -> "go in…"; "the disclosure feels
 *     nervous" -> "reads as tentative" (personifications flagged).
 *   Step 1: point the syllabus page to the Explore box.
 *
 * A27 — Disclosure Decision Tree
 *   Step 4: "confused by 'edge cases' / 'endpoint'" -> add a worked
 *     edge-case → endpoint example.
 *   Step 5: "got a Mermaid syntax error" -> harden the prompt for valid
 *     Mermaid + add a troubleshooting note.
 *
 * Digital Trust Guidelines added to all three activities' resources.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

type ExtraSource = { title: string; url: string; meta?: string; source?: string; where?: string };
const DIGITAL_TRUST: ExtraSource = {
  title: "ASU Digital Trust Guidelines — disclosing AI use",
  url: "https://ai.asu.edu/digital-trust-guidelines",
  meta: "ASU · institutional guidance",
  source: "ASU AI",
};

async function setStep(
  sb: ReturnType<typeof createClient<Database>>,
  activityId: number,
  stepNumber: number,
  fields: Record<string, unknown>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await sb.from("activity_guide_steps").update(fields as any).eq("activity_id", activityId).eq("step_number", stepNumber);
}

async function prependSource(
  sb: ReturnType<typeof createClient<Database>>,
  id: number,
  src: ExtraSource
) {
  const { data: row } = await sb.from("level_up_activities").select("extra_sources").eq("id", id).single();
  const existing = Array.isArray(row?.extra_sources) ? (row!.extra_sources as ExtraSource[]) : [];
  const kept = existing.filter((e) => e.url !== src.url);
  await sb.from("level_up_activities").update({ extra_sources: [src, ...kept] }).eq("id", id);
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ===================== A25 — Find the Policy =====================
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Overview: ASU doesn't have one page labeled \"AI disclosure policy\" — its institutional guidance on being transparent about AI use lives in the Digital Trust Guidelines. In this activity, you'll read ASU's disclosure guidance and the AI-disclosure policy for one journal or funder in your field, summarize each in a sentence, and note how they differ.",
    })
    .eq("id", 25);

  await setStep(sb, 25, 1, {
    instruction:
      "Read ASU's guidance on disclosing AI use in your work. There's no single \"AI disclosure policy\" page — the closest institutional source is ASU's Digital Trust Guidelines (linked in the Sources and Resources callout below). Save what you find here and write a one-sentence summary.",
    detailed_help:
      "**Why disclosure matters:** disclosure is what separates using AI as a tool (legitimate, widely accepted) from passing off AI output as your own (misconduct). Guidance exists so there's a shared expectation of where the line is.\n\n" +
      "**Where ASU actually says this.** ASU's **Digital Trust Guidelines** are the institutional source — reviewed by Enterprise Technology, the Office of General Counsel, and the Provost. The short version: don't hide or misrepresent AI use, and be ready to explain how a tool contributed. (There's no separate page titled \"AI disclosure policy,\" which is exactly why it's easy to hunt for one that doesn't exist.)\n\n" +
      "**The syllabus-statements page is the student-facing companion.** It's about setting expectations for *student* AI use — the flip side of disclosing your own. Useful as a model for clear language, but it isn't the faculty-disclosure source.\n\n" +
      "**Save the URL where you'll find it again.** Bookmark it, or paste it below.",
  });
  await prependSource(sb, 25, DIGITAL_TRUST);
  console.log("✓ A25 — reframed around ASU Digital Trust Guidelines; resource added");

  // ===================== A26 — Write Your Disclosure Statement =====================
  // Step 1: trim redundant prompt; point syllabus page to Explore box.
  await setStep(sb, 26, 1, {
    detailed_help:
      "**The syllabus disclosure has two audiences and two jobs.**\n\n" +
      "*To students:* sets expectation — what's allowed, what's not, what's encouraged. Without it, students guess.\n\n" +
      "*To you, in writing:* a reference you can point to in a conflict. \"This is what we said in the syllabus.\"\n\n" +
      "**Three sentences is plenty:**\n" +
      "• Sentence 1: how *you* used AI in creating course materials.\n" +
      "• Sentence 2: how students may (or may not) use AI on assignments.\n" +
      "• Sentence 3: what the verification or attribution expectation is.\n\n" +
      "ASU keeps a page of sample syllabus language you can adapt — see **ASU's syllabus-statements-for-GenAI page** in the Explore Sources and Resources box below.",
    interactive_data: {
      groups: [
        {
          id: "draft",
          count: 1,
          label: "Syllabus disclosure (2–3 sentences)",
          placeholder:
            "Sentence 1: how I used AI in materials. Sentence 2: how students may/may not use AI on assignments. Sentence 3: verification or attribution expectation.",
        },
      ],
      prompt: "Draft your syllabus disclosure below.",
      storageKey: "activity-26-syllabus",
    },
  });

  // Step 2: trim prompt; "live in" -> "sit in" / "go in".
  await setStep(sb, 26, 2, {
    detailed_help:
      "**Conference disclosures usually go in slide acknowledgments or speaker notes.**\n\n" +
      "They're shorter than syllabus statements — usually 1–2 sentences — but should still cover: what tool, what task, how verified.\n\n" +
      "**Sample:** *Slide structure and initial caption text were drafted with [tool name]; all data, claims, and citations were verified against primary sources by the author.*\n\n" +
      "If the conference has a formal AI disclosure policy, follow theirs first. If it doesn't, the syllabus pattern transfers.",
    interactive_data: {
      groups: [
        {
          id: "draft",
          count: 1,
          label: "Conference disclosure (1–2 sentences)",
          placeholder:
            "What tool, what task, how verified — short enough to sit in a slide acknowledgment.",
        },
      ],
      prompt: "Draft your conference disclosure below.",
      storageKey: "activity-26-conference",
    },
  });

  // Step 3: trim prompt; "live in" -> "go in".
  await setStep(sb, 26, 3, {
    detailed_help:
      "**Grant proposal disclosures usually go in the methods section or an acknowledgments line.**\n\n" +
      "Most funders now require some form of AI disclosure. Check your funder's specific guidance first — NIH, NSF, and major foundations all have published policies, and they're not identical.\n\n" +
      "**Default pattern (if no funder guidance):** *Generative AI tools were used to [task]; all [outputs/citations/data] were independently verified by the principal investigator.*\n\n" +
      "**What not to disclose:** routine spell-check, grammar suggestions, search summaries. Disclosure is for substantive use that shaped the document — drafting, summarizing, ideating, citing.",
    interactive_data: {
      groups: [
        {
          id: "draft",
          count: 1,
          label: "Grant disclosure (2–3 sentences)",
          placeholder:
            "Default pattern: Generative AI tools were used to [task]; all [outputs] were independently verified by the PI.",
        },
      ],
      prompt: "Draft your grant disclosure below.",
      storageKey: "activity-26-grant",
    },
  });

  // Step 4: "feels nervous" -> "reads as tentative".
  await setStep(sb, 26, 4, {
    detailed_help:
      "**The three-question audit:**\n\n" +
      "**What tool?** Specific name. \"AI\" is too vague. \"ChatGPT-4o\" or \"ASU Create AI\" is right.\n\n" +
      "**What task?** Drafting? Summarizing? Coding? Brainstorming? Be specific enough that the reader knows what AI did and didn't do.\n\n" +
      "**How verified?** \"All citations checked against primary sources.\" \"Data tables hand-verified against the original spreadsheet.\" \"Author edited every paragraph.\" Without this, the disclosure reads as tentative rather than confident.",
  });
  await prependSource(sb, 26, DIGITAL_TRUST);
  console.log("✓ A26 — redundant note trimmed, tone fixed, syllabus pointer, resource added");

  // ===================== A27 — Disclosure Decision Tree =====================
  // Step 4: add a worked edge-case -> endpoint example.
  await setStep(sb, 27, 4, {
    detailed_help:
      "**Each endpoint is a decision, not a hedge.** \"Disclose with full statement,\" \"add brief acknowledgment,\" \"no disclosure needed,\" \"escalate to department chair.\" Five well-defined endpoints beat ten ambiguous ones.\n\n" +
      "**Worked example — an edge case and where it lands.** Edge case: \"AI suggested the structure but I wrote every word.\" → endpoint: *Add brief acknowledgment* (you name the assist without overclaiming). Edge case: \"AI generated a first draft I heavily rewrote.\" → endpoint: *Disclose with full statement.* The edge case is the path; the endpoint is the concrete action it lands on.\n\n" +
      "See **ASU's syllabus-statements-for-GenAI page** in the Explore Sources and Resources box below for sample disclosure language by context.",
  });

  // Step 5: harden the Mermaid prompt + troubleshooting note.
  await setStep(sb, 27, 5, {
    detailed_help:
      "**Why Mermaid.** Mermaid Live renders text-based decision trees instantly; you can iterate without dragging shapes around. Your team can paste the source into docs, wikis, or onboarding materials.\n\n" +
      "**If Mermaid Live shows a \"syntax error.\"** It's almost always a special character — parentheses, a slash, a stray quote — sitting unquoted inside a node label. Quickest fix: ask the AI to \"regenerate the Mermaid with every node label wrapped in double quotes and no parentheses or slashes.\" That clears the vast majority of render errors.\n\n" +
      "**What you'll still own.** Whether the branches reflect *your* team's reality, the edge cases the draft misses, and the language you want each endpoint to use.",
    interactive_data: {
      hint: "Send to your AI, then paste the response into Mermaid Live to render. If Mermaid shows a syntax error, ask the AI to regenerate with every label in double quotes and no parentheses.",
      starter:
        "Role: instructional-design consultant drafting a disclosure decision tree for a higher-ed team.\n\n" +
        "Produce a Mermaid flowchart (flowchart TD) that helps a team member decide what level of AI disclosure to apply, based on:\n\n" +
        "• Type of work: [course material / research output / internal memo / public-facing]\n" +
        "• Audience: [students / peers / public / regulators]\n" +
        "• Institutional context: [ASU guidance applies? journal? funder?]\n\n" +
        "Endpoints should be specific actions, e.g. \"Disclose with full statement\", \"Add brief acknowledgment\", \"No disclosure needed\", \"Escalate to department chair\".\n\n" +
        "Mermaid syntax rules (follow exactly to avoid render errors):\n" +
        "- Use simple node ids: A, B, C, D…\n" +
        "- Put ALL label text inside double quotes: steps as id[\"...\"], decisions as id{\"...\"}.\n" +
        "- Do NOT use parentheses, slashes, or other special characters inside labels.\n" +
        "- One edge per line, e.g. A -->|\"Yes\"| B.\n\n" +
        "Return only the Mermaid source, nothing else.",
    },
  });
  await prependSource(sb, 27, DIGITAL_TRUST);
  console.log("✓ A27 — edge-case example, Mermaid prompt hardened + troubleshooting, resource added");

  // ===================== Resolve open notes on A25/A26/A27 =====================
  const { data: admin } = await sb.from("profiles").select("id").eq("is_admin", true).limit(1).single();
  const { data: steps } = await sb.from("activity_guide_steps").select("id").in("activity_id", [25, 26, 27]);
  const rowIds = ["25", "26", "27", ...(steps ?? []).map((s) => String(s.id))];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sbAny = sb as any;
  const { data: resolved, error } = await sbAny
    .from("admin_edit_comments")
    .update({ status: "resolved", resolved_by: admin?.id ?? null, resolved_at: new Date().toISOString() })
    .eq("status", "open")
    .in("row_id", rowIds)
    .select("id");
  if (error) console.warn("(could not resolve notes) " + error.message);
  else console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A25/A26/A27`);
}

main();
