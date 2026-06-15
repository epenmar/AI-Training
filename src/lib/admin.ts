import { createClient } from "@/lib/supabase/server";
import { createAdminClient, hasServiceRole } from "@/lib/supabase/admin";

export type AdminRole = "user" | "commenter" | "editor" | "superadmin";

export type AdminContext = {
  user: { id: string; email?: string } | null;
  role: AdminRole;
  displayName: string | null;
  // Capabilities derived from role.
  canComment: boolean; // commenter+
  canEdit: boolean; // editor+
  canManageUsers: boolean; // superadmin only
  // Legacy alias — "has any admin chrome" (== canComment).
  isAdmin: boolean;
};

function capsFor(role: AdminRole) {
  return {
    canComment: role === "commenter" || role === "editor" || role === "superadmin",
    canEdit: role === "editor" || role === "superadmin",
    canManageUsers: role === "superadmin",
  };
}

// Returns the caller's admin role + capabilities. Robust to the
// profiles.role column not existing yet (migration 022): falls back to
// deriving role from the legacy is_admin boolean. Also claims any
// pending role invite for the user's email on load.
export async function getAdminContext(): Promise<AdminContext> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return {
      user: null,
      role: "user",
      displayName: null,
      canComment: false,
      canEdit: false,
      canManageUsers: false,
      isAdmin: false,
    };
  }

  // Try the role-aware select; if the column is missing, retry without.
  let isAdminFlag = false;
  let displayName: string | null = null;
  let email: string | null = null;
  let role: AdminRole | null = null;
  {
    const withRole = await supabase
      .from("profiles")
      .select("is_admin, display_name, email, role")
      .eq("id", user.id)
      .single();
    if (withRole.error) {
      const legacy = await supabase
        .from("profiles")
        .select("is_admin, display_name, email")
        .eq("id", user.id)
        .single();
      isAdminFlag = !!legacy.data?.is_admin;
      displayName = legacy.data?.display_name ?? null;
      email = legacy.data?.email ?? null;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const d = withRole.data as any;
      isAdminFlag = !!d?.is_admin;
      displayName = d?.display_name ?? null;
      email = d?.email ?? null;
      role = (d?.role as AdminRole) ?? null;
    }
  }

  // Claim a pending invite (only if the role system exists, the user
  // is currently a plain user, and we can write with the service role).
  if (role === "user" && email && hasServiceRole()) {
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const admin = createAdminClient() as any;
      const { data: pending } = await admin
        .from("pending_admin_roles")
        .select("role")
        .eq("email", email.toLowerCase())
        .maybeSingle();
      if (pending?.role) {
        await admin
          .from("profiles")
          .update({ role: pending.role })
          .eq("id", user.id);
        await admin
          .from("pending_admin_roles")
          .delete()
          .eq("email", email.toLowerCase());
        role = pending.role as AdminRole;
      }
    } catch {
      // pending table missing or write blocked — ignore
    }
  }

  // Resolve effective role: explicit column wins; else derive from
  // is_admin (legacy admins become superadmins).
  const effectiveRole: AdminRole =
    role ?? (isAdminFlag ? "superadmin" : "user");
  const caps = capsFor(effectiveRole);

  return {
    user: { id: user.id, email: user.email },
    role: effectiveRole,
    displayName: displayName ?? email ?? user.email ?? null,
    ...caps,
    isAdmin: caps.canComment,
  };
}

// The ONLY content fields admins may edit inline. (table, column)
// pairs not on this list are rejected by the server action. Keep this
// tight — it's the security boundary for what inline edit can touch.
export const EDITABLE_FIELDS: Record<string, Set<string>> = {
  level_up_activities: new Set([
    "title",
    "description",
    "deliverable",
    "value_add",
  ]),
  activity_guide_steps: new Set(["instruction", "detailed_help"]),
  skills: new Set(["short_name", "statement", "derivation_note"]),
  lesson_flow: new Set(["item_title", "source", "specific_location"]),
};

export function isEditableField(table: string, column: string): boolean {
  return EDITABLE_FIELDS[table]?.has(column) ?? false;
}
