import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CompletionPanel } from "@/components/activities/CompletionPanel";
import { ToolSuggester } from "@/components/activities/ToolSuggester";

const BAND_COLORS: Record<string, string> = {
  "New → Foundational": "bg-asu-blue/10 text-asu-blue",
  "Foundational → Intermediate": "bg-asu-green/10 text-green-700",
  "Intermediate → Advanced": "bg-asu-gold/15 text-yellow-800",
};

export default async function ActivityDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: idStr } = await params;
  const activityId = parseInt(idStr, 10);
  if (isNaN(activityId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: activity } = await supabase
    .from("level_up_activities")
    .select("*")
    .eq("id", activityId)
    .single();
  if (!activity) notFound();

  const { data: skill } = await supabase
    .from("skills")
    .select("*")
    .eq("id", activity.skill_id)
    .single();

  const { data: steps } = await supabase
    .from("activity_guide_steps")
    .select("*")
    .eq("activity_id", activityId)
    .order("step_number");

  const { data: completion } = await supabase
    .from("user_activity_completions")
    .select("*")
    .eq("user_id", user.id)
    .eq("activity_id", activityId)
    .maybeSingle();

  // Linked phases for cross-navigation
  const { data: linkedPhases } =
    activity.linked_phase_ids && activity.linked_phase_ids.length > 0
      ? await supabase
          .from("bloom_phases")
          .select("id, name")
          .in("id", activity.linked_phase_ids)
      : { data: [] };

  const bandClass =
    BAND_COLORS[activity.band] ?? "bg-gray-100 text-gray-600";

  // Split off the optional extension (not counted in time_estimate)
  const [coreDescription, extension] = (activity.description ?? "").split(
    "\n\nOptional extension: "
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link */}
      <Link
        href="/activities"
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
        All activities
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2 mb-2">
          <span
            className={`inline-block text-xs font-semibold px-2.5 py-1 rounded-full ${bandClass}`}
          >
            {activity.band}
          </span>
          {skill && (
            <Link
              href="/activities"
              className="text-xs text-asu-maroon hover:underline font-medium"
            >
              Skill {skill.id}: {skill.short_name}
            </Link>
          )}
          {activity.time_estimate && (
            <span className="text-xs text-gray-400 font-medium inline-flex items-center gap-1">
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
            </span>
          )}
        </div>
        <h2 className="text-2xl font-bold text-gray-700">{activity.title}</h2>
        <p className="text-gray-600 mt-2">{coreDescription}</p>
      </div>

      {/* AI tool suggester */}
      <ToolSuggester activityId={activityId} />

      {/* Steps */}
      {((steps && steps.length > 0) || extension) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Step-by-step
          </h3>
          {steps && steps.length > 0 && (
            <ol className="space-y-3">
              {steps.map((step) => (
                <li
                  key={step.id}
                  className="bg-white border border-gray-200 rounded-lg p-4 flex gap-3"
                >
                  <span className="flex-shrink-0 w-7 h-7 rounded-full bg-asu-maroon text-white text-sm font-bold flex items-center justify-center">
                    {step.step_number}
                  </span>
                  <p className="text-sm text-gray-700 whitespace-pre-line flex-1">
                    {step.instruction}
                  </p>
                </li>
              ))}
            </ol>
          )}

          {/* Optional extension — shown at the end of the steps, not counted in the time estimate */}
          {extension && (
            <div className="mt-3 bg-asu-gold/10 border-l-4 border-asu-gold rounded-r-lg p-4">
              <p className="text-xs font-semibold text-yellow-800 uppercase tracking-wide mb-1">
                Optional extension
              </p>
              <p className="text-sm text-gray-700">{extension}</p>
              <p className="text-xs text-gray-500 mt-2 italic">
                Not included in the {activity.time_estimate} estimate above —
                for anyone who wants to go further.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Linked phases */}
      {linkedPhases && linkedPhases.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Related Learning Paths
          </h3>
          <div className="flex flex-wrap gap-2">
            {linkedPhases.map((p) => (
              <Link
                key={p.id}
                href={`/learning-paths/${p.id}`}
                className="inline-flex items-center gap-1 text-sm bg-white border border-gray-200 text-gray-700 px-3 py-1.5 rounded-lg hover:border-asu-maroon/40 hover:text-asu-maroon transition-colors"
              >
                <span className="text-xs font-bold text-asu-maroon">
                  Phase {p.id}:
                </span>
                {p.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Completion panel */}
      <CompletionPanel
        activityId={activityId}
        isComplete={!!completion}
        initialNotes={completion?.deliverable_notes ?? ""}
        completedAt={completion?.completed_at ?? null}
        deliverable={activity.deliverable ?? null}
      />
    </div>
  );
}
