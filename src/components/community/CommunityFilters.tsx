"use client";

import { useEffect, useRef, useState } from "react";
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

const BAND_OPTIONS: Array<{ value: string; label: string }> = [
  { value: "", label: "All levels" },
  { value: "New → Foundational", label: "New → Foundational" },
  { value: "Foundational → Intermediate", label: "Foundational → Intermediate" },
  { value: "Intermediate → Advanced", label: "Intermediate → Advanced" },
];

interface FilterDropdownProps {
  id: string;
  label: string;
  value: string;
  options: Array<{ value: string; label: string; title?: string }>;
  placeholder: string;
  onChange: (value: string) => void;
  widthClass: string;
}

function FilterDropdown({
  id,
  label,
  value,
  options,
  placeholder,
  onChange,
  widthClass,
}: FilterDropdownProps) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
  const displayLabel = selected?.label ?? placeholder;

  useEffect(() => {
    if (!open) return;
    function handlePointer(e: MouseEvent) {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", handlePointer);
    document.addEventListener("keydown", handleKey);
    return () => {
      document.removeEventListener("mousedown", handlePointer);
      document.removeEventListener("keydown", handleKey);
    };
  }, [open]);

  return (
    <div
      ref={wrapperRef}
      className={`relative flex flex-col w-full sm:w-auto ${widthClass}`}
    >
      <label
        htmlFor={id}
        className="text-xs text-gray-500 font-medium mb-0.5"
      >
        {label}
      </label>
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="text-sm border border-gray-300 rounded-md px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent w-full flex items-center justify-between gap-2 text-left"
      >
        <span
          className={`truncate ${selected ? "text-gray-700" : "text-gray-500"}`}
          title={selected?.title ?? selected?.label}
        >
          {displayLabel}
        </span>
        <svg
          className={`w-4 h-4 flex-shrink-0 text-gray-400 transition-transform ${
            open ? "rotate-180" : ""
          }`}
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
      </button>
      {open && (
        <ul
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-20 max-h-64 overflow-y-auto rounded-md border border-gray-200 bg-white shadow-lg py-1"
        >
          {options.map((o) => {
            const isSelected = o.value === value;
            return (
              <li key={o.value || "all"} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  title={o.title ?? o.label}
                  onClick={() => {
                    onChange(o.value);
                    setOpen(false);
                  }}
                  className={`w-full text-left text-sm px-2.5 py-1.5 truncate cursor-pointer ${
                    isSelected
                      ? "bg-asu-maroon/10 text-asu-maroon font-medium"
                      : "text-gray-700 hover:bg-gray-100"
                  }`}
                >
                  {o.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
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

  const skillOptions: Array<{ value: string; label: string; title?: string }> =
    [
      { value: "", label: "All skills" },
      ...skills.map((s) => ({
        value: String(s.id),
        label: `Skill ${s.id}: ${s.short_name}`,
        title: s.short_name,
      })),
    ];

  return (
    <div className="mb-5 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-start gap-3 bg-white border border-gray-200 rounded-lg p-3">
      <FilterDropdown
        id="skill-filter"
        label="Skill"
        value={activeSkillId}
        options={skillOptions}
        placeholder="All skills"
        onChange={(v) => pushParams({ skill: v })}
        widthClass="sm:w-80"
      />

      <FilterDropdown
        id="band-filter"
        label="Level"
        value={activeBand}
        options={BAND_OPTIONS}
        placeholder="All levels"
        onChange={(v) => pushParams({ band: v })}
        widthClass="sm:w-80"
      />

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
