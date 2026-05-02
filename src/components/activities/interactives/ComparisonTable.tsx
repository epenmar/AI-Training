"use client";

import { useEffect, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

export type ComparisonTableData = {
  storageKey: string;
  prompt?: string;
  rowHeader?: string;
  rows: { id: string; label: string; placeholder?: string }[];
  columns: { id: string; label: string; placeholder?: string }[];
  cellPlaceholder?: string;
  // When true, row labels render as static text instead of editable inputs.
  rowsReadOnly?: boolean;
  // When true, column labels render as editable input fields whose
  // values persist alongside the cell data. Useful when columns
  // represent user-supplied entities (e.g., the actual tool names).
  editableColumnLabels?: boolean;
};

type Stored = Record<string, Record<string, string>>;

// Editable column labels live under their own localStorage key so the
// cell-value shape stays clean.
function colLabelsKey(storageKey: string): string {
  return `${storageKey}:colLabels`;
}

function readColLabels(
  storageKey: string,
  columns: ComparisonTableData["columns"]
): Record<string, string> {
  const empty: Record<string, string> = Object.fromEntries(
    columns.map((c) => [c.id, c.label])
  );
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(colLabelsKey(storageKey));
    if (!raw) return empty;
    const parsed = JSON.parse(raw) as Record<string, string>;
    const merged = { ...empty };
    for (const c of columns) {
      if (typeof parsed[c.id] === "string") merged[c.id] = parsed[c.id];
    }
    return merged;
  } catch {
    return empty;
  }
}

function writeColLabels(storageKey: string, value: Record<string, string>) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(colLabelsKey(storageKey), JSON.stringify(value));
  } catch {
    // ignore
  }
}

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
  const [colLabels, setColLabels] = useState<Record<string, string>>(() =>
    Object.fromEntries(data.columns.map((c) => [c.id, c.label]))
  );
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage(data.storageKey, data.rows));
    setColLabels(readColLabels(data.storageKey, data.columns));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.storageKey]);

  useEffect(() => {
    if (hydrated) writeStorage(data.storageKey, state);
  }, [state, data.storageKey, hydrated]);

  useEffect(() => {
    if (hydrated && data.editableColumnLabels) {
      writeColLabels(data.storageKey, colLabels);
    }
  }, [colLabels, data.storageKey, data.editableColumnLabels, hydrated]);

  const update = (rowId: string, colId: string, value: string) => {
    setState((prev) => ({
      ...prev,
      [rowId]: { ...(prev[rowId] ?? {}), [colId]: value },
    }));
  };

  const updateColLabel = (colId: string, value: string) => {
    setColLabels((prev) => ({ ...prev, [colId]: value }));
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
                  {data.editableColumnLabels ? (
                    <input
                      type="text"
                      aria-label={`${c.label} name`}
                      value={colLabels[c.id] ?? c.label}
                      onChange={(e) => updateColLabel(c.id, e.target.value)}
                      placeholder={c.placeholder ?? c.label}
                      className="w-full text-[11px] font-semibold uppercase tracking-wider text-asu-blue bg-white border border-gray-200 rounded-md px-2 py-1 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue normal-case"
                    />
                  ) : (
                    c.label
                  )}
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
