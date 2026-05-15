import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { DeletePostButton } from "@/components/community/DeletePostButton";
import { CommunityFilters } from "@/components/community/CommunityFilters";
import { AskQuestionForm } from "@/components/community/AskQuestionForm";
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
  searchParams: Promise<{
    skill?: string;
    band?: string;
    tab?: string;
    q?: string;
    sort?: string;
    // Deliverable-panel handoff: activity ID + prefill=1 tells the
    // discussion form to load deliverable-prefill-discussion-{id}
    // from localStorage on mount.
    activity?: string;
    prefill?: string;
  }>;
}) {
  const params = await searchParams;
  const tab: TabKey = params.tab === "questions" ? "questions" : "projects";
  const skillFilter = params.skill ? parseInt(params.skill, 10) : null;
  const bandFilter =
    params.band && VALID_BANDS.has(params.band) ? params.band : "";
  const search = (params.q ?? "").trim();
  const sort: "top" | "latest" = params.sort === "latest" ? "latest" : "top";
  const discussionPrefillKey =
    params.prefill === "1" && params.activity
      ? `deliverable-prefill-discussion-${params.activity}`
      : undefined;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-5">
        <h2 className="text-2xl font-bold text-gray-700">Community</h2>
        <p className="text-gray-500">
          Share what you&apos;re building and ask questions across ASU.
        </p>
      </div>

      <Tabs active={tab} />

      {tab === "projects" ? (
        <ProjectSharing
          userId={user.id}
          skillFilter={skillFilter}
          bandFilter={bandFilter}
        />
      ) : (
        <AskTab
          userId={user.id}
          search={search}
          sort={sort}
          discussionPrefillKey={discussionPrefillKey}
        />
      )}
    </div>
  );
}

function Tabs({ active }: { active: TabKey }) {
  return (
    <div
      role="tablist"
      aria-label="Community sections"
      className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6"
    >
      <TabButton
        href="/community"
        active={active === "projects"}
        label="Project Sharing"
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        }
      />
      <TabButton
        href="/community?tab=questions"
        active={active === "questions"}
        label="Discussion"
        icon={
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        }
      />
    </div>
  );
}

function SortLink({
  current,
  value,
  search,
  label,
}: {
  current: "top" | "latest";
  value: "top" | "latest";
  search: string;
  label: string;
}) {
  const params = new URLSearchParams({ tab: "questions" });
  if (value !== "top") params.set("sort", value);
  if (search) params.set("q", search);
  const href = `/community?${params.toString()}`;
  const active = current === value;
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={`px-3 py-1 text-xs font-semibold rounded transition-colors ${
        active
          ? "bg-white text-asu-maroon shadow-sm"
          : "text-gray-500 hover:text-gray-700"
      }`}
    >
      {label}
    </Link>
  );
}

function TabButton({
  href,
  active,
  label,
  icon,
}: {
  href: string;
  active: boolean;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      role="tab"
      aria-selected={active}
      className={`inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
        active
          ? "bg-asu-maroon text-white shadow-sm"
          : "text-gray-600 hover:text-asu-maroon hover:bg-white"
      }`}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        {icon}
      </svg>
      {label}
    </Link>
  );
}

