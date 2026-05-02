/**
 * wave-33-organic-vocab-1.0.0.ts
 *
 * Move clickable vocab terms ({{term:definition}}) from dedicated
 * "Vocabulary" sections into the first plain-text occurrence of each
 * term across an activity's steps. The term gets defined where the
 * learner first meets it.
 *
 * Steps:
 *   1. Strip every existing {{term:definition}} markup, leaving the
 *      term as plain text. This re-establishes a clean baseline.
 *   2. Strip the redundant "Vocabulary you'll see across this skill"
 *      sections that the old approach used to plant in one step.
 *   3. For each activity, walk steps in order; for each known vocab
 *      term, find its first plain-text occurrence (skipping inside
 *      links, bold, or other markdown) and wrap it with
 *      {{originalForm:definition}}. Subsequent occurrences stay
 *      plain since the first one is now the canonical definition
 *      anchor.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

// ─────────────────────────────────────────────────────────────────
// Vocab dictionary. Order doesn't matter; we look for first
// occurrence per activity walking steps in order. Each entry's
// regex must capture the surface form (we preserve original case
// in the displayed term).
// ─────────────────────────────────────────────────────────────────
type VocabEntry = {
  canonical: string;
  // /\bprompt(s)?\b/iu — captures plural and case variants. Case
  // insensitive; the captured form is preserved in the rendered
  // markup so "Prompt" stays Prompt, "prompts" stays prompts.
  forms: RegExp;
  definition: string;
};

const VOCAB: VocabEntry[] = [
  {
    canonical: "Prompt",
    forms: /\bprompts?\b/iu,
    definition:
      "Anything you type into an AI to get a response — a question, an instruction, or a request.",
  },
  {
    canonical: "Multi-turn conversation",
    forms: /\bmulti-turn conversations?\b/iu,
    definition:
      "A back-and-forth where the AI remembers what was said earlier in the same session and uses it as context for later turns.",
  },
  {
    canonical: "Anchoring",
    forms: /\banchoring\b/iu,
    definition:
      "When AI locks onto its first answer's framing and treats follow-ups as variations of that framing. The Anchoring Breaker activity is built around recognizing and breaking this pattern.",
  },
  {
    canonical: "Context window",
    forms: /\bcontext windows?\b/iu,
    definition:
      "The amount of text the AI can hold in mind at once. Older parts of long chats start to drop off when the conversation exceeds it.",
  },
  {
    canonical: "Hallucination",
    forms: /\bhallucinations?\b/iu,
    definition:
      "Content AI generates that sounds authoritative but isn't true. Happens because the model is trained to produce *plausible* text, not *accurate* text.",
  },
  {
    canonical: "Tone",
    forms: /\btone\b/iu,
    definition:
      "How formal or casual the writing feels. Think \"Could you possibly\" vs. \"Hey, quick one.\" Tone is what your reader hears in their head as they read.",
  },
  {
    canonical: "Register",
    forms: /\bregister\b/iu,
    definition:
      "The contextual norms a piece of writing follows. Academic register is dense and citation-heavy; email register is short and direct; conference-talk register is somewhere between.",
  },
  {
    canonical: "Voice",
    forms: /\bvoice\b/iu,
    definition:
      "The recognizable fingerprint of how someone writes. Word choices, sentence rhythms, what they leave out. Two writers can hit the same tone but still have very different voices.",
  },
  {
    canonical: "Cadence",
    forms: /\bcadence\b/iu,
    definition:
      "Sentence-length pattern. Short, short, then long. AI often defaults to medium-medium-medium, which feels generic. Cadence is a quick way to spot AI-flavored writing.",
  },
  {
    canonical: "Trigger",
    forms: /\btriggers?\b/iu,
    definition:
      "The event that kicks off an agent. A new email landing, a scheduled time, a button click, a file appearing in a folder. Without a trigger, you have a chat tool, not an agent.",
  },
  {
    canonical: "Human checkpoint",
    forms: /\bhuman checkpoints?\b/iu,
    definition:
      "A pause where a person reviews and approves before the agent continues. Belongs anywhere a mistake would be hard to undo, anywhere judgment is required, and anywhere sensitive data is involved.",
  },
  {
    canonical: "Disclosure",
    forms: /\bdisclosures?\b/iu,
    definition:
      "Telling your audience that AI was used and what it did. Required by most journals, funders, and increasingly courses. Disclosure is about transparency, not seeking permission.",
  },
  {
    canonical: "Attribution",
    forms: /\battributions?\b/iu,
    definition:
      "Crediting AI as a tool used in the work. Different from authorship — most policies say AI cannot be an author, but it should still be attributed if it shaped the work.",
  },
  {
    canonical: "Verification",
    forms: /\bverifications?\b/iu,
    definition:
      "The human-checked confirmation that AI output is accurate. The thing that turns AI assistance from risk into asset. Without verification, every AI-assisted publication is a fabrication waiting to surface.",
  },
  {
    canonical: "Substantive use",
    forms: /\bsubstantive use\b/iu,
    definition:
      "AI use that shaped the document beyond cosmetic editing — drafting, ideating, summarizing, citing. The bar for required disclosure. Spell-check and grammar suggestions usually don't count.",
  },
  {
    canonical: "Principled Innovation",
    forms: /\bprincipled innovation\b/iu,
    definition:
      "ASU's framework for making decisions that honor curiosity, care, clarity, and intentionality together — not as a checklist but as a balanced set. Cases where two principles pull in different directions are the ones the framework was designed for.",
  },
  {
    canonical: "VITRA",
    forms: /\bVITRA\b/u,
    definition:
      "Vendor IT Risk Assessment — ASU's required process for vetting third-party tools (especially AI ones) before they can be used with student or other sensitive data.",
  },
  {
    canonical: "Token",
    forms: /\btokens?\b/iu,
    definition:
      "The basic unit AI processes — usually a word fragment of 3-4 characters (\"ing,\" \"ation,\" \"the\"). AI tools meter usage by tokens; long inputs/outputs cost more, and responses get cut off when you hit the model's max-token limit.",
  },
  {
    canonical: "Prompt injection",
    forms: /\bprompt injections?\b/iu,
    definition:
      "When external content (a pasted document, a web page, an email an agent reads) sneaks in instructions that override your prompt. Most concerning when AI agents act on third-party content.",
  },
];

// Mask out regions where we should NOT look for vocab terms (links,
// bold, existing vocab markup). Returns the masked text plus a
// restore function.
function maskMarkdown(text: string): {
  masked: string;
  restore: (s: string) => string;
} {
  const stash: string[] = [];
  const SENTINEL_OPEN = "";
  const SENTINEL_CLOSE = "";
  const stashOne = (s: string) => {
    stash.push(s);
    return `${SENTINEL_OPEN}${stash.length - 1}${SENTINEL_CLOSE}`;
  };
  // Order matters: vocab markup first (longest match), then links, then bold.
  let m = text;
  m = m.replace(/\{\{[^:}]+:[^}]+\}\}/g, stashOne);
  m = m.replace(/\[[^\]]+\]\([^)]+\)/g, stashOne);
  m = m.replace(/\*\*[^*]+\*\*/g, stashOne);
  return {
    masked: m,
    restore: (s: string) =>
      s.replace(
        new RegExp(`${SENTINEL_OPEN}(\\d+)${SENTINEL_CLOSE}`, "g"),
        (_, idx) => stash[Number(idx)]
      ),
  };
}

