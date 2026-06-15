"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext, isEditableField, isArrayField } from "@/lib/admin";
import {
  createAdminClient,
  hasServiceRole,
  NOT_CONFIGURED_MESSAGE,
} from "@/lib/supabase/admin";

// Integer-PK tables (row_id arrives as a string from the client and
// must be cast back to a number for the .eq() filter). Everything
// else is treated as a uuid/text PK.
const INT_PK_TABLES = new Set([
  "level_up_activities",
  "activity_guide_steps",
  "skills",
  "lesson_flow",
]);

type UpdateResult = { success: true } | { error: string };

// Inline content edit. Verifies the caller is an admin, checks the
// (table, column) pair is on the allowlist, writes the new value with
// the service-role client, and best-effort records a revision row.
export async function updateContent(input: {
  table: string;
  rowId: string;
  column: string;
  value: string;
  // Optional path to revalidate after the write.
  revalidate?: string;
}): Promise<UpdateResult> {
  const { table, rowId, column, value } = input;

  const { user, canEdit, displayName } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!canEdit) return { error: "Editing requires editor access" };
  if (!isEditableField(table, column)) {
    return { error: `Field ${table}.${column} is not editable` };
  }
  if (!hasServiceRole()) return { error: NOT_CONFIGURED_MESSAGE };

  // Dynamic table / column names — the typed client can't model these,
  // so use an untyped handle for the generic read/write.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = createAdminClient() as any;
  const admin = db;
  const pk = INT_PK_TABLES.has(table) ? Number(rowId) : rowId;
  if (INT_PK_TABLES.has(table) && Number.isNaN(pk as number)) {
    return { error: "Invalid row id" };
  }

  // Read the old value first (for the revision record).
  const { data: before, error: readErr } = await db
    .from(table)
    .select(column)
    .eq("id", pk)
    .single();
  if (readErr) return { error: readErr.message };
  const oldValue = (before as Record<string, unknown> | null)?.[column] ?? null;

  // Array columns (e.g. objectives) are edited as newline-separated
  // text; split into an array of non-empty trimmed lines before write.
  const isArr = isArrayField(table, column);
  const nextValue: string | string[] = isArr
    ? value
        .split("\n")
        .map((s) => s.trim())
        .filter(Boolean)
    : value;

  // No-op guard (compare serialized for arrays).
  if (JSON.stringify(oldValue) === JSON.stringify(nextValue)) {
    return { success: true };
  }

  const { error: writeErr } = await db
    .from(table)
    .update({ [column]: nextValue })
    .eq("id", pk);
  if (writeErr) return { error: writeErr.message };

  // Best-effort revision log. If the admin_revision_history table
  // hasn't been created yet (migration 020), the edit still succeeds —
  // we just skip logging.
  try {
    await admin.from("admin_revision_history").insert({
      table_name: table,
      row_id: String(rowId),
      column_name: column,
      old_value: oldValue,
      new_value: nextValue,
      changed_by: user.id,
      changed_by_name: displayName,
      change_source: "inline_edit",
    });
  } catch {
    // table missing or insert blocked — ignore, edit already applied
  }

  if (input.revalidate) revalidatePath(input.revalidate);
  return { success: true };
}

// Roll back a single revision: re-write the old value, and log the
// rollback as its own revision (so the trail stays linear and
// non-destructive). Used by the future revisions UI.
export async function rollbackRevision(
  revisionId: string,
  revalidate?: string
): Promise<UpdateResult> {
  const { user, canEdit, displayName } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!canEdit) return { error: "Editing requires editor access" };
  if (!hasServiceRole()) return { error: NOT_CONFIGURED_MESSAGE };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: rev, error: revErr } = await admin
    .from("admin_revision_history")
    .select("*")
    .eq("id", revisionId)
    .single();
  if (revErr || !rev) return { error: "Revision not found" };

  const r = rev as {
    table_name: string;
    row_id: string;
    column_name: string;
    old_value: unknown;
    new_value: unknown;
  };
  if (!isEditableField(r.table_name, r.column_name)) {
    return { error: "That field is no longer editable" };
  }

  const pk = INT_PK_TABLES.has(r.table_name)
    ? Number(r.row_id)
    : r.row_id;

  // Capture current value so the rollback revision is accurate even if
  // the field changed since the revision being undone.
  const { data: cur } = await admin
    .from(r.table_name)
    .select(r.column_name)
    .eq("id", pk)
    .single();
  const currentValue =
    (cur as Record<string, unknown> | null)?.[r.column_name] ?? null;

  const { error: writeErr } = await admin
    .from(r.table_name)
    .update({ [r.column_name]: r.old_value })
    .eq("id", pk);
  if (writeErr) return { error: writeErr.message };

  try {
    await admin.from("admin_revision_history").insert({
      table_name: r.table_name,
      row_id: r.row_id,
      column_name: r.column_name,
      old_value: currentValue,
      new_value: r.old_value,
      changed_by: user.id,
      changed_by_name: displayName,
      change_source: "rollback",
      rolled_back_from: revisionId,
    });
  } catch {
    // ignore
  }

  if (revalidate) revalidatePath(revalidate);
  return { success: true };
}

// ====================================================================
// Admin edit comments (annotations)
// ====================================================================

