"use client";

import { useState } from "react";

interface Props {
  activityId: number;
  // When provided, the suggester scopes its recommendations to a
  // specific step's task and the "why" lines lead with "Best for
  // [that step's specific task]…" instead of generic activity-level
  // commentary.
  stepNumber?: number;
}

type Tool = { name: string; url: string; why: string; vetted?: boolean };

// ASU's authoritative, regularly-updated approved-tools list. The
// suggester grounds its picks here (see the suggest-tools API).
const ASU_VETTED_TOOLS_URL = "https://ai.asu.edu/ai-tools";

export function ToolSuggester({ activityId, stepNumber }: Props) {
  const [tools, setTools] = useState<Tool[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSuggest = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/suggest-tools", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId, stepNumber }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.error === "not_configured") {
          setError(
            "Tool suggestions are not configured yet — ask an admin to set the Create AI env vars."
          );
        } else {
          setError("Couldn't fetch suggestions. Try again in a moment.");
        }
        return;
      }
      setTools(data.tools ?? []);
    } catch {
      setError("Couldn't fetch suggestions. Try again in a moment.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white border border-gray-300 border-dashed rounded-lg p-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M13 10V3L4 14h7v7l9-11h-7z"
              />
            </svg>
            External tools for this activity
            <span className="text-[10px] font-medium uppercase tracking-wider text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded">
              may not be ASU-vetted
            </span>
            {/* Hover-over: explains that suggestions are grounded in ASU's
                vetted tool list, with a link to that evergreen page. */}
            <span className="relative inline-flex group">
              <button
                type="button"
                aria-label="How these suggestions are sourced"
                className="text-gray-400 hover:text-gray-600 rounded-full cursor-help focus:outline-none focus-visible:ring-2 focus-visible:ring-asu-maroon"
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
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </button>
              <span
                role="tooltip"
                className="invisible opacity-0 group-hover:visible group-hover:opacity-100 group-focus-within:visible group-focus-within:opacity-100 transition-opacity absolute left-1/2 -translate-x-1/2 top-full mt-1.5 z-20 w-64 rounded-lg bg-gray-800 text-white text-[11px] font-normal normal-case tracking-normal leading-snug p-2.5 shadow-lg"
              >
                These suggestions prioritize tools on{" "}
                <a
                  href={ASU_VETTED_TOOLS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="underline font-medium hover:text-asu-gold"
                >
                  ASU&apos;s vetted AI tools list
                </a>
                , and mark which ones are ASU-approved. That list is kept
                up to date, so confirm a tool&apos;s current status there
                before relying on it.
              </span>
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            AI-generated suggestions. Some are ASU enterprise-approved
            (Adobe, Microsoft, Google, etc.); others may not be vetted
            for ASU data. Confirm vetting status and your data-handling
            needs before relying on any of them.
          </p>
        </div>
        <button
          onClick={handleSuggest}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-gray-700 text-white hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
        >
          {loading
            ? "Thinking..."
            : tools
              ? "Suggest again"
              : "Suggest tools"}
        </button>
      </div>

      {error && (
        <p className="text-sm text-red-600 mt-3" role="alert">
          {error}
        </p>
      )}

      {tools && tools.length === 0 && !error && (
        <p className="text-sm text-gray-500 mt-3">
          No suggestions came back — try again.
        </p>
      )}

      {tools && tools.length > 0 && (
        <ul className="mt-3 space-y-2">
          {tools.map((tool, i) => (
            <li
              key={`${tool.name}-${i}`}
              className="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 flex-wrap">
                  <a
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-asu-maroon hover:underline inline-flex items-center gap-1"
                  >
                    {tool.name}
                    <svg
                      className="w-3 h-3 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      aria-label="opens in new tab"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                  {tool.vetted && (
                    <span
                      className="text-[10px] font-semibold uppercase tracking-wide text-green-700 bg-green-50 border border-green-200 px-1.5 py-0.5 rounded"
                      title="On ASU's vetted AI tools list"
                    >
                      ASU-vetted
                    </span>
                  )}
                </div>
              </div>
              <p className="text-xs text-gray-600 mt-1">{tool.why}</p>
            </li>
          ))}
          <li className="text-xs text-gray-400 italic pt-1">
            Suggestions are AI-generated — verify the link and current
            availability before relying on them.
          </li>
        </ul>
      )}
    </div>
  );
}
