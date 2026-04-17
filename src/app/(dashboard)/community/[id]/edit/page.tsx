import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { EditPostForm } from "@/components/community/EditPostForm";

export default async function EditPostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: post }, { data: viewerProfile }] = await Promise.all([
    supabase
      .from("community_posts")
      .select("id, title, description, skill_id, activity_id, user_id, anonymous")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single(),
  ]);
  if (!post) notFound();

  const canEdit = post.user_id === user.id || !!viewerProfile?.is_admin;
  if (!canEdit) redirect(`/community/${id}`);

  const [{ data: skills }, { data: activities }] = await Promise.all([
    supabase.from("skills").select("id, short_name").order("id"),
    supabase
      .from("level_up_activities")
      .select("id, title, skill_id")
      .order("skill_id"),
  ]);

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={`/community/${id}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-asu-maroon mb-4"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 19l-7-7 7-7"
          />
        </svg>
        Back to post
      </Link>

      <h2 className="text-2xl font-bold text-gray-700 mb-2">Edit post</h2>
      <p className="text-gray-500 mb-6">
        Update the title, description, or tags. The uploaded file stays the
        same.
      </p>

      <EditPostForm
        postId={post.id}
        initialTitle={post.title}
        initialDescription={post.description ?? ""}
        initialSkillId={post.skill_id ? String(post.skill_id) : ""}
        initialActivityId={post.activity_id ? String(post.activity_id) : ""}
        initialAnonymous={post.anonymous ?? false}
        skills={skills ?? []}
        activities={activities ?? []}
      />
    </div>
  );
}
