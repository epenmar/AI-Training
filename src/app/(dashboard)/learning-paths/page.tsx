import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buildRecommendations } from "@/lib/recommendations";
import { SkillIcon } from "@/components/activities/skillIcons";

// One color per Bloom phase — rotates through ASU palette
const PHASE_COLORS = [
  { bg: "bg-asu-gray/10", accent: "bg-asu-gray", text: "text-gray-700" },
  { bg: "bg-asu-blue/10", accent: "bg-asu-blue", text: "text-asu-blue" },
  { bg: "bg-asu-turquoise/10", accent: "bg-asu-turquoise", text: "text-asu-turquoise" },
  { bg: "bg-asu-green/10", accent: "bg-asu-green", text: "text-green-700" },
  { bg: "bg-asu-orange/10", accent: "bg-asu-orange", text: "text-asu-orange" },
  { bg: "bg-asu-gold/15", accent: "bg-asu-gold", text: "text-yellow-800" },
  { bg: "bg-asu-copper/10", accent: "bg-asu-copper", text: "text-asu-copper" },
  { bg: "bg-asu-pink/10", accent: "bg-asu-pink", text: "text-asu-pink" },
  { bg: "bg-asu-maroon/10", accent: "bg-asu-maroon", text: "text-asu-maroon" },
];

