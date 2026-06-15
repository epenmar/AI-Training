"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAdminEdit } from "./AdminEditProvider";
import {
  addEditComment,
  resolveEditComment,
} from "@/app/(dashboard)/admin/actions";

export type AdminNoteTarget = {
  table: string;
  rowId: string;
  label: string;
};

export type AdminNote = {
  id: string;
  table_name: string;
  row_id: string;
  column_name: string | null;
  context_label: string | null;
  body: string;
  created_by_name: string | null;
  created_at: string;
};

// Admin-only panel near the top of an activity. Shows open editor
// notes for the activity + its steps and lets an admin add a note
// targeting any of them — including non-editable widgets (the note
// just attaches to the step). The reviewer (you) works through open
// notes and takes the bigger ones to AI.
export function AdminNotesPanel({
  targets,
  initialNotes,
  revalidate,
}: {
  targets: AdminNoteTarget[];
  initialNotes: AdminNote[];
  revalidate: string;
}) {
  const { showNotes: isAdmin } = useAdminEdit();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [open, setOpen] = useState(initialNotes.length > 0);
  const [body, setBody] = useState("");
  const [targetIdx, setTargetIdx] = useState(0);
  const [error, setError] = useState("");

  if (!isAdmin) return null;

  const handleAdd = () => {
    setError("");
    const t = targets[targetIdx];
    if (!t || !body.trim()) {
      setError("Pick a target and write a note.");
      return;
    }
    startTransition(async () => {
      const res = await addEditComment({
        table: t.table,
        rowId: t.rowId,
        contextLabel: t.label,
        body,
        revalidate,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setBody("");
      router.refresh();
    });
  };

  const handleResolve = (id: string) => {
    startTransition(async () => {
      await resolveEditComment(id, revalidate);
      router.refresh();
    });
  };

  return (
    <details
      open={open}
      onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}
      className="group mb-6 rounded-xl border-2 border-violet-500 bg-violet-50 shadow-sm"
    >
      <summary className="cursor-pointer list-none p-4 flex items-center justify-between gap-3">
        <span className="text-sm font-semibold uppercase tracking-wide text-violet-800 inline-flex items-center gap-2">
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          Reviewer notes
          <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-violet-200 text-[10px] font-bold text-violet-900">
            {initialNotes.length} open
          </span>
          <span className="text-[10px] font-medium normal-case tracking-normal text-violet-600">
            (admins only)
          </span>
        </span>
        <svg
          className="w-4 h-4 text-violet-800 transition-transform group-open:rotate-180"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </summary>

      <div className="px-4 pb-4 space-y-3">
        {/* Open notes */}
        {initialNotes.length > 0 ? (
          <ul className="space-y-2">
            {initialNotes.map((n) => (
              <li
                key={n.id}
                className="rounded-lg bg-white border border-gray-200 p-3"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    {n.context_label && (
                      <p className="text-[11px] font-bold uppercase tracking-wider text-asu-maroon">
                        {n.context_label}
                      </p>
                    )}
                    <p className="text-sm text-gray-700 whitespace-pre-line mt-0.5">
                      {n.body}
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      {n.created_by_name ?? "Unknown"} ·{" "}
                      {new Date(n.created_at).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                      })}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleResolve(n.id)}
                    disabled={pending}
                    className="flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md border border-asu-green/40 text-green-700 hover:bg-asu-green/5 disabled:opacity-50 cursor-pointer"
                  >
                    Resolve
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-xs text-gray-500">
            No open notes. Add one below — useful for flagging things
            that aren&apos;t inline-editable (widgets, whole steps, big
            rethinks).
          </p>
        )}

        {/* Add a note */}
        <div className="rounded-lg bg-white border border-gray-200 p-3 space-y-2">
          <div>
            <label
              htmlFor="note-target"
              className="block text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-1"
            >
              What's this note about?
            </label>
            <select
              id="note-target"
              value={targetIdx}
              onChange={(e) => setTargetIdx(Number(e.target.value))}
              className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-asu-maroon"
            >
              {targets.map((t, i) => (
                <option key={`${t.table}-${t.rowId}`} value={i}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={3}
            placeholder="e.g. This whole step should be reworked — the widget doesn't match the instruction. Take to AI."
            className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-asu-maroon resize-y"
          />
          {error && (
            <p className="text-xs text-red-600" role="alert">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={pending}
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 cursor-pointer"
            >
              {pending ? "Adding…" : "Add note"}
            </button>
          </div>
        </div>
      </div>
    </details>
  );
}
