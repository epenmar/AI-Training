import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeletePostButton } from "@/components/community/DeletePostButton";
import { CommunityFilters } from "@/components/community/CommunityFilters";
import { getDomain, getEmbedUrl, getOfficeEmbedUrl, isPdf } from "@/lib/embed";

const VALID_BANDS = new Set([
  "New → Foundational",
  "Foundational → Intermediate",
  "Intermediate → Advanced",
]);

type TabKey = "projects" | "questions";

export default async function CommunityPage({
  searchParams,
}: {
  searchParams: Promise<{ skill?: string; band?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const tab: TabKey = params.tab === "questions" ? "questions" : "projects";
  const skillFilter = params.skill ? parseInt(params.skill, 10) : null;
  const bandFilter =
    params.band && VALID_BANDS.has(params.band) ? params.band : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto">
      {/* Section-neutral header */}
      <div className="mb-4">
        <h2 className="text-2xl font-bold text-gray-700">Community</h2>
        <p className="text-gray-500">
          Share what you&apos;re building and ask questions across ASU.
        </p>
      </div>

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Community sections"
        className="flex gap-1 border-b border-gray-200 mb-6"
      >
        <TabLink
          href="/community"
          active={tab === "projects"}
          label="Project Sharing"
        />
        <TabLink
          href="/community?tab=questions"
          active={tab === "questions"}
          label="Ask a Question"
        />
      </div>

      {tab === "projects" ? (
        <ProjectSharing
          userId={user.id}
          skillFilter={skillFilter}
          bandFilter={bandFilter}
        />
      ) : (
        <AskAQuestion />
      )}
    </div>
  );
}

function TabLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={`px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors ${
        active
          ? "border-asu-maroon text-asu-maroon"
          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
      }`}
    >
      {label}
    </Link>
  );
}

function AskAQuestion() {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-10 text-center">
      <div className="w-16 h-16 bg-asu-blue/10 rounded-full flex items-center justify-center mx-auto mb-4">
        <svg
          className="w-8 h-8 text-asu-blue"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      </div>
      <p className="text-gray-700 font-medium mb-1">Coming soon</p>
      <p className="text-gray-500 text-sm max-w-md mx-auto">
        Post a question to the ASU AI community — and, once Slack is connected,
        search past Slack conversations with AI to find answers that already
        exist before asking.
      </p>
    </div>
  );
}

