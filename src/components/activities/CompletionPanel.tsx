"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { toggleCompletion, saveNotes } from "@/app/(dashboard)/activities/actions";

interface Props {
  activityId: number;
  isComplete: boolean;
  initialNotes: string;
  completedAt: string | null;
  deliverable: string | null;
}

export function CompletionPanel({
  activityId,
  isComplete,
  initialNotes,
  completedAt,
  deliverable,
}: Props) {
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes);
  const [noteStatus, setNoteStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");

  const handleToggle = () => {
    setError("");
    startTransition(async () => {
      const res = await toggleCompletion(activityId, isComplete, notes);
      if (res.error) setError(res.error);
    });
  };

  const handleSaveNotes = () => {
    setError("");
    setNoteStatus("saving");
    startTransition(async () => {
      const res = await saveNotes(activityId, notes);
      if (res.error) {
        setError(res.error);
        setNoteStatus("idle");
      } else {
        setNoteStatus("saved");
        setTimeout(() => setNoteStatus("idle"), 2000);
      }
    });
  };

  return (
    <div
      className={`rounded-lg border-2 p-5 ${
        isComplete
          ? "border-asu-green bg-asu-green/5"
          : "border-gray-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3 flex-wrap mb-4">
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-gray-700">
            {isComplete ? "Completed" : "Deliverable"}
          </h3>
          {deliverable && (
            <p className="text-sm text-gray-600 mt-1">{deliverable}</p>
          )}
          {isComplete && completedAt && (
            <p className="text-xs text-gray-500 mt-2">
              Marked complete{" "}
              {new Date(completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={handleToggle}
          disabled={pending}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
            isComplete
              ? "bg-white border border-gray-300 text-gray-700 hover:bg-gray-50"
              : "bg-asu-green text-white hover:bg-green-700"
          }`}
        >
          {pending
            ? "Saving..."
            : isComplete
              ? "Mark as not complete"
              : "Mark as complete"}
        </button>
        <Link
          href={`/community/new?activity=${activityId}`}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors"
        >
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
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Share to Look Book
        </Link>
      </div>

      {/* Deliverable notes */}
      <div>
        <label
          htmlFor="deliverable-notes"
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          Deliverable notes{" "}
          <span className="text-gray-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="deliverable-notes"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          placeholder="Links, reflections, or what you produced..."
          className="w-full text-sm border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent"
        />
        <div className="flex items-center justify-between mt-2">
          <p className="text-xs text-gray-400">
            Keep a record of what you created for this activity.
          </p>
          <button
            onClick={handleSaveNotes}
            disabled={pending || notes === initialNotes}
            className="text-sm text-asu-maroon hover:underline disabled:opacity-40 disabled:cursor-not-allowed disabled:no-underline cursor-pointer font-medium"
          >
            {noteStatus === "saving"
              ? "Saving..."
              : noteStatus === "saved"
                ? "Saved ✓"
                : "Save notes"}
          </button>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
