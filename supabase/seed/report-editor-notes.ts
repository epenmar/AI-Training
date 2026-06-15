/**
 * report-editor-notes.ts
 *
 * Reporting tool (run from here, not a site feature). Reads every
 * admin reviewer note out of `admin_edit_comments` and prints a grouped,
 * actionable report so we can work through suggested changes together.
 *
 * Usage (from app/):
 *   npx -y dotenv-cli -e .env.local -- npx tsx supabase/seed/report-editor-notes.ts
 *
 * Flags (append after the filename):
 *   --all        include resolved notes too (default: open only)
 *   --resolved   show ONLY resolved notes
 *   --json       emit raw JSON instead of the formatted report
 *
 * Groups notes by activity, then activity-level notes first, then
 * step notes in step order. Each note shows: target (activity /
 * step N + widget type), the note body, author, date, status, and a
 * direct /activities/{id} path.
 *
 * Requires migration 021 (admin_edit_comments) to be applied. If the
 * table is missing it says so and exits cleanly.
 */
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../../src/types/database";

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
}

const args = process.argv.slice(2);
const wantAll = args.includes("--all");
const wantResolvedOnly = args.includes("--resolved");
const wantJson = args.includes("--json");

type NoteRow = {
  id: string;
  table_name: string;
  row_id: string;
  column_name: string | null;
  context_label: string | null;
  body: string;
  status: string;
  created_by_name: string | null;
  created_at: string;
};

function fmtDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

