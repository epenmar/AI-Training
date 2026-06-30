import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
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

type FeedbackRow = {
  id: string;
  user_email: string | null;
  kind: "praise" | "problem" | "feature";
  message: string;
  page_path: string | null;
  created_at: string;
};

type TabKey = "notes" | "feedback";

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
      where: aid ? activityTitles.get(aid) ?? `Activity ${aid}` : "Activity step",
    };
  }
  if (n.table_name === "skills") {
    return { href: `/learning-paths/skill/${n.row_id}`, where: `Skill ${n.row_id}` };
  }
  return { href: null, where: `${n.table_name} #${n.row_id}` };
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; tab?: string }>;
}) {
  const { status, tab: tabParam } = await searchParams;
  const showResolved = status === "resolved";
  const tab: TabKey = tabParam === "feedback" ? "feedback" : "notes";

  const { user, isAdmin } = await getAdminContext();
  if (!user) redirect("/login");
  if (!isAdmin) redirect("/");

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-700">Admin dashboard</h2>
        <p className="text-gray-500">
          Reviewer notes left across the site, and feedback users send from the
          account menu.
        </p>
      </div>

      {/* Section tabs */}
      <div
        role="tablist"
        aria-label="Admin sections"
        className="inline-flex items-center gap-1 p-1 bg-gray-100 border border-gray-200 rounded-lg mb-6"
      >
        <Link
          href="/admin/comments"
          role="tab"
          aria-selected={tab === "notes"}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            tab === "notes"
              ? "bg-white text-asu-maroon shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Reviewer notes
        </Link>
        <Link
          href="/admin/comments?tab=feedback"
          role="tab"
          aria-selected={tab === "feedback"}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            tab === "feedback"
              ? "bg-white text-asu-maroon shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          User feedback
        </Link>
      </div>

      {tab === "notes" ? (
        <NotesTab showResolved={showResolved} />
      ) : (
        <FeedbackTab />
      )}
    </div>
  );
}

