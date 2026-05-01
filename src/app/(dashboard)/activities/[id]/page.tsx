import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { CompletionPanel } from "@/components/activities/CompletionPanel";
import { AsuResourcesPanel } from "@/components/activities/AsuResourcesPanel";
import { StepInteractive } from "@/components/activities/interactives/StepInteractive";
import { VocabTerm } from "@/components/activities/VocabTerm";
import { buildRecommendations } from "@/lib/recommendations";

const BAND_COLORS: Record<string, string> = {
  "New → Foundational": "bg-asu-blue/10 text-asu-blue",
  "Foundational → Intermediate": "bg-asu-green/10 text-green-700",
  "Intermediate → Advanced": "bg-asu-gold/15 text-yellow-800",
};

// Render detailed_help / instruction strings with minimal markdown:
//   **bold**
//   [text](url)
//   {{term:definition}} — inline click-to-reveal vocab term
// Anything else passes through as plain text.
function renderRichText(text: string): React.ReactNode[] {
  const tokenRegex =
    /\*\*([^*]+)\*\*|\[([^\]]+)\]\(([^)]+)\)|\{\{([^:}]+):([^}]+)\}\}/g;
  const out: React.ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let key = 0;
  while ((match = tokenRegex.exec(text)) !== null) {
    if (match.index > last) {
      out.push(text.slice(last, match.index));
    }
    if (match[1] !== undefined) {
      out.push(
        <strong key={`b${key++}`} className="font-semibold text-gray-700">
          {match[1]}
        </strong>
      );
    } else if (match[2] !== undefined && match[3] !== undefined) {
      const linkText = match[2];
      const href = match[3];
      // Internal links (relative paths starting with "/") get a Next.js
      // Link so they navigate in the same tab; external URLs open new
      // tabs as before.
      if (href.startsWith("/")) {
        out.push(
          <Link
            key={`a${key++}`}
            href={href}
            className="text-asu-maroon underline hover:opacity-80"
          >
            {linkText}
          </Link>
        );
      } else {
        out.push(
          <a
            key={`a${key++}`}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-asu-maroon underline hover:opacity-80"
          >
            {linkText}
          </a>
        );
      }
    } else if (match[4] !== undefined && match[5] !== undefined) {
      out.push(
        <VocabTerm
          key={`v${key++}`}
          term={match[4].trim()}
          definition={match[5].trim()}
        />
      );
    }
    last = match.index + match[0].length;
  }
  if (last < text.length) out.push(text.slice(last));
  return out;
}

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

  // Sources to "explore further" — pulled live from lesson_flow rows that
  // match this activity's skill + linked phases. The activity teaches by
  // doing; this callout lets the learner read the underlying material
  // directly when they want to go deeper.
  const phaseIds = activity.linked_phase_ids ?? [];
  const { data: lessonItems } =
    phaseIds.length > 0
      ? await supabase
          .from("lesson_flow")
          .select(
            "id,item_title,link,source_url,source,learning_level,modality,specific_location,skill_ids"
          )
          .in("bloom_phase_id", phaseIds)
      : { data: [] };
  const autoSources = (lessonItems ?? [])
    .filter((it) => (it.skill_ids ?? []).includes(activity.skill_id))
    .filter((it) => !!(it.link || it.source_url))
    .map((it) => ({
      key: `auto-${it.id}`,
      title: it.item_title ?? "",
      url: it.link ?? it.source_url ?? "",
      source: it.source ?? null,
      meta: [it.learning_level, it.modality].filter(Boolean).join(" · "),
      where: it.specific_location?.trim() ?? null,
    }))
    .slice(0, 6);

  // Curated per-activity extras (what specific steps' detailed_help used to
  // link inline). Stored as jsonb on the activity row.
  type ExtraSource = {
    title: string;
    url: string;
    source?: string;
    meta?: string;
    where?: string;
  };
  const rawExtras = Array.isArray(activity.extra_sources)
    ? (activity.extra_sources as ExtraSource[])
    : [];
  const extraSources = rawExtras
    .filter((e) => e && typeof e.title === "string" && typeof e.url === "string")
    .map((e, i) => ({
      key: `extra-${i}`,
      title: e.title,
      url: e.url,
      source: e.source ?? null,
      meta: e.meta ?? "",
      where: e.where ?? null,
    }));

  // Curated extras first (manually picked for this activity), auto-derived
  // sources below them.
  const exploreSources = [...extraSources, ...autoSources];

  // Determine the user's "next activity" for the bottom-of-page nav. Prefer
  // the next waypoint on their personalized roadmap (if they have an
  // assessment); otherwise advance through this activity's skill+band.
  const { data: latestAttempt } = await supabase
    .from("assessment_attempts")
    .select("id")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  let nextActivity: { id: number; title: string } | null = null;
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
    const targets = buildRecommendations(responses ?? [], qSkillMap);
    if (targets.length > 0) {
      const { data: roadmapActs } = await supabase
        .from("level_up_activities")
        .select("id, title, skill_id, band");
      const { data: completionRows } = await supabase
        .from("user_activity_completions")
        .select("activity_id")
        .eq("user_id", user.id);
      const completedSet = new Set(
        (completionRows ?? []).map((r) => r.activity_id)
      );
      // Build the same waypoint list the recommended view uses, then pick
      // the first incomplete one that isn't this activity.
      for (const t of targets) {
        const candidates = (roadmapActs ?? []).filter(
          (a) => a.skill_id === t.skillId && a.band === t.band
        );
        const next = candidates.find(
          (a) => !completedSet.has(a.id) && a.id !== activityId
        );
        if (next) {
          nextActivity = { id: next.id, title: next.title };
          break;
        }
      }
    }
  }
  if (!nextActivity) {
    // Fallback: next id in this skill, or null.
    const { data: sameSkill } = await supabase
      .from("level_up_activities")
      .select("id, title, band")
      .eq("skill_id", activity.skill_id)
      .order("id");
    const idx = (sameSkill ?? []).findIndex((a) => a.id === activityId);
    const nextInSkill = idx >= 0 ? (sameSkill ?? [])[idx + 1] : null;
    if (nextInSkill) {
      nextActivity = { id: nextInSkill.id, title: nextInSkill.title };
    }
  }

  const mapHref = latestAttempt
    ? "/activities?filter=recommended"
    : `/activities?filter=all#skill-${activity.skill_id}-heading`;

  const bandClass =
    BAND_COLORS[activity.band] ?? "bg-gray-100 text-gray-600";

  // Split off the optional extension (not counted in time_estimate)
  const [coreDescription, extension] = (activity.description ?? "").split(
    "\n\nOptional extension: "
  );

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back link — sends users back to the All Activities page anchored at
          this activity's skill section. */}
      <Link
        href={`/activities?filter=all#skill-${activity.skill_id}-heading`}
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
              href={`/activities?filter=all#skill-${skill.id}-heading`}
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

        {(activity.value_add || (activity.objectives && activity.objectives.length > 0)) && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-3">
            {activity.value_add && (
              <div className="bg-asu-maroon/5 border border-asu-maroon/15 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-asu-maroon mb-1.5">
                  Value add
                </p>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {activity.value_add}
                </p>
              </div>
            )}
            {activity.objectives && activity.objectives.length > 0 && (
              <div className="bg-asu-blue/5 border border-asu-blue/20 rounded-lg p-4">
                <p className="text-[11px] font-semibold uppercase tracking-wider text-asu-blue mb-1.5">
                  Objectives
                </p>
                <ul className="text-sm text-gray-700 leading-relaxed space-y-1 list-disc pl-5">
                  {activity.objectives.map((obj, i) => (
                    <li key={i}>{obj}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Steps — instruction is the only thing visible by default. Everything
          else (help text, ASU resources, interactives) lives inside the step's
          single expandable section. */}
      {((steps && steps.length > 0) || extension) && (
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-3">
            Step-by-step
          </h3>
          {steps && steps.length > 0 && (
            <ol className="space-y-3">
              {steps.map((step) => {
                const hasHelp = !!step.detailed_help?.trim();
                const hasInteractive =
                  step.interactive_type != null &&
                  step.interactive_data != null;
                const showPlatform = !!step.show_asu_resources;
                const showExternal = !!step.show_external_tools;
                const showResources = showPlatform || showExternal;
                const hasExpand = hasHelp || hasInteractive || showResources;
                return (
                  <li
                    key={step.id}
                    className="bg-white border border-gray-200 rounded-lg p-4"
                  >
                    <div className="flex gap-3">
                      <span className="flex-shrink-0 w-7 h-7 rounded-full bg-asu-maroon text-white text-sm font-bold flex items-center justify-center">
                        {step.step_number}
                      </span>
                      <p className="text-sm text-gray-700 whitespace-pre-line flex-1">
                        {renderRichText(step.instruction)}
                      </p>
                    </div>
                    {hasExpand && (
                      <details className="group mt-3 ml-10">
                        <summary className="cursor-pointer list-none text-xs font-medium text-asu-maroon hover:underline inline-flex items-center gap-1">
                          <svg
                            className="w-3.5 h-3.5 transition-transform group-open:rotate-90"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M9 5l7 7-7 7"
                            />
                          </svg>
                          Show details, resources &amp; practice
                        </summary>
                        <div className="mt-3 space-y-3">
                          {hasHelp && (
                            <div className="text-sm text-gray-600 whitespace-pre-line border-l-2 border-asu-maroon/20 pl-3">
                              {renderRichText(step.detailed_help ?? "")}
                            </div>
                          )}
                          {showResources && (
                            <AsuResourcesPanel
                              skillId={activity.skill_id}
                              band={activity.band}
                              activityId={activityId}
                              activityTitle={activity.title}
                              activityDeliverable={activity.deliverable ?? null}
                              showPlatform={showPlatform}
                              showExternal={showExternal}
                            />
                          )}
                          {hasInteractive && (
                            <StepInteractive
                              type={step.interactive_type as string}
                              data={step.interactive_data}
                            />
                          )}
                        </div>
                      </details>
                    )}
                  </li>
                );
              })}
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

      {/* Explore the Sources — collapsible pale-green accordion under the
          steps. Closed by default so the activity remains the focus. */}
      {exploreSources.length > 0 && (
        <details className="group mb-6 rounded-xl border border-asu-green/30 bg-asu-green/5">
          <summary className="cursor-pointer list-none p-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-green-800 inline-flex items-center gap-2">
                Explore the Sources
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-asu-green/20 text-[10px] font-bold text-green-800">
                  {exploreSources.length}
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                The activity above teaches you by doing. If you want to read
                the underlying material directly, here&apos;s what it draws
                from.
              </p>
            </div>
            <svg
              className="w-4 h-4 mt-1 text-green-800 transition-transform group-open:rotate-180 flex-shrink-0"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </summary>
          <ul className="space-y-2 px-5 pb-5">
            {exploreSources.map((item) => {
              const url = item.url;
              const meta = item.meta;
              const where = item.where;
              return (
                <li
                  key={item.key}
                  className="rounded-lg bg-white border border-gray-200 p-3"
                >
                  <a
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-asu-maroon hover:underline inline-flex items-center gap-1"
                  >
                    {item.title}
                    <svg
                      className="w-3 h-3 text-gray-400 flex-shrink-0"
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
                  {(meta || where || item.source) && (
                    <p className="text-xs text-gray-500 mt-0.5">
                      {item.source && <span>{item.source}</span>}
                      {item.source && (meta || where) && <span> · </span>}
                      {meta && <span>{meta}</span>}
                      {where && (
                        <>
                          {meta && <span> · </span>}
                          <span>{where}</span>
                        </>
                      )}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {/* Linked phases */}
      {linkedPhases && linkedPhases.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">
            Related Learning Materials
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
        communityAction={activity.community_action ?? "lookbook"}
      />

      {/* Bottom-of-page navigation */}
      <nav
        aria-label="Activity navigation"
        className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-gray-200 pt-5"
      >
        <Link
          href={mapHref}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
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
              d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l5.553 2.776A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
            />
          </svg>
          Back to{" "}
          {latestAttempt ? "your roadmap" : "all activities"}
        </Link>
        {nextActivity && (
          <Link
            href={`/activities/${nextActivity.id}`}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover"
          >
            Next activity
            <span className="hidden sm:inline text-white/80 font-normal">
              · {nextActivity.title}
            </span>
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
                d="M17 8l4 4m0 0l-4 4m4-4H3"
              />
            </svg>
          </Link>
        )}
      </nav>
    </div>
  );
}
