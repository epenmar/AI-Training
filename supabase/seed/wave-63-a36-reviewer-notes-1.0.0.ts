/**
 * wave-63-a36-reviewer-notes-1.0.0.ts
 *
 * Reviewer notes on A36 (Principled Innovation Case Study), approved
 * 2026-06-15:
 *
 *   Note 1: optional-extension comma splice → two sentences, and
 *     "Community Look Book" → "the Community" (Look Book is reserved
 *     for the elevated-course gallery).
 *   Note 2: step 2 (map stakeholders) had no input box → add a
 *     text_list_entry for stakeholder mapping.
 *   Note 3: steps 4 + 5 had no input boxes → add a text_list_entry to
 *     step 4 (tensions) and step 5 (path forward + colleague
 *     feedback). Step 6 already synthesizes into the deliverable box
 *     (now fed by all the new boxes + Summarize my work), so it's
 *     left as-is.
 *
 * Resolves the 3 open A36 notes at the end.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  // ---- Note 1: fix the optional-extension text ----
  const overview =
    "Overview: In this activity, you will pick one real AI use case from your work and apply ASU's Principled Innovation framework — naming the stakeholders, the tension between curiosity and care, and the intent. You'll use AI to draft a visual stakeholder map and propose a path forward you could defend to a colleague.";
  const extension =
    "Optional extension: Turn it into a full case study (context, stakeholders, full PI analysis, proposed path forward) and share it in the Community. Case studies get more useful when other educators weigh in on tensions you may have missed.";
  await sb
    .from("level_up_activities")
    .update({ description: `${overview}\n\n${extension}` })
    .eq("id", 36);
  console.log("✓ A36 optional extension — comma splice fixed + Community");

  // ---- Note 2: step 2 stakeholder box ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-36-stakeholders",
        prompt:
          "Name each stakeholder and how they're affected. Saves in your browser; feeds the deliverable.",
        groups: [
          {
            id: "stakeholders",
            count: 6,
            label: "Stakeholders",
            placeholder:
              "Who they are + how they're affected (e.g., Students: data privacy, little say in the decision)",
          },
        ],
      },
    })
    .eq("activity_id", 36)
    .eq("step_number", 2);
  console.log("✓ A36 step 2 — stakeholder text_list_entry");

  // ---- Note 3a: step 4 tensions box ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-36-tensions",
        prompt:
          "Name the tensions you see. Each is two principles pulling in different directions.",
        groups: [
          {
            id: "tensions",
            count: 3,
            label: "Tensions",
            placeholder:
              "Which two principles pull apart, and how (e.g., curiosity vs. care: eager to pilot, but student-data risk)",
          },
        ],
      },
    })
    .eq("activity_id", 36)
    .eq("step_number", 4);
  console.log("✓ A36 step 4 — tensions text_list_entry");

  // ---- Note 3b: step 5 path forward + colleague feedback ----
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_type: "text_list_entry",
      interactive_data: {
        storageKey: "activity-36-path",
        prompt:
          "Draft your proposed path, then note what your colleague said when you presented it.",
        groups: [
          {
            id: "path",
            count: 1,
            label: "Proposed path forward",
            placeholder:
              "How you'd resolve the tensions honestly, in a way you could defend.",
          },
          {
            id: "feedback",
            count: 1,
            label: "Colleague feedback",
            placeholder:
              "What your colleague said, and anything it made you reconsider.",
          },
        ],
      },
    })
    .eq("activity_id", 36)
    .eq("step_number", 5);
  console.log("✓ A36 step 5 — path + colleague-feedback text_list_entry");

  // ---- Resolve the 3 open A36 notes ----
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: stepRows } = await sb
    .from("activity_guide_steps")
    .select("id")
    .eq("activity_id", 36);
  const rowIds = ["36", ...(stepRows ?? []).map((s) => String(s.id))];

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sbAny = sb as any;
  const { data: resolved, error } = await sbAny
    .from("admin_edit_comments")
    .update({
      status: "resolved",
      resolved_by: admin?.id ?? null,
      resolved_at: new Date().toISOString(),
    })
    .eq("status", "open")
    .in("row_id", rowIds)
    .select("id");
  if (error) console.warn("(resolve) " + error.message);
  else console.log(`✓ Resolved ${resolved?.length ?? 0} A36 reviewer notes`);
}

main();
