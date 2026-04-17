import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { DeletePostButton } from "@/components/community/DeletePostButton";

const BAND_COLORS: Record<string, string> = {
  "New → Foundational": "bg-asu-blue/10 text-asu-blue",
  "Foundational → Intermediate": "bg-asu-green/10 text-green-700",
  "Intermediate → Advanced": "bg-asu-gold/15 text-yellow-800",
};

export default async function CommunityPostPage({
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

  const { data: post } = await supabase
    .from("community_posts")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (!post) notFound();

  const [
    { data: author },
    { data: skill },
    { data: activity },
    { data: viewerProfile },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, email, avatar_url")
      .eq("id", post.user_id)
      .single(),
    post.skill_id
      ? supabase
          .from("skills")
          .select("id, short_name, statement")
          .eq("id", post.skill_id)
          .single()
      : Promise.resolve({ data: null }),
    post.activity_id
      ? supabase
          .from("level_up_activities")
          .select("id, title, band")
          .eq("id", post.activity_id)
          .single()
      : Promise.resolve({ data: null }),
    supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", user.id)
      .single(),
  ]);

  const authorName =
    author?.display_name || author?.email?.split("@")[0] || "Anonymous";
  const canDelete = post.user_id === user.id || !!viewerProfile?.is_admin;
  const bandClass = activity ? BAND_COLORS[activity.band] : null;
  const fileExt = post.media_url.split(".").pop()?.toUpperCase() ?? "FILE";

  return (
    <div className="max-w-3xl mx-auto">
      <Link
        href="/community"
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
        Back to Look Book
      </Link>

      <article className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        {/* Media */}
        <div className="bg-gray-100">
          {post.media_type === "video" ? (
            <video
              src={post.media_url}
              controls
              className="w-full max-h-[70vh]"
              preload="metadata"
            >
              Your browser does not support video playback.
            </video>
          ) : post.media_type === "audio" ? (
            <div className="flex flex-col items-center justify-center gap-4 py-12 px-6 bg-gradient-to-br from-asu-turquoise/10 to-asu-blue/15">
              <svg
                className="w-16 h-16 text-asu-blue"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 19V6l12-3v13M9 19a3 3 0 11-6 0 3 3 0 016 0zm12-3a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              <audio
                src={post.media_url}
                controls
                preload="metadata"
                className="w-full max-w-lg"
              >
                Your browser does not support audio playback.
              </audio>
            </div>
          ) : post.media_type === "document" ? (
            <a
              href={post.media_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center gap-3 py-16 bg-gradient-to-br from-asu-maroon/5 to-asu-maroon/15 hover:from-asu-maroon/10 hover:to-asu-maroon/20 transition-colors"
            >
              <svg
                className="w-16 h-16 text-asu-maroon"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.5}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              <span className="text-sm font-semibold text-asu-maroon uppercase tracking-wide">
                {fileExt} · Open document
              </span>
            </a>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={post.media_url}
              alt={post.title}
              className="w-full max-h-[70vh] object-contain"
            />
          )}
        </div>

        <div className="p-6">
          <h2 className="text-2xl font-bold text-gray-700">{post.title}</h2>

          {/* Tags */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            {skill && (
              <Link
                href={`/community?skill=${skill.id}`}
                className="text-xs bg-asu-maroon/10 text-asu-maroon px-2.5 py-1 rounded-full font-medium hover:bg-asu-maroon/20"
              >
                Skill {skill.id}: {skill.short_name}
              </Link>
            )}
            {activity && bandClass && (
              <Link
                href={`/community?band=${encodeURIComponent(activity.band)}`}
                className={`text-xs px-2.5 py-1 rounded-full font-medium hover:opacity-80 ${bandClass}`}
              >
                {activity.band}
              </Link>
            )}
            {activity && (
              <Link
                href={`/activities/${activity.id}`}
                className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full font-medium hover:bg-gray-200"
              >
                Activity: {activity.title}
              </Link>
            )}
          </div>

          {post.description && (
            <p className="text-sm text-gray-700 mt-5 whitespace-pre-line leading-relaxed">
              {post.description}
            </p>
          )}

          {/* Footer */}
          <div className="flex items-center justify-between mt-6 pt-4 border-t border-gray-100">
            <div className="text-xs text-gray-500">
              Shared by <span className="font-medium text-gray-700">{authorName}</span>{" "}
              on{" "}
              {new Date(post.created_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </div>
            {canDelete && <DeletePostButton postId={post.id} />}
          </div>
        </div>
      </article>
    </div>
  );
}
