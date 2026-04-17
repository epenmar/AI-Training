import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { buildRecommendations } from "@/lib/recommendations";

export default async function DashboardHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch user's latest data
  const [
    { data: latestAttempt },
    { data: completions },
    { data: allActivities },
    { data: recentPosts },
  ] = await Promise.all([
    supabase
      .from("assessment_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("user_activity_completions")
      .select("activity_id")
      .eq("user_id", user.id),
    supabase.from("level_up_activities").select("id, skill_id"),
    supabase
      .from("community_posts")
      .select("id, title, media_url, media_type, user_id, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const TOTAL_SKILLS = 14;
  const activitySkillMap = new Map(
    (allActivities ?? []).map((a) => [a.id, a.skill_id])
  );
  const skillsWithProgress = new Set<number>();
  for (const c of completions ?? []) {
    const skillId = activitySkillMap.get(c.activity_id);
    if (skillId) skillsWithProgress.add(skillId);
  }
  const skillsCovered = skillsWithProgress.size;
  const skillsPct = Math.round((skillsCovered / TOTAL_SKILLS) * 100);

  // Suggest a next activity — pick the lowest-scoring skill's band-matched
  // bridging activity (the one that takes them from their current level to
  // the next). Fall back to the next-lowest skill if that one is already done.
  const completedSet = new Set(
    (completions ?? []).map((c) => c.activity_id)
  );
  let suggestedActivity: {
    id: number;
    title: string;
    band: string;
    skill_id: number;
  } | null = null;

  if (latestAttempt) {
    const [{ data: responses }, { data: questions }] = await Promise.all([
      supabase
        .from("assessment_responses")
        .select("question_id, score")
        .eq("attempt_id", latestAttempt.id),
      supabase.from("assessment_questions").select("id, skill_id"),
    ]);
    const qSkillMap = new Map((questions ?? []).map((q) => [q.id, q.skill_id]));
    const targets = buildRecommendations(responses ?? [], qSkillMap);

    for (const target of targets) {
      const { data: acts } = await supabase
        .from("level_up_activities")
        .select("id, title, band, skill_id")
        .eq("skill_id", target.skillId)
        .eq("band", target.band);
      const incomplete = (acts ?? []).find((a) => !completedSet.has(a.id));
      if (incomplete) {
        suggestedActivity = incomplete;
        break;
      }
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  const fullName = profile?.display_name ?? "";
  const firstName = fullName.trim().split(/\s+/)[0] || "there";

  const primaryCta = !latestAttempt ? (
    <div className="bg-asu-maroon text-white rounded-lg p-6">
      <h3 className="text-lg font-bold mb-1">
        Take your first self-assessment
      </h3>
      <p className="text-sm opacity-90 mb-4">
        14 scenario questions. About 10 minutes. You&apos;ll get a per-skill
        breakdown and tailored next steps.
      </p>
      <Link
        href="/assessment"
        className="inline-block bg-white text-asu-maroon px-5 py-2.5 rounded-lg font-medium text-sm hover:bg-gray-100 transition-colors"
      >
        Start Assessment
      </Link>
    </div>
  ) : suggestedActivity ? (
    <div className="bg-white border-2 border-asu-maroon rounded-lg p-6">
      <p className="text-xs uppercase tracking-wide text-asu-maroon font-semibold mb-1">
        Suggested next activity
      </p>
      <h3 className="text-lg font-bold text-gray-700 mb-1">
        {suggestedActivity.title}
      </h3>
      <p className="text-sm text-gray-500 mb-4">
        Based on your lowest scoring skill from the last assessment.
      </p>
      <div className="flex gap-2 flex-wrap">
        <Link
          href={`/activities/${suggestedActivity.id}`}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
        >
          Open activity
        </Link>
        <Link
          href="/activities?filter=recommended"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-asu-maroon/30 text-asu-maroon hover:bg-asu-maroon/5 transition-colors"
        >
          See all recommended
        </Link>
        <Link
          href="/activities"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Browse all
        </Link>
      </div>
    </div>
  ) : (
    <div className="bg-asu-green/10 border border-asu-green rounded-lg p-6">
      <h3 className="text-lg font-bold text-gray-700 mb-1">
        Great work — you&apos;ve covered every skill!
      </h3>
      <p className="text-sm text-gray-600 mb-4">
        Retake the assessment to see how far you&apos;ve come, or browse more
        activities.
      </p>
      <div className="flex gap-2 flex-wrap">
        <Link
          href="/assessment"
          className="inline-block px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
        >
          Retake Assessment
        </Link>
        <Link
          href="/activities"
          className="inline-block px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Browse activities
        </Link>
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <section>
        <h2 className="text-2xl font-bold text-gray-700">
          Welcome back, {firstName}
        </h2>
        <p className="mt-1 text-gray-500">
          {latestAttempt
            ? `You're at ${latestAttempt.overall_band} level — keep the momentum going.`
            : "Start with a self-assessment to see where you stand across 14 AI skills."}
        </p>
      </section>

      {/* Primary CTA — top priority */}
      {primaryCta}

      {/* Top stats */}
      <section className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Latest Score
          </p>
          {latestAttempt ? (
            <>
              <p className="text-2xl font-bold text-asu-maroon mt-1">
                {latestAttempt.total_score}
                <span className="text-sm font-normal text-gray-400">/42</span>
              </p>
              <p className="text-xs text-gray-500 mt-0.5">
                {latestAttempt.overall_band}
              </p>
            </>
          ) : (
            <>
              <p className="text-2xl font-bold text-gray-300 mt-1">—</p>
              <p className="text-xs text-gray-400 mt-0.5">Not taken yet</p>
            </>
          )}
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide font-medium">
            Skills Practiced
          </p>
          <p className="text-2xl font-bold text-asu-maroon mt-1">
            {skillsCovered}
            <span className="text-sm font-normal text-gray-400">
              /{TOTAL_SKILLS}
            </span>
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {skillsCovered === 0
              ? "Complete one activity per skill"
              : "Skills with at least one activity done"}
          </p>
          <div className="mt-2 w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-asu-green h-1.5 rounded-full transition-all"
              style={{ width: `${skillsPct}%` }}
            />
          </div>
        </div>

        <Link
          href="/learning-paths"
          className="bg-asu-blue text-white rounded-lg p-5 hover:bg-asu-blue/90 transition-colors"
        >
          <p className="text-xs uppercase tracking-wide font-medium opacity-80">
            Learning Paths
          </p>
          <p className="text-2xl font-bold mt-1">9 phases</p>
          <p className="text-xs opacity-80 mt-0.5">Browse all →</p>
        </Link>

        <Link
          href="/community"
          className="bg-asu-turquoise text-white rounded-lg p-5 hover:bg-asu-turquoise/90 transition-colors"
        >
          <p className="text-xs uppercase tracking-wide font-medium opacity-80">
            Community
          </p>
          <p className="text-2xl font-bold mt-1">
            {recentPosts?.length ?? 0} posts
          </p>
          <p className="text-xs opacity-80 mt-0.5">See what others built →</p>
        </Link>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Primary action column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Quick links */}
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Explore
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Link
                href="/progress"
                className="p-4 rounded-lg border border-gray-200 hover:border-asu-maroon/40 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-700">
                  Progress over time
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  See how scores have changed
                </p>
              </Link>
              <Link
                href="/learning-paths"
                className="p-4 rounded-lg border border-gray-200 hover:border-asu-maroon/40 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-700">
                  Learning paths
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  9 Bloom phases, 107+ items
                </p>
              </Link>
              <Link
                href="/activities"
                className="p-4 rounded-lg border border-gray-200 hover:border-asu-maroon/40 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-700">
                  All activities
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  42 hands-on projects
                </p>
              </Link>
              <Link
                href="/slack"
                className="p-4 rounded-lg border border-gray-200 hover:border-asu-maroon/40 hover:bg-gray-50 transition-colors"
              >
                <p className="text-sm font-semibold text-gray-700">
                  Slack channels
                </p>
                <p className="text-xs text-gray-500 mt-0.5">
                  Team conversations
                </p>
              </Link>
            </div>
          </div>
        </div>

        {/* Community sidebar */}
        <div className="bg-white rounded-lg border border-gray-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Recent Community Posts
            </h3>
            <Link
              href="/community"
              className="text-xs text-asu-maroon hover:underline font-medium"
            >
              View all →
            </Link>
          </div>
          {recentPosts && recentPosts.length > 0 ? (
            <ul className="space-y-3">
              {recentPosts.map((post) => (
                <li
                  key={post.id}
                  className="flex gap-3 pb-3 last:pb-0 last:border-0 border-b border-gray-100"
                >
                  {post.media_type === "image" ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={post.media_url}
                      alt=""
                      className="w-16 h-16 rounded object-cover flex-shrink-0"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded bg-gray-200 flex items-center justify-center flex-shrink-0">
                      <svg
                        className="w-6 h-6 text-gray-400"
                        fill="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700 line-clamp-2">
                      {post.title}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {new Date(post.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-center py-6">
              <p className="text-sm text-gray-500 mb-2">No posts yet</p>
              <Link
                href="/community/new"
                className="text-xs text-asu-maroon hover:underline font-medium"
              >
                Share the first one →
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
