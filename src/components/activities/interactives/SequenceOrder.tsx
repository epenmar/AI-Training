"use client";

import { useMemo, useState } from "react";

export type SequenceOrderData = {
  prompt?: string;
  // Items provided in correct order — the widget shuffles them on first render.
  items: { id: string; text: string }[];
};

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function SequenceOrder({ data }: { data: SequenceOrderData }) {
  const correct = useMemo(() => data.items.map((it) => it.id), [data.items]);
  const [order, setOrder] = useState(() => {
    let s = shuffle(data.items.map((it) => it.id));
    // ensure it's not already in correct order
    if (s.join() === correct.join() && s.length > 1) {
      [s[0], s[1]] = [s[1], s[0]];
    }
    return s;
  });
  const [checked, setChecked] = useState(false);
  const itemsById = useMemo(
    () => Object.fromEntries(data.items.map((it) => [it.id, it])),
    [data.items]
  );

  const move = (idx: number, dir: -1 | 1) => {
    setChecked(false);
    setOrder((prev) => {
      const next = [...prev];
      const j = idx + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[idx], next[j]] = [next[j], next[idx]];
      return next;
    });
  };

  const allCorrect = order.join() === correct.join();

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}
      <ol className="space-y-2">
        {order.map((id, idx) => {
          const item = itemsById[id];
          const correctIdx = correct.indexOf(id);
          const isInPlace = checked && correctIdx === idx;
          const isWrong = checked && correctIdx !== idx;
          return (
            <li
              key={id}
              className={`flex items-center gap-2 rounded-lg border bg-white p-2 transition-colors ${
                isInPlace
                  ? "border-asu-green/50 bg-asu-green/5"
                  : isWrong
                    ? "border-red-300 bg-red-50"
                    : "border-gray-200"
              }`}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gray-100 text-xs font-bold text-gray-500">
                {idx + 1}
              </span>
              <p className="flex-1 text-sm text-gray-700">{item.text}</p>
              <div className="flex flex-col gap-0.5">
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  aria-label="Move up"
                  className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === order.length - 1}
                  aria-label="Move down"
                  className="px-1.5 py-0.5 text-xs rounded bg-gray-100 text-gray-500 hover:bg-gray-200 disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                >
                  ▼
                </button>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={() => setChecked(true)}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-asu-blue text-white hover:opacity-90 cursor-pointer"
        >
          Check order
        </button>
        {checked && allCorrect && (
          <p className="text-xs font-semibold text-green-700">
            ✓ Correct order
          </p>
        )}
        {checked && !allCorrect && (
          <p className="text-xs text-red-700">
            Not quite — keep adjusting and try again.
          </p>
        )}
      </div>
    </div>
  );
}
