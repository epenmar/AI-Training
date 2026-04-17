"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function deletePost(postId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: post } = await supabase
    .from("community_posts")
    .select("media_url, user_id")
    .eq("id", postId)
    .single();
  if (!post || post.user_id !== user.id) return { error: "Not allowed" };

  // Strip the public URL prefix to get the storage path
  const match = post.media_url.match(/community-media\/(.+)$/);
  if (match) {
    await supabase.storage.from("community-media").remove([match[1]]);
  }

  const { error } = await supabase
    .from("community_posts")
    .delete()
    .eq("id", postId);
  if (error) return { error: error.message };

  revalidatePath("/community");
  return { success: true };
}

export async function createPost(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const title = formData.get("title")?.toString().trim();
  const description = formData.get("description")?.toString().trim() || null;
  const skillIdRaw = formData.get("skill_id")?.toString();
  const activityIdRaw = formData.get("activity_id")?.toString();
  const file = formData.get("media") as File | null;

  if (!title || !file || file.size === 0) {
    return { error: "Title and media file are required" };
  }

  const isVideo = file.type.startsWith("video/");
  const ext = file.name.split(".").pop() ?? "bin";
  const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const { error: uploadErr } = await supabase.storage
    .from("community-media")
    .upload(path, file, {
      contentType: file.type,
      upsert: false,
    });
  if (uploadErr) return { error: `Upload failed: ${uploadErr.message}` };

  const {
    data: { publicUrl },
  } = supabase.storage.from("community-media").getPublicUrl(path);

  const { error: insertErr } = await supabase.from("community_posts").insert({
    user_id: user.id,
    title,
    description,
    media_url: publicUrl,
    media_type: isVideo ? "video" : "image",
    skill_id: skillIdRaw ? parseInt(skillIdRaw, 10) : null,
    activity_id: activityIdRaw ? parseInt(activityIdRaw, 10) : null,
  });
  if (insertErr) {
    await supabase.storage.from("community-media").remove([path]);
    return { error: insertErr.message };
  }

  revalidatePath("/community");
  redirect("/community");
}
