import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buildRecommendations } from "@/lib/recommendations";

const BAND_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  "New → Foundational": {
    bg: "bg-asu-blue/10",
    text: "text-asu-blue",
    border: "border-asu-blue/30",
  },
  "Foundational → Intermediate": {
    bg: "bg-asu-green/10",
    text: "text-green-700",
    border: "border-asu-green/30",
  },
  "Intermediate → Advanced": {
    bg: "bg-asu-gold/15",
    text: "text-yellow-800",
    border: "border-asu-gold/40",
  },
};

const BAND_ORDER = [
  "New → Foundational",
  "Foundational → Intermediate",
  "Intermediate → Advanced",
];

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;
  const recommendedOnly = filter === "recommended";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: activities } = await supabase
    .from("level_up_activities")
    .select("*")
    .order("skill_id");

  const { data: skills } = await supabase.from("skills").select("*").order("id");
  const { data: completions } = await supabase
    .from("user_activity_completions")
    .select("activity_id")
    .eq("user_id", user.id);

  const completedSet = new Set(
    (completions ?? []).map((c) => c.activity_id)
  );

  // Build the recommended (skill_id, band) targets from the user's latest
  // assessment. Empty map → no assessment yet.
  const { data: latestAttempt } = await supabase
    .from("assessment_attempts")
    .select("id")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const recommendedBySkill = new Map<number, string>();
  if (latestAttempt) {
    const [{ data: responses }, { data: questions }] = await Promise.all([
      supabase
        .from("assessment_responses")
        .select("question_id, score")
        .eq("attempt_id", latestAttempt.id),
      supabase.from("assessment_questions").select("id, skill_id"),
    ]);
    const qSkillMap = new Map((questions ?? []).map((q) => [q.id, q.skill_id]));
    for (const t of buildRecommendations(responses ?? [], qSkillMap)) {
      recommendedBySkill.set(t.skillId, t.band);
    }
  }

  // Filter to recommended-only if requested (and user has taken an assessment)
  const visibleActivities = recommendedOnly
    ? (activities ?? []).filter(
        (a) => recommendedBySkill.get(a.skill_id) === a.band
      )
    : activities ?? [];

  // Group activities by skill
  const bySkill = new Map<number, typeof activities>();
  visibleActivities.forEach((a) => {
    if (!bySkill.has(a.skill_id)) bySkill.set(a.skill_id, []);
    bySkill.get(a.skill_id)!.push(a);
  });

  const totalCount = activities?.length ?? 0;
  const recommendedActivities = (activities ?? []).filter(
    (a) => recommendedBySkill.get(a.skill_id) === a.band
  );
  const recommendedCount = recommendedActivities.length;
  const recommendedCompletedCount = recommendedActivities.filter((a) =>
    completedSet.has(a.id)
  ).length;

  const scopedDenominator = recommendedOnly ? recommendedCount : totalCount;
  const scopedNumerator = recommendedOnly
    ? recommendedCompletedCount
    : completedSet.size;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-gray-700">Activities</h2>
          <p className="text-gray-500">
            42 hands-on activities across 14 skills and 3 level-up bands.
            Each activity includes step-by-step instructions and a concrete
            deliverable.
          </p>
        </div>
        <div className="bg-white rounded-lg border border-gray-200 px-5 py-3 flex items-center gap-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-asu-maroon">
              {scopedNumerator}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              of {scopedDenominator}
            </p>
          </div>
          <div
            className="w-px h-8 bg-gray-200"
            aria-hidden="true"
          />
          <div className="text-sm text-gray-500">
            {scopedDenominator > 0
              ? `${Math.round((scopedNumerator / scopedDenominator) * 100)}% complete`
              : "No activities yet"}
          </div>
        </div>
      </div>

      {/* Filter toggle */}
      <div
        role="tablist"
        aria-label="Filter activities"
        className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6"
      >
        <Link
          href="/activities"
          role="tab"
          aria-selected={!recommendedOnly}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            !recommendedOnly
              ? "bg-white text-gray-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Browse all
          <span className="ml-1.5 text-xs text-gray-400">{totalCount}</span>
        </Link>
        <Link
          href="/activities?filter=recommended"
          role="tab"
          aria-selected={recommendedOnly}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            recommendedOnly
              ? "bg-white text-asu-maroon shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Recommended for me
          {latestAttempt && (
            <span className="ml-1.5 text-xs text-gray-400">
              {recommendedCount}
            </span>
          )}
        </Link>
      </div>

      {recommendedOnly && !latestAttempt && (
        <div className="bg-asu-blue/5 border border-asu-blue/20 rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            Take the self-assessment to get recommendations
          </h3>
          <p className="text-sm text-gray-500 mb-3">
            Answer 14 quick scenarios and we&apos;ll highlight the one
            bridging activity per skill that will move you up a level.
          </p>
          <Link
            href="/assessment"
            className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
          >
            Start Assessment
          </Link>
        </div>
      )}

      {recommendedOnly && latestAttempt && recommendedCount === 0 && (
        <div className="bg-asu-green/10 border border-asu-green rounded-lg p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-700 mb-1">
            You&apos;re at Advanced on every skill
          </h3>
          <p className="text-sm text-gray-600">
            No bridging activities left — browse all activities to keep
            practicing, or retake the assessment.
          </p>
        </div>
      )}

      <div className="space-y-6">
        {(skills ?? []).map((skill) => {
          const skillActivities = bySkill.get(skill.id) ?? [];
          if (skillActivities.length === 0) return null;

          // Sort by band order
          const sorted = [...skillActivities].sort(
            (a, b) => BAND_ORDER.indexOf(a.band) - BAND_ORDER.indexOf(b.band)
          );
          const skillCompleted = sorted.filter((a) =>
            completedSet.has(a.id)
          ).length;

          return (
            <section
              key={skill.id}
              aria-labelledby={`skill-${skill.id}-heading`}
            >
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3
                  id={`skill-${skill.id}-heading`}
                  className="text-sm font-semibold text-gray-700"
                >
                  <span className="text-asu-maroon">Skill {skill.id}:</span>{" "}
                  {skill.short_name}
                </h3>
                <span className="text-xs text-gray-400 font-medium">
                  {skillCompleted}/{sorted.length} complete
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {sorted.map((activity) => {
                  const isComplete = completedSet.has(activity.id);
                  const colors =
                    BAND_COLORS[activity.band] ?? BAND_COLORS["New → Foundational"];
                  return (
                    <Link
                      key={activity.id}
                      href={`/activities/${activity.id}`}
                      className={`block rounded-lg border-2 ${colors.border} bg-white p-4 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:ring-offset-2 relative`}
                    >
                      {isComplete && (
                        <div
                          className="absolute top-3 right-3 w-6 h-6 rounded-full bg-asu-green text-white flex items-center justify-center"
                          aria-label="Completed"
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
                              strokeWidth={3}
                              d="M5 13l4 4L19 7"
                            />
                          </svg>
                        </div>
                      )}
                      <span
                        className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full ${colors.bg} ${colors.text} mb-2`}
                      >
                        {activity.band}
                      </span>
                      <h4 className="text-base font-semibold text-gray-700 mb-1 pr-8">
                        {activity.title}
                      </h4>
                      <p className="text-sm text-gray-500 line-clamp-2 mb-2">
                        {(activity.description ?? "").split(
                          "\n\nOptional extension: "
                        )[0]}
                      </p>
                      {activity.time_estimate && (
                        <p className="text-xs text-gray-400 flex items-center gap-1">
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
                              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                            />
                          </svg>
                          {activity.time_estimate}
                        </p>
                      )}
                    </Link>
                  );
                })}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}
