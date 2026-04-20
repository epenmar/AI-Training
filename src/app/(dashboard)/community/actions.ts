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
  if (!post) return { error: "Post not found" };

  if (post.user_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) return { error: "Not allowed" };
  }

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

type CreatePostInput = {
  title: string;
  description: string | null;
  mediaPath: string;
  mediaType: "image" | "video" | "audio" | "document";
  skillId: number | null;
  activityId: number | null;
  anonymous: boolean;
};

export async function createPost(input: CreatePostInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const title = input.title?.trim();
  if (!title || !input.mediaPath) {
    return { error: "Title and media are required" };
  }

  // Enforce that the path belongs to the authenticated user (matches the
  // storage RLS policy). Defends against a tampered client request.
  const pathPrefix = input.mediaPath.split("/")[0];
  if (pathPrefix !== user.id) {
    return { error: "Invalid media path" };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("community-media").getPublicUrl(input.mediaPath);

  const { error: insertErr } = await supabase.from("community_posts").insert({
    user_id: user.id,
    title,
    description: input.description,
    media_url: publicUrl,
    media_type: input.mediaType,
    skill_id: input.skillId,
    activity_id: input.activityId,
    anonymous: input.anonymous,
  });
  if (insertErr) {
    await supabase.storage.from("community-media").remove([input.mediaPath]);
    return { error: insertErr.message };
  }

  revalidatePath("/community");
  redirect("/community");
}

type CreateLinkPostInput = {
  title: string;
  description: string | null;
  url: string;
  skillId: number | null;
  activityId: number | null;
  anonymous: boolean;
};

export async function createLinkPost(input: CreateLinkPostInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const title = input.title?.trim();
  if (!title) return { error: "Title is required" };

  const raw = input.url?.trim();
  if (!raw) return { error: "Paste a link to share" };

  let parsed: URL;
  try {
    parsed = new URL(raw);
  } catch {
    return { error: "That doesn't look like a valid URL" };
  }
  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    return { error: "Only http and https links are supported" };
  }

  const { error } = await supabase.from("community_posts").insert({
    user_id: user.id,
    title,
    description: input.description,
    media_url: parsed.toString(),
    media_type: "link",
    skill_id: input.skillId,
    activity_id: input.activityId,
    anonymous: input.anonymous,
  });
  if (error) return { error: error.message };

  revalidatePath("/community");
  redirect("/community");
}

type UpdatePostInput = {
  postId: string;
  title: string;
  description: string | null;
  skillId: number | null;
  activityId: number | null;
  anonymous: boolean;
};

export async function updatePost(input: UpdatePostInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const title = input.title?.trim();
  if (!title) return { error: "Title is required" };

  const { data: post } = await supabase
    .from("community_posts")
    .select("user_id")
    .eq("id", input.postId)
    .single();
  if (!post) return { error: "Post not found" };

  if (post.user_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) return { error: "Not allowed" };
  }

  const { error } = await supabase
    .from("community_posts")
    .update({
      title,
      description: input.description,
      skill_id: input.skillId,
      activity_id: input.activityId,
      anonymous: input.anonymous,
    })
    .eq("id", input.postId);
  if (error) return { error: error.message };

  revalidatePath("/community");
  revalidatePath(`/community/${input.postId}`);
  redirect(`/community/${input.postId}`);
}

type AddCommentInput = {
  postId: string;
  body: string;
  anonymous: boolean;
  parentCommentId: string | null;
};

export async function addComment(input: AddCommentInput) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const body = input.body?.trim();
  if (!body) return { error: "Say something first" };
  if (body.length > 2000) return { error: "Keep it under 2000 characters" };

  if (input.parentCommentId) {
    const { data: parent } = await supabase
      .from("community_post_comments")
      .select("id, post_id, parent_comment_id")
      .eq("id", input.parentCommentId)
      .single();
    if (!parent) return { error: "Parent comment not found" };
    if (parent.post_id !== input.postId) return { error: "Invalid parent" };
    if (parent.parent_comment_id) {
      return { error: "Replies can only be one level deep" };
    }
  }

  const { error } = await supabase.from("community_post_comments").insert({
    post_id: input.postId,
    user_id: user.id,
    parent_comment_id: input.parentCommentId,
    body,
    anonymous: input.anonymous,
  });
  if (error) return { error: error.message };

  revalidatePath(`/community/${input.postId}`);
  revalidatePath("/community");
  return { success: true };
}

export async function deleteComment(commentId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in" };

  const { data: comment } = await supabase
    .from("community_post_comments")
    .select("id, post_id, user_id")
    .eq("id", commentId)
    .single();
  if (!comment) return { error: "Comment not found" };

  if (comment.user_id !== user.id) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single();
    if (!profile?.is_admin) return { error: "Not allowed" };
  }

  const { error } = await supabase
    .from("community_post_comments")
    .delete()
    .eq("id", commentId);
  if (error) return { error: error.message };

  revalidatePath(`/community/${comment.post_id}`);
  revalidatePath("/community");
  return { success: true };
}
