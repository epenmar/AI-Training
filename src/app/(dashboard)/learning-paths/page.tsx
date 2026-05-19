import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { buildRecommendations } from "@/lib/recommendations";
import { SkillIcon } from "@/components/activities/skillIcons";

// 12-position color palette for the skill cards. Cycles through the
// ASU palette so adjacent skills are visually distinct without any
// skill dominating.
const SKILL_COLOR_PALETTE = [
  { bg: "bg-asu-maroon/10", accent: "bg-asu-maroon", text: "text-asu-maroon" },
  { bg: "bg-asu-blue/10", accent: "bg-asu-blue", text: "text-asu-blue" },
  { bg: "bg-asu-turquoise/10", accent: "bg-asu-turquoise", text: "text-asu-turquoise" },
  { bg: "bg-asu-green/10", accent: "bg-asu-green", text: "text-green-700" },
  { bg: "bg-asu-orange/10", accent: "bg-asu-orange", text: "text-asu-orange" },
  { bg: "bg-asu-gold/15", accent: "bg-asu-gold", text: "text-yellow-800" },
  { bg: "bg-asu-copper/10", accent: "bg-asu-copper", text: "text-asu-copper" },
  { bg: "bg-asu-pink/10", accent: "bg-asu-pink", text: "text-asu-pink" },
  { bg: "bg-asu-maroon/10", accent: "bg-asu-maroon", text: "text-asu-maroon" },
  { bg: "bg-asu-blue/10", accent: "bg-asu-blue", text: "text-asu-blue" },
  { bg: "bg-asu-green/10", accent: "bg-asu-green", text: "text-green-700" },
  { bg: "bg-asu-gold/15", accent: "bg-asu-gold", text: "text-yellow-800" },
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

  // The 12 active skills surfaced as an accordion above the
  // how-it-works infographic. Display order captures the curated
  // sequence. The transparency note explains the adaptation from
  // Maynard's original 14.
  const { data: skills } = await supabase
    .from("skills")
    .select("id, statement, short_name, is_gap, display_order, derivation_note")
    .eq("is_active", true)
    .order("display_order", { nullsFirst: false });

  // Materials per skill — counted across lesson_flow rows whose
  // skill_ids array includes this skill. A material can serve more
  // than one skill, so totals will exceed the lesson_flow row count.
  const { data: lessonItems } = await supabase
    .from("lesson_flow")
    .select("id, skill_ids, learning_level");
  const materialCountBySkill = new Map<number, number>();
  for (const item of lessonItems ?? []) {
    for (const sid of item.skill_ids ?? []) {
      materialCountBySkill.set(
        sid,
        (materialCountBySkill.get(sid) ?? 0) + 1
      );
    }
  }

  // Active activities per skill — used both for the "X activities"
  // copy on each card and for the total in the how-it-works section.
  const { data: actRows } = await supabase
    .from("level_up_activities")
    .select("skill_id")
    .eq("is_active", true);
  const activityCountBySkill = new Map<number, number>();
  for (const row of actRows ?? []) {
    if (row.skill_id == null) continue;
    activityCountBySkill.set(
      row.skill_id,
      (activityCountBySkill.get(row.skill_id) ?? 0) + 1
    );
  }
  const activeActivityCount = actRows?.length ?? 0;

  // Default to personalized view if the user has an attempt; explicit
  // `filter=all` opts into browse-all.
  const recommendedOnly =
    filter === "recommended" || (filter !== "all" && !!latestAttempt);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Skills and Materials</h2>
        <p className="text-gray-500">
          12 skills, sequenced from active practice to critical judgment.
          Each skill has curated reading + reference material AND hands-on
          activities that build it in practice.
        </p>
      </div>

      {/* The 12 active skills the curriculum is built around */}
      {skills && skills.length > 0 && (
        <details className="group mb-6 rounded-xl border border-gray-200 bg-white">
          <summary className="cursor-pointer list-none p-5 flex items-start justify-between gap-3">
            <div>
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 inline-flex items-center gap-2 flex-wrap">
                The {skills.length} AI skills this curriculum teaches
                <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-asu-maroon/10 text-[10px] font-bold text-asu-maroon">
                  {skills.length}
                </span>
                <span
                  className="group/info relative inline-flex items-center"
                  tabIndex={0}
                  aria-label="How this skill list was derived"
                >
                  <svg
                    className="w-4 h-4 text-gray-400 hover:text-asu-maroon focus:text-asu-maroon"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
                    />
                  </svg>
                  <span
                    role="tooltip"
                    className="invisible group-hover/info:visible group-focus/info:visible absolute left-0 top-full mt-2 w-80 max-w-[calc(100vw-2rem)] z-30 rounded-lg bg-white border border-gray-300 shadow-lg p-3 text-xs text-gray-700 leading-relaxed normal-case tracking-normal font-normal"
                  >
                    <strong className="block text-asu-maroon mb-1">
                      Why these 12 skills
                    </strong>
                    We started with Andrew Maynard&apos;s 14-skill AI
                    framework and adapted it for educators and others
                    who already hold a college degree — readers who
                    don&apos;t need an AI-101 vocabulary primer but do
                    need to think harder about classroom and research
                    applications. Skills that overlapped were combined
                    into sharper composites; we added{" "}
                    <em>Bias and equity in AI</em> because it deserves
                    its own attention rather than living implicitly
                    across the others; and the framing across the rest
                    is aligned with ASU&apos;s Principled Innovation
                    charter.
                  </span>
                </span>
              </h3>
              <p className="text-xs text-gray-600 mt-1 max-w-2xl">
                These {skills.length} skills, adapted from Andrew
                Maynard&apos;s AI skills framework, are what every
                activity in the curriculum builds toward. Expand to see
                the full set; click any skill to jump to its materials
                and activities.
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
            {skills.map((skill) => {
              const displayN = skill.display_order ?? skill.id;
              const isAdapted =
                !!skill.derivation_note &&
                skill.derivation_note.toLowerCase().startsWith("adapted");
              const isNew =
                !!skill.derivation_note &&
                skill.derivation_note.toLowerCase().startsWith("new");
              // The dropdown lives on the Skills and Materials page,
              // so each skill chip jumps to that skill's detail page
              // (same destination as the cards below) — not to the
              // activities filter view.
              const skillHref = `/learning-paths/skill/${skill.id}`;
              return (
                <li key={skill.id}>
                  <Link
                    href={skillHref}
                    className="group flex items-start gap-3 rounded-lg border border-gray-200 bg-white p-3 hover:border-asu-maroon/40 hover:bg-asu-maroon/5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-asu-maroon transition-colors"
                  >
                    <div className="flex-shrink-0 inline-flex h-9 w-9 items-center justify-center rounded-md bg-asu-maroon/5 text-asu-maroon group-hover:bg-asu-maroon/10">
                      <SkillIcon skillId={skill.id} size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-asu-maroon uppercase tracking-wider flex flex-wrap items-center gap-1.5">
                        Skill {displayN}
                        {skill.is_gap && (
                          <span className="text-[10px] font-medium normal-case tracking-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            gap-skill
                          </span>
                        )}
                        {isAdapted && skill.derivation_note && (
                          <span
                            tabIndex={0}
                            aria-label={skill.derivation_note}
                            className="group/pill relative inline-flex text-[10px] font-medium normal-case tracking-normal text-asu-blue bg-asu-blue/10 px-1.5 py-0.5 rounded cursor-help focus:outline-none"
                          >
                            adapted
                            <span
                              role="tooltip"
                              className="invisible group-hover/pill:visible group-focus/pill:visible absolute left-0 top-full mt-1 w-72 max-w-[calc(100vw-2rem)] z-30 rounded-lg bg-white border border-gray-300 shadow-lg p-2.5 text-[11px] text-gray-700 leading-relaxed font-normal"
                            >
                              {skill.derivation_note}
                            </span>
                          </span>
                        )}
                        {isNew && skill.derivation_note && (
                          <span
                            tabIndex={0}
                            aria-label={skill.derivation_note}
                            className="group/pill relative inline-flex text-[10px] font-medium normal-case tracking-normal text-green-700 bg-asu-green/10 px-1.5 py-0.5 rounded cursor-help focus:outline-none"
                          >
                            new
                            <span
                              role="tooltip"
                              className="invisible group-hover/pill:visible group-focus/pill:visible absolute left-0 top-full mt-1 w-72 max-w-[calc(100vw-2rem)] z-30 rounded-lg bg-white border border-gray-300 shadow-lg p-2.5 text-[11px] text-gray-700 leading-relaxed font-normal"
                            >
                              {skill.derivation_note}
                            </span>
                          </span>
                        )}
                      </p>
                      <p className="text-sm font-semibold text-gray-700 group-hover:text-asu-maroon leading-snug">
                        {skill.short_name}
                      </p>
                      <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                        {skill.statement}
                      </p>
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </details>
      )}

      {/* How materials + activities work together */}
      <section
        aria-label="How materials and activities work together"
        className="mb-6 rounded-xl bg-gradient-to-br from-asu-green/5 via-white to-asu-blue/5 border border-gray-200 p-5"
      >
        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          How materials and activities work together
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
              <p className="text-sm font-bold text-gray-700">Source material</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              ASU&apos;s GenAI course modules, vetted external guides, and
              reference PDFs. The raw curriculum.
            </p>
          </div>
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
              The {activeActivityCount} hands-on activities pull from these
              materials. As you work through an activity, the relevant
              pages, lessons, and tools surface inline — you learn through
              doing.
            </p>
          </div>
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
              <p className="text-sm font-bold text-gray-700">Or come back here</p>
            </div>
            <p className="text-xs text-gray-600 leading-relaxed">
              When you want to read a source straight through, or revisit a
              specific lesson outside an activity, come here and jump
              straight to it from the skill it builds.
            </p>
          </div>
        </div>
      </section>

      {/* Filter toggle — personalized vs. browse all */}
      <div
        role="tablist"
        aria-label="Skills view"
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
          Browse all skills
        </Link>
      </div>

      {recommendedOnly ? (
        <PersonalizedSkillGrid
          latestAttempt={latestAttempt}
          skills={skills ?? []}
          activityCountBySkill={activityCountBySkill}
          lessonItems={lessonItems ?? []}
        />
      ) : (
        <AllSkillGrid
          skills={skills ?? []}
          materialCountBySkill={materialCountBySkill}
          activityCountBySkill={activityCountBySkill}
        />
      )}
    </div>
  );
}

type SkillRow = {
  id: number;
  short_name: string;
  statement: string;
  is_gap: boolean | null;
  display_order: number | null;
  derivation_note: string | null;
};

function AllSkillGrid({
  skills,
  materialCountBySkill,
  activityCountBySkill,
}: {
  skills: SkillRow[];
  materialCountBySkill: Map<number, number>;
  activityCountBySkill: Map<number, number>;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {skills.map((skill, i) => (
        <SkillCard
          key={skill.id}
          skill={skill}
          colorIdx={i}
          materialCount={materialCountBySkill.get(skill.id) ?? 0}
          activityCount={activityCountBySkill.get(skill.id) ?? 0}
        />
      ))}
    </div>
  );
}

async function PersonalizedSkillGrid({
  latestAttempt,
  skills,
  activityCountBySkill,
  lessonItems,
}: {
  latestAttempt: { id: string; completed_at: string } | null;
  skills: SkillRow[];
  activityCountBySkill: Map<number, number>;
  lessonItems: { skill_ids: number[] | null; learning_level: string | null }[];
}) {
  if (!latestAttempt) {
    return (
      <div className="bg-asu-blue/5 border border-asu-blue/20 rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-1">
          Take the self-assessment to get a personalized view
        </h3>
        <p className="text-sm text-gray-500 mb-4">
          Answer 14 quick scenarios and we&apos;ll filter your skills down to
          the ones you can grow next.
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

  const supabase = await createClient();
  const [{ data: responses }, { data: questions }] = await Promise.all([
    supabase
      .from("assessment_responses")
      .select("question_id, score")
      .eq("attempt_id", latestAttempt.id),
    supabase.from("assessment_questions").select("id, skill_id"),
  ]);
  const qSkillMap = new Map((questions ?? []).map((q) => [q.id, q.skill_id]));
  const targets = buildRecommendations(responses ?? [], qSkillMap);
  // skill_id -> target level (Foundational / Intermediate / Advanced)
  const skillToLevel = new Map(targets.map((t) => [t.skillId, t.targetLevel]));

  if (targets.length === 0) {
    return (
      <div className="bg-asu-green/10 border border-asu-green rounded-lg p-6">
        <h3 className="text-base font-semibold text-gray-700 mb-1">
          You&apos;re at Advanced on every skill
        </h3>
        <p className="text-sm text-gray-600">
          No bridge content left. Switch to &ldquo;Browse all skills&rdquo; to
          revisit anything, or retake the assessment.
        </p>
      </div>
    );
  }

  // Per-skill: how many lesson_flow items are AT this learner's target
  // level? Used to label the card with "X at your level."
  const atLevelBySkill = new Map<number, number>();
  for (const item of lessonItems) {
    if (!item.learning_level) continue;
    for (const sid of item.skill_ids ?? []) {
      if (skillToLevel.get(sid) === item.learning_level) {
        atLevelBySkill.set(sid, (atLevelBySkill.get(sid) ?? 0) + 1);
      }
    }
  }

  const targetSkillIds = new Set(targets.map((t) => t.skillId));
  const visibleSkills = skills.filter((s) => targetSkillIds.has(s.id));
  const totalAtLevel = Array.from(atLevelBySkill.values()).reduce(
    (a, b) => a + b,
    0
  );
  const hiddenCount = skills.length - visibleSkills.length;
  const completedAt = new Date(latestAttempt.completed_at).toLocaleDateString(
    "en-US",
    { month: "short", day: "numeric", year: "numeric" }
  );

  return (
    <div>
      <p className="text-sm text-gray-500 mb-6">
        Based on your assessment from {completedAt},{" "}
        {visibleSkills.length}{" "}
        {visibleSkills.length === 1 ? "skill is" : "skills are"} where you
        can grow next. {totalAtLevel} materials match your current level.
        {hiddenCount > 0 && (
          <>
            {" "}
            {hiddenCount} {hiddenCount === 1 ? "skill is" : "skills are"}{" "}
            hidden — you&apos;ve already leveled past the content there.
          </>
        )}
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {visibleSkills.map((skill, i) => (
          <SkillCard
            key={skill.id}
            skill={skill}
            colorIdx={i}
            materialCount={atLevelBySkill.get(skill.id) ?? 0}
            activityCount={activityCountBySkill.get(skill.id) ?? 0}
            targetLevel={skillToLevel.get(skill.id) ?? null}
            countLabel="at your level"
          />
        ))}
      </div>
      <div className="mt-4 text-xs text-gray-500">
        Materials counts above show resources at your target level.{" "}
        <Link
          href="/learning-paths?filter=all"
          className="text-asu-maroon underline hover:opacity-80"
        >
          Switch to all skills
        </Link>{" "}
        to see every material.
      </div>
    </div>
  );
}

function SkillCard({
  skill,
  colorIdx,
  materialCount,
  activityCount,
  targetLevel,
  countLabel,
}: {
  skill: SkillRow;
  colorIdx: number;
  materialCount: number;
  activityCount: number;
  targetLevel?: string | null;
  countLabel?: string;
}) {
  const color =
    SKILL_COLOR_PALETTE[colorIdx % SKILL_COLOR_PALETTE.length] ??
    SKILL_COLOR_PALETTE[0];
  const displayN = skill.display_order ?? skill.id;
  const materialLabel = countLabel
    ? `${materialCount} ${countLabel}`
    : `${materialCount} ${materialCount === 1 ? "material" : "materials"}`;
  return (
    <Link
      href={`/learning-paths/skill/${skill.id}`}
      className="group relative block rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:ring-offset-2"
    >
      <div className={`h-1.5 w-full ${color.accent}`} />
      <div className="p-5">
        <div className="flex items-start justify-between gap-2 mb-2">
          <div
            className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${color.bg} ${color.text}`}
          >
            <SkillIcon skillId={skill.id} size={20} />
          </div>
          <span className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">
            Skill {displayN}
          </span>
        </div>
        <h3 className="text-base font-semibold text-gray-700 group-hover:text-asu-maroon transition-colors">
          {skill.short_name}
        </h3>
        {targetLevel && (
          <p className="text-[11px] text-asu-maroon mt-0.5 font-bold uppercase tracking-wider">
            Target: {targetLevel}
          </p>
        )}
        <p className="text-xs text-gray-500 mt-2 line-clamp-2">
          {skill.statement}
        </p>
        <div className="mt-3 flex items-center gap-3 text-xs text-gray-500">
          <span className="font-medium">{materialLabel}</span>
          <span className="text-gray-300">·</span>
          <span className="font-medium">
            {activityCount} {activityCount === 1 ? "activity" : "activities"}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-sm font-medium text-asu-maroon mt-3 group-hover:gap-2 transition-all">
          Explore skill
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
