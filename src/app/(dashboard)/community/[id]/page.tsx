import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { DeletePostButton } from "@/components/community/DeletePostButton";
import {
  CommentSection,
  type CommentAuthor,
} from "@/components/community/CommentSection";
import {
  getDomain,
  getEmbedUrl,
  getOfficeEmbedUrl,
  isPdf,
} from "@/lib/embed";

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
    { data: commentsData },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("display_name, avatar_url, public_contact")
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
    supabase
      .from("community_post_comments")
      .select("id, user_id, parent_comment_id, body, anonymous, created_at")
      .eq("post_id", id)
      .order("created_at", { ascending: true }),
  ]);

  const comments = commentsData ?? [];
  const commenterIds = Array.from(new Set(comments.map((c) => c.user_id)));
  const { data: commenterProfiles } =
    commenterIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", commenterIds)
      : { data: [] };
  const commentAuthors: Record<string, CommentAuthor> = {};
  for (const p of commenterProfiles ?? []) {
    commentAuthors[p.id] = {
      id: p.id,
      display_name: p.display_name,
      avatar_url: p.avatar_url,
    };
  }

  const showName = !post.anonymous && author?.display_name;
  const authorName = showName ? author.display_name : "Anonymous";
  const publicContact = showName ? author?.public_contact ?? null : null;
  const avatarUrl = showName ? author?.avatar_url ?? null : null;
  const avatarInitials = showName
    ? (author.display_name ?? "?")
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : null;
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
          ) : post.media_type === "link" ? (
            (() => {
              const embed = getEmbedUrl(post.media_url);
              if (embed) {
                return (
                  <iframe
                    src={embed}
                    title={post.title}
                    className="w-full aspect-video border-0"
                    loading="lazy"
                    allow="fullscreen"
                  />
                );
              }
              return (
                <a
                  href={post.media_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col items-center justify-center gap-3 py-16 bg-gradient-to-br from-asu-blue/5 to-asu-blue/15 hover:from-asu-blue/10 hover:to-asu-blue/20 transition-colors"
                >
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
                      d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
                    />
                  </svg>
                  <span className="text-sm font-semibold text-asu-blue">
                    {getDomain(post.media_url)} · Open link
                  </span>
                </a>
              );
            })()
          ) : post.media_type === "document" ? (
            (() => {
              const officeEmbed = getOfficeEmbedUrl(post.media_url);
              if (officeEmbed) {
                return (
                  <iframe
                    src={officeEmbed}
                    title={post.title}
                    className="w-full aspect-video border-0"
                    loading="lazy"
                    allow="fullscreen"
                  />
                );
              }
              if (isPdf(post.media_url)) {
                return (
                  <iframe
                    src={post.media_url}
                    title={post.title}
                    className="w-full h-[75vh] border-0"
                    loading="lazy"
                  />
                );
              }
              return (
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
              );
            })()
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
          <div className="flex items-start justify-between gap-4 mt-6 pt-4 border-t border-gray-100">
            <div className="flex items-start gap-3 min-w-0">
              {showName ? (
                avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={avatarUrl}
                    alt=""
                    className="w-9 h-9 rounded-full object-cover flex-shrink-0"
                  />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-asu-maroon text-white flex items-center justify-center text-xs font-medium flex-shrink-0">
                    {avatarInitials}
                  </div>
                )
              ) : (
                <div className="w-9 h-9 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-5 h-5"
                    fill="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                  </svg>
                </div>
              )}
              <div className="text-xs text-gray-500 min-w-0">
                <div>
                  Shared by{" "}
                  <span className="font-medium text-gray-700">
                    {authorName}
                  </span>{" "}
                  on{" "}
                  {new Date(post.created_at).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </div>
                {publicContact && (
                  <div className="mt-1 text-gray-600">
                    Contact:{" "}
                    <span className="font-medium text-gray-700">
                      {publicContact}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {canDelete && (
              <div className="flex items-center gap-4">
                <Link
                  href={`/community/${post.id}/edit`}
                  className="text-xs text-gray-500 hover:text-asu-maroon"
                >
                  Edit
                </Link>
                <DeletePostButton postId={post.id} />
              </div>
            )}
          </div>
        </div>
      </article>

      <CommentSection
        postId={post.id}
        comments={comments}
        authors={commentAuthors}
        currentUserId={user.id}
        isAdmin={!!viewerProfile?.is_admin}
      />
    </div>
  );
}
