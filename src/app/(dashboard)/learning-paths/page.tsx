import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buildRecommendations } from "@/lib/recommendations";

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
  const recommendedOnly = filter === "recommended";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Learning Paths</h2>
        <p className="text-gray-500">
          9 phases organized by Bloom&apos;s Taxonomy, from foundational
          understanding to advanced creation.
        </p>
      </div>

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
          href="/learning-paths"
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
        <PersonalizedPhaseGrid userId={user.id} />
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

async function PersonalizedPhaseGrid({ userId }: { userId: string }) {
  const supabase = await createClient();

  const { data: latestAttempt } = await supabase
    .from("assessment_attempts")
    .select("id, completed_at")
    .eq("user_id", userId)
    .order("completed_at", { ascending: false })
    .limit(1)
    .maybeSingle();

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
