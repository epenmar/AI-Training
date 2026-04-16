import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

const BAND_COLORS: Record<string, string> = {
  "New to this": "bg-asu-orange/15 text-asu-orange border-asu-orange",
  Foundational: "bg-asu-blue/15 text-asu-blue border-asu-blue",
  Intermediate: "bg-asu-green/15 text-asu-green border-asu-green",
  Advanced: "bg-asu-maroon/15 text-asu-maroon border-asu-maroon",
};

export default async function ResultsPage({
  params,
}: {
  params: Promise<{ attemptId: string }>;
}) {
  const { attemptId } = await params;
  const supabase = await createClient();

  // Verify the user owns this attempt
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: attempt } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (!attempt || attempt.user_id !== user.id) {
    redirect("/assessment");
  }

  // Fetch responses with question & skill info
  const { data: responses } = await supabase
    .from("assessment_responses")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("question_id");

  const { data: questions } = await supabase
    .from("assessment_questions")
    .select("*")
    .order("id");

  const { data: skills } = await supabase
    .from("skills")
    .select("*");

  if (!responses || !questions || !skills) {
    return <p className="text-gray-500">Unable to load results.</p>;
  }

  const skillMap = new Map(skills.map((s) => [s.id, s]));
  const questionMap = new Map(questions.map((q) => [q.id, q]));

  const bandStyle =
    BAND_COLORS[attempt.overall_band] ?? "bg-gray-100 text-gray-600 border-gray-300";

  const maxScore = questions.length * 3;
  const pct = Math.round((attempt.total_score / maxScore) * 100);

  return (
    <div className="max-w-3xl mx-auto">
      <h2 className="text-2xl font-bold text-gray-700 mb-6">
        Assessment Results
      </h2>

      {/* Summary card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 mb-8">
        <div className="flex flex-col sm:flex-row items-center gap-6">
          {/* Score ring */}
          <div className="relative w-32 h-32 flex-shrink-0">
            <svg className="w-32 h-32 -rotate-90" viewBox="0 0 128 128" aria-hidden="true">
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#e5e7eb"
                strokeWidth="12"
              />
              <circle
                cx="64"
                cy="64"
                r="56"
                fill="none"
                stroke="#8C1D40"
                strokeWidth="12"
                strokeDasharray={`${pct * 3.52} ${352 - pct * 3.52}`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-gray-700">
                {attempt.total_score}
              </span>
              <span className="text-xs text-gray-400">/ {maxScore}</span>
            </div>
          </div>

          <div className="text-center sm:text-left">
            <p className="text-sm text-gray-500 mb-1">Overall Level</p>
            <span
              className={`inline-block px-4 py-2 rounded-full text-sm font-semibold border ${bandStyle}`}
            >
              {attempt.overall_band}
            </span>
            <p className="text-xs text-gray-400 mt-3">
              Completed{" "}
              {new Date(attempt.completed_at).toLocaleDateString("en-US", {
                month: "long",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          </div>
        </div>
      </div>

      {/* Per-skill breakdown */}
      <h3 className="text-lg font-semibold text-gray-700 mb-4">
        Skill Breakdown
      </h3>
      <div className="space-y-3 mb-8">
        {responses.map((r) => {
          const skill = skillMap.get(questionMap.get(r.question_id)?.skill_id ?? 0);
          const bandColors =
            BAND_COLORS[r.level_label] ?? "bg-gray-100 text-gray-600 border-gray-300";
          return (
            <div
              key={r.id}
              className="bg-white rounded-lg border border-gray-200 p-4 flex items-center justify-between gap-4"
            >
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-700 truncate">
                  {skill?.short_name ?? `Skill ${r.question_id}`}
                </p>
                <p className="text-xs text-gray-400">
                  Score: {r.score} / 3
                </p>
              </div>
              <span
                className={`flex-shrink-0 px-3 py-1 rounded-full text-xs font-semibold border ${bandColors}`}
              >
                {r.level_label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          href="/assessment"
          className="flex-1 text-center px-5 py-3 rounded-lg bg-asu-maroon text-white font-medium hover:bg-sidebar-hover transition-colors"
        >
          Retake Assessment
        </Link>
        <Link
          href="/progress"
          className="flex-1 text-center px-5 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          View Progress Over Time
        </Link>
        <Link
          href="/learning-paths"
          className="flex-1 text-center px-5 py-3 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors"
        >
          Explore Learning Paths
        </Link>
      </div>
    </div>
  );
}
