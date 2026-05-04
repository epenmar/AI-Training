"use client";

import { useEffect, useRef, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

// Three-region "Venn-like" entry. Renders two overlapping circles as
// a visual cue, plus three labeled regions below for the actual lists:
// left-only, intersection, right-only. Designed for compare-two-views
// activities (your themes vs. AI's themes; your read vs. their read).
export type VennEntryData = {
  storageKey: string;
  prompt?: string;
  // Optional small caption above each circle ("Yours", "AI", etc.)
  leftCircleLabel?: string;
  rightCircleLabel?: string;
  // Region labels rendered above each list area.
  leftLabel: string;
  bothLabel: string;
  rightLabel: string;
  leftPlaceholder?: string;
  bothPlaceholder?: string;
  rightPlaceholder?: string;
};

type Stored = {
  left: string;
  both: string;
  right: string;
};

const SYNC_EVENT = "venn-entry:storage-update";

function readStorage(key: string): Stored {
  const empty: Stored = { left: "", both: "", right: "" };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<Stored>;
    return {
      left: typeof p.left === "string" ? p.left : "",
      both: typeof p.both === "string" ? p.both : "",
      right: typeof p.right === "string" ? p.right : "",
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

export function VennEntry({ data }: { data: VennEntryData }) {
  const [state, setState] = useState<Stored>({ left: "", both: "", right: "" });
  const [hydrated, setHydrated] = useState(false);
  const lastWritten = useRef<string>("");

  useEffect(() => {
    setState(readStorage(data.storageKey));
    setHydrated(true);
  }, [data.storageKey]);

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

  const setRegion = (key: keyof Stored, val: string) =>
    setState((p) => ({ ...p, [key]: val }));

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4 space-y-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700">{data.prompt}</p>
      )}

      {/* Decorative Venn — pure visual; lists below are the editable parts. */}
      <div className="flex items-center justify-center" aria-hidden="true">
        <svg
          viewBox="0 0 320 140"
          className="w-full max-w-md h-auto"
          role="presentation"
        >
          <circle
            cx="120"
            cy="70"
            r="60"
            fill="rgba(140, 29, 64, 0.12)"
            stroke="rgba(140, 29, 64, 0.5)"
            strokeWidth="2"
          />
          <circle
            cx="200"
            cy="70"
            r="60"
            fill="rgba(0, 163, 224, 0.12)"
            stroke="rgba(0, 163, 224, 0.5)"
            strokeWidth="2"
          />
          {data.leftCircleLabel && (
            <text
              x="80"
              y="22"
              textAnchor="middle"
              className="fill-asu-maroon"
              fontSize="11"
              fontWeight="700"
            >
              {data.leftCircleLabel}
            </text>
          )}
          {data.rightCircleLabel && (
            <text
              x="240"
              y="22"
              textAnchor="middle"
              className="fill-asu-blue"
              fontSize="11"
              fontWeight="700"
            >
              {data.rightCircleLabel}
            </text>
          )}
          <text
            x="80"
            y="135"
            textAnchor="middle"
            fontSize="9"
            className="fill-gray-500"
          >
            only
          </text>
          <text
            x="160"
            y="135"
            textAnchor="middle"
            fontSize="9"
            className="fill-gray-600"
            fontWeight="600"
          >
            both
          </text>
          <text
            x="240"
            y="135"
            textAnchor="middle"
            fontSize="9"
            className="fill-gray-500"
          >
            only
          </text>
        </svg>
      </div>

      {/* Three editable regions stacked. Color-coded to match the Venn. */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div>
          <label
            htmlFor={`${data.storageKey}-left`}
            className="block text-[11px] font-bold uppercase tracking-wider text-asu-maroon mb-1"
          >
            {data.leftLabel}
          </label>
          <AutoTextarea
            id={`${data.storageKey}-left`}
            value={state.left}
            onChange={(e) => setRegion("left", e.target.value)}
            placeholder={data.leftPlaceholder ?? "One per line"}
            className="text-sm bg-white border border-asu-maroon/30 rounded-md px-2 py-1.5 focus:border-asu-maroon focus:outline-none focus:ring-1 focus:ring-asu-maroon"
          />
        </div>
        <div>
          <label
            htmlFor={`${data.storageKey}-both`}
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1"
          >
            {data.bothLabel}
          </label>
          <AutoTextarea
            id={`${data.storageKey}-both`}
            value={state.both}
            onChange={(e) => setRegion("both", e.target.value)}
            placeholder={data.bothPlaceholder ?? "One per line"}
            className="text-sm bg-white border border-gray-400 rounded-md px-2 py-1.5 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div>
          <label
            htmlFor={`${data.storageKey}-right`}
            className="block text-[11px] font-bold uppercase tracking-wider text-asu-blue mb-1"
          >
            {data.rightLabel}
          </label>
          <AutoTextarea
            id={`${data.storageKey}-right`}
            value={state.right}
            onChange={(e) => setRegion("right", e.target.value)}
            placeholder={data.rightPlaceholder ?? "One per line"}
            className="text-sm bg-white border border-asu-blue/30 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
          />
        </div>
      </div>
      <p className="text-[11px] text-gray-500">Saved in your browser.</p>
    </div>
  );
}
