"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const MAX_AVATAR_BYTES = 5 * 1024 * 1024;
const ALLOWED_MIME = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

export async function saveProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const displayName = formData.get("display_name")?.toString().trim() ?? "";
  if (!displayName) return { error: "Please enter a name." };
  if (displayName.length > 80) return { error: "Name is too long." };

  const file = formData.get("avatar") as File | null;
  let newAvatarUrl: string | null = null;

  if (file && file.size > 0) {
    if (file.size > MAX_AVATAR_BYTES) {
      return { error: "Image must be under 5MB." };
    }
    if (!ALLOWED_MIME.has(file.type)) {
      return { error: "Use a PNG, JPEG, WEBP, or GIF image." };
    }

    const ext = file.name.split(".").pop()?.toLowerCase() ?? "png";
    const path = `${user.id}/avatar-${Date.now()}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("avatars")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` };

    const {
      data: { publicUrl },
    } = supabase.storage.from("avatars").getPublicUrl(path);
    newAvatarUrl = publicUrl;

    // Delete old avatar files under this user's folder (keep the new one only)
    const { data: existing } = await supabase.storage
      .from("avatars")
      .list(user.id);
    const toRemove = (existing ?? [])
      .map((f) => `${user.id}/${f.name}`)
      .filter((p) => p !== path);
    if (toRemove.length > 0) {
      await supabase.storage.from("avatars").remove(toRemove);
    }
  }

  const patch: { display_name: string; avatar_url?: string } = {
    display_name: displayName,
  };
  if (newAvatarUrl) patch.avatar_url = newAvatarUrl;

  const { error } = await supabase
    .from("profiles")
    .update(patch)
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}

export async function removeAvatar() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: existing } = await supabase.storage
    .from("avatars")
    .list(user.id);
  const paths = (existing ?? []).map((f) => `${user.id}/${f.name}`);
  if (paths.length > 0) {
    await supabase.storage.from("avatars").remove(paths);
  }

  const { error } = await supabase
    .from("profiles")
    .update({ avatar_url: null })
    .eq("id", user.id);
  if (error) return { error: error.message };

  revalidatePath("/", "layout");
  return { success: true };
}
