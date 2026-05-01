"use client";

import { useState } from "react";

export type StageFlowchartData = {
  prompt?: string;
  stages: {
    id: string;
    label: string; // short, e.g. "AI prompt #1"
    title: string; // longer, e.g. "Generate sources"
    actor: "ai" | "human";
    detail: {
      whatHappens: string;
      output: string;
    };
  }[];
  notes?: { title: string; body: string; tone?: "info" | "warning" }[];
};

const ACTOR_PALETTE: Record<
  "ai" | "human",
  { bg: string; border: string; chip: string; ringActive: string; iconLabel: string }
> = {
  ai: {
    bg: "bg-asu-blue/10",
    border: "border-asu-blue/40",
    chip: "bg-asu-blue text-white",
    ringActive: "ring-asu-blue",
    iconLabel: "AI",
  },
  human: {
    bg: "bg-asu-green/10",
    border: "border-asu-green/40",
    chip: "bg-asu-green text-white",
    ringActive: "ring-asu-green",
    iconLabel: "Human",
  },
};

export function StageFlowchart({ data }: { data: StageFlowchartData }) {
  const [activeId, setActiveId] = useState<string>(data.stages[0]?.id ?? "");
  const activeIndex = Math.max(
    0,
    data.stages.findIndex((s) => s.id === activeId)
  );
  const active = data.stages[activeIndex];

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.prompt && (
        <p className="text-sm text-gray-700 mb-3">{data.prompt}</p>
      )}

      {/* Stage chips, scroll horizontally on narrow screens */}
      <div className="flex items-stretch gap-1 overflow-x-auto pb-2 -mx-1 px-1">
        {data.stages.map((stage, i) => {
          const palette = ACTOR_PALETTE[stage.actor];
          const isActive = stage.id === activeId;
          return (
            <div key={stage.id} className="flex items-stretch gap-1">
              <button
                type="button"
                onClick={() => setActiveId(stage.id)}
                aria-pressed={isActive}
                aria-label={`Stage ${i + 1}: ${stage.label}, ${stage.title}`}
                className={`group relative w-44 shrink-0 text-left rounded-lg border-2 p-2.5 cursor-pointer transition-shadow hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 ${
                  palette.border
                } ${palette.bg} ${
                  isActive
                    ? `ring-2 ring-offset-1 ${palette.ringActive} shadow-sm`
                    : ""
                }`}
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold ${palette.chip}`}
                  >
                    {i + 1}
                  </span>
                  <span
                    className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${palette.chip}`}
                  >
                    {palette.iconLabel}
                  </span>
                </div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-gray-700 mt-2 leading-snug">
                  {stage.label}
                </p>
                <p className="text-xs font-semibold text-gray-700 mt-1 leading-snug">
                  {stage.title}
                </p>
              </button>
              {i < data.stages.length - 1 && (
                <div
                  aria-hidden="true"
                  className="flex items-center text-gray-400"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Active stage detail panel */}
      {active && (
        <div className="mt-3 rounded-lg bg-white border border-gray-200 p-4">
          <header className="mb-2 flex flex-wrap items-baseline gap-2">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 rounded ${ACTOR_PALETTE[active.actor].chip}`}
            >
              Stage {activeIndex + 1} · {ACTOR_PALETTE[active.actor].iconLabel}
            </span>
            <h4 className="text-sm font-bold text-gray-700">{active.title}</h4>
          </header>
          <div className="space-y-3">
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                What happens
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {active.detail.whatHappens}
              </p>
            </div>
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1">
                Output
              </p>
              <p className="text-sm text-gray-700 leading-relaxed">
                {active.detail.output}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Notes always visible at the bottom */}
      {data.notes && data.notes.length > 0 && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.notes.map((note, i) => {
            const tone =
              note.tone === "warning"
                ? "border-amber-500 bg-amber-50 text-amber-900"
                : "border-asu-blue/30 bg-asu-blue/5 text-gray-700";
            return (
              <div key={i} className={`rounded-md border p-3 ${tone}`}>
                <p className="text-[11px] font-semibold uppercase tracking-wider mb-1">
                  {note.title}
                </p>
                <p className="text-xs leading-relaxed">{note.body}</p>
              </div>
            );
          })}
        </div>
      )}

      <p className="text-[11px] text-gray-500 mt-2">
        Tap a stage above to see what happens and what it produces.
      </p>
    </div>
  );
}