async function AskTab({
  userId,
  search,
  sort,
  discussionPrefillKey,
}: {
  userId: string;
  search: string;
  sort: "top" | "latest";
  discussionPrefillKey?: string;
}) {
  const supabase = await createClient();

  let questionQuery = supabase
    .from("community_posts")
    .select(
      "id, user_id, title, description, skill_id, anonymous, created_at"
    )
    .eq("post_type", "question");
  if (search) {
    // Postgres ilike via Supabase. Search both title and description.
    const escaped = search.replace(/[%_]/g, (c) => `\\${c}`);
    questionQuery = questionQuery.or(
      `title.ilike.%${escaped}%,description.ilike.%${escaped}%`
    );
  }
  // We always pull newest-first from the DB; if sort=top we re-order in JS
  // by comment count after we count them.
  questionQuery = questionQuery.order("created_at", { ascending: false });

  const [
    { data: questions },
    { data: viewerProfile },
    { data: skills },
  ] = await Promise.all([
    questionQuery,
    supabase.from("profiles").select("is_admin").eq("id", userId).single(),
    supabase
      .from("skills")
      .select("id, short_name, display_order")
      .eq("is_active", true)
      .order("display_order", { nullsFirst: false }),
  ]);
  const isAdmin = !!viewerProfile?.is_admin;

  const authorIds = Array.from(
    new Set((questions ?? []).map((q) => q.user_id))
  );
  const { data: profiles } =
    authorIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", authorIds)
      : { data: [] };
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p]));
  const skillMap = new Map((skills ?? []).map((s) => [s.id, s]));

  const questionIds = (questions ?? []).map((q) => q.id);
  const { data: commentRows } =
    questionIds.length > 0
      ? await supabase
          .from("community_post_comments")
          .select("post_id")
          .in("post_id", questionIds)
      : { data: [] };
  const commentCounts = new Map<string, number>();
  for (const row of commentRows ?? []) {
    commentCounts.set(row.post_id, (commentCounts.get(row.post_id) ?? 0) + 1);
  }

  // Reddit-style "top" sort: most-discussed first, recency as tiebreaker.
  const sortedQuestions =
    sort === "top"
      ? [...(questions ?? [])].sort((a, b) => {
          const ca = commentCounts.get(a.id) ?? 0;
          const cb = commentCounts.get(b.id) ?? 0;
          if (cb !== ca) return cb - ca;
          return (
            new Date(b.created_at).getTime() -
            new Date(a.created_at).getTime()
          );
        })
      : (questions ?? []);

  return (
    <div className="space-y-5">
      <p className="text-sm text-gray-500">
        Ask a question, post an observation, or search what others have
        already shared.
      </p>

      {/* Ask AI callout: future search-your-activities feature */}
      <aside
        aria-label="Ask AI tip"
        className="rounded-lg border border-asu-blue/30 bg-asu-blue/5 p-4 flex items-start gap-3"
      >
        <span
          aria-hidden="true"
          className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-md bg-asu-blue text-white"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
        </span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-700">
            Looking for something you did before?
          </p>
          <p className="text-xs text-gray-600 mt-0.5 leading-relaxed">
            The <span className="font-semibold text-asu-blue">Ask AI</span>{" "}
            assistant can search your activities by description. &ldquo;Where
            did I write that disclosure statement?&rdquo; or &ldquo;Which
            activity had the citation tracker?&rdquo; — let it surface the
            step you&apos;re trying to find.
          </p>
        </div>
      </aside>

      {/* Search */}
      <form
        method="GET"
        action="/community"
        role="search"
        className="flex items-center gap-2"
      >
        <input type="hidden" name="tab" value="questions" />
        <label htmlFor="discussion-search" className="sr-only">
          Search discussion
        </label>
        <div className="relative flex-1">
          <span
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            aria-hidden="true"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
          </span>
          <input
            id="discussion-search"
            name="q"
            type="search"
            defaultValue={search}
            placeholder="Search discussion (questions, observations, replies)..."
            className="w-full pl-9 pr-3 py-2 text-sm bg-white border border-gray-300 rounded-lg focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
          />
        </div>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-semibold rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover cursor-pointer"
        >
          Search
        </button>
        {search && (
          <Link
            href="/community?tab=questions"
            className="text-xs text-gray-500 hover:text-asu-maroon"
          >
            Clear
          </Link>
        )}
      </form>

      {search && (
        <p className="text-xs text-gray-500">
          {sortedQuestions.length}{" "}
          {sortedQuestions.length === 1 ? "result" : "results"} for
          &ldquo;{search}&rdquo;
        </p>
      )}

      {/* Sort toggle */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">
          Sort
        </span>
        <div
          role="tablist"
          aria-label="Sort discussions"
          className="inline-flex items-center gap-0.5 p-0.5 bg-gray-100 rounded-md"
        >
          <SortLink current={sort} value="top" search={search} label="Top" />
          <SortLink
            current={sort}
            value="latest"
            search={search}
            label="Latest"
          />
        </div>
      </div>

      <div id="new-post" className="scroll-mt-24">
        <AskQuestionForm
          skills={skills ?? []}
          prefillKey={discussionPrefillKey}
        />
      </div>

      {sortedQuestions.length > 0 ? (
        <ul className="space-y-3">
          {sortedQuestions.map((q) => {
            const author = profileMap.get(q.user_id);
            const showName = !q.anonymous && author?.display_name;
            const authorName = showName ? author.display_name : "Anonymous";
            const skill = q.skill_id ? skillMap.get(q.skill_id) : null;
            const commentCount = commentCounts.get(q.id) ?? 0;
            const canDelete = q.user_id === userId || isAdmin;
            return (
              <li key={q.id}>
                <article className="group bg-white border border-gray-200 rounded-lg p-4 hover:border-asu-blue/40 hover:shadow-sm transition-all relative">
                  <Link
                    href={`/community/${q.id}?from=questions`}
                    aria-label={`Open question: ${q.title}`}
                    className="absolute inset-0 rounded-lg focus:outline-none focus:ring-2 focus:ring-asu-blue focus:ring-inset"
                  />
                  <div className="relative z-[1] pointer-events-none">
                    <div className="flex items-start justify-between gap-3">
                      <h3 className="text-base font-semibold text-gray-700 group-hover:text-asu-blue transition-colors">
                        {q.title}
                      </h3>
                      <span className="inline-flex items-center gap-1 text-xs text-gray-500 flex-shrink-0">
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
                        {commentCount}
                        <span className="sr-only">
                          {" "}
                          {commentCount === 1 ? "reply" : "replies"}
                        </span>
                      </span>
                    </div>
                    {q.description && (
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                        {q.description}
                      </p>
                    )}
                    <div className="flex items-center flex-wrap gap-2 mt-3 text-xs text-gray-400">
                      {skill && (
                        <span className="bg-asu-blue/10 text-asu-blue px-2 py-0.5 rounded font-medium">
                          {skill.short_name}
                        </span>
                      )}
                      <span>
                        {authorName} ·{" "}
                        {new Date(q.created_at).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                  {canDelete && (
                    <div className="relative z-10 flex justify-end mt-2">
                      <DeletePostButton postId={q.id} />
                    </div>
                  )}
                </article>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-8 text-center">
          <div className="w-14 h-14 bg-asu-blue/10 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-7 h-7 text-asu-blue"
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
          <p className="text-gray-700 font-medium mb-1">No questions yet</p>
          <p className="text-gray-500 text-sm max-w-md mx-auto">
            Be the first to ask something. Questions can be general or tagged
            to a specific skill.
          </p>
        </div>
      )}
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
      .eq("post_type", "project")
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
            const mediaUrl = post.media_url ?? "";
            return (
              <article
                key={post.id}
                className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col"
              >
                <div className="aspect-video bg-gray-100 overflow-hidden">
                  {post.media_type === "video" ? (
                    <video
                      src={mediaUrl}
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
                        src={mediaUrl}
                        controls
                        preload="none"
                        className="w-full"
                      >
                        Your browser does not support audio playback.
                      </audio>
                    </div>
                  ) : post.media_type === "link" ? (
                    (() => {
                      const embed = getEmbedUrl(mediaUrl);
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
                            {getDomain(mediaUrl)}
                          </span>
                        </Link>
                      );
                    })()
                  ) : post.media_type === "document" ? (
                    (() => {
                      const officeEmbed = getOfficeEmbedUrl(mediaUrl);
                      const embedSrc = officeEmbed
                        ? officeEmbed
                        : isPdf(mediaUrl)
                          ? mediaUrl
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
                            {mediaUrl.split(".").pop()?.toUpperCase() ??
                              "FILE"}{" "}
                            · Open
                          </span>
                        </Link>
                      );
                    })()
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={mediaUrl}
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
