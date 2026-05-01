"use client";

import { useMemo, useState } from "react";

export type SortBucketsData = {
  prompt?: string;
  buckets: { id: string; label: string }[];
  items: { id: string; text: string; bucketId: string; rationale?: string }[];
};

type Placement = Record<string, string | null>; // itemId -> bucketId | null (unsorted)

export function SortBuckets({ data }: { data: SortBucketsData }) {
  const initial = useMemo<Placement>(
    () => Object.fromEntries(data.items.map((it) => [it.id, null])),
    [data.items]
  );
  const [placement, setPlacement] = useState<Placement>(initial);
  const [active, setActive] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const itemsById = useMemo(
    () => Object.fromEntries(data.items.map((it) => [it.id, it])),
    [data.items]
  );

  const unsorted = data.items.filter((it) => !placement[it.id]);
  const allPlaced = unsorted.length === 0;
  const correctCount = data.items.reduce(
    (n, it) => (placement[it.id] === it.bucketId ? n + 1 : n),
    0
  );

  function placeInto(itemId: string | null, bucketId: string | null) {
    if (!itemId) return;
    setPlacement((p) => ({ ...p, [itemId]: bucketId }));
    setActive(null);
  }

  function pickItem(itemId: string) {
    if (checked) return;
    setActive((cur) => (cur === itemId ? null : itemId));
  }

  function reset() {
    setPlacement(initial);
    setActive(null);
    setChecked(false);
  }

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}

      {/* Unsorted chips */}
      <div className="rounded-lg bg-white border border-dashed border-gray-300 p-3 mb-3">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-gray-500 mb-2">
          To sort{unsorted.length > 0 ? ` (${unsorted.length})` : ""}
        </p>
        {unsorted.length > 0 ? (
          <ul className="flex flex-wrap gap-2">
            {unsorted.map((it) => {
              const isActive = active === it.id;
              return (
                <li key={it.id}>
                  <button
                    type="button"
                    aria-pressed={isActive}
                    onClick={() => pickItem(it.id)}
                    className={`text-left text-sm rounded-md border px-3 py-2 cursor-pointer transition-all ${
                      isActive
                        ? "border-asu-blue ring-2 ring-asu-blue/30 bg-asu-blue/10 text-gray-700"
                        : "border-gray-300 bg-white text-gray-700 hover:border-asu-blue hover:text-asu-blue"
                    }`}
                  >
                    {it.text}
                  </button>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="text-xs text-gray-400 italic">All items placed.</p>
        )}
      </div>

      {/* Active hint */}
      {active && (
        <p className="text-xs text-asu-blue font-medium mb-2">
          Selected. Click a bucket below to drop it.
        </p>
      )}

      {/* Buckets */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {data.buckets.map((b) => {
          const inBucket = data.items.filter((it) => placement[it.id] === b.id);
          return (
            <button
              key={b.id}
              type="button"
              onClick={() => placeInto(active, b.id)}
              disabled={!active}
              aria-label={`Drop into ${b.label}`}
              className={`text-left rounded-lg border-2 bg-white p-3 transition-colors ${
                active
                  ? "border-asu-blue/50 hover:border-asu-blue hover:bg-asu-blue/5 cursor-pointer"
                  : "border-gray-200 cursor-default"
              }`}
            >
              <p className="text-sm font-bold text-asu-blue mb-2">{b.label}</p>
              {inBucket.length === 0 ? (
                <p className="text-xs text-gray-400 italic">Empty</p>
              ) : (
                <ul className="flex flex-col gap-1.5">
                  {inBucket.map((it) => {
                    const isCorrect = checked && placement[it.id] === it.bucketId;
                    const isWrong =
                      checked && placement[it.id] != null && !isCorrect;
                    return (
                      <li
                        key={it.id}
                        className={`text-sm rounded-md border px-2 py-1.5 flex items-start justify-between gap-2 ${
                          isCorrect
                            ? "border-asu-green/50 bg-asu-green/5"
                            : isWrong
                              ? "border-red-300 bg-red-50"
                              : "border-gray-200 bg-gray-50"
                        }`}
                      >
                        <span className="flex-1">{it.text}</span>
                        {!checked && (
                          <span
                            role="button"
                            tabIndex={0}
                            onClick={(e) => {
                              e.stopPropagation();
                              setPlacement((p) => ({ ...p, [it.id]: null }));
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" || e.key === " ") {
                                e.preventDefault();
                                setPlacement((p) => ({ ...p, [it.id]: null }));
                              }
                            }}
                            aria-label={`Remove ${it.text} from ${b.label}`}
                            className="text-xs text-gray-400 hover:text-asu-maroon cursor-pointer"
                          >
                            ✕
                          </span>
                        )}
                      </li>
                    );
                  })}
                </ul>
              )}
            </button>
          );
        })}
      </div>

      {/* Check + feedback */}
      <div className="mt-3 flex items-center gap-3 flex-wrap">
        <button
          type="button"
          onClick={() => setChecked(true)}
          disabled={!allPlaced}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-asu-blue text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Check answers
        </button>
        {checked && (
          <p className="text-xs text-gray-600">
            {correctCount} of {data.items.length} correct
          </p>
        )}
        {(allPlaced || checked) && (
          <button
            type="button"
            onClick={reset}
            className="text-xs text-asu-maroon hover:underline cursor-pointer"
          >
            Reset
          </button>
        )}
      </div>

      {/* Per-item rationale (only on wrong placements) */}
      {checked && (
        <ul className="mt-3 space-y-1">
          {data.items
            .filter((it) => placement[it.id] !== it.bucketId && it.rationale)
            .map((it) => (
              <li key={it.id} className="text-xs text-red-700">
                <span className="font-semibold">&ldquo;{it.text}&rdquo;:</span>{" "}
                {it.rationale}
              </li>
            ))}
        </ul>
      )}
    </div>
  );
}