export default async function LearningPathsPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const { filter } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: latestAttempt } = await supabase
    .from("assessment_attempts")
    .select("id, completed_at")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  // The 14 Maynard skills, surfaced as an accordion above the
  // how-it-works infographic so users can see the full skill set the
  // curriculum is built around.
  const { data: skills } = await supabase
    .from("skills")
    .select("id, statement, short_name, is_gap")
    .order("id");

  // Default to personalized view if the user has an attempt; explicit
  // `filter=all` opts into browse-all.
  const recommendedOnly =
    filter === "recommended" || (filter !== "all" && !!latestAttempt);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Learning Materials</h2>
        <p className="text-gray-500">
          9 phases of curated source material, organized by Bloom&apos;s
          Taxonomy from foundational understanding to advanced creation.
        </p>
      </div>

      {/* The 14 Maynard skills the curriculum is built around */}
      {skills && skills.length > 0 && (
        <details className="group mb-6 rounded-xl border border-gray-200 bg-white">
          <summary className="cursor-pointer list-none p-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 inline-flex items-center gap-2">
                The 14 AI skills this curriculum teaches
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-asu-maroon/10 text-[10px] font-bold text-asu-maroon">
                  {skills.length}
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                The 9 Bloom phases below organize the source material;
                these 14 skills are what the activities build. Tap to see
                the full skill set.
              </p>
            </div>
            <svg
              className="w-4 h-4 mt-1 text-gray-500 transition-transform group-open:rotate-180 flex-shrink-0"
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
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 px-5 pb-5">
            {skills.map((skill) => (
              <li
                key={skill.id}
                className="flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3"
              >
                <div className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-md bg-asu-maroon/5 text-asu-maroon">
                  <SkillIcon skillId={skill.id} size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold text-asu-maroon uppercase tracking-wider">
                    Skill {skill.id}
                    {skill.is_gap && (
                      <span className="ml-2 text-[10px] font-medium normal-case tracking-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                        gap-skill
                      </span>
                    )}
                  </p>
                  <p className="text-sm font-semibold text-gray-700 leading-snug">
                    {skill.short_name}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                    {skill.statement}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* How activities and materials relate */}
      <section
        aria-label="How materials and activities work together"
        className="mb-6 rounded-xl bg-gradient-to-br from-asu-green/5 via-white to-asu-blue/5 border border-gray-200 p-5"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          How materials and activities work together
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          {/* Step 1 — Materials */}
          <div className="rounded-lg bg-white border border-asu-green/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-asu-green text-white">
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
                    d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25"
                  />
                </svg>
              </span>
              <p className="text-sm font-bold text-gray-700">
                Source material
              </p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              ASU&apos;s GenAI course modules, vetted external guides, and
              reference PDFs. The raw curriculum.
            </p>
          </div>

          {/* Arrow / connector */}
          <div className="rounded-lg bg-white border border-asu-maroon/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-asu-maroon text-white">
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
                    d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
                  />
                </svg>
              </span>
              <p className="text-sm font-bold text-gray-700">
                Activities → learning by doing
              </p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              The 42 hands-on activities pull from these materials. As you
              work through an activity, the relevant pages, lessons, and
              tools surface inline, you learn through doing.
            </p>
          </div>

          {/* Direct access */}
          <div className="rounded-lg bg-white border border-asu-blue/30 p-4">
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-asu-blue text-white">
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
                    d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                  />
                </svg>
              </span>
              <p className="text-sm font-bold text-gray-700">
                Or come back here
              </p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              When you want to read a source straight through, or revisit a
              specific lesson outside an activity, come to this page and
              jump directly to the source.
            </p>
          </div>
        </div>
      </section>

      {/* Filter toggle */}
      <div
        role="tablist"
        aria-label="Learning paths view"
        className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-6"
      >
        <Link
          href="/learning-paths?filter=recommended"
          role="tab"
          aria-selected={recommendedOnly}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            recommendedOnly
              ? "bg-white text-asu-maroon shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Personalized for me
        </Link>
        <Link
          href="/learning-paths?filter=all"
          role="tab"
          aria-selected={!recommendedOnly}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            !recommendedOnly
              ? "bg-white text-gray-700 shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Browse all phases
        </Link>
      </div>

      {recommendedOnly ? (
        <PersonalizedPhaseGrid latestAttempt={latestAttempt} />
      ) : (
        <AllPhaseGrid />
      )}
    </div>
  );
}

async function AllPhaseGrid() {
  const supabase = await createClient();
  const { data: phases } = await supabase
    .from("bloom_phases")
    .select("*")
    .order("sort_order");

  const { data: lessonItems } = await supabase
    .from("lesson_flow")
    .select("bloom_phase_id");

  const countByPhase = new Map<number, number>();
  (lessonItems ?? []).forEach((item) => {
    countByPhase.set(
      item.bloom_phase_id,
      (countByPhase.get(item.bloom_phase_id) ?? 0) + 1
    );
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {(phases ?? []).map((phase) => (
        <PhaseCard
          key={phase.id}
          phase={phase}
          itemCount={countByPhase.get(phase.id) ?? 0}
          href={`/learning-paths/${phase.id}`}
          countLabel={(n) => `${n} ${n === 1 ? "item" : "items"}`}
        />
      ))}
    </div>
  );
}

async function PersonalizedPhaseGrid({
  latestAttempt,
}: {
  latestAttempt: { id: string; completed_at: string } | null;
}) {
  const supabase = await createClient();

  if (!latestAttempt) {
    return (
      <div className="bg-asu-blue/5 border border-asu-blue/20 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-1">
          Take the self-assessment to get a personalized path
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Answer 14 quick scenarios and we&apos;ll filter each phase down to
          just the resources that match your current level.
        </p>
        <Link
          href="/assessment"
          className="inline-block px-4 py-2 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
        >
          Start Assessment
        </Link>
      </div>
    );
  }

  const [
    { data: responses },
    { data: questions },
    { data: phases },
    { data: lessonItems },
  ] = await Promise.all([
    supabase
      .from("assessment_responses")
      .select("question_id, score")
      .eq("attempt_id", latestAttempt.id),
    supabase.from("assessment_questions").select("id, skill_id"),
    supabase.from("bloom_phases").select("*").order("sort_order"),
    supabase
      .from("lesson_flow")
      .select("id, bloom_phase_id, learning_level, skill_ids"),
  ]);

  const qSkillMap = new Map((questions ?? []).map((q) => [q.id, q.skill_id]));
  const targets = buildRecommendations(responses ?? [], qSkillMap);
  // skillId -> targetLevel (e.g. 1 -> "Advanced")
  const skillToLevel = new Map(
    targets.map((t) => [t.skillId, t.targetLevel])
  );

  if (targets.length === 0) {
    return (
      <div className="bg-asu-green/10 border border-asu-green rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-1">
          You&apos;re at Advanced on every skill
        </h3>
        <p className="text-sm text-gray-600">
          No bridge content left. Switch to &ldquo;Browse all phases&rdquo; to
          revisit anything, or retake the assessment.
        </p>
      </div>
    );
  }

  // Count "at your level" items per phase
  const countByPhase = new Map<number, number>();
  (lessonItems ?? []).forEach((item) => {
    if (!item.learning_level) return;
    const matches = (item.skill_ids ?? []).some(
      (sid) => skillToLevel.get(sid) === item.learning_level
    );
    if (matches) {
      countByPhase.set(
        item.bloom_phase_id,
        (countByPhase.get(item.bloom_phase_id) ?? 0) + 1
      );
    }
  });

  const visiblePhases = (phases ?? []).filter(
    (p) => (countByPhase.get(p.id) ?? 0) > 0
  );
  const totalCount = Array.from(countByPhase.values()).reduce(
    (a, b) => a + b,
    0
  );
  const hiddenCount = (phases?.length ?? 0) - visiblePhases.length;
  const completedAt = new Date(latestAttempt.completed_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        Based on your assessment from {completedAt}, {totalCount} resources
        across {visiblePhases.length} phases match your current level.
        {hiddenCount > 0 && (
          <>
            {" "}
            {hiddenCount} {hiddenCount === 1 ? "phase is" : "phases are"}{" "}
            hidden — you&apos;ve already leveled past the content there.
          </>
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visiblePhases.map((phase) => (
          <PhaseCard
            key={phase.id}
            phase={phase}
            itemCount={countByPhase.get(phase.id) ?? 0}
            href={`/learning-paths/${phase.id}?filter=recommended`}
            countLabel={(n) =>
              `${n} at your level`
            }
          />
        ))}
      </div>
    </div>
  );
}

type PhaseRow = {
  id: number;
  name: string;
  bloom_levels: string;
  description: string | null;
};

function PhaseCard({
  phase,
  itemCount,
  href,
  countLabel,
}: {
  phase: PhaseRow;
  itemCount: number;
  href: string;
  countLabel: (n: number) => string;
}) {
  const color = PHASE_COLORS[phase.id] ?? PHASE_COLORS[0];
  return (
    <Link
      href={href}
      className="group relative block rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:ring-offset-2"
    >
      <div className={`h-1.5 w-full ${color.accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${color.bg} ${color.text} font-bold text-sm`}
          >
            {phase.id}
          </div>
          <span className="text-xs text-gray-400 font-medium">
            {countLabel(itemCount)}
          </span>
        </div>
        <h3 className="text-base font-semibold text-gray-700 group-hover:text-asu-maroon transition-colors">
          {phase.name}
        </h3>
        <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide font-medium">
          {phase.bloom_levels}
        </p>
        {phase.description && (
          <p className="text-sm text-gray-500 mt-2 line-clamp-2">
            {phase.description}
          </p>
        )}
        <span className="inline-flex items-center gap-1 text-sm font-medium text-asu-maroon mt-3 group-hover:gap-2 transition-all">
          Explore phase
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
        </span>
      </div>
    </Link>
  );
}
