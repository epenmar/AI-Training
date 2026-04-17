"use client";

import { useRouter } from "next/navigation";

interface Skill {
  id: number;
  short_name: string;
}

interface Props {
  skills: Skill[];
  activeSkillId: string;
  activeBand: string;
  hasFilters: boolean;
}

const BAND_OPTIONS = [
  { value: "", label: "All levels" },
  { value: "New → Foundational", label: "New → Foundational" },
  { value: "Foundational → Intermediate", label: "Foundational → Intermediate" },
  { value: "Intermediate → Advanced", label: "Intermediate → Advanced" },
];

function truncate(text: string, max: number) {
  return text.length > max ? `${text.slice(0, max - 1).trimEnd()}…` : text;
}

export function CommunityFilters({
  skills,
  activeSkillId,
  activeBand,
  hasFilters,
}: Props) {
  const router = useRouter();

  function pushParams(next: { skill?: string; band?: string }) {
    const params = new URLSearchParams();
    const skill = next.skill ?? activeSkillId;
    const band = next.band ?? activeBand;
    if (skill) params.set("skill", skill);
    if (band) params.set("band", band);
    const qs = params.toString();
    router.push(qs ? `/community?${qs}` : "/community");
  }

  return (
    <div className="mb-5 flex flex-wrap items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
      <div className="flex flex-col w-full sm:w-auto min-w-0">
        <label
          htmlFor="skill-filter"
          className="text-xs text-gray-500 font-medium mb-0.5"
        >
          Skill
        </label>
        <select
          id="skill-filter"
          value={activeSkillId}
          onChange={(e) => pushParams({ skill: e.target.value })}
          className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent w-full sm:w-56"
        >
          <option value="">All skills</option>
          {skills.map((s) => (
            <option key={s.id} value={s.id} title={s.short_name}>
              Skill {s.id}: {truncate(s.short_name, 38)}
            </option>
          ))}
        </select>
      </div>

      <div className="flex flex-col w-full sm:w-auto min-w-0">
        <label
          htmlFor="band-filter"
          className="text-xs text-gray-500 font-medium mb-0.5"
        >
          Level
        </label>
        <select
          id="band-filter"
          value={activeBand}
          onChange={(e) => pushParams({ band: e.target.value })}
          className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent w-full sm:w-64"
        >
          {BAND_OPTIONS.map((b) => (
            <option key={b.value} value={b.value}>
              {b.label}
            </option>
          ))}
        </select>
      </div>

      {hasFilters && (
        <button
          type="button"
          onClick={() => router.push("/community")}
          className="self-end text-xs text-asu-maroon hover:underline font-medium px-1 py-1.5"
        >
          Clear filters
        </button>
      )}
    </div>
  );
}
