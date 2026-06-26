"use client";

import { useEffect, useRef, useState } from "react";

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

const SYNC_EVENT = "citation-tracker:storage-update";

// Entry mode owns `citations`; verify mode owns `verdicts`. They share a
// storageKey so the verify step can read the citations the entry step
// captured. Merge on write so neither instance clobbers the other's
// field, and broadcast so the sibling instance on the same page re-reads
// without a reload (the bug: verify hydrated empty and never refreshed).
function writeStorage(key: string, partial: Partial<Stored>, count: number) {
  if (typeof window === "undefined") return;
  try {
    const cur = readStorage(key, count);
    const merged: Stored = {
      citations: partial.citations ?? cur.citations,
      verdicts: partial.verdicts ?? cur.verdicts,
    };
    window.localStorage.setItem(key, JSON.stringify(merged));
    window.dispatchEvent(new CustomEvent(SYNC_EVENT, { detail: { key } }));
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
  const lastWritten = useRef<string>("");

  useEffect(() => {
    setState(readStorage(data.storageKey, data.count));
    setHydrated(true);
    if (typeof window === "undefined") return;
    // Re-read when the sibling instance (entry <-> verify, same key on
    // the same page) writes, or when another tab updates storage.
    const reread = () => {
      const fresh = readStorage(data.storageKey, data.count);
      setState((cur) =>
        JSON.stringify(cur) === JSON.stringify(fresh) ? cur : fresh
      );
    };
    const onSync = (e: Event) => {
      if ((e as CustomEvent<{ key: string }>).detail?.key === data.storageKey)
        reread();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === data.storageKey) reread();
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/set-state-in-effect
  }, [data.storageKey, data.count]);

  useEffect(() => {
    if (!hydrated) return;
    // Write only this instance's own field so it never clobbers the
    // sibling's data (entry writes citations; verify writes verdicts).
    const partial: Partial<Stored> =
      data.mode === "entry"
        ? { citations: state.citations }
        : { verdicts: state.verdicts };
    const ser = JSON.stringify(partial);
    if (ser === lastWritten.current) return;
    lastWritten.current = ser;
    writeStorage(data.storageKey, partial, data.count);
  }, [state, data.mode, data.storageKey, data.count, hydrated]);

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
        <p className="text-xs text-gray-600 mt-3">
          Saved automatically in your browser — these carry to the verify
          step, where you&apos;ll mark each one Real, Frankenstein, or Fully
          invented.
        </p>
      </div>
    );
  }

  // verify mode
  const allEmpty = state.citations.every((c) => !c.trim());
  const markedCount = state.verdicts.filter((v) => v != null).length;
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
        <>
          <p className="text-xs text-gray-500 mb-3">
            Tap one verdict per citation. Progress, {markedCount} of{" "}
            {state.citations.length} marked.
          </p>
          <ol className="space-y-3 list-decimal pl-5">
            {state.citations.map((cite, i) => {
              const selected = state.verdicts[i];
              return (
                <li key={i} className="space-y-2">
                  <p className="text-sm text-gray-700 bg-white rounded-md border border-gray-200 px-3 py-2 font-mono leading-snug whitespace-pre-wrap">
                    {cite || (
                      <span className="text-gray-400 italic">(blank)</span>
                    )}
                  </p>
                  <div className="flex items-center gap-3 flex-wrap bg-white rounded-md border border-asu-blue/30 px-3 py-2">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-asu-blue">
                      Mark as
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {VERDICTS.map((v) => {
                        const isSelected = selected === v.value;
                        return (
                          <button
                            key={v.value}
                            type="button"
                            aria-pressed={isSelected}
                            onClick={() =>
                              setState((s) => {
                                const next = [...s.verdicts];
                                next[i] = v.value;
                                return { ...s, verdicts: next };
                              })
                            }
                            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-md cursor-pointer transition-all ${
                              isSelected
                                ? `${v.tone} ring-2 ring-offset-1 ring-current/30`
                                : "bg-white border border-gray-300 text-gray-700 hover:border-asu-blue hover:text-asu-blue"
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
                            {v.label}
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
                </li>
              );
            })}
          </ol>
        </>
      )}
    </div>
  );
}
