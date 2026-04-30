"use client";

import { useEffect, useState } from "react";

export type TextListEntryData = {
  storageKey: string;
  prompt?: string;
  groups: {
    id: string;
    label: string;
    placeholder?: string;
    count: number;
  }[];
};

type Stored = Record<string, string[]>;

function readStorage(key: string): Stored | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as Stored) : null;
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: Stored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function TextListEntry({ data }: { data: TextListEntryData }) {
  const init: Stored = Object.fromEntries(
    data.groups.map((g) => [g.id, Array(g.count).fill("")])
  );
  const [values, setValues] = useState<Stored>(init);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = readStorage(data.storageKey);
    if (stored) {
      const merged: Stored = { ...init };
      for (const g of data.groups) {
        const incoming = Array.isArray(stored[g.id]) ? stored[g.id] : [];
        merged[g.id] = Array.from(
          { length: g.count },
          (_, i) => incoming[i] ?? ""
        );
      }
      setValues(merged);
    }
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.storageKey]);

  useEffect(() => {
    if (hydrated) writeStorage(data.storageKey, values);
  }, [values, data.storageKey, hydrated]);

  const updateAt = (groupId: string, idx: number, val: string) => {
    setValues((prev) => {
      const next = { ...prev, [groupId]: [...(prev[groupId] ?? [])] };
      next[groupId][idx] = val;
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
            </p>
            <div className="space-y-2">
              {Array.from({ length: g.count }, (_, i) => (
                <input
                  key={i}
                  type="text"
                  value={values[g.id]?.[i] ?? ""}
                  onChange={(e) => updateAt(g.id, i, e.target.value)}
                  placeholder={g.placeholder}
                  className="w-full text-sm bg-white border border-gray-200 rounded-md px-3 py-2 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="text-[11px] text-gray-400 mt-3">
        Saved in your browser. Comes back to you in later steps.
      </p>
    </div>
  );
}
