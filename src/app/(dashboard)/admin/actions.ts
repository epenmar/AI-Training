"use server";

import { revalidatePath } from "next/cache";
import { getAdminContext, isEditableField } from "@/lib/admin";
import { createAdminClient } from "@/lib/supabase/admin";

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

  const { user, isAdmin, displayName } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!isAdmin) return { error: "Admins only" };
  if (!isEditableField(table, column)) {
    return { error: `Field ${table}.${column} is not editable` };
  }

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

  // No-op guard.
  if (oldValue === value) return { success: true };

  const { error: writeErr } = await db
    .from(table)
    .update({ [column]: value })
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
      new_value: value,
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
  const { user, isAdmin, displayName } = await getAdminContext();
  if (!user) return { error: "Not signed in" };
  if (!isAdmin) return { error: "Admins only" };

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
