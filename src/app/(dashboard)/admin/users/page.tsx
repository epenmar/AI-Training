import { redirect } from "next/navigation";
import { getAdminContext } from "@/lib/admin";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";
import { UserRoleSelect } from "@/components/admin/UserRoleSelect";
import {
  InviteUserForm,
  RemovePendingInviteButton,
} from "@/components/admin/InviteUserForm";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  role: string | null;
  is_admin: boolean;
};

type PendingRow = {
  email: string;
  role: string;
  invited_by_name: string | null;
  created_at: string;
};

const ROLE_BADGE: Record<string, string> = {
  superadmin: "bg-violet-200 text-violet-900",
  editor: "bg-asu-blue/15 text-asu-blue",
  commenter: "bg-asu-green/15 text-green-700",
  user: "bg-gray-100 text-gray-500",
};

export default async function AdminUsersPage() {
  const { user, canManageUsers } = await getAdminContext();
  if (!user) redirect("/login");
  if (!canManageUsers) redirect("/");

  if (!hasServiceRole()) {
    return (
      <div className="max-w-3xl mx-auto">
        <h2 className="text-2xl font-bold text-gray-700 mb-2">Admin toolbox</h2>
        <div className="rounded-lg border-2 border-violet-300 bg-violet-50 p-5">
          <p className="text-sm text-gray-700">
            User management isn&apos;t enabled on this deployment — the
            SUPABASE_SERVICE_ROLE_KEY environment variable is missing.
          </p>
        </div>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;

  let profiles: ProfileRow[] = [];
  let pending: PendingRow[] = [];
  let rolesMissing = false;

  const { data: profData, error: profErr } = await admin
    .from("profiles")
    .select("id, email, display_name, role, is_admin")
    .order("role", { ascending: true })
    .order("email", { ascending: true });
  if (profErr) {
    rolesMissing = true;
  } else {
    profiles = (profData ?? []) as ProfileRow[];
  }

  try {
    const { data: pendData } = await admin
      .from("pending_admin_roles")
      .select("email, role, invited_by_name, created_at")
      .order("created_at", { ascending: false });
    pending = (pendData ?? []) as PendingRow[];
  } catch {
    pending = [];
  }

  // Sort: admins (non-user roles) first, then by email.
  const ranked = [...profiles].sort((a, b) => {
    const order = (r: string | null) =>
      r === "superadmin" ? 0 : r === "editor" ? 1 : r === "commenter" ? 2 : 3;
    const d = order(a.role) - order(b.role);
    return d !== 0 ? d : a.email.localeCompare(b.email);
  });

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Admin toolbox</h2>
        <p className="text-gray-500">
          Grant admin access by role. Commenters can leave reviewer notes;
          editors can also edit page text directly; superadmins can do
          everything, including managing users.
        </p>
      </div>

      {rolesMissing && (
        <div className="mb-6 rounded-lg border-2 border-violet-300 bg-violet-50 p-4">
          <p className="text-sm text-gray-700">
            The role system isn&apos;t set up yet. Apply migration{" "}
            <span className="font-mono">022_admin_roles.sql</span> in the
            Supabase dashboard, then this page can manage roles.
          </p>
        </div>
      )}

      <div className="mb-6">
        <InviteUserForm />
      </div>

      {/* Pending invites */}
      {pending.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
            Pending invites
          </h3>
          <ul className="space-y-2">
            {pending.map((p) => (
              <li
                key={p.email}
                className="rounded-lg bg-white border border-dashed border-gray-300 p-3 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-700 truncate">
                    {p.email}
                  </p>
                  <p className="text-[11px] text-gray-400">
                    Will become{" "}
                    <span className="font-semibold">{p.role}</span> on first
                    sign-in
                    {p.invited_by_name ? ` · invited by ${p.invited_by_name}` : ""}
                  </p>
                </div>
                <RemovePendingInviteButton email={p.email} />
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Existing users */}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-2">
        Users ({ranked.length})
      </h3>
      <ul className="space-y-2">
        {ranked.map((p) => {
          const role = p.role ?? (p.is_admin ? "superadmin" : "user");
          return (
            <li
              key={p.id}
              className="rounded-lg bg-white border border-gray-200 p-3 flex items-center justify-between gap-3"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {p.display_name || p.email}
                  <span
                    className={`ml-2 text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      ROLE_BADGE[role] ?? ROLE_BADGE.user
                    }`}
                  >
                    {role}
                  </span>
                </p>
                <p className="text-[11px] text-gray-400 truncate">{p.email}</p>
              </div>
              <UserRoleSelect
                userId={p.id}
                role={role}
                isSelf={p.id === user.id}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
