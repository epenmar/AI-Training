import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { scoreToRecommendedBand } from "@/lib/recommendations";

const LEVEL_NAMES = ["New", "Foundational", "Intermediate", "Advanced"] as const;

const LEVEL_COLORS: Record<string, string> = {
  New: "bg-gray-100 text-gray-600 ring-gray-300",
  Foundational: "bg-asu-blue/15 text-asu-blue ring-asu-blue/30",
  Intermediate: "bg-asu-green/15 text-green-800 ring-asu-green/30",
  Advanced: "bg-asu-gold/20 text-yellow-900 ring-asu-gold/40",
};

// Interpretive descriptions of what the user's answer signaled about
// where they stand on a given skill. These re-frame the Leveling Rubric
// in second person so the page answers "what did my answer say about me"
// without echoing the answer text.
const LEVEL_READS: Record<string, string> = {
  New: "You haven't started working with this skill yet — the vocabulary and examples are still unfamiliar.",
  Foundational:
    "You recognize the vocabulary and can follow single-step procedures. You're oriented, but working from templates more than instinct.",
  Intermediate:
    "You can apply concepts in multi-step scenarios, compare approaches, and use frameworks. You're making grounded choices.",
  Advanced:
    "You work at the synthesis level — troubleshooting edge cases, making design decisions, and adapting when things don't fit a template.",
};

const NEXT_STEP: Record<string, string> = {
  New: "Next up: build a Foundational understanding — vocabulary, what the skill looks like in practice, and one clean example.",
  Foundational:
    "Next up: move to Intermediate — apply the skill across multiple scenarios and start comparing trade-offs.",
  Intermediate:
    "Next up: push to Advanced — tackle edge cases, combine this skill with others, and design rather than follow a template.",
  Advanced: "",
};

export default async function SkillSummaryPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: latestAttempt } = await supabase
    .from("assessment_attempts")
    .select("id, completed_at, total_score, overall_band")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!latestAttempt) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-700">Skill Summary</h2>
          <p className="text-gray-500">
            Take the self-assessment to see where you stand on each of the
            14 AI skills.
          </p>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <p className="text-gray-500 mb-4">No assessment on file yet.</p>
          <Link
            href="/assessment"
            className="inline-block px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
          >
            Start Assessment
          </Link>
        </div>
      </div>
    );
  }

  const [
    { data: responses },
    { data: questions },
    { data: skills },
    { data: activities },
  ] = await Promise.all([
    supabase
      .from("assessment_responses")
      .select("question_id, score")
      .eq("attempt_id", latestAttempt.id),
    supabase.from("assessment_questions").select("id, skill_id"),
    supabase.from("skills").select("*").order("id"),
    supabase.from("level_up_activities").select("id, skill_id, band"),
  ]);

  // (skill_id, band) → activity_id so we can link directly to the
  // bridging activity for each skill at the user's level.
  const activityBySkillBand = new Map<string, number>();
  for (const a of activities ?? []) {
    activityBySkillBand.set(`${a.skill_id}|${a.band}`, a.id);
  }

  const qSkillMap = new Map((questions ?? []).map((q) => [q.id, q.skill_id]));
  const skillScore = new Map<number, number>();
  (responses ?? []).forEach((r) => {
    const sid = qSkillMap.get(r.question_id);
    if (sid != null) skillScore.set(sid, r.score);
  });

  const completedAt = new Date(latestAttempt.completed_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  // Roll-up counts for the header
  const counts = { New: 0, Foundational: 0, Intermediate: 0, Advanced: 0 };
  for (const [, score] of skillScore) {
    const name = LEVEL_NAMES[score] ?? "New";
    counts[name as keyof typeof counts] += 1;
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Skill Summary</h2>
        <p className="text-gray-500">
          Where you stand on each of the 14 AI skills, based on your
          assessment from {completedAt}.
        </p>
      </div>

      {/* Overall roll-up */}
      <div className="bg-white border border-gray-200 rounded-lg p-5 mb-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400 font-medium">
              Overall
            </p>
            <p className="text-xl font-bold text-gray-700 mt-1">
              {latestAttempt.overall_band}{" "}
              <span className="text-sm font-normal text-gray-500">
                · {latestAttempt.total_score}/42
              </span>
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {(LEVEL_NAMES as readonly string[]).map((level) => {
              const n = counts[level as keyof typeof counts] ?? 0;
              if (n === 0) return null;
              return (
                <span
                  key={level}
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ring-1 ${
                    LEVEL_COLORS[level] ?? "bg-gray-100 text-gray-600 ring-gray-300"
                  }`}
                >
                  {n} {level}
                </span>
              );
            })}
          </div>
        </div>
      </div>

      {/* 14 skill rows */}
      <ul className="space-y-3">
        {(skills ?? []).map((skill) => {
          const score = skillScore.get(skill.id);
          const level = score != null ? LEVEL_NAMES[score] : "New";
          const read = LEVEL_READS[level];
          const next = NEXT_STEP[level];
          const nextBand =
            score != null ? scoreToRecommendedBand(score) : null;
          const nextActivityId = nextBand
            ? activityBySkillBand.get(`${skill.id}|${nextBand}`) ?? null
            : null;
          return (
            <li key={skill.id}>
              <article className="bg-white border border-gray-200 rounded-lg p-5">
                <div className="flex items-start justify-between gap-3 flex-wrap mb-2">
                  <div className="min-w-0">
                    <h3 className="text-base font-semibold text-gray-700">
                      <span className="text-asu-maroon">
                        Skill {skill.id}:
                      </span>{" "}
                      {skill.short_name}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">
                      {skill.statement}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ring-1 ${
                      LEVEL_COLORS[level] ?? ""
                    }`}
                  >
                    {level}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mt-2">{read}</p>
                {next && (
                  <p className="text-sm text-gray-500 mt-2 italic">{next}</p>
                )}
                <div className="flex flex-wrap gap-2 mt-4">
                  {nextActivityId ? (
                    <Link
                      href={`/activities/${nextActivityId}`}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
                    >
                      Go to activity
                      <svg
                        className="w-3 h-3"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 5l7 7-7 7"
                        />
                      </svg>
                    </Link>
                  ) : (
                    <Link
                      href="/activities"
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      Browse activities
                    </Link>
                  )}
                  {skill.bloom_phase_id != null && (
                    <Link
                      href={`/learning-paths/${skill.bloom_phase_id}`}
                      className="inline-flex items-center gap-1 text-xs font-medium px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                    >
                      See resources
                    </Link>
                  )}
                </div>
              </article>
            </li>
          );
        })}
      </ul>

      <div className="flex flex-wrap gap-2 mt-8">
        <Link
          href="/activities?filter=recommended"
          className="px-4 py-2 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
        >
          See recommended activities
        </Link>
        <Link
          href="/progress"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          View progress charts
        </Link>
        <Link
          href="/assessment"
          className="px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Retake assessment
        </Link>
      </div>
    </div>
  );
}
