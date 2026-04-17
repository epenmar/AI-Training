import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

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

export default async function ActivitiesPage() {
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

  // Group activities by skill
  const bySkill = new Map<number, typeof activities>();
  (activities ?? []).forEach((a) => {
    if (!bySkill.has(a.skill_id)) bySkill.set(a.skill_id, []);
    bySkill.get(a.skill_id)!.push(a);
  });

  const totalCount = activities?.length ?? 0;
  const completedCount = completedSet.size;

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
              {completedCount}
            </p>
            <p className="text-xs text-gray-400 uppercase tracking-wide font-medium">
              of {totalCount}
            </p>
          </div>
          <div
            className="w-px h-8 bg-gray-200"
            aria-hidden="true"
          />
          <div className="text-sm text-gray-500">
            {totalCount > 0
              ? `${Math.round((completedCount / totalCount) * 100)}% complete`
              : "No activities yet"}
          </div>
        </div>
      </div>

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
