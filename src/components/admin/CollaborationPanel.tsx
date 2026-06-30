"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  setItemStatus,
  assignItem,
  toggleItemVote,
  addItemComment,
} from "@/app/(dashboard)/admin/actions";

export type CollabComment = {
  id: string;
  author_name: string | null;
  body: string;
  created_at: string;
};

type Props = {
  itemType: "note" | "feedback";
  itemId: string;
  status: string;
  assignedTo: string | null;
  voteCount: number;
  hasVoted: boolean;
  comments: CollabComment[];
  admins: { id: string; name: string }[];
};

const STATUSES: { value: string; label: string; on: string }[] = [
  { value: "open", label: "Open", on: "bg-white text-gray-700 shadow-sm" },
  { value: "in_progress", label: "In progress", on: "bg-white text-asu-blue shadow-sm" },
  { value: "resolved", label: "Resolved", on: "bg-white text-green-700 shadow-sm" },
];

function fmt(iso: string): string {
  return new Date(iso).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function CollaborationPanel({
  itemType,
  itemId,
  status,
  assignedTo,
  voteCount,
  hasVoted,
  comments,
  admins,
}: Props) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");

  const run = (fn: () => Promise<unknown>) =>
    start(async () => {
      await fn();
      router.refresh();
    });

  return (
    <div className="mt-3 border-t border-gray-100 pt-3">
      <div className="flex flex-wrap items-center gap-2">
        {/* Status */}
        <div className="inline-flex items-center gap-0.5 p-0.5 bg-gray-100 border border-gray-200 rounded-md">
          {STATUSES.map((s) => (
            <button
              key={s.value}
              type="button"
              disabled={pending}
              onClick={() =>
                run(() => setItemStatus({ itemType, itemId, status: s.value }))
              }
              className={`px-2 py-1 text-xs font-medium rounded transition-colors cursor-pointer disabled:opacity-50 ${
                status === s.value ? s.on : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Assignee */}
        <select
          value={assignedTo ?? ""}
          disabled={pending}
          onChange={(e) =>
            run(() =>
              assignItem({
                itemType,
                itemId,
                assignedTo: e.target.value || null,
              })
            )
          }
          className="text-xs border border-gray-200 rounded-md px-2 py-1 bg-white text-gray-600 focus:outline-none focus:ring-1 focus:ring-asu-maroon cursor-pointer disabled:opacity-50"
          aria-label="Assign to"
        >
          <option value="">Unassigned</option>
          {admins.map((a) => (
            <option key={a.id} value={a.id}>
              {a.name}
            </option>
          ))}
        </select>

        {/* Upvote */}
        <button
          type="button"
          disabled={pending}
          onClick={() => run(() => toggleItemVote({ itemType, itemId }))}
          aria-pressed={hasVoted}
          className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border transition-colors cursor-pointer disabled:opacity-50 ${
            hasVoted
              ? "border-asu-maroon/30 bg-asu-maroon/5 text-asu-maroon"
              : "border-gray-200 text-gray-500 hover:border-gray-300"
          }`}
          title={hasVoted ? "Remove your upvote" : "Upvote"}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
          </svg>
          {voteCount}
        </button>

        {/* Discussion toggle */}
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-md border border-gray-200 text-gray-500 hover:border-gray-300 cursor-pointer"
          aria-expanded={open}
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
          </svg>
          {comments.length > 0 ? `Discussion (${comments.length})` : "Discuss"}
        </button>
      </div>

      {open && (
        <div className="mt-3 rounded-lg bg-gray-50 border border-gray-200 p-3">
          {comments.length > 0 ? (
            <ul className="space-y-2 mb-3">
              {comments.map((c) => (
                <li key={c.id} className="text-sm">
                  <span className="font-semibold text-gray-700">
                    {c.author_name ?? "Admin"}
                  </span>{" "}
                  <span className="text-[11px] text-gray-400">{fmt(c.created_at)}</span>
                  <p className="text-gray-700 whitespace-pre-line">{c.body}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-400 mb-3">No discussion yet.</p>
          )}
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={2}
              placeholder="Add a note for the team…"
              className="flex-1 text-sm border border-gray-300 rounded-md px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-asu-maroon"
            />
            <button
              type="button"
              disabled={pending || !draft.trim()}
              onClick={() =>
                run(async () => {
                  const res = await addItemComment({
                    itemType,
                    itemId,
                    body: draft,
                  });
                  if (!("error" in res)) setDraft("");
                })
              }
              className="px-3 py-1.5 text-xs font-semibold rounded-md bg-asu-maroon text-white hover:bg-sidebar-hover disabled:opacity-50 cursor-pointer whitespace-nowrap"
            >
              Post
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
