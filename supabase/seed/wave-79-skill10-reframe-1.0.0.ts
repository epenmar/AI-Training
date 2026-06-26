/**
 * wave-79-skill10-reframe-1.0.0.ts
 *
 * Skill 10 (Build with AI) reviewer notes. Levels: A22 = New→Foundational
 * ("Describe It, See It"), A17 = Foundational→Intermediate ("Design an
 * Agent"), A18 = Intermediate→Advanced ("Build and Test").
 *
 * Owner-approved: reframe faculty/instructor voice -> instructional-
 * designer voice across the skill.
 *
 * A22 — Describe It, See It
 *   "framed for an instructor; reframe from an ID perspective" -> describe
 *     concepts you explain to faculty / a course team / in a workshop.
 *   Step 3: "link the Texas Tech accessible-presentation guide or point to
 *     the Explore box" -> point to the Explore Sources box.
 *   (Adobe Firefly note: ASU has the whole Adobe suite, so no change.
 *    "Look Book" in the deliverable: already gone.)
 *
 * A17 — Design an Agent
 *   "Some recommended workflows are framed for faculty rather than IDs"
 *     -> reframe the sample-workflow chips to ID work (accessibility
 *        passes, objective drafting, module QA, consult notes, faculty FAQ).
 *
 * Still open (flagged to owner, not in this seed): the Sources/Resources
 * for A17 + A18 are all tool docs and lack foundational learning content
 * — needs an ASU learning resource to point at (owner's call on which).
 * The nav bugs (no advance button / Advanced looping back) are fixed in
 * the activity page, not here.
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

  // ===================== A22 — Describe It, See It =====================
  await sb
    .from("level_up_activities")
    .update({
      description:
        "Overview: In this activity, you will pick a concept you often explain — to faculty you support, in a workshop, or to a course team — and describe it to an AI image or diagram tool. You'll see what it produces and note what's usable as-is versus what needs human correction before it's ready to put in front of an audience.\n\n" +
        "Optional extension: Scale the move from a single visual to a five-slide deck draft for the same concept. Generate each slide's visual the same way, then audience-tune the deck (does the order make sense for someone seeing this for the first time? does each slide stand alone if someone joins late?).",
    })
    .eq("id", 22);

  await sb
    .from("activity_guide_steps")
    .update({
      instruction:
        "Pick a concept you frequently explain — to faculty, in a training, or to a course team (e.g., a process, a comparison, a hierarchy).",
      detailed_help:
        "**Why a concept you already explain:** you already know what a good version looks like. That gives you an evaluation baseline. When the AI produces something off, you'll see immediately what's missing.\n\n" +
        "Good candidates: a process (like how peer review works), a comparison (like inductive vs. deductive reasoning), or a hierarchy (like Bloom's taxonomy). Avoid anything with precise technical relationships — AI diagram tools are still rough at subject-matter accuracy.",
    })
    .eq("activity_id", 22)
    .eq("step_number", 1);

  // Step 3: point the Texas Tech guide to the Explore Sources box.
  await sb
    .from("activity_guide_steps")
    .update({
      detailed_help:
        "Common issues to check:\n\n" +
        "**Labels.** Are they spelled correctly? Do they match the field's terminology? (AI frequently \"smooths\" specialist terms into more generic versions.)\n\n" +
        "**Relationships.** Do the arrows point the right way? Are the groupings logical?\n\n" +
        "**Completeness.** Did it include everything you asked for? Did it add things you didn't?\n\n" +
        "**Accessibility.** Is there enough color contrast? Are shapes distinguishable without relying on color alone? See the **Texas Tech accessible presentations guide** in the Explore Sources and Resources box below for the core rules — most AI-generated visuals need adjustment here.",
    })
    .eq("activity_id", 22)
    .eq("step_number", 3);
  console.log("✓ A22 — ID-voice reframe + Texas Tech pointer to Explore box");

  // ===================== A17 — Design an Agent =====================
  // Reframe the sample-workflow chips to instructional-designer work.
  await sb
    .from("activity_guide_steps")
    .update({
      interactive_data: {
        prompt:
          "Pick one to spark your thinking, or write your own. The follow-up captures the workflow you'll design.",
        options: [
          { id: "accessibility-pass", label: "Run an accessibility pass on a course page (alt text, headings, contrast)" },
          { id: "objectives-draft", label: "Draft learning objectives from a course outline at a target Bloom level" },
          { id: "quiz-generation", label: "Generate a quiz set aligned to learning objectives at target Bloom levels" },
          { id: "module-qa", label: "Check a built module against a course-quality rubric (e.g., Quality Matters)" },
          { id: "consult-notes", label: "Turn faculty-consultation notes into an action list with follow-ups" },
          { id: "meeting-prep", label: "Build a meeting agenda from the prior meeting's notes" },
          { id: "faculty-faq", label: "Answer a category of faculty FAQ from a support doc you maintain" },
        ],
        followUps: [
          {
            id: "name",
            label: "Your workflow (in your words)",
            placeholder:
              'e.g., "Accessibility pass on new Canvas pages before a course goes live"',
          },
        ],
        allowOther: true,
        chipsLabel: "Sample workflows",
        otherLabel: "My own workflow",
        storageKey: "activity-17-workflow-pick",
        singleSelect: true,
        otherPlaceholder:
          "Describe a repetitive multi-step workflow from your role.",
      },
    })
    .eq("activity_id", 17)
    .eq("step_number", 1);
  console.log("✓ A17 — sample workflows reframed to instructional-designer work");

  // ===================== Resolve open notes on A17/A18/A22 =====================
  const { data: admin } = await sb
    .from("profiles")
    .select("id")
    .eq("is_admin", true)
    .limit(1)
    .single();
  const { data: steps } = await sb
    .from("activity_guide_steps")
    .select("id")
    .in("activity_id", [17, 18, 22]);
  const rowIds = ["17", "18", "22", ...(steps ?? []).map((s) => String(s.id))];
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
  if (error) console.warn("(could not resolve notes) " + error.message);
  else console.log(`✓ Resolved ${resolved?.length ?? 0} open reviewer notes on A17/A18/A22`);
}

main();
