import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeletePostButton } from "@/components/community/DeletePostButton";

export default async function CommunityPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: posts } = await supabase
    .from("community_posts")
    .select("*")
    .order("created_at", { ascending: false });

  const authorIds = Array.from(new Set((posts ?? []).map((p) => p.user_id)));
  const { data: profiles } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, email")
          .in("id", authorIds)
      : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const { data: skills } = await supabase
    .from("skills")
    .select("id, short_name");
  const skillMap = new Map((skills ?? []).map((s) => [s.id, s]));

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-700">Community Look Book</h2>
          <p className="text-gray-500">
            Share screenshots and videos of what you&apos;re building with AI.
            See what peers across ASU are creating.
          </p>
        </div>
        <Link
          href="/community/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Share something
        </Link>
      </div>

      {posts && posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => {
            const author = profileMap.get(post.user_id);
            const authorName =
              author?.display_name || author?.email?.split("@")[0] || "Anonymous";
            const skill = post.skill_id ? skillMap.get(post.skill_id) : null;
            const isOwner = post.user_id === user.id;
            return (
              <article
                key={post.id}
                className="bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {post.media_type === "video" ? (
                    <video
                      src={post.media_url}
                      controls
                      className="w-full h-full object-cover"
                      preload="metadata"
                    >
                      Your browser does not support video playback.
                    </video>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.media_url}
                      alt={post.title}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  )}
                </div>
                <div className="p-4 flex-1 flex flex-col">
                  <h3 className="text-base font-semibold text-gray-700">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-3">
                      {post.description}
                    </p>
                  )}
                  <div className="flex items-center flex-wrap gap-2 mt-3">
                    {skill && (
                      <span className="text-xs bg-asu-maroon/10 text-asu-maroon px-2 py-0.5 rounded font-medium">
                        {skill.short_name}
                      </span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="text-xs text-gray-400">
                      {authorName} ·{" "}
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </div>
                    {isOwner && <DeletePostButton postId={post.id} />}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
          <div className="w-16 h-16 bg-asu-turquoise/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-asu-turquoise"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
              />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-1">
            No posts yet — be the first!
          </p>
          <p className="text-gray-500 text-sm mb-4">
            Share a screenshot or short clip of what you&apos;ve built with AI.
          </p>
          <Link
            href="/community/new"
            className="inline-block px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
          >
            Share the first post
          </Link>
        </div>
      )}
    </div>
  );
}
