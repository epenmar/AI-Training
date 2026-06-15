import { createClient } from "@/lib/supabase/server";

// Returns { user, isAdmin }. Used by the layout (to enable edit mode
// UI) and by server actions (to gate writes). Reads is_admin off the
// caller's own profile row through the normal auth'd client.
export async function getAdminContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { user: null, isAdmin: false, displayName: null };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin, display_name, email")
    .eq("id", user.id)
    .single();

  return {
    user,
    isAdmin: !!profile?.is_admin,
    displayName: profile?.display_name ?? profile?.email ?? user.email ?? null,
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