async function ProjectSharing({
  userId,
  skillFilter,
  bandFilter,
}: {
  userId: string;
  skillFilter: number | null;
  bandFilter: string;
}) {
  const supabase = await createClient();

  const [{ data: allPosts }, { data: viewerProfile }] = await Promise.all([
    supabase
      .from("community_posts")
      .select("*")
      .order("created_at", { ascending: false }),
    supabase.from("profiles").select("is_admin").eq("id", userId).single(),
  ]);
  const isAdmin = !!viewerProfile?.is_admin;

  // Activity band lookup for band filtering
  const postActivityIds = Array.from(
    new Set(
      (allPosts ?? [])
        .map((p) => p.activity_id)
        .filter((id): id is number => typeof id === "number")
    )
  );
  const { data: activities } =
    postActivityIds.length > 0
      ? await supabase
          .from("level_up_activities")
          .select("id, band")
          .in("id", postActivityIds)
      : { data: [] };
  const activityBandMap = new Map(
    (activities ?? []).map((a) => [a.id, a.band])
  );

  const posts = (allPosts ?? []).filter((p) => {
    if (
      skillFilter !== null &&
      !Number.isNaN(skillFilter) &&
      p.skill_id !== skillFilter
    ) {
      return false;
    }
    if (bandFilter) {
      if (!p.activity_id) return false;
      if (activityBandMap.get(p.activity_id) !== bandFilter) return false;
    }
    return true;
  });

  const authorIds = Array.from(new Set(posts.map((p) => p.user_id)));
  const { data: profiles } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name, avatar_url, public_contact")
          .in("id", authorIds)
      : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));

  const postIds = posts.map((p) => p.id);
  const { data: commentRows } =
    postIds.length > 0
      ? await supabase
          .from("community_post_comments")
          .select("post_id")
          .in("post_id", postIds)
      : { data: [] };
  const commentCounts = new Map<string, number>();
  for (const row of commentRows ?? []) {
    commentCounts.set(row.post_id, (commentCounts.get(row.post_id) ?? 0) + 1);
  }

  const { data: skills } = await supabase
    .from("skills")
    .select("id, short_name")
    .order("id");
  const skillMap = new Map((skills ?? []).map((s) => [s.id, s]));

  const hasFilters = skillFilter !== null || !!bandFilter;
  const totalCount = allPosts?.length ?? 0;

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3 mb-4">
        <p className="text-sm text-gray-500 max-w-xl">
          Share screenshots, videos, or decks of what you&apos;re building with
          AI. See what peers across ASU are creating.
        </p>
        <Link
          href="/community/new"
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
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
              d="M12 4v16m8-8H4"
            />
          </svg>
          Share something
        </Link>
      </div>

      <CommunityFilters
        skills={skills ?? []}
        activeSkillId={skillFilter !== null ? String(skillFilter) : ""}
        activeBand={bandFilter}
        hasFilters={hasFilters}
      />

      {hasFilters && (
        <p className="text-xs text-gray-500 mb-4">
          Showing {posts.length} of {totalCount} posts
        </p>
      )}

      {posts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {posts.map((post) => {
            const author = profileMap.get(post.user_id);
            const showName = !post.anonymous && author?.display_name;
            const authorName = showName ? author.display_name : "Anonymous";
            const publicContact = showName
              ? author?.public_contact ?? null
              : null;
            const avatarUrl = showName ? author?.avatar_url ?? null : null;
            const avatarInitials = showName
              ? (author.display_name ?? "?")
                  .split(" ")
                  .map((n: string) => n[0])
                  .join("")
                  .toUpperCase()
                  .slice(0, 2)
              : null;
            const skill = post.skill_id ? skillMap.get(post.skill_id) : null;
            const commentCount = commentCounts.get(post.id) ?? 0;
            const isOwnPost = post.user_id === userId;
            const canEdit = isOwnPost || isAdmin;
            const canDelete = isOwnPost || isAdmin;
            return (
              <article
                key={post.id}
                className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
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
                  ) : post.media_type === "audio" ? (
                    <div className="w-full h-full flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-asu-turquoise/10 to-asu-blue/15 px-4">
                      <svg
                        className="w-12 h-12 text-asu-blue"
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
                        preload="none"
                        className="w-full"
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  ) : post.media_type === "link" ? (
                    (() => {
                      const embed = getEmbedUrl(post.media_url);
                      if (embed) {
                        return (
                          <div className="relative w-full h-full bg-white">
                            <iframe
                              src={embed}
                              title=""
                              aria-hidden="true"
                              tabIndex={-1}
                              loading="lazy"
                              className="w-full h-full border-0 pointer-events-none"
                            />
                            <Link
                              href={`/community/${post.id}`}
                              aria-label={`Open ${post.title}`}
                              className="absolute inset-0 hover:bg-black/5 transition-colors"
                            />
                          </div>
                        );
                      }
                      return (
                        <Link
                          href={`/community/${post.id}`}
                          className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-asu-blue/5 to-asu-blue/15 hover:from-asu-blue/10 hover:to-asu-blue/20 transition-colors"
                        >
                          <svg
                            className="w-12 h-12 text-asu-blue"
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
                          <span className="text-xs font-medium text-asu-blue tracking-wide">
                            {getDomain(post.media_url)}
                          </span>
                        </Link>
                      );
                    })()
                  ) : post.media_type === "document" ? (
                    (() => {
                      const officeEmbed = getOfficeEmbedUrl(post.media_url);
                      const embedSrc = officeEmbed
                        ? officeEmbed
                        : isPdf(post.media_url)
                          ? post.media_url
                          : null;
                      if (embedSrc) {
                        return (
                          <div className="relative w-full h-full bg-white">
                            <iframe
                              src={embedSrc}
                              title=""
                              aria-hidden="true"
                              tabIndex={-1}
                              loading="lazy"
                              className="w-full h-full border-0 pointer-events-none"
                            />
                            <Link
                              href={`/community/${post.id}`}
                              aria-label={`Open ${post.title}`}
                              className="absolute inset-0 hover:bg-black/5 transition-colors"
                            />
                          </div>
                        );
                      }
                      return (
                        <Link
                          href={`/community/${post.id}`}
                          className="w-full h-full flex flex-col items-center justify-center gap-2 bg-gradient-to-br from-asu-maroon/5 to-asu-maroon/15 hover:from-asu-maroon/10 hover:to-asu-maroon/20 transition-colors"
                        >
                          <svg
                            className="w-12 h-12 text-asu-maroon"
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
                          <span className="text-xs font-medium text-asu-maroon uppercase tracking-wide">
                            {post.media_url.split(".").pop()?.toUpperCase() ??
                              "FILE"}{" "}
                            · Open
                          </span>
                        </Link>
                      );
                    })()
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
                <div className="relative p-4 flex-1 flex flex-col">
                  {/* Stretched link: whole body area navigates to detail */}
                  <Link
                    href={`/community/${post.id}`}
                    aria-label={`Open ${post.title}`}
                    className="absolute inset-0 z-0 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:ring-inset rounded-b-lg"
                  />
                  <h3 className="relative z-[1] text-base font-semibold text-gray-700 group-hover:text-asu-maroon transition-colors pointer-events-none">
                    {post.title}
                  </h3>
                  {post.description && (
                    <p className="relative z-[1] text-sm text-gray-500 mt-1 line-clamp-3 pointer-events-none">
                      {post.description}
                    </p>
                  )}
                  <div className="relative z-[1] flex items-center flex-wrap gap-2 mt-3 pointer-events-none">
                    {skill && (
                      <span className="text-xs bg-asu-maroon/10 text-asu-maroon px-2 py-0.5 rounded font-medium">
                        {skill.short_name}
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 text-xs text-gray-500 ml-auto">
                      <svg
                        className="w-3.5 h-3.5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                        />
                      </svg>
                      <span>
                        {commentCount}
                        <span className="sr-only">
                          {" "}
                          comment{commentCount === 1 ? "" : "s"}
                        </span>
                      </span>
                    </span>
                  </div>
                  <div className="relative z-10 flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
                    <div className="flex items-center gap-2 min-w-0 flex-1 pointer-events-none">
                      {showName ? (
                        avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={avatarUrl}
                            alt=""
                            className="w-6 h-6 rounded-full object-cover flex-shrink-0"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-asu-maroon text-white flex items-center justify-center text-[10px] font-medium flex-shrink-0">
                            {avatarInitials}
                          </div>
                        )
                      ) : (
                        <div className="w-6 h-6 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0">
                          <svg
                            className="w-3.5 h-3.5"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
                          </svg>
                        </div>
                      )}
                      <div className="text-xs text-gray-400 min-w-0 flex-1">
                        <div className="truncate">
                          {authorName} ·{" "}
                          {new Date(post.created_at).toLocaleDateString(
                            "en-US",
                            { month: "short", day: "numeric" }
                          )}
                        </div>
                        {publicContact && (
                          <div className="truncate text-gray-500">
                            {publicContact}
                          </div>
                        )}
                      </div>
                    </div>
                    {(canEdit || canDelete) && (
                      <div className="flex items-center gap-3 flex-shrink-0 ml-2">
                        {canEdit && (
                          <Link
                            href={`/community/${post.id}/edit`}
                            className="text-xs font-medium text-gray-500 hover:text-asu-maroon"
                          >
                            Edit
                          </Link>
                        )}
                        {canDelete && <DeletePostButton postId={post.id} />}
                      </div>
                    )}
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
            {hasFilters
              ? "No posts match these filters"
              : "No posts yet — be the first!"}
          </p>
          <p className="text-gray-500 text-sm">
            {hasFilters ? (
              <>
                Try clearing the filters, or{" "}
                <Link
                  href="/community"
                  className="text-asu-maroon hover:underline font-medium"
                >
                  see all posts
                </Link>
                .
              </>
            ) : (
              <>
                Use the <span className="font-medium">Share something</span>{" "}
                button above to post a screenshot or short clip of what
                you&apos;ve built with AI.
              </>
            )}
          </p>
        </div>
      )}
    </>
  );
}