// Leave a freeform note about any content target — including
// non-editable things (widgets, whole steps, structural rethinks).
export async function addEditComment(input: {
  table: string;
  rowId: string;
  columnName?: string | null;
  contextLabel?: string | null;
  body: string;
  revalidate?: string;
}): Promise<UpdateResult> {
  const { user, canComment, displayName } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!canComment) return { error: "Leaving notes requires commenter access" };
  const body = input.body.trim();
  if (!body) return { error: "Note can't be empty" };
  if (!hasServiceRole()) return { error: NOT_CONFIGURED_MESSAGE };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin.from("admin_edit_comments").insert({
    table_name: input.table,
    row_id: String(input.rowId),
    column_name: input.columnName ?? null,
    context_label: input.contextLabel ?? null,
    body,
    created_by: user.id,
    created_by_name: displayName,
  });
  if (error) {
    // Most likely the table hasn't been created yet (migration 021).
    return {
      error:
        error.message.includes("admin_edit_comments") ||
        error.code === "42P01"
          ? "Editor notes aren't set up yet — apply migration 021 in Supabase."
          : error.message,
    };
  }
  if (input.revalidate) revalidatePath(input.revalidate);
  return { success: true };
}

// Mark a note resolved (it drops off the open list but is retained).
export async function resolveEditComment(
  commentId: string,
  revalidate?: string
): Promise<UpdateResult> {
  const { user, canComment } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!canComment) return { error: "Leaving notes requires commenter access" };
  if (!hasServiceRole()) return { error: NOT_CONFIGURED_MESSAGE };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("admin_edit_comments")
    .update({
      status: "resolved",
      resolved_by: user.id,
      resolved_at: new Date().toISOString(),
    })
    .eq("id", commentId);
  if (error) return { error: error.message };
  if (revalidate) revalidatePath(revalidate);
  return { success: true };
}

// Re-open a resolved note.
export async function reopenEditComment(
  commentId: string,
  revalidate?: string
): Promise<UpdateResult> {
  const { user, canComment } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!canComment) return { error: "Leaving notes requires commenter access" };
  if (!hasServiceRole()) return { error: NOT_CONFIGURED_MESSAGE };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("admin_edit_comments")
    .update({ status: "open", resolved_by: null, resolved_at: null })
    .eq("id", commentId);
  if (error) return { error: error.message };
  if (revalidate) revalidatePath(revalidate);
  return { success: true };
}

// ====================================================================
// User role management (superadmin only)
// ====================================================================

const ASSIGNABLE_ROLES = new Set(["user", "commenter", "editor", "superadmin"]);

// Set an existing user's role by their profile id.
export async function setUserRole(
  userId: string,
  role: string
): Promise<UpdateResult> {
  const { user, canManageUsers } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!canManageUsers) return { error: "Only superadmins can manage users" };
  if (!ASSIGNABLE_ROLES.has(role)) return { error: "Invalid role" };
  if (userId === user.id && role !== "superadmin") {
    return { error: "You can't demote yourself" };
  }
  if (!hasServiceRole()) return { error: NOT_CONFIGURED_MESSAGE };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("profiles")
    .update({ role })
    .eq("id", userId);
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}

// Grant a role to someone by email. If a profile with that email
// exists, set it directly; otherwise store a pending invite that's
// claimed on their first sign-in.
export async function inviteUserRole(input: {
  email: string;
  role: string;
}): Promise<UpdateResult> {
  const { user, canManageUsers, displayName } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!canManageUsers) return { error: "Only superadmins can manage users" };
  const email = input.email.trim().toLowerCase();
  if (!email || !email.includes("@")) return { error: "Enter a valid email" };
  if (!["commenter", "editor", "superadmin"].includes(input.role)) {
    return { error: "Invalid role" };
  }
  if (!hasServiceRole()) return { error: NOT_CONFIGURED_MESSAGE };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { data: existing } = await admin
    .from("profiles")
    .select("id")
    .ilike("email", email)
    .maybeSingle();

  if (existing?.id) {
    const { error } = await admin
      .from("profiles")
      .update({ role: input.role })
      .eq("id", existing.id);
    if (error) return { error: error.message };
    revalidatePath("/admin/users");
    return { success: true };
  }

  // No account yet — store a pending invite.
  const { error } = await admin.from("pending_admin_roles").upsert(
    {
      email,
      role: input.role,
      invited_by: user.id,
      invited_by_name: displayName,
    },
    { onConflict: "email" }
  );
  if (error) {
    return {
      error:
        error.code === "42P01"
          ? "Roles aren't set up yet — apply migration 022 in Supabase."
          : error.message,
    };
  }
  revalidatePath("/admin/users");
  return { success: true };
}

// Cancel a pending invite.
export async function removePendingInvite(
  email: string
): Promise<UpdateResult> {
  const { user, canManageUsers } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!canManageUsers) return { error: "Only superadmins can manage users" };
  if (!hasServiceRole()) return { error: NOT_CONFIGURED_MESSAGE };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const admin = createAdminClient() as any;
  const { error } = await admin
    .from("pending_admin_roles")
    .delete()
    .eq("email", email.toLowerCase());
  if (error) return { error: error.message };
  revalidatePath("/admin/users");
  return { success: true };
}
