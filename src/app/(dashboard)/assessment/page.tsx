import { createClient } from "@/lib/supabase/server";
import { AssessmentFlow } from "@/components/assessment/AssessmentFlow";

export default async function AssessmentPage() {
  const supabase = await createClient();

  const { data: questions } = await supabase
    .from("assessment_questions")
    .select("*")
    .order("id");

  const { data: options } = await supabase
    .from("assessment_options")
    .select("*")
    .order("question_id")
    .order("option_key");

  const { data: skills } = await supabase
    .from("skills")
    .select("*");

  if (!questions || !options || !skills) {
    return (
      <div className="max-w-3xl mx-auto text-center py-12">
        <p className="text-gray-500">Unable to load assessment questions. Please try again later.</p>
      </div>
    );
  }

  const skillMap = new Map(skills.map((s) => [s.id, s]));

  const questionsWithOptions = questions.map((q) => ({
    ...q,
    options: options.filter((o) => o.question_id === q.id),
    skill: skillMap.get(q.skill_id)!,
  }));

  return <AssessmentFlow questions={questionsWithOptions} />;
}
