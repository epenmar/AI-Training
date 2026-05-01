"use client";

import { useEffect, useRef, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

// Lightweight shortlist/synthesis table that pulls one column read-only
// from a previous step's TextListEntry storage and lets the user fill
// remaining columns. Live-syncs with the source widget via the same
// custom event TextListEntry uses.
//
// Shape:
//   ┌────────────────────────────┬────────────┬───────────────┐
//   │ Idea (mirrored from step N)│ Angle      │ Rationale     │
//   ├────────────────────────────┼────────────┼───────────────┤
//   │ <round1 output>            │ Student    │ <user input>  │
//   │ <round2 output>            │ Skeptic    │ <user input>  │
//   │ <round3 output>            │ ToT        │ <user input>  │
//   └────────────────────────────┴────────────┴───────────────┘
export type ShortlistTableData = {
  // Where to read the read-only "idea" column from.
  sourceStorageKey: string;
  // For each row, which source group to mirror (single-item groups assumed).
  rows: { id: string; angleLabel: string; sourceGroupId: string }[];
  // Where to save this widget's editable cells (rationale + any other).
  storageKey: string;
  prompt?: string;
  ideaColumnLabel?: string;
  angleColumnLabel?: string;
  rationaleColumnLabel?: string;
};

type SourceStored = {
  values: Record<string, string[]>;
  marks: Record<string, boolean[]>;
};

type LocalStored = Record<string, string>; // rowId -> rationale

const SYNC_EVENT = "text-list-entry:storage-update";

function readSource(
  key: string,
  rows: ShortlistTableData["rows"]
): Record<string, string> {
  const empty = Object.fromEntries(rows.map((r) => [r.id, ""]));
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as SourceStored | Record<string, string[]>;
    const valuesSrc =
      parsed != null && typeof parsed === "object" && "values" in parsed
        ? (parsed as SourceStored).values
        : (parsed as Record<string, string[]>);
    const out = { ...empty };
    for (const r of rows) {
      const arr = Array.isArray(valuesSrc?.[r.sourceGroupId])
        ? valuesSrc[r.sourceGroupId]
        : [];
      out[r.id] = arr[0] ?? "";
    }
    return out;
  } catch {
    return empty;
  }
}

function readLocal(key: string, rows: ShortlistTableData["rows"]): LocalStored {
  const empty = Object.fromEntries(rows.map((r) => [r.id, ""]));
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as LocalStored;
    const out = { ...empty };
    for (const r of rows) {
      out[r.id] = parsed[r.id] ?? "";
    }
    return out;
  } catch {
    return empty;
  }
}

function writeLocal(key: string, value: LocalStored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function ShortlistTable({ data }: { data: ShortlistTableData }) {
  const [source, setSource] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.rows.map((r) => [r.id, ""]))
  );
  const [local, setLocal] = useState<LocalStored>(() =>
    Object.fromEntries(data.rows.map((r) => [r.id, ""]))
  );
  const [hydrated, setHydrated] = useState(false);
  const lastWritten = useRef<string>("");

  // Hydrate from both storage keys on mount and listen for source updates.
  useEffect(() => {
    setSource(readSource(data.sourceStorageKey, data.rows));
    setLocal(readLocal(data.storageKey, data.rows));
    setHydrated(true);
    if (typeof window === "undefined") return;
    const onSync = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key !== data.sourceStorageKey) return;
      setSource(readSource(data.sourceStorageKey, data.rows));
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === data.sourceStorageKey) {
        setSource(readSource(data.sourceStorageKey, data.rows));
      }
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.sourceStorageKey, data.storageKey]);

  // Persist local state on change.
  useEffect(() => {
    if (!hydrated) return;
    const ser = JSON.stringify(local);
    if (ser === lastWritten.current) return;
    lastWritten.current = ser;
    writeLocal(data.storageKey, local);
  }, [local, data.storageKey, hydrated]);

  const updateRationale = (rowId: string, val: string) => {
    setLocal((prev) => ({ ...prev, [rowId]: val }));
  };

  const ideaLabel = data.ideaColumnLabel ?? "Idea (from previous step)";
  const angleLabel = data.angleColumnLabel ?? "Angle";
  const rationaleLabel = data.rationaleColumnLabel ?? "Rationale";

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              <th
                scope="col"
                className="text-left text-[11px] font-semibold uppercase tracking-wider text-asu-blue px-2 pb-2 w-1/2"
              >
                {ideaLabel}
              </th>
              <th
                scope="col"
                className="text-left text-[11px] font-semibold uppercase tracking-wider text-asu-blue px-2 pb-2 w-32"
              >
                {angleLabel}
              </th>
              <th
                scope="col"
                className="text-left text-[11px] font-semibold uppercase tracking-wider text-asu-blue px-2 pb-2"
              >
                {rationaleLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => {
              const sourceValue = source[row.id] ?? "";
              return (
                <tr key={row.id}>
                  <td className="align-top py-1">
                    <div
                      className={`text-sm rounded-md border px-3 py-2 leading-snug bg-white border-gray-200 max-h-48 overflow-y-auto whitespace-pre-wrap ${
                        sourceValue ? "text-gray-700" : "text-gray-400 italic"
                      }`}
                    >
                      {sourceValue || "(blank, fill in earlier step)"}
                    </div>
                  </td>
                  <td className="align-top py-1">
                    <div className="text-sm font-semibold text-gray-700 px-2 py-2 leading-snug">
                      {row.angleLabel}
                    </div>
                  </td>
                  <td className="align-top py-1">
                    <AutoTextarea
                      aria-label={`${rationaleLabel} for ${row.angleLabel}`}
                      value={local[row.id] ?? ""}
                      onChange={(e) =>
                        updateRationale(row.id, e.target.value)
                      }
                      placeholder="Why this idea matters for your step-1 problem"
                      className="w-full text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue leading-snug"
                    />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-500 mt-2">
        The first column mirrors what you saved in the previous step. Updates
        from there appear here automatically.
      </p>
    </div>
  );
}
