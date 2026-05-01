"use client";

import { useEffect, useRef, useState } from "react";

// Click-to-reveal vocabulary term. Renders inline in flowing prose:
//
//   The {{term:definition}} markdown extension renders as a styled button.
//   Clicking it pops the definition next to the word.
//
// More organic than a separate flashcard widget — the term is defined
// where it's first introduced.
export function VocabTerm({
  term,
  definition,
}: {
  term: string;
  definition: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef<HTMLSpanElement>(null);
  const popoverId = useRef(
    `vocab-${Math.random().toString(36).slice(2, 9)}`
  );

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span ref={wrapperRef} className="relative inline-block">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={popoverId.current}
        aria-label={`Definition of ${term}`}
        className="font-bold text-asu-blue hover:text-asu-maroon focus:outline-none focus-visible:ring-2 focus-visible:ring-asu-blue focus-visible:ring-offset-1 rounded cursor-pointer"
      >
        {term}
        <span aria-hidden="true">*</span>
      </button>
      {open && (
        <span
          id={popoverId.current}
          role="tooltip"
          className="absolute left-0 top-full z-20 mt-1 block w-72 max-w-[calc(100vw-2rem)] rounded-lg bg-white border border-asu-blue/50 shadow-lg p-3 text-sm text-gray-700 leading-snug font-normal normal-case tracking-normal not-italic"
        >
          <span className="block text-[10px] font-bold uppercase tracking-wider text-asu-blue mb-1">
            {term}
          </span>
          {definition}
        </span>
      )}
    </span>
  );
}
