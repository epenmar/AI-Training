"use client";

import { useState } from "react";

interface Props {
  activityId: number;
}

type Tool = { name: string; url: string; why: string };

export function ToolSuggester({ activityId }: Props) {
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
        body: JSON.stringify({ activityId }),
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
    <div className="bg-asu-blue/5 border border-asu-blue/20 rounded-lg p-4 mb-6">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-1.5">
            <svg
              className="w-4 h-4 text-asu-blue"
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
            Tools for this activity
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            Ask AI to suggest tools that fit this activity right now.
          </p>
        </div>
        <button
          onClick={handleSuggest}
          disabled={loading}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-asu-blue text-white hover:bg-blue-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer whitespace-nowrap"
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
