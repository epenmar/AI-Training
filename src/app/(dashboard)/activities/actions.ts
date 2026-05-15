"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Save notes AND mark complete in one round trip. Replaces the two-
// step "Mark complete" + "Save notes" flow used by the old panel —
// the new panel's "Save privately" button is the single primary
// action. Idempotent: re-submitting just refreshes the notes.
export async function saveAndComplete(
  activityId: number,
  notes: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  // Upsert by (user_id, activity_id). user_activity_completions has
  // that pair as a uniqueness constraint via the schema, so an upsert
  // either creates the row or refreshes the notes.
  const { error } = await supabase
    .from("user_activity_completions")
    .upsert(
      {
        user_id: user.id,
        activity_id: activityId,
        deliverable_notes: notes || null,
      },
      { onConflict: "user_id,activity_id" }
    );
  if (error) return { error: error.message };

  revalidatePath("/activities");
  revalidatePath(`/activities/${activityId}`);
  return { success: true };
}

export async function toggleCompletion(
  activityId: number,
  currentlyComplete: boolean,
  deliverableNotes?: string
) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (currentlyComplete) {
    const { error } = await supabase
      .from("user_activity_completions")
      .delete()
      .eq("user_id", user.id)
      .eq("activity_id", activityId);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("user_activity_completions")
      .insert({
        user_id: user.id,
        activity_id: activityId,
        deliverable_notes: deliverableNotes ?? null,
      });
    if (error) return { error: error.message };
  }

  revalidatePath("/activities");
  revalidatePath(`/activities/${activityId}`);
  return { success: true };
}

export async function saveNotes(activityId: number, notes: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { error } = await supabase
    .from("user_activity_completions")
    .update({ deliverable_notes: notes })
    .eq("user_id", user.id)
    .eq("activity_id", activityId);
  if (error) return { error: error.message };

  revalidatePath(`/activities/${activityId}`);
  return { success: true };
}
