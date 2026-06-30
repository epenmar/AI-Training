import { redirect } from "next/navigation";
import Link from "next/link";
import { getAdminContext } from "@/lib/admin";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import {
  CollaborationPanel,
  type CollabComment,
} from "@/components/admin/CollaborationPanel";

type NoteRow = {
  id: string;
  table_name: string;
  row_id: string;
  column_name: string | null;
  context_label: string | null;
  body: string;
  status: string;
  assigned_to: string | null;
  created_by_name: string | null;
  created_at: string;
};

type FeedbackRow = {
  id: string;
  user_email: string | null;
  kind: "praise" | "problem" | "feature";
  message: string;
  page_path: string | null;
  status: string;
  assigned_to: string | null;
  created_at: string;
};

type Admin = { id: string; name: string };
type CollabInfo = { voteCount: number; hasVoted: boolean; comments: CollabComment[] };
type TabKey = "notes" | "feedback";

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function noteLink(
  n: NoteRow,
  stepToActivity: Map<string, number>,
  activityTitles: Map<number, string>
): { href: string | null; where: string } {
  if (n.table_name === "level_up_activities") {
    const aid = Number(n.row_id);
    return { href: `/activities/${aid}`, where: activityTitles.get(aid) ?? `Activity ${aid}` };
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

// Batch-load votes + discussion for a set of items.
async function loadCollab(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  itemType: "note" | "feedback",
  ids: string[],
  currentUserId: string
): Promise<Map<string, CollabInfo>> {
  const map = new Map<string, CollabInfo>();
  for (const id of ids) map.set(id, { voteCount: 0, hasVoted: false, comments: [] });
  if (ids.length === 0) return map;
  const [{ data: votes }, { data: comments }] = await Promise.all([
    db
      .from("admin_collab_votes")
      .select("item_id, user_id")
      .eq("item_type", itemType)
      .in("item_id", ids),
    db
      .from("admin_collab_comments")
      .select("id, item_id, author_name, body, created_at")
      .eq("item_type", itemType)
      .in("item_id", ids)
      .order("created_at", { ascending: true }),
  ]);
  for (const v of votes ?? []) {
    const e = map.get(v.item_id);
    if (e) {
      e.voteCount++;
      if (v.user_id === currentUserId) e.hasVoted = true;
    }
  }
  for (const c of comments ?? []) {
    const e = map.get(c.item_id);
    if (e) e.comments.push(c as CollabComment);
  }
  return map;
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

  // Admins (for the assignee dropdown) — service-role read.
  let admins: Admin[] = [];
  if (hasServiceRole()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const db = createAdminClient() as any;
    const { data } = await db
      .from("profiles")
      .select("id, display_name, email")
      .eq("is_admin", true);
    admins = (data ?? []).map(
      (p: { id: string; display_name: string | null; email: string | null }) => ({
        id: p.id,
        name: p.display_name ?? p.email ?? "Admin",
      })
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-700">Admin dashboard</h2>
        <p className="text-gray-500">
          Reviewer notes left across the site, and feedback users send from the
          account menu. Assign, upvote, set status, and discuss inline.
        </p>
      </div>

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
            tab === "notes" ? "bg-white text-asu-maroon shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Reviewer notes
        </Link>
        <Link
          href="/admin/comments?tab=feedback"
          role="tab"
          aria-selected={tab === "feedback"}
          className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
            tab === "feedback" ? "bg-white text-asu-maroon shadow-sm" : "text-gray-500 hover:text-gray-700"
          }`}
        >
          User feedback
        </Link>
      </div>

      {tab === "notes" ? (
        <NotesTab showResolved={showResolved} admins={admins} currentUserId={user.id} />
      ) : (
        <FeedbackTab admins={admins} currentUserId={user.id} />
      )}
    </div>
  );
}

// ============================ Reviewer notes ============================
async function NotesTab({
  showResolved,
  admins,
  currentUserId,
}: {
  showResolved: boolean;
  admins: Admin[];
  currentUserId: string;
}) {
  let notes: NoteRow[] = [];
  let tableMissing = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let admin: any = null;
  if (!hasServiceRole()) tableMissing = true;
  try {
    admin = hasServiceRole() ? (createAdminClient() as unknown) : null;
    let q = admin.from("admin_edit_comments").select("*").order("created_at", { ascending: false });
    // "Open" shows anything not yet resolved (incl. in_progress).
    q = showResolved ? q.eq("status", "resolved") : q.neq("status", "resolved");
    const { data, error } = await q;
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

  const collab = admin
    ? await loadCollab(admin, "note", notes.map((n) => n.id), currentUserId)
    : new Map<string, CollabInfo>();

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
            Reviewer notes aren&apos;t set up yet. Apply migrations{" "}
            <span className="font-mono">021</span> and{" "}
            <span className="font-mono">025</span> in the Supabase dashboard, then
            notes you add on activity pages will show up here.
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
            const c = collab.get(n.id) ?? { voteCount: 0, hasVoted: false, comments: [] };
            return (
              <li key={n.id} className="rounded-lg bg-white border border-gray-200 p-4">
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
                <CollaborationPanel
                  itemType="note"
                  itemId={n.id}
                  status={n.status}
                  assignedTo={n.assigned_to}
                  voteCount={c.voteCount}
                  hasVoted={c.hasVoted}
                  comments={c.comments}
                  admins={admins}
                />
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
  accent: string;
}[] = [
  { kind: "praise", title: "What people like", blurb: "Keep doing these.", accent: "text-green-700" },
  { kind: "problem", title: "Problems, bugs & outdated", blurb: "Triage these.", accent: "text-red-700" },
  { kind: "feature", title: "Feature requests", blurb: "Ideas to consider.", accent: "text-asu-blue" },
];

async function FeedbackTab({
  admins,
  currentUserId,
}: {
  admins: Admin[];
  currentUserId: string;
}) {
  let rows: FeedbackRow[] = [];
  let missing = false;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let db: any = null;
  if (!hasServiceRole()) missing = true;
  try {
    db = hasServiceRole() ? (createAdminClient() as unknown) : null;
    const { data, error } = await db
      .from("user_feedback")
      .select("id, user_email, kind, message, page_path, status, assigned_to, created_at")
      .order("created_at", { ascending: false });
    if (error) missing = true;
    else rows = (data ?? []) as FeedbackRow[];
  } catch {
    missing = true;
  }

  if (missing) {
    return (
      <div className="rounded-lg border-2 border-asu-gold/50 bg-asu-gold/5 p-5">
        <p className="text-sm text-gray-700">
          User feedback isn&apos;t set up yet. Apply migrations{" "}
          <span className="font-mono">024</span> and{" "}
          <span className="font-mono">025</span> in the Supabase dashboard, then
          feedback sent from the account menu shows up here.
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

  const collab = await loadCollab(db, "feedback", rows.map((r) => r.id), currentUserId);

  return (
    <div className="space-y-7">
      {FEEDBACK_GROUPS.map((g) => {
        const items = rows.filter((r) => r.kind === g.kind);
        return (
          <section key={g.kind}>
            <div className="flex items-baseline justify-between mb-2">
              <h3 className={`text-sm font-bold ${g.accent}`}>
                {g.title} <span className="text-gray-400 font-medium">({items.length})</span>
              </h3>
              <p className="text-xs text-gray-400">{g.blurb}</p>
            </div>
            {items.length === 0 ? (
              <p className="text-sm text-gray-400 italic px-1">Nothing here yet.</p>
            ) : (
              <ul className="space-y-2">
                {items.map((r) => {
                  const c = collab.get(r.id) ?? { voteCount: 0, hasVoted: false, comments: [] };
                  return (
                    <li key={r.id} className="rounded-lg bg-white border border-gray-200 p-4">
                      <p className="text-sm text-gray-700 whitespace-pre-line">{r.message}</p>
                      <p className="text-[11px] text-gray-400 mt-1.5">
                        {r.user_email ?? "Unknown"} · {fmtDate(r.created_at)}
                        {r.page_path && (
                          <>
                            {" · "}
                            {r.page_path.startsWith("/") ? (
                              <Link href={r.page_path} className="text-asu-maroon hover:underline">
                                {r.page_path}
                              </Link>
                            ) : (
                              <span>{r.page_path}</span>
                            )}
                          </>
                        )}
                      </p>
                      <CollaborationPanel
                        itemType="feedback"
                        itemId={r.id}
                        status={r.status}
                        assignedTo={r.assigned_to}
                        voteCount={c.voteCount}
                        hasVoted={c.hasVoted}
                        comments={c.comments}
                        admins={admins}
                      />
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </div>
  );
}