async function main() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = createClient<Database>(SUPABASE_URL!, SERVICE_ROLE_KEY!) as any;

  // Pull notes (filtered by status unless --all).
  let query = sb
    .from("admin_edit_comments")
    .select("*")
    .order("created_at", { ascending: true });
  if (wantResolvedOnly) query = query.eq("status", "resolved");
  else if (!wantAll) query = query.eq("status", "open");

  const { data: notes, error } = await query;
  if (error) {
    if (
      error.code === "42P01" ||
      String(error.message).includes("admin_edit_comments")
    ) {
      console.error(
        "admin_edit_comments table not found. Apply migration 021_admin_edit_comments.sql in the Supabase dashboard first."
      );
      process.exit(1);
    }
    throw error;
  }

  const rows = (notes ?? []) as NoteRow[];
  if (rows.length === 0) {
    console.log(
      `No ${wantResolvedOnly ? "resolved" : wantAll ? "" : "open "}reviewer notes found.`
    );
    return;
  }

  // Resolve step -> activity, and activity titles, and step numbers /
  // widget types for readable context.
  const stepIds = rows
    .filter((n) => n.table_name === "activity_guide_steps")
    .map((n) => Number(n.row_id))
    .filter((n) => !Number.isNaN(n));

  const stepInfo = new Map<
    string,
    { activityId: number; stepNumber: number; widget: string | null }
  >();
  if (stepIds.length > 0) {
    const { data: steps } = await sb
      .from("activity_guide_steps")
      .select("id, activity_id, step_number, interactive_type")
      .in("id", stepIds);
    for (const s of steps ?? []) {
      stepInfo.set(String(s.id), {
        activityId: s.activity_id,
        stepNumber: s.step_number,
        widget: s.interactive_type ?? null,
      });
    }
  }

  // Collect every activity id referenced (direct + via steps).
  const activityIds = new Set<number>();
  for (const n of rows) {
    if (n.table_name === "level_up_activities")
      activityIds.add(Number(n.row_id));
  }
  for (const info of stepInfo.values()) activityIds.add(info.activityId);

  const activityTitles = new Map<number, string>();
  if (activityIds.size > 0) {
    const { data: acts } = await sb
      .from("level_up_activities")
      .select("id, title")
      .in("id", [...activityIds]);
    for (const a of acts ?? []) activityTitles.set(a.id, a.title);
  }

  // Build an enriched view of each note.
  type Enriched = NoteRow & {
    activityId: number | null;
    stepNumber: number | null;
    widget: string | null;
    where: string;
    path: string | null;
  };
  const enriched: Enriched[] = rows.map((n) => {
    if (n.table_name === "level_up_activities") {
      const aid = Number(n.row_id);
      return {
        ...n,
        activityId: aid,
        stepNumber: null,
        widget: null,
        where: "Activity (title / overview / deliverable)",
        path: `/activities/${aid}`,
      };
    }
    if (n.table_name === "activity_guide_steps") {
      const info = stepInfo.get(n.row_id);
      return {
        ...n,
        activityId: info?.activityId ?? null,
        stepNumber: info?.stepNumber ?? null,
        widget: info?.widget ?? null,
        where: info
          ? `Step ${info.stepNumber}${info.widget ? ` (${info.widget})` : ""}`
          : `Step (id ${n.row_id})`,
        path: info ? `/activities/${info.activityId}` : null,
      };
    }
    if (n.table_name === "skills") {
      return {
        ...n,
        activityId: null,
        stepNumber: null,
        widget: null,
        where: `Skill ${n.row_id}`,
        path: `/learning-paths/skill/${n.row_id}`,
      };
    }
    return {
      ...n,
      activityId: null,
      stepNumber: null,
      widget: null,
      where: `${n.table_name} #${n.row_id}`,
      path: null,
    };
  });

  if (wantJson) {
    console.log(JSON.stringify(enriched, null, 2));
    return;
  }

  // Group: activity-scoped notes by activity (activity-level first,
  // then steps in order); non-activity notes in an "Other" bucket.
  const byActivity = new Map<number, Enriched[]>();
  const other: Enriched[] = [];
  for (const e of enriched) {
    if (e.activityId != null) {
      if (!byActivity.has(e.activityId)) byActivity.set(e.activityId, []);
      byActivity.get(e.activityId)!.push(e);
    } else {
      other.push(e);
    }
  }

  const statusLabel = wantResolvedOnly
    ? "RESOLVED"
    : wantAll
      ? "ALL"
      : "OPEN";
  console.log(
    `\n=================== REVIEWER NOTES REPORT (${statusLabel}) ===================`
  );
  console.log(`Total notes: ${rows.length}\n`);

  const sortedActivityIds = [...byActivity.keys()].sort((a, b) => a - b);
  for (const aid of sortedActivityIds) {
    const list = byActivity
      .get(aid)!
      .sort((a, b) => {
        // activity-level (stepNumber null) first, then by step number
        if (a.stepNumber == null && b.stepNumber != null) return -1;
        if (a.stepNumber != null && b.stepNumber == null) return 1;
        return (a.stepNumber ?? 0) - (b.stepNumber ?? 0);
      });
    const title = activityTitles.get(aid) ?? `Activity ${aid}`;
    console.log(
      `\n========== A${aid} — ${title}   (/activities/${aid}) ==========`
    );
    for (const e of list) {
      const flag = e.status === "resolved" ? " [RESOLVED]" : "";
      console.log(`\n  • ${e.where}${flag}`);
      console.log(
        `    ${e.body.replace(/\n/g, "\n    ")}`
      );
      console.log(
        `    — ${e.created_by_name ?? "Unknown"}, ${fmtDate(e.created_at)}`
      );
    }
  }

  if (other.length > 0) {
    console.log(`\n========== OTHER ==========`);
    for (const e of other) {
      const flag = e.status === "resolved" ? " [RESOLVED]" : "";
      console.log(`\n  • ${e.where}${flag}${e.path ? `  (${e.path})` : ""}`);
      console.log(`    ${e.body.replace(/\n/g, "\n    ")}`);
      console.log(
        `    — ${e.created_by_name ?? "Unknown"}, ${fmtDate(e.created_at)}`
      );
    }
  }

  console.log(
    `\n=================== END (${rows.length} notes across ${
      sortedActivityIds.length
    } activities${other.length ? ` + ${other.length} other` : ""}) ===================\n`
  );
}

main();
