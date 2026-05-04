"use client";

import { useEffect, useRef, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

// Three-region "Venn" entry. Two overlapping CSS-circle regions form
// the visual; three textareas live INSIDE them — left-only sits in
// the left crescent, intersection sits over the overlap, right-only
// sits in the right crescent. Typing in each textarea is the same as
// typing into that part of the Venn.
export type VennEntryData = {
  storageKey: string;
  prompt?: string;
  // Caption above each circle ("You", "AI", etc.)
  leftCircleLabel?: string;
  rightCircleLabel?: string;
  // Region labels rendered as the textarea labels.
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

      {/* Venn layout. SVG draws the two overlapping circles; an
          absolutely-positioned 3-column grid sits on top with the
          textareas in each region. On narrow screens the layout
          drops to a vertical stack with the SVG above. */}
      <div className="hidden lg:block relative w-full">
        <svg
          viewBox="0 0 600 320"
          className="w-full h-auto"
          aria-hidden="true"
          role="presentation"
        >
          <circle
            cx="220"
            cy="160"
            r="150"
            fill="rgba(140, 29, 64, 0.10)"
            stroke="rgba(140, 29, 64, 0.45)"
            strokeWidth="2"
          />
          <circle
            cx="380"
            cy="160"
            r="150"
            fill="rgba(0, 163, 224, 0.10)"
            stroke="rgba(0, 163, 224, 0.45)"
            strokeWidth="2"
          />
          {data.leftCircleLabel && (
            <text
              x="120"
              y="32"
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#8c1d40"
            >
              {data.leftCircleLabel}
            </text>
          )}
          {data.rightCircleLabel && (
            <text
              x="480"
              y="32"
              textAnchor="middle"
              fontSize="14"
              fontWeight="700"
              fill="#00a3e0"
            >
              {data.rightCircleLabel}
            </text>
          )}
        </svg>
        {/* Overlay: 3-column grid sized to match the SVG aspect ratio.
            Each cell carries a label + textarea positioned inside its
            circle region. */}
        <div className="absolute inset-0 grid grid-cols-12 gap-2 px-6 py-12">
          <div className="col-span-4 flex flex-col">
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
              className="flex-1 text-sm bg-white/80 border border-asu-maroon/30 rounded-md px-2 py-1.5 focus:border-asu-maroon focus:bg-white focus:outline-none focus:ring-1 focus:ring-asu-maroon"
              style={{ minHeight: "9rem" }}
            />
          </div>
          <div className="col-span-4 flex flex-col">
            <label
              htmlFor={`${data.storageKey}-both`}
              className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1 text-center"
            >
              {data.bothLabel}
            </label>
            <AutoTextarea
              id={`${data.storageKey}-both`}
              value={state.both}
              onChange={(e) => setRegion("both", e.target.value)}
              placeholder={data.bothPlaceholder ?? "One per line"}
              className="flex-1 text-sm bg-white/80 border border-gray-400 rounded-md px-2 py-1.5 focus:border-gray-700 focus:bg-white focus:outline-none focus:ring-1 focus:ring-gray-500"
              style={{ minHeight: "9rem" }}
            />
          </div>
          <div className="col-span-4 flex flex-col">
            <label
              htmlFor={`${data.storageKey}-right`}
              className="block text-[11px] font-bold uppercase tracking-wider text-asu-blue mb-1 text-right"
            >
              {data.rightLabel}
            </label>
            <AutoTextarea
              id={`${data.storageKey}-right`}
              value={state.right}
              onChange={(e) => setRegion("right", e.target.value)}
              placeholder={data.rightPlaceholder ?? "One per line"}
              className="flex-1 text-sm bg-white/80 border border-asu-blue/30 rounded-md px-2 py-1.5 focus:border-asu-blue focus:bg-white focus:outline-none focus:ring-1 focus:ring-asu-blue"
              style={{ minHeight: "9rem" }}
            />
          </div>
        </div>
      </div>

      {/* Narrow-screen fallback: stack the three regions vertically
          with a small Venn icon up top so the metaphor still reads. */}
      <div className="lg:hidden space-y-3">
        <div className="flex items-center justify-center" aria-hidden="true">
          <svg viewBox="0 0 280 110" className="w-40 h-auto">
            <circle
              cx="100"
              cy="55"
              r="50"
              fill="rgba(140, 29, 64, 0.15)"
              stroke="rgba(140, 29, 64, 0.5)"
              strokeWidth="2"
            />
            <circle
              cx="180"
              cy="55"
              r="50"
              fill="rgba(0, 163, 224, 0.15)"
              stroke="rgba(0, 163, 224, 0.5)"
              strokeWidth="2"
            />
          </svg>
        </div>
        <div>
          <label
            htmlFor={`${data.storageKey}-left-mobile`}
            className="block text-[11px] font-bold uppercase tracking-wider text-asu-maroon mb-1"
          >
            {data.leftLabel}
          </label>
          <AutoTextarea
            id={`${data.storageKey}-left-mobile`}
            value={state.left}
            onChange={(e) => setRegion("left", e.target.value)}
            placeholder={data.leftPlaceholder ?? "One per line"}
            className="text-sm bg-white border border-asu-maroon/30 rounded-md px-2 py-1.5 focus:border-asu-maroon focus:outline-none focus:ring-1 focus:ring-asu-maroon"
          />
        </div>
        <div>
          <label
            htmlFor={`${data.storageKey}-both-mobile`}
            className="block text-[11px] font-bold uppercase tracking-wider text-gray-700 mb-1"
          >
            {data.bothLabel}
          </label>
          <AutoTextarea
            id={`${data.storageKey}-both-mobile`}
            value={state.both}
            onChange={(e) => setRegion("both", e.target.value)}
            placeholder={data.bothPlaceholder ?? "One per line"}
            className="text-sm bg-white border border-gray-400 rounded-md px-2 py-1.5 focus:border-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-500"
          />
        </div>
        <div>
          <label
            htmlFor={`${data.storageKey}-right-mobile`}
            className="block text-[11px] font-bold uppercase tracking-wider text-asu-blue mb-1"
          >
            {data.rightLabel}
          </label>
          <AutoTextarea
            id={`${data.storageKey}-right-mobile`}
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
