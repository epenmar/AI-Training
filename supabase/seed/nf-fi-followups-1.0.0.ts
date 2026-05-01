/**
 * nf-fi-followups-1.0.0.ts
 *
 *   1. Em-dash cleanup on activity descriptions and objectives across
 *      all 42 activities (was already done on value_add and on every
 *      step's detailed_help in earlier passes).
 *   2. Source-pointer normalization, link text for the most-cited
 *      Canvas / Articulate Rise / VITRA URLs gets a time-budget tag
 *      so users know whether they're committing to a 5-minute skim or
 *      a 15-minute lesson.
 *   3. New interactives on activities that didn't get one: 11
 *      Confidence Trap, 19 AI Meets Your Spreadsheet, 25 Find the
 *      Policy, 31 The Unexpected Prompt, 34 My AI Decision Journal,
 *      37 Build Your Starter Kit, 40 Ask AI About AI.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const EM = String.fromCharCode(8212); // U+2014 EM DASH

// ─────────────────────────────────────────────────────────────────
// 1. Em-dash cleanup, same conservative rules as the detailed_help
//    pass in nf-fi-cleanup-1.0.0.ts.
// ─────────────────────────────────────────────────────────────────
function cleanEmDashes(text: string): string {
  const stash: string[] = [];
  const SENTINEL = String.fromCharCode(1);
  let out = text.replace(/\[([^\]]+)\]/g, (m) => {
    stash.push(m);
    return `${SENTINEL}${stash.length - 1}${SENTINEL}`;
  });
  const dash = ` ${EM} `;
  out = out.replace(new RegExp(`${EM} (?=["“])`, "g"), ": ");
  for (const w of ["and", "but", "yet", "so"]) {
    out = out.replaceAll(`${dash}${w} `, `, ${w} `);
  }
  for (const w of ["just", "only"]) {
    out = out.replaceAll(`${dash}${w} `, `; ${w} `);
  }
  out = out.replaceAll(`${dash}not `, `, not `);
  out = out.replaceAll(dash, ", ");
  out = out.replace(
    new RegExp(`${SENTINEL}(\\d+)${SENTINEL}`, "g"),
    (_, idx) => stash[Number(idx)]
  );
  return out;
}

// ─────────────────────────────────────────────────────────────────
// 2. Source-pointer normalization. For each URL we care about,
//    define what the link *text* should look like. The script then
//    searches the detailed_help for any markdown link to that URL
//    and rewrites the text portion so the time-budget hint is
//    consistent across activities.
// ─────────────────────────────────────────────────────────────────
const URL_LABELS: Record<string, string> = {
  "https://canvas.asu.edu/courses/157584/pages/module-1-overview-3":
    "Canvas Module 1 (overview) — GPTs, terminology, capabilities (~10 min skim)",
  "https://canvas.asu.edu/courses/157584/pages/module-2-overview-2":
    "Canvas Module 2 (overview) — types of GenAI applications and uses (~10 min skim)",
  "https://canvas.asu.edu/courses/157584/pages/module-3-overview-2":
    "Canvas Module 3 (overview) — ethical AI, fairness, transparency (~10 min skim)",
  "https://canvas.asu.edu/courses/157584/pages/module-4-overview-2":
    "Canvas Module 4 (overview) — prompt engineering essentials (~10 min skim)",
  "https://canvas.asu.edu/courses/157584/pages/module-5-overview-2":
    "Canvas Module 5, Lesson 2 — Key terms for evaluating GenAI outputs (~5 min)",
  "https://canvas.asu.edu/courses/157584/pages/maximizing-teaching-efficacy-with-asus-chatgpt-resources":
    "ASU's ChatGPT-for-faculty page (Canvas, ~5 min skim)",
  "https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra":
    "ASU's VITRA process (Canvas, ~5 min)",
  "https://canvas.asu.edu/courses/157584/pages/syllabus-statements-for-generative-ai":
    "ASU's syllabus-statements-for-GenAI page (Canvas, ~3 min)",
  "https://canvas.asu.edu/courses/157584/pages/look-up-key-terms-in-the-course-glossary-2":
    "ASU course glossary of GenAI terms (Canvas, lookup reference)",
  "https://canvas.asu.edu/courses/157584/pages/about-this-course":
    "ASU \"About this course\" page (Canvas, ~3 min)",
  "https://rise.articulate.com/share/3lU5J_haoXgNR9QKQORI67zuM2Qix_sv#/lessons/J4bNGWxtic5oznXuy5BC_gwfhfAMsE1A":
    "Module 1, Lesson 1 — Experimenting with GenAI at ASU (Articulate Rise, ~10 min)",
  "https://rise.articulate.com/share/fRP7fjoWsWuSXljLxc2dF011IycTdmdL#/lessons/_3dr-VqskB18C8sq3TPuSG2e-zUIxdTC":
    "Module 2, Lesson 1 — Do you know what AI can do? (Articulate Rise, ~10 min)",
  "https://rise.articulate.com/share/Ih949hPlICDdUyw0OtVdBtg6EWYn0V3n#/lessons/K0OMFl0s_2SIUThBCuYlAR63-lF5xI9P":
    "Module 4, Lesson 1 — Steps for an effective prompt (Articulate Rise, ~10 min)",
  "https://rise.articulate.com/share/LZmZZ-KMIhK7vDZxyC2e8ThCFkfQ5T01#/lessons/tai1yFyVRajyPWKuEhr_OV74I_C6iUok":
    "Module 3, Lesson 1 — Core values for AI use (Articulate Rise, ~10 min)",
};

const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

function normalizeLinks(text: string): string {
  return text.replace(linkRegex, (full, label, url) => {
    const target = URL_LABELS[url];
    return target ? `[${target}](${url})` : full;
  });
}

// ─────────────────────────────────────────────────────────────────
// 3. New interactives.
// ─────────────────────────────────────────────────────────────────
type StepInteractive = {
  activityId: number;
  stepNumber: number;
  type: string;
  data: unknown;
};

const STEP_INTERACTIVES: StepInteractive[] = [
  // 11 — Confidence Trap, step 1 (pick a question AI is likely to bluff on)
  {
    activityId: 11,
    stepNumber: 1,
    type: "claim_quiz",
    data: {
      prompt:
        "Calibrate first: which kinds of questions is AI most likely to bluff on?",
      claims: [
        {
          id: "c1",
          text:
            "What policies your specific department adopted in the last six months.",
          verdict: "false",
          explanation:
            "Recent + niche to your institution = high bluff risk. Always verify.",
        },
        {
          id: "c2",
          text:
            "How addition works for two-digit numbers.",
          verdict: "true",
          explanation:
            "Stable, well-documented, unambiguous, AI is reliable here.",
        },
        {
          id: "c3",
          text:
            "What happened in the AI industry yesterday.",
          verdict: "false",
          explanation:
            "Beyond the model's knowledge cutoff, AI either invents or fails to flag the gap.",
        },
        {
          id: "c4",
          text:
            "Common misconceptions about photosynthesis that K-12 students hold.",
          verdict: "mixed",
          explanation:
            "AI often repeats the misconception with the same confidence as the truth.",
        },
      ],
    },
  },

  // 19 — AI Meets Your Spreadsheet, step 3 (compare reads)
  {
    activityId: 19,
    stepNumber: 3,
    type: "text_list_entry",
    data: {
      storageKey: "activity-19-reads",
      prompt:
        "Capture three observations the AI made about the data, then three of your own. The point is to compare, not to score.",
      groups: [
        {
          id: "ai",
          label: "What the AI said",
          placeholder: "e.g., enrollment trended up 12% YoY",
          count: 3,
        },
        {
          id: "you",
          label: "What you noticed",
          placeholder: "e.g., the dip in 2022 lines up with the new schedule",
          count: 3,
        },
      ],
    },
  },

  // 25 — Find the Policy, step 2 (capture the two policy summaries)
  {
    activityId: 25,
    stepNumber: 2,
    type: "text_list_entry",
    data: {
      storageKey: "activity-25-policies",
      prompt:
        "Note the source name and your one-line summary for each policy. The boxes save in your browser, you'll re-use them in step 3.",
      groups: [
        {
          id: "asu",
          label: "ASU policy",
          placeholder: "Source name + one-line summary",
          count: 1,
        },
        {
          id: "external",
          label: "External policy (journal/funder/org)",
          placeholder: "Source name + one-line summary",
          count: 1,
        },
      ],
    },
  },

  // 31 — The Unexpected Prompt, step 2 (the actually-unexpected ask)
  {
    activityId: 31,
    stepNumber: 2,
    type: "prompt_sandbox",
    data: {
      starter:
        "Write a meeting agenda for our weekly faculty sync as a choose-your-own-adventure with three branching paths. Each path should produce a different style of meeting.",
      hint:
        "Edit the routine task and the unexpected format. The weirder the format, the better — that's the point.",
    },
  },

  // 34 — My AI Decision Journal, step 2 (daily log entries)
  {
    activityId: 34,
    stepNumber: 2,
    type: "text_list_entry",
    data: {
      storageKey: "activity-34-journal",
      prompt:
        "Five days, one entry per day. Keep it short. The boxes save in your browser, come back to them all week.",
      groups: [
        {
          id: "log",
          label: "Daily log (Mon–Fri)",
          placeholder:
            "Task: ___. Used AI? Y/N. Why or why not?",
          count: 5,
        },
      ],
    },
  },

  // 37 — Build Your Starter Kit, step 2 (capture the 3 sources)
  {
    activityId: 37,
    stepNumber: 2,
    type: "text_list_entry",
    data: {
      storageKey: "activity-37-kit",
      prompt:
        "Lock in your three. Each box, the source name and one sentence on what it's good for.",
      groups: [
        {
          id: "institutional",
          label: "Institutional (e.g., ASU AI hub)",
          placeholder: "Source name + what it's good for",
          count: 1,
        },
        {
          id: "practitioner",
          label: "Practitioner / researcher",
          placeholder: "Source name + what it's good for",
          count: 1,
        },
        {
          id: "tool",
          label: "Tool-focused",
          placeholder: "Source name + what it's good for",
          count: 1,
        },
      ],
    },
  },

  // 40 — Ask AI About AI, step 1 (the actual prompt)
  {
    activityId: 40,
    stepNumber: 1,
    type: "prompt_sandbox",
    data: {
      starter:
        "I'm brand new to AI. What are the 3 most important things I should understand before I start using you for work? Keep it short, and be specific about *why* each one matters.",
      hint: "Copy this into any AI chat tool, or edit it to fit your situation first.",
    },
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ── 1. Em-dash cleanup on description + objectives ──────────────
  const { data: activities, error: aErr } = await sb
    .from("level_up_activities")
    .select("id,description,objectives");
  if (aErr) throw aErr;

  let descCleaned = 0;
  let objCleaned = 0;
  for (const a of activities ?? []) {
    const patch: {
      description?: string;
      objectives?: string[];
    } = {};
    if (a.description) {
      const next = cleanEmDashes(a.description);
      if (next !== a.description) {
        patch.description = next;
        descCleaned++;
      }
    }
    if (Array.isArray(a.objectives)) {
      const nextObjs = a.objectives.map(cleanEmDashes);
      if (nextObjs.some((s, i) => s !== a.objectives[i])) {
        patch.objectives = nextObjs;
        objCleaned++;
      }
    }
    if (Object.keys(patch).length > 0) {
      const { error } = await sb
        .from("level_up_activities")
        .update(patch)
        .eq("id", a.id);
      if (error) console.error(`  x activity ${a.id}:`, error.message);
    }
  }
  console.log(
    `em-dash cleanup: ${descCleaned} descriptions, ${objCleaned} objectives lists updated`
  );

  // ── 2. Source-pointer normalization on detailed_help ────────────
  const { data: steps, error: sErr } = await sb
    .from("activity_guide_steps")
    .select("id,detailed_help");
  if (sErr) throw sErr;

  let linkUpdated = 0;
  for (const s of steps ?? []) {
    if (!s.detailed_help) continue;
    const next = normalizeLinks(s.detailed_help);
    if (next === s.detailed_help) continue;
    const { error } = await sb
      .from("activity_guide_steps")
      .update({ detailed_help: next })
      .eq("id", s.id);
    if (error) console.error(`  x step ${s.id}:`, error.message);
    else linkUpdated++;
  }
  console.log(`source-pointer normalization: ${linkUpdated} steps updated`);

  // ── 3. New interactives ─────────────────────────────────────────
  for (const it of STEP_INTERACTIVES) {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({
        interactive_type: it.type,
        interactive_data: it.data,
      })
      .eq("activity_id", it.activityId)
      .eq("step_number", it.stepNumber);
    if (error)
      console.error(`  x ${it.activityId}/${it.stepNumber}:`, error.message);
  }
  console.log(`interactives added on ${STEP_INTERACTIVES.length} steps`);

  console.log("\nDone.");
}

main();
