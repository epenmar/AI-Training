"use client";

import { useState } from "react";

export type ClaimQuizData = {
  prompt?: string;
  claims: {
    id: string;
    text: string;
    verdict: "true" | "false" | "mixed";
    explanation: string;
  }[];
};

const VERDICT_LABEL: Record<ClaimQuizData["claims"][number]["verdict"], string> = {
  true: "True",
  false: "False",
  mixed: "Partly true",
};

export function ClaimQuiz({ data }: { data: ClaimQuizData }) {
  const [picked, setPicked] = useState<Record<string, string | null>>(() =>
    Object.fromEntries(data.claims.map((c) => [c.id, null]))
  );

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4 space-y-3">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700">{data.prompt}</p>
      )}
      {data.claims.map((claim) => {
        const choice = picked[claim.id];
        const reveal = choice != null;
        const isRight = choice === claim.verdict;
        return (
          <div
            key={claim.id}
            className="rounded-lg border border-gray-200 bg-white p-3"
          >
            <p className="text-sm text-gray-700 mb-3">&ldquo;{claim.text}&rdquo;</p>
            <div className="flex items-center gap-3 flex-wrap bg-asu-blue/5 rounded-md border border-asu-blue/25 px-3 py-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-asu-blue">
                Your call
              </span>
              <div className="flex flex-wrap gap-2">
                {(["true", "false", "mixed"] as const).map((opt) => {
                  const isSelected = choice === opt;
                  const isCorrect = reveal && opt === claim.verdict;
                  const tone = isCorrect
                    ? "bg-asu-green text-white border-asu-green"
                    : isSelected
                      ? "bg-red-200 text-red-800 border-red-300"
                      : "bg-white text-gray-700 border-gray-300 hover:border-asu-blue hover:text-asu-blue";
                  return (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={isSelected}
                      onClick={() =>
                        setPicked((p) => ({ ...p, [claim.id]: opt }))
                      }
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md cursor-pointer transition-all border ${tone}`}
                    >
                      <span
                        className={`inline-flex items-center justify-center w-4 h-4 rounded-full border-2 ${
                          isSelected
                            ? "border-white bg-white/30"
                            : "border-gray-400"
                        }`}
                        aria-hidden="true"
                      >
                        {isSelected && (
                          <span className="block w-1.5 h-1.5 rounded-full bg-current" />
                        )}
                      </span>
                      {VERDICT_LABEL[opt]}
                    </button>
                  );
                })}
              </div>
              {!reveal && (
                <span className="text-[11px] text-gray-400 italic">
                  Pick one
                </span>
              )}
            </div>
            {reveal && (
              <p
                className={`mt-2 text-xs ${
                  isRight ? "text-green-700" : "text-red-700"
                }`}
              >
                {isRight ? "✓ " : "✗ "}
                {claim.explanation}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
