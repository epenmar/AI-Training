import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { SkillIcon } from "@/components/activities/skillIcons";
import { EditableText } from "@/components/admin/EditableText";

const LEVEL_ORDER = ["Foundational", "Intermediate", "Advanced"] as const;
const LEVEL_COLORS: Record<string, { chip: string; bar: string }> = {
  Foundational: { chip: "bg-asu-blue/10 text-asu-blue", bar: "bg-asu-blue" },
  Intermediate: {
    chip: "bg-asu-green/10 text-green-700",
    bar: "bg-asu-green",
  },
  Advanced: {
    chip: "bg-asu-gold/15 text-yellow-800",
    bar: "bg-asu-gold",
  },
};

const BAND_COLORS: Record<string, string> = {
  "New → Foundational": "bg-asu-blue/10 text-asu-blue",
  "Foundational → Intermediate": "bg-asu-green/10 text-green-700",
  "Intermediate → Advanced": "bg-asu-gold/15 text-yellow-800",
};

export default async function SkillDetailPage({
  params,
}: {
  params: Promise<{ skillId: string }>;
}) {
  const { skillId: skillIdStr } = await params;
  const skillId = parseInt(skillIdStr, 10);
  if (isNaN(skillId)) notFound();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: skill } = await supabase
    .from("skills")
    .select(
      "id, statement, short_name, is_gap, is_active, display_order, derivation_note"
    )
    .eq("id", skillId)
    .single();
  if (!skill || skill.is_active === false) notFound();

  // Materials whose skill_ids array contains this skill.
  const { data: lessonItems } = await supabase
    .from("lesson_flow")
    .select(
      "id, item_title, link, source_url, source, learning_level, modality, specific_location, skill_ids, seq"
    )
    .order("seq", { nullsFirst: false });
  const materials =
    (lessonItems ?? []).filter((item) =>
      (item.skill_ids ?? []).includes(skillId)
    ) ?? [];

  // Activities scoped to this skill.
  const { data: activities } = await supabase
    .from("level_up_activities")
    .select("id, title, band, time_estimate, deliverable, description")
    .eq("skill_id", skillId)
    .eq("is_active", true)
    .order("id");

  // Group materials by learning_level for clean rendering.
  type Material = (typeof materials)[number];
  const byLevel = new Map<string, Material[]>();
  for (const m of materials) {
    const lvl = m.learning_level ?? "Foundational";
    if (!byLevel.has(lvl)) byLevel.set(lvl, []);
    byLevel.get(lvl)!.push(m);
  }
  const orderedLevels = LEVEL_ORDER.filter((lvl) => byLevel.has(lvl));
  const otherLevels = [...byLevel.keys()].filter(
    (lvl) => !(LEVEL_ORDER as readonly string[]).includes(lvl)
  );
  const allLevels = [...orderedLevels, ...otherLevels];

  const displayN = skill.display_order ?? skill.id;
  const totalMaterials = materials.length;
  const totalActivities = activities?.length ?? 0;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/learning-paths"
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
        Skills and Materials
      </Link>

      {/* Header */}
      <header className="mb-6 flex flex-wrap items-start gap-4">
        <div className="flex-shrink-0 inline-flex items-center justify-center w-14 h-14 rounded-xl bg-asu-maroon/5 text-asu-maroon">
          <SkillIcon skillId={skill.id} size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-bold text-asu-maroon uppercase tracking-wider flex flex-wrap items-center gap-1.5">
            Skill {displayN}
            {skill.is_gap && (
              <span className="text-[10px] font-medium normal-case tracking-normal text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                gap-skill
              </span>
            )}
          </p>
          <h1 className="text-2xl font-bold text-gray-700">
            <EditableText
              table="skills"
              rowId={skill.id}
              column="short_name"
              value={skill.short_name}
              singleLine
              label="Skill name"
              revalidate={`/learning-paths/skill/${skill.id}`}
            />
          </h1>
          <p className="text-sm text-gray-600 mt-1 max-w-2xl">
            <EditableText
              table="skills"
              rowId={skill.id}
              column="statement"
              value={skill.statement}
              label="Skill statement"
              revalidate={`/learning-paths/skill/${skill.id}`}
            >
              {skill.statement}
            </EditableText>
          </p>
          {skill.derivation_note && (
            <p className="text-xs text-gray-400 mt-2 italic max-w-2xl">
              <EditableText
                table="skills"
                rowId={skill.id}
                column="derivation_note"
                value={skill.derivation_note}
                label="Derivation note"
                revalidate={`/learning-paths/skill/${skill.id}`}
              >
                {skill.derivation_note}
              </EditableText>
            </p>
          )}
          <p className="text-xs text-gray-500 mt-3">
            {totalMaterials}{" "}
            {totalMaterials === 1 ? "material" : "materials"} · {totalActivities}{" "}
            {totalActivities === 1 ? "activity" : "activities"}
          </p>
        </div>
      </header>

      {/* Materials, grouped by level */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Curated materials
        </h2>
        {allLevels.length === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5">
            <p className="text-sm text-gray-600">
              No curated source material lives directly under this skill yet
              — but the {totalActivities}{" "}
              {totalActivities === 1 ? "activity" : "activities"} below build it
              in practice.
            </p>
          </div>
        ) : (
          <div className="space-y-5">
            {allLevels.map((level) => {
              const items = byLevel.get(level) ?? [];
              const colors =
                LEVEL_COLORS[level] ?? LEVEL_COLORS.Foundational;
              return (
                <div key={level}>
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${colors.chip}`}
                    >
                      {level}
                    </span>
                    <span className="text-[11px] text-gray-400 font-medium">
                      {items.length} {items.length === 1 ? "item" : "items"}
                    </span>
                  </div>
                  <ul className="space-y-2">
                    {items.map((m) => {
                      const url = m.link || m.source_url;
                      const isInternal =
                        url && url.startsWith("/");
                      const meta = [m.modality, m.specific_location?.trim()]
                        .filter(Boolean)
                        .join(" · ");
                      return (
                        <li
                          key={m.id}
                          className="rounded-lg bg-white border border-gray-200 p-3 flex flex-col gap-1"
                        >
                          {url ? (
                            isInternal ? (
                              <Link
                                href={url}
                                className="text-sm font-semibold text-asu-maroon hover:underline inline-flex items-center gap-1"
                              >
                                {m.item_title}
                              </Link>
                            ) : (
                              <a
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-sm font-semibold text-asu-maroon hover:underline inline-flex items-center gap-1"
                              >
                                {m.item_title}
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
                            )
                          ) : (
                            <p className="text-sm font-semibold text-gray-700">
                              {m.item_title}
                            </p>
                          )}
                          {(m.source || meta) && (
                            <p className="text-xs text-gray-500">
                              {m.source && <span>{m.source}</span>}
                              {m.source && meta && <span> · </span>}
                              {meta && <span>{meta}</span>}
                            </p>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Activities scoped to this skill */}
      <section className="mb-8">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
          Activities that build this skill
        </h2>
        {(activities?.length ?? 0) === 0 ? (
          <div className="rounded-lg border border-dashed border-gray-300 bg-gray-50 p-5">
            <p className="text-sm text-gray-600">
              No active activities yet for this skill.
            </p>
          </div>
        ) : (
          <ul className="space-y-2">
            {(activities ?? []).map((a) => {
              const bandClass =
                (a.band && BAND_COLORS[a.band]) ?? "bg-gray-100 text-gray-600";
              return (
                <li
                  key={a.id}
                  className="rounded-lg bg-white border border-gray-200 p-4"
                >
                  <div className="flex flex-wrap items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/activities/${a.id}`}
                        className="text-sm font-semibold text-asu-maroon hover:underline"
                      >
                        {a.title}
                      </Link>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {a.band && (
                          <span
                            className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${bandClass}`}
                          >
                            {a.band}
                          </span>
                        )}
                        {a.time_estimate && (
                          <span className="text-[11px] text-gray-500">
                            {a.time_estimate}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  {a.description && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                      {a.description.replace(/^Overview:\s*/, "")}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
