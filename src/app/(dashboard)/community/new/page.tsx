import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { UploadForm } from "@/components/community/UploadForm";

export default async function NewPostPage() {
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

  return (
    <div className="max-w-2xl mx-auto">
      <Link
        href="/community"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-asu-maroon mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Look Book
      </Link>

      <h2 className="text-2xl font-bold text-gray-700 mb-2">Share your work</h2>
      <p className="text-gray-500 mb-6">
        Upload a screenshot or short video (max 50MB). Add a title, and
        optionally tag the skill or activity it relates to.
      </p>

      <UploadForm skills={skills ?? []} activities={activities ?? []} />
    </div>
  );
}
