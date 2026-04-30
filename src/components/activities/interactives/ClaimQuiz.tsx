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
            <p className="text-sm text-gray-700 mb-2">&ldquo;{claim.text}&rdquo;</p>
            <div className="flex flex-wrap gap-2">
              {(["true", "false", "mixed"] as const).map((opt) => {
                const isSelected = choice === opt;
                const isCorrect = reveal && opt === claim.verdict;
                return (
                  <button
                    key={opt}
                    type="button"
                    aria-pressed={isSelected}
                    onClick={() => setPicked((p) => ({ ...p, [claim.id]: opt }))}
                    className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                      isCorrect
                        ? "bg-asu-green text-white"
                        : isSelected
                          ? "bg-red-200 text-red-800"
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                    }`}
                  >
                    {VERDICT_LABEL[opt]}
                  </button>
                );
              })}
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
