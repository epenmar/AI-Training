/**
 * wave-83-syllabus-doc-direct-link-1.0.0.ts
 *
 * Skill 11 reviewer note (A25): "link directly to the Google Doc rather
 * than the Teaching-and-Learning page to reduce extra clicks." The owner
 * supplied the URL; verified it's ASU's official "Approaches to Syllabus
 * Statements Concerning Use of Generative AI" doc (three sample
 * statements + Academic Integrity Policy links, dated 7/2025).
 *
 * Swap the Canvas syllabus-statements page link for the direct Google
 * Doc across A25/A26/A27 (it's the sample-language source in all three),
 * and update A26 step 1's inline reference to match.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const CANVAS_MATCH = "syllabus-statements-for-generative-ai";
const DOC_URL =
  "https://docs.google.com/document/d/1u9RGD8oU3e16XkdFNC6k8tgXIzYW2L7yZ2ELW5LfZqQ/edit";
const DOC_TITLE = "ASU sample syllabus statements for generative AI (Google Doc)";

type ExtraSource = { title: string; url: string; meta?: string; source?: string; where?: string };

async function main() {
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!);

  for (const id of [25, 26, 27]) {
    const { data: row } = await sb
      .from("level_up_activities")
      .select("extra_sources")
      .eq("id", id)
      .single();
    const extras = Array.isArray(row?.extra_sources)
      ? (row!.extra_sources as ExtraSource[])
      : [];
    let changed = false;
    const next = extras.map((e) => {
      if ((e?.url ?? "").includes(CANVAS_MATCH)) {
        changed = true;
        return { ...e, url: DOC_URL, title: DOC_TITLE, source: "ASU" };
      }
      return e;
    });
    if (changed) {
      await sb.from("level_up_activities").update({ extra_sources: next }).eq("id", id);
      console.log(`✓ A${id} — syllabus-statements resource now links the Google Doc directly`);
    } else {
      console.log(`(A${id} — no Canvas syllabus link found to swap)`);
    }
  }

  // A26 step 1 help references the page by name — match the new wording.
  const { data: s1 } = await sb
    .from("activity_guide_steps")
    .select("detailed_help")
    .eq("activity_id", 26)
    .eq("step_number", 1)
    .single();
  const help = s1?.detailed_help ?? "";
  const updated = help.replace(
    "see **ASU's syllabus-statements-for-GenAI page** in the Explore Sources and Resources box below.",
    "see **ASU's sample syllabus statements for generative AI** in the Explore Sources and Resources box below."
  );
  if (updated !== help) {
    await sb
      .from("activity_guide_steps")
      .update({ detailed_help: updated })
      .eq("activity_id", 26)
      .eq("step_number", 1);
    console.log("✓ A26 step 1 — inline reference reworded to match");
  }
}

main();
