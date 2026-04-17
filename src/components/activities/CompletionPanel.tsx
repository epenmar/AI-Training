"use client";

import { useState, useTransition } from "react";
import { toggleCompletion, saveNotes } from "@/app/(dashboard)/activities/actions";

interface Props {
  activityId: number;
  isComplete: boolean;
  initialNotes: string;
  completedAt: string | null;
}

export function CompletionPanel({
  activityId,
  isComplete,
  initialNotes,
  completedAt,
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
      <div className="flex items-start justify-between gap-3 flex-wrap mb-3">
        <div>
          <h3 className="text-base font-semibold text-gray-700">
            {isComplete ? "Completed" : "Track your progress"}
          </h3>
          {isComplete && completedAt && (
            <p className="text-xs text-gray-500 mt-0.5">
              Marked complete{" "}
              {new Date(completedAt).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </p>
          )}
        </div>
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
