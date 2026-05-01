"use client";

import { useEffect, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

export type ComparisonTableData = {
  storageKey: string;
  prompt?: string;
  rowHeader?: string;
  rows: { id: string; label: string; placeholder?: string }[];
  columns: { id: string; label: string }[];
  cellPlaceholder?: string;
  // When true, row labels render as static text instead of editable inputs.
  rowsReadOnly?: boolean;
};

type Stored = Record<string, Record<string, string>>;

function emptyState(rows: ComparisonTableData["rows"]): Stored {
  return Object.fromEntries(rows.map((r) => [r.id, {}]));
}

function readStorage(key: string, rows: ComparisonTableData["rows"]): Stored {
  if (typeof window === "undefined") return emptyState(rows);
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return emptyState(rows);
    const parsed = JSON.parse(raw) as Stored;
    const merged = emptyState(rows);
    for (const r of rows) {
      merged[r.id] = { ...(parsed[r.id] ?? {}) };
    }
    return merged;
  } catch {
    return emptyState(rows);
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

export function ComparisonTable({ data }: { data: ComparisonTableData }) {
  const [state, setState] = useState<Stored>(emptyState(data.rows));
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage(data.storageKey, data.rows));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.storageKey]);

  useEffect(() => {
    if (hydrated) writeStorage(data.storageKey, state);
  }, [state, data.storageKey, hydrated]);

  const update = (rowId: string, colId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      [rowId]: { ...(prev[rowId] ?? {}), [colId]: value },
    }));
  };

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
                className="text-left text-[11px] font-semibold uppercase tracking-wider text-asu-blue px-2 pb-2"
              >
                {data.rowHeader ?? ""}
              </th>
              {data.columns.map((c) => (
                <th
                  key={c.id}
                  scope="col"
                  className="text-left text-[11px] font-semibold uppercase tracking-wider text-asu-blue px-2 pb-2"
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row) => (
              <tr key={row.id}>
                <th
                  scope="row"
                  className="text-left align-top pr-2 py-1"
                >
                  {data.rowsReadOnly ? (
                    <span className="block w-40 text-sm font-semibold text-gray-700 px-1 py-1.5 leading-snug">
                      {row.label}
                    </span>
                  ) : (
                    <input
                      type="text"
                      aria-label={`${row.label} name`}
                      defaultValue={row.label}
                      placeholder={row.placeholder ?? row.label}
                      onChange={(e) => update(row.id, "_label", e.target.value)}
                      className="w-32 text-sm font-semibold text-gray-700 bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue"
                    />
                  )}
                </th>
                {data.columns.map((col) => (
                  <td key={col.id} className="align-top py-1 min-w-[10rem]">
                    <AutoTextarea
                      aria-label={`${row.label} ${col.label}`}
                      value={state[row.id]?.[col.id] ?? ""}
                      onChange={(e) => update(row.id, col.id, e.target.value)}
                      placeholder={data.cellPlaceholder}
                      className="w-full text-sm bg-white border border-gray-200 rounded-md px-2 py-1.5 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue leading-snug"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[11px] text-gray-500 mt-2">
        Saved in your browser. Capture your reflection in the deliverable
        box at the bottom of this page.
      </p>
    </div>
  );
}
