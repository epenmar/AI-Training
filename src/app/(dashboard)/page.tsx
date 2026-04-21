import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { buildRecommendations } from "@/lib/recommendations";
import { HowItWorks } from "@/components/HowItWorks";

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
    supabase.from("level_up_activities").select("id, title, skill_id, band"),
  ]);

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
      const match = (allActivities ?? []).find(
        (a) =>
          a.skill_id === target.skillId &&
          a.band === target.band &&
          !completedSet.has(a.id)
      );
      if (match) {
        suggestedActivity = match;
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

      {/* How the platform works — shown on every load so the flow stays visible */}
      <HowItWorks hasAssessment={!!latestAttempt} />

      {/* Primary CTA */}
      {primaryCta}
    </div>
  );
}
