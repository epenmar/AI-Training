/**
 * Remove the two Canvas course-orientation items from Phase 0
 * (Welcome & Orient).
 *
 * "About this course" and "How to use this course" were carried over
 * from the Canvas course outline, but they describe the Canvas course,
 * not this platform — so they don't match the structure here. Phase 0
 * keeps the remaining two items: AI Creative Learning Lab (ecosystem
 * context) and the Course Glossary (reference).
 *
 * Run with: npx tsx supabase/seed/remove-phase-0-canvas-orientation.ts
 */
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const TITLES_TO_REMOVE = ["About this course", "How to use this course"];

async function run() {
  for (const title of TITLES_TO_REMOVE) {
    const { data, error } = await supabase
      .from("lesson_flow")
      .delete()
      .eq("bloom_phase_id", 0)
      .eq("item_title", title)
      .select("id");
    if (error) {
      console.error(`Failed to delete "${title}": ${error.message}`);
      continue;
    }
    console.log(`Deleted ${data?.length ?? 0} row(s) for "${title}"`);
  }
  console.log("\nDone.");
}

run();
