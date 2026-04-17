"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

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
