"use client";

import { useEffect, useRef, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

export type TextListEntryData = {
  storageKey: string;
  prompt?: string;
  groups: {
    id: string;
    label: string;
    placeholder?: string;
    count: number;
    // Render rows as static text (mirrored from a previous step).
    readOnly?: boolean;
    // Add a checkbox per row that highlights the row when checked. Useful
    // when an instruction asks the user to "mark" specific entries.
    markable?: boolean;
    // Optional label rendered next to each checkbox.
    markLabel?: string;
  }[];
};

type Stored = {
  values: Record<string, string[]>;
  marks: Record<string, boolean[]>;
};

// Same-tab live-update mechanism: when one instance writes to localStorage,
// it dispatches a custom event; instances pointing at the same storageKey
// re-read and re-render without a page refresh.
const SYNC_EVENT = "text-list-entry:storage-update";

function readStorage(key: string, groups: TextListEntryData["groups"]): Stored {
  const empty: Stored = {
    values: Object.fromEntries(
      groups.map((g) => [g.id, Array(g.count).fill("")])
    ),
    marks: Object.fromEntries(
      groups.map((g) => [g.id, Array(g.count).fill(false)])
    ),
  };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as
      | Stored
      | Record<string, string[]>;
    const isV2 =
      parsed != null &&
      typeof parsed === "object" &&
      "values" in parsed &&
      "marks" in parsed;
    const valuesSrc = isV2
      ? (parsed as Stored).values
      : (parsed as Record<string, string[]>);
    const marksSrc = isV2 ? (parsed as Stored).marks : {};
    const merged: Stored = {
      values: { ...empty.values },
      marks: { ...empty.marks },
    };
    for (const g of groups) {
      const valIn = Array.isArray(valuesSrc?.[g.id]) ? valuesSrc[g.id] : [];
      merged.values[g.id] = Array.from(
        { length: g.count },
        (_, i) => valIn[i] ?? ""
      );
      const markIn = Array.isArray(marksSrc?.[g.id]) ? marksSrc[g.id] : [];
      merged.marks[g.id] = Array.from(
        { length: g.count },
        (_, i) => Boolean(markIn[i])
      );
    }
    return merged;
  } catch {
    return empty;
  }
}

function writeStorage(key: string, value: Stored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent(SYNC_EVENT, { detail: { key } })
    );
  } catch {
    // ignore
  }
}

export function TextListEntry({ data }: { data: TextListEntryData }) {
  const empty: Stored = {
    values: Object.fromEntries(
      data.groups.map((g) => [g.id, Array(g.count).fill("")])
    ),
    marks: Object.fromEntries(
      data.groups.map((g) => [g.id, Array(g.count).fill(false)])
    ),
  };
  const [state, setState] = useState<Stored>(empty);
  const [hydrated, setHydrated] = useState(false);
  const lastWritten = useRef<string>("");

  // Hydrate from localStorage on mount.
  useEffect(() => {
    setState(readStorage(data.storageKey, data.groups));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.storageKey]);

  // Persist on change (and notify other instances).
  useEffect(() => {
    if (!hydrated) return;
    const serialized = JSON.stringify(state);
    if (serialized === lastWritten.current) return;
    lastWritten.current = serialized;
    writeStorage(data.storageKey, state);
  }, [state, data.storageKey, hydrated]);

  // Listen for cross-instance updates (other TextListEntry on the same
  // page writing to the same storageKey, or a different tab).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const onSync = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key !== data.storageKey) return;
      const fresh = readStorage(data.storageKey, data.groups);
      const freshSer = JSON.stringify(fresh);
      if (freshSer === lastWritten.current) return;
      lastWritten.current = freshSer;
      setState(fresh);
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key !== data.storageKey) return;
      const fresh = readStorage(data.storageKey, data.groups);
      const freshSer = JSON.stringify(fresh);
      if (freshSer === lastWritten.current) return;
      lastWritten.current = freshSer;
      setState(fresh);
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.storageKey]);

  const updateValue = (groupId: string, idx: number, val: string) => {
    setState((prev) => {
      const next = { ...prev, values: { ...prev.values } };
      next.values[groupId] = [...(prev.values[groupId] ?? [])];
      next.values[groupId][idx] = val;
      return next;
    });
  };

  const toggleMark = (groupId: string, idx: number) => {
    setState((prev) => {
      const next = { ...prev, marks: { ...prev.marks } };
      next.marks[groupId] = [...(prev.marks[groupId] ?? [])];
      next.marks[groupId][idx] = !next.marks[groupId][idx];
      return next;
    });
  };

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {data.groups.map((g) => (
          <div key={g.id}>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-asu-blue mb-2">
              {g.label}
              {g.readOnly && (
                <span className="ml-2 text-[10px] font-medium text-gray-500 normal-case tracking-normal">
                  (from earlier step)
                </span>
              )}
            </p>
            <div className="space-y-2">
              {Array.from({ length: g.count }, (_, i) => {
                const value = state.values[g.id]?.[i] ?? "";
                const marked = state.marks[g.id]?.[i] ?? false;
                const rowHighlight =
                  g.markable && marked
                    ? "bg-asu-gold/20 border-asu-gold/60"
                    : "bg-white border-gray-200";

                return (
                  <div
                    key={i}
                    className={`flex items-stretch gap-2 rounded-md border px-2 py-1.5 min-h-[2.5rem] ${rowHighlight}`}
                  >
                    {g.markable && (
                      <label className="inline-flex items-center cursor-pointer">
                        <input
                          type="checkbox"
                          checked={marked}
                          onChange={() => toggleMark(g.id, i)}
                          aria-label={
                            g.markLabel ?? `Mark this ${g.label} item`
                          }
                          className="w-4 h-4 rounded border-gray-300 text-asu-gold focus:ring-asu-gold cursor-pointer"
                        />
                      </label>
                    )}
                    {g.readOnly ? (
                      <span
                        className={`flex-1 text-sm self-center px-1 py-1 leading-snug ${
                          value ? "text-gray-700" : "text-gray-400 italic"
                        }`}
                      >
                        {value || "(blank, fill in earlier step)"}
                      </span>
                    ) : (
                      <AutoTextarea
                        aria-label={`${g.label} item ${i + 1}`}
                        value={value}
                        onChange={(e) =>
                          updateValue(g.id, i, e.target.value)
                        }
                        placeholder={g.placeholder}
                        className="flex-1 text-sm bg-transparent border-0 px-2 py-1 focus:outline-none focus:ring-0 leading-snug"
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-500 mt-3">
        Saved in your browser. Comes back to you in later steps.
      </p>
    </div>
  );
}
