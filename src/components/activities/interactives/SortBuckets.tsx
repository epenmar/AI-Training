"use client";

import { useMemo, useState } from "react";

export type SortBucketsData = {
  prompt?: string;
  buckets: { id: string; label: string }[];
  items: { id: string; text: string; bucketId: string; rationale?: string }[];
};

type AnswerState = Record<string, string | null>;

export function SortBuckets({ data }: { data: SortBucketsData }) {
  const initial = useMemo<AnswerState>(
    () => Object.fromEntries(data.items.map((it) => [it.id, null])),
    [data.items]
  );
  const [answers, setAnswers] = useState<AnswerState>(initial);
  const [checked, setChecked] = useState(false);

  const allAnswered = data.items.every((it) => answers[it.id] != null);

  const correctCount = data.items.reduce(
    (n, it) => (answers[it.id] === it.bucketId ? n + 1 : n),
    0
  );

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}
      <ul className="space-y-3">
        {data.items.map((item) => {
          const selected = answers[item.id];
          const isCorrect = checked && selected === item.bucketId;
          const isWrong = checked && selected != null && selected !== item.bucketId;
          return (
            <li
              key={item.id}
              className={`rounded-lg border bg-white p-3 transition-colors ${
                isCorrect
                  ? "border-asu-green/50 bg-asu-green/5"
                  : isWrong
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
              }`}
            >
              <p className="text-sm text-gray-700 mb-3">{item.text}</p>
              <div className="flex items-center gap-3 flex-wrap bg-asu-blue/5 rounded-md border border-asu-blue/25 px-3 py-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-asu-blue">
                  Sort into
                </span>
                <div className="flex flex-wrap gap-2">
                  {data.buckets.map((b) => {
                    const isSelected = selected === b.id;
                    return (
                      <button
                        key={b.id}
                        type="button"
                        aria-pressed={isSelected}
                        disabled={checked && isCorrect}
                        onClick={() =>
                          setAnswers((a) => ({ ...a, [item.id]: b.id }))
                        }
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md cursor-pointer transition-all border disabled:cursor-default ${
                          isSelected
                            ? "bg-asu-blue text-white border-asu-blue"
                            : "bg-white text-gray-700 border-gray-300 hover:border-asu-blue hover:text-asu-blue"
                        }`}
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
                        {b.label}
                      </button>
                    );
                  })}
                </div>
                {selected == null && (
                  <span className="text-[11px] text-gray-400 italic">
                    Pick one
                  </span>
                )}
              </div>
              {isWrong && item.rationale && (
                <p className="mt-2 text-xs text-red-700">{item.rationale}</p>
              )}
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={!allAnswered}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-asu-blue text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Check answers
        </button>
        {checked && (
          <p className="text-xs text-gray-600">
            {correctCount} of {data.items.length} correct
          </p>
        )}
        {checked && correctCount < data.items.length && (
          <button
            type="button"
            onClick={() => {
              setAnswers(initial);
              setChecked(false);
            }}
            className="text-xs text-asu-maroon hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>
    </div>
  );
}
