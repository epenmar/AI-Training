/**
 * nf-fi-cleanup-1.0.0.ts
 *
 *   1. Em-dash audit on every detailed_help across the 28 NF + FI
 *      activities. The default replacement is a comma; specific
 *      contexts get a colon, semicolon, or split sentence.
 *   2. Surface ASU resources on the step in each activity where the
 *      learner first needs to open or use an AI tool.
 *   3. Point the last reflection step at the deliverable box on
 *      activities whose final step is "write a reflection" with no
 *      external artifact.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const TARGET_ACTIVITY_IDS = [
  // NF
  1, 4, 7, 10, 13, 16, 19, 22, 25, 28, 31, 34, 37, 40,
  // FI
  2, 5, 8, 11, 14, 17, 20, 23, 26, 29, 32, 35, 38, 41,
];

const EM = String.fromCharCode(8212); // U+2014 EM DASH

function cleanEmDashes(text: string): string {
  // Stash link bodies "[ ... ]" so any em-dashes inside link titles
  // (e.g. "Module 4 - Steps for an effective prompt") are preserved.
  const stash: string[] = [];
  const SENTINEL = String.fromCharCode(1); // SOH
  let out = text.replace(/\[([^\]]+)\]/g, (m) => {
    stash.push(m);
    return `${SENTINEL}${stash.length - 1}${SENTINEL}`;
  });

  const dash = ` ${EM} `;

  // Em-dash before an opening double-quote, colon.
  out = out.replace(new RegExp(`${EM} (?=["“])`, "g"), ": ");

  // Em-dash + contrastive coordinator -> comma + word
  for (const word of ["and", "but", "yet", "so"]) {
    out = out.replaceAll(`${dash}${word} `, `, ${word} `);
  }

  // Em-dash + parenthetical clarifier
  for (const word of ["just", "only"]) {
    out = out.replaceAll(`${dash}${word} `, `; ${word} `);
  }
  out = out.replaceAll(`${dash}not `, `, not `);

  // Default em-dash with surrounding spaces -> comma.
  out = out.replaceAll(dash, ", ");

  // Restore link bodies.
  out = out.replace(
    new RegExp(`${SENTINEL}(\\d+)${SENTINEL}`, "g"),
    (_, idx) => stash[Number(idx)]
  );

  return out;
}

const RESOURCE_STEPS: Array<[number, number]> = [
  // NF
  [1, 1],
  [4, 2],
  [10, 2],
  [13, 1],
  [16, 2],
  [19, 2],
  [22, 2],
  [31, 1],
  [40, 1],
  // FI
  [2, 4],
  [5, 2],
  [8, 1],
  [11, 2],
  [14, 1],
  [20, 3],
  [23, 2],
  [32, 2],
  [41, 2],
];

type LastStepUpdate = {
  activityId: number;
  stepNumber: number;
  newInstruction: string;
};

const LAST_STEP_UPDATES: LastStepUpdate[] = [
  {
    activityId: 1,
    stepNumber: 6,
    newInstruction:
      "Reflection: which tool did you find most useful, and why? When might the others be better? Capture your answer in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 4,
    stepNumber: 6,
    newInstruction:
      "Reflection: did the conversation go somewhere you didn't expect? What would you do differently next time? Capture your answer in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 10,
    stepNumber: 6,
    newInstruction:
      "Reflection: which 'fact' surprised you most, and what does that tell you about how you read AI output? Capture your answer in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 16,
    stepNumber: 4,
    newInstruction:
      "In your own words, what would make a tool an 'agent' instead of just a chat? Capture your answer in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 19,
    stepNumber: 5,
    newInstruction:
      "Write a one-line trust note: would you rely on this AI summary, verify it, or discard it? Capture your answer in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 25,
    stepNumber: 4,
    newInstruction:
      "Note one sentence on how the two policies differ. Capture your answer in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 31,
    stepNumber: 4,
    newInstruction:
      "Reflection: was any part of the unexpected output actually useful? Did it spark an idea you wouldn't have had otherwise? Capture your answer in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 40,
    stepNumber: 5,
    newInstruction:
      "Capture the AI's answer, your reaction, and one follow-up question you'd ask in the deliverable box at the bottom of this page.",
  },
  // FI
  {
    activityId: 5,
    stepNumber: 6,
    newInstruction:
      "Write one sentence: which round was more useful, and what does that tell you about how AI defaults work? Capture your answer in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 8,
    stepNumber: 6,
    newInstruction:
      "Reflection: what type of claim was most likely to be fabricated? How would you build a verification habit into your workflow? Capture your answer in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 11,
    stepNumber: 6,
    newInstruction:
      "Capture your 3-step walkthrough as a record someone else could follow, in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 29,
    stepNumber: 4,
    newInstruction:
      "Read your paragraph aloud and revise until it sounds like someone who understands the complexity. Capture the final version in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 35,
    stepNumber: 5,
    newInstruction:
      "Read your framework back. Add a final note on what you're still uncertain about. Capture the framework and that note in the deliverable box at the bottom of this page.",
  },
  {
    activityId: 38,
    stepNumber: 5,
    newInstruction:
      "Reflection: did this exercise change how you'll read AI news in the future? Capture your answer in the deliverable box at the bottom of this page.",
  },
];

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // 1. Em-dash cleanup on detailed_help
  const { data: rows, error: fetchErr } = await sb
    .from("activity_guide_steps")
    .select("id,detailed_help,activity_id,step_number")
    .in("activity_id", TARGET_ACTIVITY_IDS);
  if (fetchErr) throw fetchErr;

  let cleaned = 0;
  let untouched = 0;
  for (const row of rows ?? []) {
    if (!row.detailed_help) continue;
    const next = cleanEmDashes(row.detailed_help);
    if (next === row.detailed_help) {
      untouched++;
      continue;
    }
    const { error } = await sb
      .from("activity_guide_steps")
      .update({ detailed_help: next })
      .eq("id", row.id);
    if (error) {
      console.error(`  x ${row.activity_id}/${row.step_number}:`, error.message);
    } else {
      cleaned++;
    }
  }
  console.log(
    `em-dash cleanup: ${cleaned} steps cleaned, ${untouched} already clean`
  );

  // 2. show_asu_resources
  for (const [activityId, stepNumber] of RESOURCE_STEPS) {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({ show_asu_resources: true })
      .eq("activity_id", activityId)
      .eq("step_number", stepNumber);
    if (error) console.error(`  x ${activityId}/${stepNumber}:`, error.message);
  }
  console.log(
    `show_asu_resources set on ${RESOURCE_STEPS.length} (activity, step) pairs`
  );

  // 3. Last-step deliverable references
  for (const u of LAST_STEP_UPDATES) {
    const { error } = await sb
      .from("activity_guide_steps")
      .update({ instruction: u.newInstruction })
      .eq("activity_id", u.activityId)
      .eq("step_number", u.stepNumber);
    if (error)
      console.error(`  x ${u.activityId}/${u.stepNumber}:`, error.message);
  }
  console.log(
    `deliverable-box reference added to ${LAST_STEP_UPDATES.length} last steps`
  );

  console.log("\nDone.");
}

main();
