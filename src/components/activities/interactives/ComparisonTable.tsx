"use client";

import { Fragment, useEffect, useState } from "react";
import { AutoTextarea } from "./AutoTextarea";

type GroupColor =
  | "maroon"
  | "blue"
  | "gold"
  | "green"
  | "orange"
  | "neutral";

// Per-group color tints. `stickyBg` must be opaque (sticky-left cells
// hide whatever scrolls under them) so the values are pre-blended on
// white. `rowBg` paints the data cells; the textareas inside stay
// `bg-white`, so the tint shows in the gap created by border-spacing.
const GROUP_TINTS: Record<
  GroupColor,
  { rowBg: string; stickyBg: string; borderL: string; headerBg: string }
> = {
  maroon: {
    rowBg: "bg-asu-maroon/5",
    stickyBg: "bg-[#fbf2f4]",
    borderL: "border-asu-maroon/40",
    headerBg: "bg-asu-maroon/10 text-asu-maroon",
  },
  blue: {
    rowBg: "bg-asu-blue/5",
    stickyBg: "bg-[#f5fbff]",
    borderL: "border-asu-blue/40",
    headerBg: "bg-asu-blue/10 text-asu-blue",
  },
  gold: {
    rowBg: "bg-asu-gold/10",
    stickyBg: "bg-[#fff8df]",
    borderL: "border-asu-gold/60",
    headerBg: "bg-asu-gold/20 text-yellow-900",
  },
  green: {
    rowBg: "bg-asu-green/5",
    stickyBg: "bg-[#f4faea]",
    borderL: "border-asu-green/40",
    headerBg: "bg-asu-green/10 text-green-800",
  },
  orange: {
    rowBg: "bg-asu-orange/10",
    stickyBg: "bg-[#fff1e7]",
    borderL: "border-asu-orange/50",
    headerBg: "bg-asu-orange/15 text-orange-900",
  },
  neutral: {
    rowBg: "",
    stickyBg: "bg-[#f5fbff]",
    borderL: "border-gray-200",
    headerBg: "bg-gray-100 text-gray-700",
  },
};

export type ComparisonTableData = {
  storageKey: string;
  prompt?: string;
  rowHeader?: string;
  rows: {
    id: string;
    label: string;
    placeholder?: string;
    // When set, this row participates in a row-group. Adjacent rows
    // sharing a groupId render under one group header; the group's
    // color tints the row.
    groupId?: string;
  }[];
  rowGroups?: { id: string; label?: string; color?: GroupColor }[];
  columns: { id: string; label: string; placeholder?: string }[];
  cellPlaceholder?: string;
  // When true, row labels render as static text instead of editable inputs.
  rowsReadOnly?: boolean;
  // When true, column labels render as editable input fields whose
  // values persist alongside the cell data. Useful when columns
  // represent user-supplied entities (e.g., the actual tool names).
  editableColumnLabels?: boolean;
  // Show a "Download CSV" button under the table. CSV uses current
  // editable column labels (when applicable) and includes a "Group"
  // column up front when row groups are configured.
  enableCsvExport?: boolean;
  csvFilename?: string;
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

function escapeCsvCell(s: string): string {
  if (s.includes(",") || s.includes('"') || s.includes("\n") || s.includes("\r")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

function buildCsv(
  data: ComparisonTableData,
  state: Stored,
  colLabels: Record<string, string>
): string {
  const hasGroups = !!data.rowGroups && data.rowGroups.length > 0;
  const groupLabelById = new Map(
    (data.rowGroups ?? []).map((g) => [g.id, g.label ?? g.id])
  );

  const colLabel = (id: string, fallback: string) =>
    data.editableColumnLabels ? colLabels[id] ?? fallback : fallback;

  const headers: string[] = [];
  if (hasGroups) headers.push("Group");
  headers.push(data.rowHeader ?? "Row");
  for (const c of data.columns) headers.push(colLabel(c.id, c.label));

  const lines = [headers.map(escapeCsvCell).join(",")];
  for (const row of data.rows) {
    const values: string[] = [];
    if (hasGroups) {
      values.push(
        row.groupId ? (groupLabelById.get(row.groupId) ?? row.groupId) : ""
      );
    }
    values.push(row.label);
    for (const c of data.columns) {
      values.push(state[row.id]?.[c.id] ?? "");
    }
    lines.push(values.map(escapeCsvCell).join(","));
  }
  return lines.join("\n");
}

function downloadCsv(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
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

  const groupConfig = (groupId: string | undefined) =>
    groupId ? data.rowGroups?.find((g) => g.id === groupId) : undefined;
  const tintFor = (groupId: string | undefined) =>
    GROUP_TINTS[groupConfig(groupId)?.color ?? "neutral"];

  const onCsvDownload = () => {
    const csv = buildCsv(data, state, colLabels);
    downloadCsv(data.csvFilename ?? `${data.storageKey}.csv`, csv);
  };

  const totalCols = 1 + data.columns.length;

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}
      {/*
        overflow-x-auto on the wrapper enables horizontal scroll when the
        table is wider than its parent. The first column (row labels) is
        sticky-left so it stays visible while the user scrolls — useful
        on narrow screens or matrices with many tool columns.
      */}
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-1 text-sm">
          <thead>
            <tr>
              {/*
                Sticky cells need a fully-opaque bg so scrolling cells
                are hidden behind them. The card around the table is
                bg-asu-blue/5 (5% over white ≈ #f5fbff), so a solid
                bg-[#f5fbff] keeps the visual continuous.
              */}
              <th
                scope="col"
                className="sticky left-0 z-20 bg-[#f5fbff] text-left text-[11px] font-semibold uppercase tracking-wider text-asu-blue px-2 pb-2 shadow-[2px_0_0_0_rgba(0,163,224,0.15)]"
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
            {data.rows.map((row, i) => {
              const tint = tintFor(row.groupId);
              const prevGroupId = i > 0 ? data.rows[i - 1].groupId : undefined;
              const isFirstInGroup = row.groupId && row.groupId !== prevGroupId;
              const group = groupConfig(row.groupId);
              return (
                <Fragment key={row.id}>
                  {isFirstInGroup && group?.label && (
                    <tr>
                      <th
                        scope="rowgroup"
                        colSpan={totalCols}
                        className={`text-left text-[11px] font-bold uppercase tracking-wider rounded-md px-3 py-1.5 border-l-4 ${tint.borderL} ${tint.headerBg}`}
                      >
                        {group.label}
                      </th>
                    </tr>
                  )}
                  <tr>
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 ${tint.stickyBg} text-left align-top pr-2 py-1 shadow-[2px_0_0_0_rgba(0,163,224,0.15)]`}
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
                      <td
                        key={col.id}
                        className={`align-top py-1 min-w-[10rem] ${tint.rowBg}`}
                      >
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
                </Fragment>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-3">
        <p className="text-[11px] text-gray-500 flex-1">
          Saved in your browser. Capture your reflection in the deliverable
          box at the bottom of this page.
        </p>
        {data.enableCsvExport && (
          <button
            type="button"
            onClick={onCsvDownload}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-asu-blue text-white hover:opacity-90 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-asu-blue"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 16v2a2 2 0 002 2h12a2 2 0 002-2v-2M7 10l5 5m0 0l5-5m-5 5V4"
              />
            </svg>
            Download CSV
          </button>
        )}
      </div>
    </div>
  );
}
