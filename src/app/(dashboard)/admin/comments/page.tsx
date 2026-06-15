import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { ResolveNoteButton } from "@/components/admin/ResolveNoteButton";

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

// Resolve a note's target to a link + a readable activity label.
function noteLink(
  n: NoteRow,
  stepToActivity: Map<string, number>,
  activityTitles: Map<number, string>
): { href: string | null; where: string } {
  if (n.table_name === "level_up_activities") {
    const aid = Number(n.row_id);
    return {
      href: `/activities/${aid}`,
      where: activityTitles.get(aid) ?? `Activity ${aid}`,
    };
  }
  if (n.table_name === "activity_guide_steps") {
    const aid = stepToActivity.get(n.row_id);
    return {
      href: aid ? `/activities/${aid}` : null,
      where: aid
        ? activityTitles.get(aid) ?? `Activity ${aid}`
        : "Activity step",
    };
  }
  if (n.table_name === "skills") {
    return {
      href: `/learning-paths/skill/${n.row_id}`,
      where: `Skill ${n.row_id}`,
    };
  }
  return { href: null, where: `${n.table_name} #${n.row_id}` };
}

export default async function AdminCommentsPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const showResolved = status === "resolved";

  const { user, isAdmin } = await getAdminContext();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  let notes: NoteRow[] = [];
  let tableMissing = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let admin: any = null;
  if (!hasServiceRole()) {
    tableMissing = true;
  }
  try {
    admin = hasServiceRole() ? (createAdminClient() as unknown) : null;
    const { data, error } = await admin
      .from("admin_edit_comments")
      .select("*")
      .eq("status", showResolved ? "resolved" : "open")
      .order("created_at", { ascending: false });
    if (error) tableMissing = true;
    else notes = (data ?? []) as NoteRow[];
  } catch {
    tableMissing = true;
  }

  // Resolve step → activity + activity titles for readable links.
  const stepIds = notes
    .filter((n) => n.table_name === "activity_guide_steps")
    .map((n) => Number(n.row_id))
    .filter((n) => !Number.isNaN(n));
  const stepToActivity = new Map<string, number>();
  if (stepIds.length > 0) {
    const { data: stepRows } = await admin
      .from("activity_guide_steps")
      .select("id, activity_id")
      .in("id", stepIds);
    for (const s of stepRows ?? []) {
      stepToActivity.set(String(s.id), s.activity_id as number);
    }
  }
  const activityIds = new Set<number>();
  for (const n of notes) {
    if (n.table_name === "level_up_activities")
      activityIds.add(Number(n.row_id));
  }
  for (const aid of stepToActivity.values()) activityIds.add(aid);
  const activityTitles = new Map<number, string>();
  if (activityIds.size > 0) {
    const { data: actRows } = await admin
      .from("level_up_activities")
      .select("id, title")
      .in("id", [...activityIds]);
    for (const a of actRows ?? []) {
      activityTitles.set(a.id as number, a.title as string);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Reviewer notes</h2>
        <p className="text-gray-500">
          Admin annotations across the site — flags for bigger changes
          that inline editing can&apos;t make. Work through these and take
          the structural ones to AI.
        </p>
      </div>

      {/* Open / resolved toggle */}
      <div
        role="tablist"
        aria-label="Notes view"
        className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6"
      >
        <Link
          href="/admin/comments"
          role="tab"
          aria-selected={!showResolved}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            !showResolved
              ? "bg-white text-asu-maroon shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Open
        </Link>
        <Link
          href="/admin/comments?status=resolved"
          role="tab"
          aria-selected={showResolved}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            showResolved
              ? "bg-white text-gray-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Resolved
        </Link>
      </div>

      {tableMissing ? (
        <div className="rounded-lg border-2 border-asu-gold/50 bg-asu-gold/5 p-5">
          <p className="text-sm text-gray-700">
            Reviewer notes aren&apos;t set up yet. Apply migration{" "}
            <span className="font-mono">021_admin_edit_comments.sql</span> in
            the Supabase dashboard SQL editor, then notes you add on
            activity pages will show up here.
          </p>
        </div>
      ) : notes.length === 0 ? (
        <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5">
          <p className="text-sm text-gray-600">
            No {showResolved ? "resolved" : "open"} notes.
            {!showResolved &&
              " Add one from any activity page using the gold “Reviewer notes” panel."}
          </p>
        </div>
      ) : (
        <ul className="space-y-2">
          {notes.map((n) => {
            const { href, where } = noteLink(
              n,
              stepToActivity,
              activityTitles
            );
            return (
              <li
                key={n.id}
                className="rounded-lg bg-white border border-gray-200 p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-asu-maroon">
                      {where}
                      {n.context_label && (
                        <span className="text-gray-400 font-medium normal-case tracking-normal">
                          {" "}
                          · {n.context_label}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-line mt-1">
                      {n.body}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {n.created_by_name ?? "Unknown"} ·{" "}
                      {new Date(n.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {href && (
                        <>
                          {" · "}
                          <Link
                            href={href}
                            className="text-asu-maroon hover:underline"
                          >
                            Go to page →
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <ResolveNoteButton
                    commentId={n.id}
                    resolved={n.status === "resolved"}
                  />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
