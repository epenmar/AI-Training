import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { buildRecommendations } from "@/lib/recommendations";

const LEVEL_COLORS: Record<string, string> = {
  Foundational: "bg-asu-blue/15 text-asu-blue",
  Intermediate: "bg-asu-green/15 text-green-800",
  Advanced: "bg-asu-gold/20 text-yellow-800",
};

const MODALITY_ICONS: Record<string, string> = {
  Video: "▶",
  PDF: "📄",
  Article: "📰",
  Course: "🎓",
  Interactive: "⚡",
};

export default async function PhaseDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ phaseId: string }>;
  searchParams: Promise<{ filter?: string }>;
}) {
  const { phaseId: phaseIdStr } = await params;
  const { filter } = await searchParams;
  const recommendedOnly = filter === "recommended";
  const phaseId = parseInt(phaseIdStr, 10);
  if (isNaN(phaseId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: phase } = await supabase
    .from("bloom_phases")
    .select("*")
    .eq("id", phaseId)
    .single();
  if (!phase) notFound();

  const { data: allItems } = await supabase
    .from("lesson_flow")
    .select("*")
    .eq("bloom_phase_id", phaseId)
    .order("seq");

  const { data: skills } = await supabase.from("skills").select("*");
  const skillMap = new Map((skills ?? []).map((s) => [s.id, s]));

  // Build the user's skill -> target level map if we're filtering to
  // personalized content.
  let skillToLevel = new Map<number, string>();
  if (recommendedOnly) {
    const { data: latestAttempt } = await supabase
      .from("assessment_attempts")
      .select("id")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (latestAttempt) {
      const [{ data: responses }, { data: questions }] = await Promise.all([
        supabase
          .from("assessment_responses")
          .select("question_id, score")
          .eq("attempt_id", latestAttempt.id),
        supabase.from("assessment_questions").select("id, skill_id"),
      ]);
      const qSkillMap = new Map(
        (questions ?? []).map((q) => [q.id, q.skill_id])
      );
      skillToLevel = new Map(
        buildRecommendations(responses ?? [], qSkillMap).map((t) => [
          t.skillId,
          t.targetLevel,
        ])
      );
    }
  }

  const items = recommendedOnly
    ? (allItems ?? []).filter(
        (item) =>
          item.learning_level != null &&
          (item.skill_ids ?? []).some(
            (sid) => skillToLevel.get(sid) === item.learning_level
          )
      )
    : allItems;

  // Group items by topic for nicer layout
  const topicGroups = new Map<string, typeof items>();
  (items ?? []).forEach((item) => {
    const topic = item.topic ?? "Other";
    if (!topicGroups.has(topic)) topicGroups.set(topic, []);
    topicGroups.get(topic)!.push(item);
  });

  // Find prev/next phase for navigation
  const { data: allPhases } = await supabase
    .from("bloom_phases")
    .select("id, name, sort_order")
    .order("sort_order");
  const currentIdx = (allPhases ?? []).findIndex((p) => p.id === phaseId);
  const prevPhase = currentIdx > 0 ? allPhases![currentIdx - 1] : null;
  const nextPhase =
    currentIdx !== -1 && currentIdx < (allPhases?.length ?? 0) - 1
      ? allPhases![currentIdx + 1]
      : null;

  const qs = recommendedOnly ? "?filter=recommended" : "";

  return (
    <div className="max-w-4xl mx-auto">
      {/* Back link */}
      <Link
        href={`/learning-paths${qs}`}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-asu-maroon mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        {recommendedOnly ? "Your learning path" : "All learning paths"}
      </Link>

      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-asu-maroon text-white font-bold">
            {phase.id}
          </span>
          <span className="text-xs uppercase tracking-wide text-gray-400 font-semibold">
            {phase.bloom_levels}
          </span>
        </div>
        <h2 className="text-2xl font-bold text-gray-700">{phase.name}</h2>
        {phase.description && (
          <p className="text-gray-500 mt-1">{phase.description}</p>
        )}
        <p className="text-sm text-gray-400 mt-2">
          {recommendedOnly
            ? `${items?.length ?? 0} ${items?.length === 1 ? "item" : "items"} at your level`
            : `${items?.length ?? 0} learning ${items?.length === 1 ? "item" : "items"}`}
          {recommendedOnly && (
            <>
              {" · "}
              <Link
                href={`/learning-paths/${phase.id}`}
                className="underline hover:text-asu-maroon"
              >
                show all {allItems?.length ?? 0}
              </Link>
            </>
          )}
        </p>
      </div>

      {/* Items grouped by topic */}
      {items && items.length > 0 ? (
        <div className="space-y-6">
          {Array.from(topicGroups.entries()).map(([topic, groupItems]) => (
            <section key={topic}>
              <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
                {topic}
              </h3>
              <ul className="space-y-2">
                {(groupItems ?? []).map((item) => {
                  const levelClass =
                    LEVEL_COLORS[item.learning_level ?? ""] ??
                    "bg-gray-100 text-gray-600";
                  const modalityIcon =
                    MODALITY_ICONS[item.modality ?? ""] ?? "•";

                  const sourceHost = item.source_url
                    ? (() => {
                        try {
                          return new URL(item.source_url).hostname.replace(
                            /^www\./,
                            ""
                          );
                        } catch {
                          return item.source_url;
                        }
                      })()
                    : null;

                  return (
                    <li key={item.id}>
                      <div
                        className={`group relative bg-white rounded-lg border border-gray-200 p-4 transition-all ${
                          item.link
                            ? "hover:border-asu-maroon/40 hover:shadow-sm focus-within:border-asu-maroon/40"
                            : ""
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <span
                            className="text-lg flex-shrink-0 mt-0.5"
                            aria-hidden="true"
                          >
                            {modalityIcon}
                          </span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3 flex-wrap">
                              <h4 className="text-base font-medium text-gray-700 group-hover:text-asu-maroon transition-colors">
                                {item.link ? (
                                  <a
                                    href={item.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="before:content-[''] before:absolute before:inset-0 before:rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-asu-maroon focus-visible:ring-offset-2 rounded-sm"
                                  >
                                    {item.item_title}
                                    <svg
                                      className="inline-block w-3.5 h-3.5 ml-1 -mt-0.5 text-gray-400 group-hover:text-asu-maroon"
                                      fill="none"
                                      stroke="currentColor"
                                      viewBox="0 0 24 24"
                                      aria-label="opens in new tab"
                                    >
                                      <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                      />
                                    </svg>
                                  </a>
                                ) : (
                                  item.item_title
                                )}
                              </h4>
                              <div className="flex items-center gap-2 flex-wrap">
                                {item.learning_level && (
                                  <span
                                    className={`text-xs font-medium px-2 py-0.5 rounded-full ${levelClass}`}
                                  >
                                    {item.learning_level}
                                  </span>
                                )}
                                {item.modality && (
                                  <span className="text-xs text-gray-500">
                                    {item.modality}
                                  </span>
                                )}
                              </div>
                            </div>
                            {item.specific_location && (
                              <p className="text-xs text-gray-400 mt-1">
                                📍 {item.specific_location}
                              </p>
                            )}
                            {item.purpose && (
                              <p className="text-sm text-gray-500 mt-2">
                                {item.purpose}
                              </p>
                            )}
                            {item.skill_ids && item.skill_ids.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-2">
                                {item.skill_ids.map((sid) => {
                                  const skill = skillMap.get(sid);
                                  if (!skill) return null;
                                  return (
                                    <span
                                      key={sid}
                                      className="inline-block text-xs bg-asu-maroon/10 text-asu-maroon px-2 py-0.5 rounded"
                                      title={skill.statement}
                                    >
                                      Skill {sid}: {skill.short_name}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                            {item.source_url && sourceHost && (
                              <p className="text-xs text-gray-400 mt-2 relative z-10 w-fit">
                                From{" "}
                                <a
                                  href={item.source_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="underline hover:text-asu-maroon"
                                >
                                  {sourceHost}
                                </a>
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-gray-500">
            {recommendedOnly
              ? "No items at your level in this phase."
              : "No items in this phase yet."}
          </p>
          {recommendedOnly && (allItems?.length ?? 0) > 0 && (
            <Link
              href={`/learning-paths/${phase.id}`}
              className="inline-block mt-3 text-sm text-asu-maroon hover:underline font-medium"
            >
              Show all {allItems?.length ?? 0} items in this phase →
            </Link>
          )}
        </div>
      )}

      {/* Prev/Next navigation */}
      <nav className="flex items-center justify-between gap-3 mt-10 pt-6 border-t border-gray-200">
        {prevPhase ? (
          <Link
            href={`/learning-paths/${prevPhase.id}${qs}`}
            className="flex-1 max-w-xs p-3 rounded-lg border border-gray-200 hover:border-asu-maroon/40 hover:bg-gray-50 transition-colors"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              ← Previous
            </p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">
              {prevPhase.id}. {prevPhase.name}
            </p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
        {nextPhase ? (
          <Link
            href={`/learning-paths/${nextPhase.id}${qs}`}
            className="flex-1 max-w-xs p-3 rounded-lg border border-gray-200 hover:border-asu-maroon/40 hover:bg-gray-50 transition-colors text-right"
          >
            <p className="text-xs text-gray-400 uppercase tracking-wide">
              Next →
            </p>
            <p className="text-sm font-medium text-gray-700 mt-0.5">
              {nextPhase.id}. {nextPhase.name}
            </p>
          </Link>
        ) : (
          <div className="flex-1" />
        )}
      </nav>
    </div>
  );
}