function stripExistingVocabMarkup(text: string): string {
  // {{Term:definition}} → just the term
  return text.replace(/\{\{([^:}]+):[^}]+\}\}/g, (_, term) => term);
}

function stripVocabSection(text: string): string {
  // Heuristic: a "Vocabulary" section starts with a bold marker
  // containing "Vocabulary" (e.g. "**Vocabulary you'll see across this
  // skill**" or "**Vocabulary** (click each…)") and runs to the end of
  // detailed_help. Cut everything from the marker on, plus trailing
  // whitespace.
  return text
    .replace(/\n{0,2}\*\*Vocabulary[^*]*\*\*[\s\S]*$/i, "")
    .trimEnd();
}

// Insert {{term:definition}} at the first plain-text occurrence of a
// term in the text. Returns [newText, didInsert].
function insertVocabMark(
  text: string,
  entry: VocabEntry
): [string, boolean] {
  const { masked, restore } = maskMarkdown(text);
  const match = entry.forms.exec(masked);
  if (!match) return [text, false];
  const matchedSurface = match[0];
  const start = match.index;
  const end = start + matchedSurface.length;
  const replacement = `{{${matchedSurface}:${entry.definition}}}`;
  const updatedMasked =
    masked.slice(0, start) + replacement + masked.slice(end);
  return [restore(updatedMasked), true];
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  const { data: activeActivities } = await sb
    .from("level_up_activities")
    .select("id")
    .eq("is_active", true);

  const activityIds = (activeActivities ?? []).map((a) => a.id);
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id,activity_id,step_number,instruction,detailed_help")
    .in("activity_id", activityIds)
    .order("activity_id")
    .order("step_number");

  // 1. Baseline pass: strip existing vocab markup + redundant Vocabulary
  //    sections so we work from clean text.
  const cleaned = (steps ?? []).map((s) => ({
    ...s,
    instruction: stripExistingVocabMarkup(s.instruction),
    detailed_help: s.detailed_help
      ? stripVocabSection(stripExistingVocabMarkup(s.detailed_help))
      : s.detailed_help,
  }));

  // Group by activity for first-occurrence tracking.
  const byActivity = new Map<number, typeof cleaned>();
  for (const s of cleaned) {
    const arr = byActivity.get(s.activity_id) ?? [];
    arr.push(s);
    byActivity.set(s.activity_id, arr);
  }

  let stepsTouched = 0;
  let marksAdded = 0;
  for (const [, activitySteps] of byActivity) {
    activitySteps.sort((a, b) => a.step_number - b.step_number);
    const introducedHere = new Set<string>();
    for (const step of activitySteps) {
      let instr = step.instruction;
      let help = step.detailed_help ?? "";
      let touched =
        instr !== (steps?.find((s) => s.id === step.id)?.instruction ?? "") ||
        help !== (steps?.find((s) => s.id === step.id)?.detailed_help ?? "");

      for (const entry of VOCAB) {
        if (introducedHere.has(entry.canonical)) continue;
        // Try instruction first, then detailed_help.
        const [newInstr, hitInstr] = insertVocabMark(instr, entry);
        if (hitInstr) {
          instr = newInstr;
          introducedHere.add(entry.canonical);
          marksAdded++;
          touched = true;
          continue;
        }
        const [newHelp, hitHelp] = insertVocabMark(help, entry);
        if (hitHelp) {
          help = newHelp;
          introducedHere.add(entry.canonical);
          marksAdded++;
          touched = true;
        }
      }

      if (touched) {
        stepsTouched++;
        await sb
          .from("activity_guide_steps")
          .update({
            instruction: instr,
            detailed_help: help.trim() || null,
          })
          .eq("id", step.id);
      }
    }
  }

  console.log(
    `✓ vocab sweep complete: ${stepsTouched} steps updated, ${marksAdded} vocab marks placed`
  );
}

main();
