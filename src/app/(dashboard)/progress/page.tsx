import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ScoreChart } from "@/components/progress/ScoreChart";
import { SkillRadar } from "@/components/progress/SkillRadar";

export default async function ProgressPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // Fetch all attempts ordered by date
  const { data: attempts } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: true });

  // Fetch skills for radar labels
  const { data: skills } = await supabase
    .from("skills")
    .select("*")
    .order("id");

  // Fetch questions for skill mapping
  const { data: questions } = await supabase
    .from("assessment_questions")
    .select("id, skill_id");

  const questionSkillMap = new Map(
    (questions ?? []).map((q) => [q.id, q.skill_id])
  );

  const chartData = (attempts ?? []).map((a) => ({
    date: new Date(a.completed_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: a.total_score,
    band: a.overall_band,
  }));

  // Build radar data from latest (and previous) attempt
  let radarCurrent: { skill: string; score: number; fullName: string }[] = [];
  let radarPrevious: { skill: string; score: number; fullName: string }[] | undefined;

  if (attempts && attempts.length > 0 && skills) {
    const latestId = attempts[attempts.length - 1].id;
    const { data: latestResponses } = await supabase
      .from("assessment_responses")
      .select("*")
      .eq("attempt_id", latestId);

    const responseBySkill = new Map<number, number>();
    (latestResponses ?? []).forEach((r) => {
      const skillId = questionSkillMap.get(r.question_id);
      if (skillId) responseBySkill.set(skillId, r.score);
    });

    radarCurrent = skills.map((s) => ({
      skill: `S${s.id}`,
      score: responseBySkill.get(s.id) ?? 0,
      fullName: s.short_name,
    }));

    // Compare with previous attempt if exists
    if (attempts.length >= 2) {
      const prevId = attempts[attempts.length - 2].id;
      const { data: prevResponses } = await supabase
        .from("assessment_responses")
        .select("*")
        .eq("attempt_id", prevId);

      const prevBySkill = new Map<number, number>();
      (prevResponses ?? []).forEach((r) => {
        const skillId = questionSkillMap.get(r.question_id);
        if (skillId) prevBySkill.set(skillId, r.score);
      });

      radarPrevious = skills.map((s) => ({
        skill: `S${s.id}`,
        score: prevBySkill.get(s.id) ?? 0,
        fullName: s.short_name,
      }));
    }
  }

  const hasAttempts = (attempts ?? []).length > 0;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-700">Progress</h2>
          <p className="text-gray-500">
            Track your skill growth over time across all 14 AI competencies.
          </p>
        </div>
        {hasAttempts && (
          <Link
            href="/assessment"
            className="px-4 py-2 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
          >
            Retake Assessment
          </Link>
        )}
      </div>

      {!hasAttempts ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="w-16 h-16 bg-asu-maroon/10 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-asu-maroon"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
              />
            </svg>
          </div>
          <p className="text-gray-700 font-medium mb-2">No progress to show yet</p>
          <p className="text-gray-500 text-sm mb-4">
            Complete your first self-assessment to start tracking your AI skill growth.
          </p>
          <Link
            href="/assessment"
            className="inline-block px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
          >
            Take Assessment
          </Link>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Assessments Taken</p>
              <p className="text-3xl font-bold text-asu-maroon mt-1">
                {attempts!.length}
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Latest Score</p>
              <p className="text-3xl font-bold text-asu-maroon mt-1">
                {attempts![attempts!.length - 1].total_score}
                <span className="text-base font-normal text-gray-400">/42</span>
              </p>
            </div>
            <div className="bg-white rounded-lg border border-gray-200 p-5">
              <p className="text-sm text-gray-500">Current Level</p>
              <p className="text-3xl font-bold text-asu-maroon mt-1">
                {attempts![attempts!.length - 1].overall_band}
              </p>
            </div>
          </div>

          {/* Charts */}
          <ScoreChart attempts={chartData} />
          <SkillRadar current={radarCurrent} previous={radarPrevious} />
        </div>
      )}
    </div>
  );
}
