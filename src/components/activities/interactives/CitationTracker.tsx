"use client";

import { useEffect, useState } from "react";

type Verdict = "real" | "frankenstein" | "invented" | null;

type Stored = {
  citations: string[];
  verdicts: Verdict[];
};

export type CitationTrackerData = {
  storageKey: string;
  mode: "entry" | "verify";
  count: number;
  prompt?: string;
};

const VERDICTS: { value: Exclude<Verdict, null>; label: string; tone: string }[] = [
  { value: "real", label: "Real", tone: "bg-asu-green text-white" },
  {
    value: "frankenstein",
    label: "Frankenstein",
    tone: "bg-asu-orange text-white",
  },
  { value: "invented", label: "Fully invented", tone: "bg-red-600 text-white" },
];

function readStorage(key: string, count: number): Stored {
  const blank: Stored = {
    citations: Array(count).fill(""),
    verdicts: Array(count).fill(null),
  };
  if (typeof window === "undefined") return blank;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return blank;
    const parsed = JSON.parse(raw) as Partial<Stored>;
    return {
      citations: Array.from(
        { length: count },
        (_, i) => parsed.citations?.[i] ?? ""
      ),
      verdicts: Array.from(
        { length: count },
        (_, i) => (parsed.verdicts?.[i] ?? null) as Verdict
      ),
    };
  } catch {
    return blank;
  }
}

function writeStorage(key: string, value: Stored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore
  }
}

export function CitationTracker({ data }: { data: CitationTrackerData }) {
  const [state, setState] = useState<Stored>({
    citations: Array(data.count).fill(""),
    verdicts: Array(data.count).fill(null),
  });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    setState(readStorage(data.storageKey, data.count));
    setHydrated(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.storageKey, data.count]);

  useEffect(() => {
    if (hydrated) writeStorage(data.storageKey, state);
  }, [state, data.storageKey, hydrated]);

  if (data.mode === "entry") {
    return (
      <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
        {data.prompt && (
          <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
        )}
        <ol className="space-y-2 list-decimal pl-5">
          {Array.from({ length: data.count }, (_, i) => (
            <li key={i}>
              <textarea
                value={state.citations[i] ?? ""}
                onChange={(e) =>
                  setState((s) => {
                    const next = [...s.citations];
                    next[i] = e.target.value;
                    return { ...s, citations: next };
                  })
                }
                rows={2}
                placeholder="Paste the citation exactly as the AI gave it"
                className="w-full text-sm bg-white border border-gray-200 rounded-md px-3 py-2 focus:border-asu-blue focus:outline-none focus:ring-1 focus:ring-asu-blue font-mono leading-snug"
              />
            </li>
          ))}
        </ol>
        <p className="text-[11px] text-gray-400 mt-3">
          Saved in your browser. You'll come back to these in a later step to
          mark each one Real, Frankenstein, or Fully invented.
        </p>
      </div>
    );
  }

  // verify mode
  const allEmpty = state.citations.every((c) => !c.trim());
  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}
      {allEmpty ? (
        <p className="text-sm text-gray-500 italic">
          No citations stored yet. Go back to the earlier step to enter them.
        </p>
      ) : (
        <ol className="space-y-2 list-decimal pl-5">
          {state.citations.map((cite, i) => (
            <li key={i} className="space-y-2">
              <p className="text-sm text-gray-700 bg-white rounded-md border border-gray-200 px-3 py-2 font-mono leading-snug whitespace-pre-wrap">
                {cite || (
                  <span className="text-gray-400 italic">(blank)</span>
                )}
              </p>
              <div className="flex flex-wrap gap-2">
                {VERDICTS.map((v) => {
                  const selected = state.verdicts[i] === v.value;
                  return (
                    <button
                      key={v.value}
                      type="button"
                      aria-pressed={selected}
                      onClick={() =>
                        setState((s) => {
                          const next = [...s.verdicts];
                          next[i] = v.value;
                          return { ...s, verdicts: next };
                        })
                      }
                      className={`px-3 py-1 text-xs font-semibold rounded-md cursor-pointer transition-colors ${
                        selected
                          ? v.tone
                          : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                      }`}
                    >
                      {v.label}
                    </button>
                  );
                })}
              </div>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
