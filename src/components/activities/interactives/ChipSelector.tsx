"use client";

import { useEffect, useRef, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

// A chip-style picker for "pick one of these (or write your own)"
// moments. Single-select by default (radio-shaped); pass
// singleSelect: false to allow multi. The "Other" chip toggles a
// freeform text input. Optional follow-up textareas appear below the
// chips for capturing additional context that goes with the choice
// (e.g., audience, risk profile).
export type ChipSelectorData = {
  storageKey: string;
  prompt?: string;
  chipsLabel?: string;
  options: { id: string; label: string }[];
  allowOther?: boolean;
  otherLabel?: string;
  otherPlaceholder?: string;
  // Default true (radio behavior). Set false for multi-select.
  singleSelect?: boolean;
  followUps?: { id: string; label: string; placeholder?: string }[];
};

type Stored = {
  selected: string[];
  otherText: string;
  followUps: Record<string, string>;
};

const SYNC_EVENT = "chip-selector:storage-update";
const OTHER_ID = "__other__";

function readStorage(key: string): Stored {
  const empty: Stored = { selected: [], otherText: "", followUps: {} };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return empty;
    const p = JSON.parse(raw) as Partial<Stored>;
    return {
      selected: Array.isArray(p.selected) ? (p.selected as string[]) : [],
      otherText: typeof p.otherText === "string" ? p.otherText : "",
      followUps:
        p.followUps && typeof p.followUps === "object"
          ? (p.followUps as Record<string, string>)
          : {},
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

export function ChipSelector({ data }: { data: ChipSelectorData }) {
  const isSingle = data.singleSelect !== false;
  const [state, setState] = useState<Stored>({
    selected: [],
    otherText: "",
    followUps: {},
  });
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

  // Cross-instance live sync (same pattern as Scorecard / TextListEntry).
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

  const toggleChip = (id: string) => {
    setState((p) => {
      if (isSingle) {
        const next = p.selected[0] === id ? [] : [id];
        return { ...p, selected: next };
      }
      const has = p.selected.includes(id);
      const next = has ? p.selected.filter((x) => x !== id) : [...p.selected, id];
      return { ...p, selected: next };
    });
  };

  const otherSelected = state.selected.includes(OTHER_ID);
  const setOther = (val: string) =>
    setState((p) => ({ ...p, otherText: val }));
  const setFollowUp = (id: string, val: string) =>
    setState((p) => ({ ...p, followUps: { ...p.followUps, [id]: val } }));

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4 space-y-3">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700">{data.prompt}</p>
      )}
      {data.chipsLabel && (
        <p className="text-[11px] font-semibold uppercase tracking-wider text-asu-blue">
          {data.chipsLabel}
        </p>
      )}
      <div role={isSingle ? "radiogroup" : "group"} className="flex flex-wrap gap-2">
        {data.options.map((opt) => {
          const active = state.selected.includes(opt.id);
          return (
            <button
              key={opt.id}
              type="button"
              role={isSingle ? "radio" : undefined}
              aria-checked={isSingle ? active : undefined}
              aria-pressed={isSingle ? undefined : active}
              onClick={() => toggleChip(opt.id)}
              className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-asu-blue ${
                active
                  ? "bg-asu-blue text-white border-asu-blue"
                  : "bg-white text-gray-700 border-gray-300 hover:border-asu-blue/50"
              }`}
            >
              {opt.label}
            </button>
          );
        })}
        {data.allowOther && (
          <button
            key={OTHER_ID}
            type="button"
            role={isSingle ? "radio" : undefined}
            aria-checked={isSingle ? otherSelected : undefined}
            aria-pressed={isSingle ? undefined : otherSelected}
            onClick={() => toggleChip(OTHER_ID)}
            className={`text-sm px-3 py-1.5 rounded-full border transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-asu-maroon ${
              otherSelected
                ? "bg-asu-maroon text-white border-asu-maroon"
                : "bg-white text-gray-700 border-gray-300 hover:border-asu-maroon/50"
            }`}
          >
            {data.otherLabel ?? "Other"}
          </button>
        )}
      </div>
      {otherSelected && (
        <div>
          <label
            htmlFor={`${data.storageKey}-other`}
            className="block text-[11px] font-semibold uppercase tracking-wider text-asu-maroon mb-1"
          >
            {data.otherLabel ?? "Other"}
          </label>
          <AutoTextarea
            id={`${data.storageKey}-other`}
            value={state.otherText}
            onChange={(e) => setOther(e.target.value)}
            placeholder={data.otherPlaceholder ?? "Describe your own choice"}
            className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-maroon focus:outline-none focus:ring-1 focus:ring-asu-maroon"
          />
        </div>
      )}
      {data.followUps && data.followUps.length > 0 && (
        <div className="space-y-2 pt-1">
          {data.followUps.map((f) => (
            <div key={f.id}>
              <label
                htmlFor={`${data.storageKey}-fu-${f.id}`}
                className="block text-[11px] font-semibold uppercase tracking-wider text-asu-blue mb-1"
              >
                {f.label}
              </label>
              <AutoTextarea
                id={`${data.storageKey}-fu-${f.id}`}
                value={state.followUps[f.id] ?? ""}
                onChange={(e) => setFollowUp(f.id, e.target.value)}
                placeholder={f.placeholder}
                className="text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
              />
            </div>
          ))}
        </div>
      )}
      <p className="text-[11px] text-gray-500">Saved in your browser.</p>
    </div>
  );
}
