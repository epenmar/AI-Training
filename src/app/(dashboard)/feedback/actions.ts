"use server";

import { createClient } from "@/lib/supabase/server";

export type FeedbackKind = "praise" | "problem" | "feature";

const KINDS: FeedbackKind[] = ["praise", "problem", "feature"];

type SubmitInput = {
  kind: FeedbackKind;
  message: string;
  pagePath?: string;
};

// Records a piece of user feedback. Uses the user-scoped client (the
// RLS insert policy enforces user_id = auth.uid()), so it works without
// the service-role key.
export async function submitFeedback(
  input: SubmitInput
): Promise<{ ok: true } | { error: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  if (!KINDS.includes(input.kind)) return { error: "Pick a feedback type" };
  const message = input.message?.trim();
  if (!message) return { error: "Add a short note so we know what you mean" };
  if (message.length > 4000) return { error: "That's a bit long — trim it under 4000 characters" };

  // user_feedback isn't in the generated Database types yet.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("user_feedback").insert({
    user_id: user.id,
    user_email: user.email ?? null,
    kind: input.kind,
    message,
    page_path: input.pagePath?.slice(0, 300) ?? null,
  });
  if (error) {
    if (error.code === "42P01") {
      return { error: "Feedback isn't set up yet — ask an admin to apply migration 024." };
    }
    return { error: "Couldn't send your feedback. Try again in a moment." };
  }
  return { ok: true };
}
