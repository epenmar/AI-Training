"use client";

import { useEffect, useRef, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

// A two-mode rubric widget. Per-step "single" mode shows one
// dimension's dropdown + evidence textarea; the final-step "summary"
// mode renders all dimensions stacked vertically (transposed: long,
// not wide) with their dropdowns + evidence + an optional verdict.
// Both modes share one storageKey, so the summary mirrors what the
// learner entered in the per-dimension steps. Sync across instances
// (different steps on the same page) goes through a custom event so
// edits anywhere update everywhere without a refresh.
export type ScorecardData = {
  storageKey: string;
  mode: "single" | "summary";
  // single mode
  dimensionId?: string;
  dimensionLabel?: string;
  dimensionPlaceholder?: string;
  // summary mode
  dimensions?: { id: string; label: string }[];
  showVerdict?: boolean;
  verdictPlaceholder?: string;
  // both
  scoreOptions?: string[]; // default ["Strong", "Adequate", "Weak"]
};

type Stored = {
  scores: Record<string, string>;
  notes: Record<string, string>;
  verdict: string;
};

const SYNC_EVENT = "scorecard:storage-update";

function readStorage(key: string): Stored {
  const empty: Stored = { scores: {}, notes: {}, verdict: "" };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<Stored>;
    return {
      scores: p.scores ?? {},
      notes: p.notes ?? {},
      verdict: p.verdict ?? "",
    };
  } catch {
    return empty;
  }
}

function writeStorage(key: string, value: Stored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
  } catch {
    // ignore
  }
}

export function Scorecard({ data }: { data: ScorecardData }) {
  const scoreOpts = data.scoreOptions ?? ["Strong", "Adequate", "Weak"];
  const [state, setState] = useState<Stored>({
    scores: {},
    notes: {},
    verdict: "",
  });
  const [hydrated, setHydrated] = useState(false);
  const lastWritten = useRef<string>("");

  // Hydrate from storage.
  useEffect(() => {
    setState(readStorage(data.storageKey));
    setHydrated(true);
  }, [data.storageKey]);

  // Persist on change.
  useEffect(() => {
    if (!hydrated) return;
    const ser = JSON.stringify(state);
    if (ser === lastWritten.current) return;
    lastWritten.current = ser;
    writeStorage(data.storageKey, state);
  }, [state, hydrated, data.storageKey]);

  // Cross-instance live sync.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key !== data.storageKey) return;
      const fresh = readStorage(data.storageKey);
      const ser = JSON.stringify(fresh);
      if (ser === lastWritten.current) return;
      lastWritten.current = ser;
      setState(fresh);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== data.storageKey) return;
      const fresh = readStorage(data.storageKey);
      const ser = JSON.stringify(fresh);
      if (ser === lastWritten.current) return;
      lastWritten.current = ser;
      setState(fresh);
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener("storage", onStorage);
    };
  }, [data.storageKey]);

  const setScore = (id: string, val: string) => {
    setState((p) => ({ ...p, scores: { ...p.scores, [id]: val } }));
  };
  const setNote = (id: string, val: string) => {
    setState((p) => ({ ...p, notes: { ...p.notes, [id]: val } }));
  };
  const setVerdict = (val: string) => {
    setState((p) => ({ ...p, verdict: val }));
  };

  // Visual feedback: green (top option), gold (mid), orange (bottom).
  const scoreClass = (score: string) => {
    if (!score) return "bg-white border-gray-200 text-gray-700";
    if (score === scoreOpts[0])
      return "bg-asu-green/10 border-asu-green/40 text-green-800";
    if (score === scoreOpts[scoreOpts.length - 1])
      return "bg-asu-orange/10 border-asu-orange/40 text-orange-900";
    return "bg-asu-gold/10 border-asu-gold/40 text-yellow-900";
  };

  if (data.mode === "single") {
    const id = data.dimensionId ?? "x";
    const score = state.scores[id] ?? "";
    return (
      <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          <label className="text-sm font-semibold text-asu-blue inline-flex items-center gap-2">
            <span>{data.dimensionLabel ?? "Score"}:</span>
            <select
              aria-label={`${data.dimensionLabel ?? "Dimension"} score`}
              value={score}
              onChange={(e) => setScore(id, e.target.value)}
              className={`text-sm px-2 py-1 rounded-md border ${scoreClass(
                score
              )} focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue`}
            >
              <option value="">(pick a level)</option>
              {scoreOpts.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </label>
        </div>
        <AutoTextarea
          aria-label={`${data.dimensionLabel ?? "Dimension"} evidence`}
          value={state.notes[id] ?? ""}
          onChange={(e) => setNote(id, e.target.value)}
          placeholder={
            data.dimensionPlaceholder ??
            "Specific evidence — what you noticed and why it scored that way."
          }
          className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
        />
        <p className="text-[11px] text-gray-500">
          Saved in your browser. The final step collects every dimension in
          one place.
        </p>
      </div>
    );
  }

  // summary mode — vertical stack, one row per dimension.
  const dims = data.dimensions ?? [];
  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4 space-y-3">
      <ul className="space-y-2">
        {dims.map((d) => {
          const score = state.scores[d.id] ?? "";
          const note = state.notes[d.id] ?? "";
          return (
            <li
              key={d.id}
              className="rounded-md border border-gray-200 bg-white p-3 space-y-2"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-sm font-semibold text-asu-blue">
                  {d.label}
                </span>
                <select
                  aria-label={`${d.label} score`}
                  value={score}
                  onChange={(e) => setScore(d.id, e.target.value)}
                  className={`text-sm px-2 py-1 rounded-md border ${scoreClass(
                    score
                  )} focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue`}
                >
                  <option value="">(pick a level)</option>
                  {scoreOpts.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
              <AutoTextarea
                aria-label={`${d.label} evidence`}
                value={note}
                onChange={(e) => setNote(d.id, e.target.value)}
                placeholder="Evidence (mirrored from earlier steps; edit here to refine)."
                className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
              />
            </li>
          );
        })}
      </ul>
      {data.showVerdict && (
        <div className="rounded-md border border-asu-maroon/30 bg-asu-maroon/5 p-3">
          <label
            htmlFor={`${data.storageKey}-verdict`}
            className="block text-sm font-semibold text-asu-maroon mb-2"
          >
            Final verdict
          </label>
          <AutoTextarea
            id={`${data.storageKey}-verdict`}
            value={state.verdict}
            onChange={(e) => setVerdict(e.target.value)}
            placeholder={
              data.verdictPlaceholder ??
              "Use as-is / Revise / Discard — and why."
            }
            className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-maroon focus:outline-none focus:ring-1 focus:ring-asu-maroon"
          />
        </div>
      )}
      <p className="text-[11px] text-gray-500">
        Saved in your browser. Capture the deliverable in the box at the
        bottom of this page.
      </p>
    </div>
  );
}
