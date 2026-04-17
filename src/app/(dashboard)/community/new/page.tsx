import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UploadForm } from "@/components/community/UploadForm";

export default async function NewPostPage({
  searchParams,
}: {
  searchParams: Promise<{ activity?: string; skill?: string }>;
}) {
  const { activity: activityParam, skill: skillParam } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: skills } = await supabase
    .from("skills")
    .select("id, short_name")
    .order("id");

  const { data: activities } = await supabase
    .from("level_up_activities")
    .select("id, title, skill_id")
    .order("skill_id");

  // Resolve the pre-fill: if an activity id came in, use it and derive its skill.
  let initialActivityId = "";
  let initialSkillId = skillParam ?? "";
  let prefilledActivityTitle: string | null = null;
  if (activityParam) {
    const match = (activities ?? []).find(
      (a) => a.id === parseInt(activityParam, 10)
    );
    if (match) {
      initialActivityId = String(match.id);
      initialSkillId = String(match.skill_id);
      prefilledActivityTitle = match.title;
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href={prefilledActivityTitle ? `/activities/${activityParam}` : "/community"}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-asu-maroon mb-4"
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
            d="M15 19l-7-7 7-7"
          />
        </svg>
        {prefilledActivityTitle ? "Back to activity" : "Back to Look Book"}
      </Link>

      <h2 className="text-2xl font-bold text-gray-700 mb-2">Share your work</h2>
      {prefilledActivityTitle ? (
        <p className="text-gray-500 mb-6">
          Sharing from{" "}
          <span className="font-medium text-gray-700">
            {prefilledActivityTitle}
          </span>
          . Upload a screenshot, slide, or short video (max 50MB) — the activity
          and skill tags are pre-filled.
        </p>
      ) : (
        <p className="text-gray-500 mb-6">
          Upload a screenshot or short video (max 50MB). Add a title, and
          optionally tag the skill or activity it relates to.
        </p>
      )}

      <UploadForm
        skills={skills ?? []}
        activities={activities ?? []}
        initialSkillId={initialSkillId}
        initialActivityId={initialActivityId}
      />
    </div>
  );
}
