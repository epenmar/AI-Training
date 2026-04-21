import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { AssessmentFlow } from "@/components/assessment/AssessmentFlow";
import { ScoreChart } from "@/components/progress/ScoreChart";
import { SkillRadar } from "@/components/progress/SkillRadar";

export default async function AssessmentPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [
    { data: questions },
    { data: options },
    { data: skills },
    { data: attempts },
  ] = await Promise.all([
    supabase.from("assessment_questions").select("*").order("id"),
    supabase
      .from("assessment_options")
      .select("*")
      .order("question_id")
      .order("option_key"),
    supabase.from("skills").select("*").order("id"),
    supabase
      .from("assessment_attempts")
      .select("*")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: true }),
  ]);

  if (!questions || !options || !skills) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-500">
          Unable to load assessment questions. Please try again later.
        </p>
      </div>
    );
  }

  const skillMap = new Map(skills.map((s) => [s.id, s]));
  const questionSkillMap = new Map(questions.map((q) => [q.id, q.skill_id]));

  const questionsWithOptions = questions.map((q) => ({
    ...q,
    options: options.filter((o) => o.question_id === q.id),
    skill: skillMap.get(q.skill_id)!,
  }));

  const hasAttempts = (attempts ?? []).length > 0;

  const chartData = (attempts ?? []).map((a) => ({
    date: new Date(a.completed_at).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    }),
    score: a.total_score,
    band: a.overall_band,
  }));

  let radarCurrent: { skill: string; score: number; fullName: string }[] = [];
  let radarPrevious:
    | { skill: string; score: number; fullName: string }[]
    | undefined;

  if (hasAttempts) {
    const latestId = attempts![attempts!.length - 1].id;
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

    if (attempts!.length >= 2) {
      const prevId = attempts![attempts!.length - 2].id;
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

  if (!hasAttempts) {
    return <AssessmentFlow questions={questionsWithOptions} />;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <section>
        <h2 className="text-2xl font-bold text-gray-700">Your progress</h2>
        <p className="text-gray-500">
          Skill growth across all 14 AI competencies, tracked over every
          self-assessment.
        </p>
      </section>

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

      <ScoreChart attempts={chartData} />
      <SkillRadar current={radarCurrent} previous={radarPrevious} />

      <section className="pt-4 border-t border-gray-200">
        <h3 className="text-xl font-bold text-gray-700 mb-1">
          Ready for another check-in?
        </h3>
        <p className="text-gray-500 mb-6">
          Retake the assessment to see how your skill levels have shifted.
        </p>
        <AssessmentFlow questions={questionsWithOptions} />
      </section>
    </div>
  );
}
