"use client";

import { useEffect, useState } from "react";
import { submitFeedback, type FeedbackKind } from "@/app/(dashboard)/feedback/actions";

type Path = {
  kind: FeedbackKind;
  label: string;
  sub: string;
  accent: string; // ring/text when selected
  icon: React.ReactNode;
};

const PATHS: Path[] = [
  {
    kind: "praise",
    label: "I like something",
    sub: "Tell us what's working well",
    accent: "border-asu-green text-green-700 bg-asu-green/5",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5"
      />
    ),
  },
  {
    kind: "problem",
    label: "Something's wrong or outdated",
    sub: "A bug, a broken link, or out-of-date info",
    accent: "border-red-400 text-red-700 bg-red-50",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    ),
  },
  {
    kind: "feature",
    label: "Suggest a feature",
    sub: "An idea to make this better",
    accent: "border-asu-blue text-asu-blue bg-asu-blue/5",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
      />
    ),
  },
];

export function FeedbackModal({
  open,
  onClose,
  pagePath,
}: {
  open: boolean;
  onClose: () => void;
  pagePath?: string;
}) {
  const [kind, setKind] = useState<FeedbackKind | null>(null);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  // State resets on each open via a key remount from the parent, so no
  // reset effect is needed here.

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const handleSubmit = async () => {
    if (!kind) {
      setError("Pick one of the three above first.");
      return;
    }
    if (!message.trim()) {
      setError("Add a short note so we know what you mean.");
      return;
    }
    setSubmitting(true);
    setError("");
    const res = await submitFeedback({ kind, message, pagePath });
    setSubmitting(false);
    if ("error" in res) {
      setError(res.error);
      return;
    }
    setDone(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        onClick={onClose}
        aria-label="Close feedback form"
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Leave feedback"
        className="relative w-full max-w-md bg-white rounded-xl shadow-xl border border-gray-200 p-5"
      >
        {done ? (
          <div className="text-center py-6">
            <div className="mx-auto w-12 h-12 rounded-full bg-asu-green/15 flex items-center justify-center mb-3">
              <svg className="w-6 h-6 text-green-700" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-800">Thanks for the feedback</h2>
            <p className="text-sm text-gray-500 mt-1">
              It goes straight to the team building this. We read every note.
            </p>
            <button
              type="button"
              onClick={onClose}
              className="mt-5 px-4 py-2 text-sm font-semibold rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover cursor-pointer"
            >
              Done
            </button>
          </div>
        ) : (
          <>
            <div className="flex items-start justify-between mb-1">
              <h2 className="text-lg font-semibold text-gray-800">Leave feedback</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-1 -mr-1 text-gray-400 hover:text-gray-600 cursor-pointer"
                aria-label="Close"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <p className="text-sm text-gray-500 mb-4">What kind of feedback is this?</p>

            <div className="space-y-2 mb-4">
              {PATHS.map((p) => {
                const selected = kind === p.kind;
                return (
                  <button
                    key={p.kind}
                    type="button"
                    onClick={() => {
                      setKind(p.kind);
                      setError("");
                    }}
                    aria-pressed={selected}
                    className={`w-full flex items-center gap-3 text-left px-3 py-2.5 rounded-lg border transition-colors cursor-pointer ${
                      selected
                        ? `${p.accent} ring-2 ring-offset-1 ring-current/30`
                        : "border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      {p.icon}
                    </svg>
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold leading-tight">{p.label}</span>
                      <span className="block text-xs text-gray-500 leading-tight mt-0.5">{p.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>

            <label htmlFor="feedback-message" className="block text-sm font-medium text-gray-700 mb-1.5">
              Tell us more
            </label>
            <textarea
              id="feedback-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder={
                kind === "praise"
                  ? "What did you like?"
                  : kind === "problem"
                    ? "What's wrong, and where did you see it?"
                    : kind === "feature"
                      ? "What would you add, and what would it help with?"
                      : "A sentence or two is plenty."
              }
              className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-asu-maroon"
            />

            {error && (
              <p className="text-sm text-red-600 mt-2" role="alert">
                {error}
              </p>
            )}

            <div className="mt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="px-3 py-2 text-sm font-medium text-gray-500 hover:text-gray-700 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting}
                className="px-4 py-2 text-sm font-semibold rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover disabled:opacity-50 cursor-pointer"
              >
                {submitting ? "Sending…" : "Send feedback"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