// ============================ Reviewer notes ============================
async function NotesTab({ showResolved }: { showResolved: boolean }) {
  let notes: NoteRow[] = [];
  let tableMissing = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let admin: any = null;
  if (!hasServiceRole()) tableMissing = true;
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
    for (const s of stepRows ?? []) stepToActivity.set(String(s.id), s.activity_id as number);
  }
  const activityIds = new Set<number>();
  for (const n of notes)
    if (n.table_name === "level_up_activities") activityIds.add(Number(n.row_id));
  for (const aid of stepToActivity.values()) activityIds.add(aid);
  const activityTitles = new Map<number, string>();
  if (activityIds.size > 0) {
    const { data: actRows } = await admin
      .from("level_up_activities")
      .select("id, title")
      .in("id", [...activityIds]);
    for (const a of actRows ?? []) activityTitles.set(a.id as number, a.title as string);
  }

  return (
    <>
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
            !showResolved ? "bg-white text-asu-maroon shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Open
        </Link>
        <Link
          href="/admin/comments?status=resolved"
          role="tab"
          aria-selected={showResolved}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            showResolved ? "bg-white text-gray-700 shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Resolved
        </Link>
      </div>

      {tableMissing ? (
        <div className="rounded-lg border-2 border-asu-gold/50 bg-asu-gold/5 p-5">
          <p className="text-sm text-gray-700">
            Reviewer notes aren&apos;t set up yet. Apply migration{" "}
            <span className="font-mono">021_admin_edit_comments.sql</span> in the
            Supabase dashboard SQL editor, then notes you add on activity pages
            will show up here.
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
            const { href, where } = noteLink(n, stepToActivity, activityTitles);
            return (
              <li key={n.id} className="rounded-lg bg-white border border-gray-200 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-[11px] font-bold uppercase tracking-wider text-asu-maroon">
                      {where}
                      {n.context_label && (
                        <span className="text-gray-400 font-medium normal-case tracking-normal">
                          {" "}· {n.context_label}
                        </span>
                      )}
                    </p>
                    <p className="text-sm text-gray-700 whitespace-pre-line mt-1">{n.body}</p>
                    <p className="text-[11px] text-gray-400 mt-1.5">
                      {n.created_by_name ?? "Unknown"} · {fmtDate(n.created_at)}
                      {href && (
                        <>
                          {" · "}
                          <Link href={href} className="text-asu-maroon hover:underline">
                            Go to page →
                          </Link>
                        </>
                      )}
                    </p>
                  </div>
                  <ResolveNoteButton commentId={n.id} resolved={n.status === "resolved"} />
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

// ============================ User feedback ============================
const FEEDBACK_GROUPS: {
  kind: FeedbackRow["kind"];
  title: string;
  blurb: string;
  head: string; // header bg/text
  border: string;
}[] = [
  {
    kind: "praise",
    title: "What people like",
    blurb: "Things that are working — keep doing these.",
    head: "bg-asu-green/10 text-green-800",
    border: "border-asu-green/30",
  },
  {
    kind: "problem",
    title: "Problems, bugs & outdated",
    blurb: "Something wrong, broken, or stale — triage these.",
    head: "bg-red-50 text-red-800",
    border: "border-red-200",
  },
  {
    kind: "feature",
    title: "Feature requests",
    blurb: "Ideas to make this better.",
    head: "bg-asu-blue/10 text-asu-blue",
    border: "border-asu-blue/30",
  },
];

async function FeedbackTab() {
  const supabase = await createClient();
  // Admin RLS policy gates the read; works with the user-scoped client.
  // user_feedback isn't in the generated Database types yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from("user_feedback")
    .select("id, user_email, kind, message, page_path, created_at")
    .order("created_at", { ascending: false });

  const missing = !!error;
  const rows = (data ?? []) as FeedbackRow[];

  if (missing) {
    return (
      <div className="rounded-lg border-2 border-asu-gold/50 bg-asu-gold/5 p-5">
        <p className="text-sm text-gray-700">
          User feedback isn&apos;t set up yet. Apply migration{" "}
          <span className="font-mono">024_user_feedback.sql</span> in the Supabase
          dashboard SQL editor, then feedback sent from the account menu will show
          up here.
        </p>
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5">
        <p className="text-sm text-gray-600">
          No feedback yet. It arrives here when users pick “Leave feedback” from
          the account menu.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-7">
      {FEEDBACK_GROUPS.map((g) => {
        const items = rows.filter((r) => r.kind === g.kind);
        return (
          <section key={g.kind}>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className="text-sm font-bold text-gray-700">
                {g.title}{" "}
                <span className="text-gray-400 font-medium">({items.length})</span>
              </h3>
              <p className="text-xs text-gray-400">{g.blurb}</p>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 italic px-1">Nothing here yet.</p>
            ) : (
              <div className={`overflow-hidden rounded-lg border ${g.border}`}>
                <table className="w-full text-sm">
                  <thead className={`text-left text-[11px] font-semibold uppercase tracking-wider ${g.head}`}>
                    <tr>
                      <th className="px-4 py-2 font-semibold">Feedback</th>
                      <th className="px-4 py-2 font-semibold whitespace-nowrap">Where</th>
                      <th className="px-4 py-2 font-semibold whitespace-nowrap">From</th>
                      <th className="px-4 py-2 font-semibold whitespace-nowrap">When</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 bg-white">
                    {items.map((r) => (
                      <tr key={r.id} className="align-top">
                        <td className="px-4 py-3 text-gray-700 whitespace-pre-line">{r.message}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          {r.page_path ? (
                            r.page_path.startsWith("/") ? (
                              <Link href={r.page_path} className="text-asu-maroon hover:underline">
                                {r.page_path}
                              </Link>
                            ) : (
                              <span className="text-gray-500">{r.page_path}</span>
                            )
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 whitespace-nowrap">
                          {r.user_email ?? "—"}
                        </td>
                        <td className="px-4 py-3 text-gray-400 whitespace-nowrap">
                          {fmtDate(r.created_at)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}
