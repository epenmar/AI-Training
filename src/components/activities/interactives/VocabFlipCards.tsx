"use client";

import { useState } from "react";

export type VocabFlipCardsData = {
  cards: { term: string; definition: string }[];
};

export function VocabFlipCards({ data }: { data: VocabFlipCardsData }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {data.cards.map((card, i) => (
        <FlipCard key={i} term={card.term} definition={card.definition} />
      ))}
    </div>
  );
}

function FlipCard({ term, definition }: { term: string; definition: string }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <button
      type="button"
      aria-pressed={flipped}
      onClick={() => setFlipped((f) => !f)}
      className="group relative h-32 w-full cursor-pointer rounded-lg border border-asu-maroon/25 bg-white text-left transition-all hover:border-asu-maroon/50 hover:shadow-sm focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:ring-offset-2"
    >
      <div className="flex h-full flex-col justify-between p-4">
        {flipped ? (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-asu-maroon">
              Definition
            </p>
            <p className="text-sm text-gray-700 leading-snug">{definition}</p>
            <p className="text-[10px] text-gray-400">Click to flip back</p>
          </>
        ) : (
          <>
            <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
              Term
            </p>
            <p className="text-base font-semibold text-asu-maroon leading-snug">
              {term}
            </p>
            <p className="text-[10px] text-gray-400">Click to reveal</p>
          </>
        )}
      </div>
    </button>
  );
}
