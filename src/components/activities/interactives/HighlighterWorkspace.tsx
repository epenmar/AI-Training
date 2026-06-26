"use client";

import { useEffect, useMemo, useRef, useState } from "react";

export type HighlighterWorkspaceData = {
  storageKey: string;
  prompt?: string;
  placeholder?: string;
  legend?: { color: ColorKey; label: string }[];
};

type ColorKey = "green" | "yellow" | "red";

type Stored = {
  text: string;
  // Per-character color array, length === text.length
  colors: (ColorKey | null)[];
};

const COLOR_TO_BG: Record<ColorKey, string> = {
  green: "bg-asu-green/30",
  yellow: "bg-asu-gold/40",
  red: "bg-red-300",
};

const COLOR_TO_BUTTON: Record<ColorKey, string> = {
  green: "bg-asu-green text-white",
  yellow: "bg-asu-gold text-yellow-900",
  red: "bg-red-600 text-white",
};

const DEFAULT_LEGEND: { color: ColorKey; label: string }[] = [
  { color: "green", label: "Verified / accurate" },
  { color: "yellow", label: "Partially accurate / unsure" },
  { color: "red", label: "Wrong or fabricated" },
];

const SYNC_EVENT = "highlighter-workspace:storage-update";

function readStorage(key: string): Stored {
  if (typeof window === "undefined") return { text: "", colors: [] };
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return { text: "", colors: [] };
    const parsed = JSON.parse(raw) as Stored;
    if (
      parsed &&
      typeof parsed.text === "string" &&
      Array.isArray(parsed.colors) &&
      parsed.colors.length === parsed.text.length
    ) {
      return parsed;
    }
    return { text: "", colors: [] };
  } catch {
    return { text: "", colors: [] };
  }
}

function writeStorage(key: string, value: Stored) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    window.dispatchEvent(
      new CustomEvent(SYNC_EVENT, { detail: { key } })
    );
  } catch {
    // ignore
  }
}

// Walk text nodes inside container; given a Range start/end position,
// return the absolute offset within the concatenated text content.
function offsetWithin(
  container: HTMLElement,
  node: Node,
  offset: number
): number {
  let total = 0;
  const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
  let n = walker.nextNode();
  while (n) {
    if (n === node) return total + offset;
    total += (n.nodeValue ?? "").length;
    n = walker.nextNode();
  }
  return -1;
}

// Group consecutive same-color characters into spans for rendering.
function buildSpans(stored: Stored): {
  start: number;
  end: number;
  color: ColorKey | null;
}[] {
  const spans: { start: number; end: number; color: ColorKey | null }[] = [];
  let i = 0;
  const { text, colors } = stored;
  while (i < text.length) {
    const c = colors[i] ?? null;
    let j = i + 1;
    while (j < text.length && (colors[j] ?? null) === c) j++;
    spans.push({ start: i, end: j, color: c });
    i = j;
  }
  return spans;
}

export function HighlighterWorkspace({
  data,
}: {
  data: HighlighterWorkspaceData;
}) {
  const [state, setState] = useState<Stored>({ text: "", colors: [] });
  const [editing, setEditing] = useState(true);
  const [hydrated, setHydrated] = useState(false);
  const [selRange, setSelRange] = useState<
    { start: number; end: number } | null
  >(null);
  // "Start over" wipes the pasted text + all highlights, so it asks for a
  // second click to confirm (the reviewer hit it expecting a smaller edit).
  const [confirmReset, setConfirmReset] = useState(false);
  const lastWritten = useRef<string>("");
  const renderRef = useRef<HTMLDivElement>(null);
  const legend = data.legend ?? DEFAULT_LEGEND;

  useEffect(() => {
    const fresh = readStorage(data.storageKey);
    setState(fresh);
    if (fresh.text.length > 0) setEditing(false);
    setHydrated(true);
    if (typeof window === "undefined") return;
    // When a sibling instance (same storageKey, e.g. A44 step 3 -> step 4)
    // writes text, mirror it AND leave the paste form — otherwise this
    // instance keeps showing its empty box even though text arrived (the
    // reviewer's "it didn't auto-load" bug).
    const refresh = () => {
      const fresh = readStorage(data.storageKey);
      setState(fresh);
      if (fresh.text.length > 0) setEditing(false);
    };
    const onSync = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key === data.storageKey) refresh();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === data.storageKey) refresh();
    };
    window.addEventListener(SYNC_EVENT, onSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(SYNC_EVENT, onSync);
      window.removeEventListener("storage", onStorage);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data.storageKey]);

  useEffect(() => {
    if (!hydrated) return;
    const ser = JSON.stringify(state);
    if (ser === lastWritten.current) return;
    lastWritten.current = ser;
    writeStorage(data.storageKey, state);
  }, [state, data.storageKey, hydrated]);

  // Track the user's selection within the rendered text. Capture happens
  // on mouseup / keyup / selectionchange so we have a known-good range
  // before the user clicks a color button (which would otherwise shift
  // focus and collapse the selection).
  useEffect(() => {
    if (typeof window === "undefined") return;
    const captureSelection = () => {
      const container = renderRef.current;
      if (!container) return;
      const sel = window.getSelection();
      if (!sel || sel.rangeCount === 0 || sel.isCollapsed) {
        setSelRange(null);
        return;
      }
      const range = sel.getRangeAt(0);
      if (
        !container.contains(range.startContainer) ||
        !container.contains(range.endContainer)
      ) {
        setSelRange(null);
        return;
      }
      const start = offsetWithin(
        container,
        range.startContainer,
        range.startOffset
      );
      const end = offsetWithin(container, range.endContainer, range.endOffset);
      if (start < 0 || end < 0 || start === end) {
        setSelRange(null);
        return;
      }
      const [a, b] = start < end ? [start, end] : [end, start];
      setSelRange({ start: a, end: b });
    };
    document.addEventListener("selectionchange", captureSelection);
    document.addEventListener("mouseup", captureSelection);
    document.addEventListener("keyup", captureSelection);
    return () => {
      document.removeEventListener("selectionchange", captureSelection);
      document.removeEventListener("mouseup", captureSelection);
      document.removeEventListener("keyup", captureSelection);
    };
  }, [editing, state.text]);

  const stats = useMemo(() => {
    const total = state.text.length;
    const counts: Record<ColorKey, number> = { green: 0, yellow: 0, red: 0 };
    for (const c of state.colors) {
      if (c) counts[c]++;
    }
    const sum = counts.green + counts.yellow + counts.red;
    const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
    const highlightedPct = total > 0 ? Math.round((sum / total) * 100) : 0;
    return {
      total,
      counts,
      pct: {
        green: pct(counts.green),
        yellow: pct(counts.yellow),
        red: pct(counts.red),
      },
      highlightedPct,
    };
  }, [state]);

  const applyColor = (color: ColorKey | null) => {
    const range = selRange;
    if (!range) return;
    setState((prev) => {
      const colors = [...prev.colors];
      for (let i = range.start; i < range.end; i++) colors[i] = color;
      return { ...prev, colors };
    });
    // Clear selection visually but keep it logically until next user action.
    window.getSelection()?.removeAllRanges();
    setSelRange(null);
  };

  const clearAll = () => {
    if (!state.text) return;
    setState((prev) => ({
      ...prev,
      colors: Array(prev.text.length).fill(null),
    }));
  };

  const handlePasteSubmit = (text: string) => {
    setState({ text, colors: Array(text.length).fill(null) });
    setEditing(false);
  };

  const reset = () => {
    setState({ text: "", colors: [] });
    setSelRange(null);
    setConfirmReset(false);
    setEditing(true);
  };

  const spans = useMemo(() => buildSpans(state), [state]);

  if (editing) {
    return (
      <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
        {data.prompt && (
          <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
        )}
        <PasteForm
          placeholder={data.placeholder}
          onSubmit={handlePasteSubmit}
        />
      </div>
    );
  }

  const selLen = selRange ? selRange.end - selRange.start : 0;
  const buttonsDisabled = selLen === 0;

  return (
    <div className="rounded-lg border border-asu-blue/25 bg-asu-blue/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}

      {/* Selection-aware color toolbar */}
      <div className="flex flex-wrap items-center gap-2 mb-2">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">
          {selLen > 0
            ? `Selected ${selLen} char${selLen === 1 ? "" : "s"} → highlight as`
            : "Select text in the workspace, then click a color"}
        </span>
        {legend.map(({ color, label }) => (
          <button
            key={color}
            type="button"
            disabled={buttonsDisabled}
            // mousedown preventDefault keeps focus from leaving the
            // selection. selRange already captured what we need.
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => applyColor(color)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-asu-blue disabled:opacity-40 disabled:cursor-not-allowed ${COLOR_TO_BUTTON[color]}`}
            aria-label={`Highlight selected text as ${label}`}
          >
            <span
              aria-hidden="true"
              className={`block w-3 h-3 rounded-sm border border-white/40 ${COLOR_TO_BG[color]}`}
            />
            {label}
          </button>
        ))}
        <button
          type="button"
          disabled={buttonsDisabled}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => applyColor(null)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-md cursor-pointer bg-white border border-gray-300 text-gray-700 hover:border-gray-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-asu-blue disabled:opacity-40 disabled:cursor-not-allowed"
          aria-label="Remove highlight from selected text"
        >
          Erase highlight
        </button>
        <span className="flex-1" />
        <span
          className="hidden sm:block w-px h-4 bg-gray-300"
          aria-hidden="true"
        />
        <button
          type="button"
          onClick={clearAll}
          className="text-xs text-gray-500 hover:text-asu-maroon cursor-pointer disabled:opacity-40"
          disabled={!state.text}
          title="Remove every highlight but keep the pasted text"
        >
          Clear all highlights
        </button>
        {!confirmReset ? (
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="text-xs text-gray-500 hover:text-asu-maroon cursor-pointer"
            title="Discard the pasted text and start over with new text"
          >
            Start over
          </button>
        ) : (
          <span className="inline-flex items-center gap-2">
            <button
              type="button"
              onClick={reset}
              className="text-xs font-semibold text-red-600 hover:text-red-700 cursor-pointer"
            >
              Discard text &amp; start over
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="text-xs text-gray-400 hover:text-gray-600 cursor-pointer"
            >
              Cancel
            </button>
          </span>
        )}
      </div>

      {/* The highlightable rendered text */}
      <div
        ref={renderRef}
        className="text-sm text-gray-800 leading-relaxed bg-white rounded-md border border-gray-200 p-3 min-h-[10rem] max-h-[28rem] overflow-y-auto whitespace-pre-wrap select-text cursor-text"
      >
        {spans.map((span, i) => {
          const slice = state.text.slice(span.start, span.end);
          if (span.color) {
            return (
              <span
                key={i}
                className={`${COLOR_TO_BG[span.color]} rounded-sm`}
                data-color={span.color}
              >
                {slice}
              </span>
            );
          }
          return <span key={i}>{slice}</span>;
        })}
      </div>

      {/* Live stats */}
      <div className="mt-3 grid grid-cols-2 sm:grid-cols-4 gap-2">
        <StatBlock
          label="Total chars"
          value={stats.total.toLocaleString()}
          caption={`${stats.highlightedPct}% highlighted`}
          tone="bg-gray-100 text-gray-700"
        />
        {legend.map(({ color, label }) => (
          <StatBlock
            key={color}
            label={label}
            value={`${stats.pct[color]}%`}
            caption={`${stats.counts[color].toLocaleString()} chars`}
            tone={`${COLOR_TO_BG[color]} text-gray-800`}
          />
        ))}
      </div>
      <p className="text-[11px] text-gray-500 mt-2">
        Select text in the box above and click a color to mark it.
        Percentages update live; this replaces the manual count from
        step 5.
      </p>
    </div>
  );
}

function PasteForm({
  placeholder,
  onSubmit,
}: {
  placeholder?: string;
  onSubmit: (text: string) => void;
}) {
  const [value, setValue] = useState("");
  return (
    <div>
      <label
        htmlFor="highlighter-paste"
        className="block text-[11px] font-semibold uppercase tracking-wider text-asu-blue mb-2"
      >
        Paste the text you want to mark up
      </label>
      <textarea
        id="highlighter-paste"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        rows={8}
        placeholder={
          placeholder ??
          "Paste the AI-generated text here. You'll color-code each citation and claim in the next steps."
        }
        className="w-full text-sm bg-white border border-gray-200 rounded-md p-3 focus:border-asu-blue focus:outline-none focus:ring-2 focus:ring-asu-blue leading-relaxed"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="button"
          onClick={() => value.trim() && onSubmit(value)}
          disabled={!value.trim()}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-asu-blue text-white hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
        >
          Start highlighting
        </button>
      </div>
    </div>
  );
}

function StatBlock({
  label,
  value,
  caption,
  tone,
}: {
  label: string;
  value: string;
  caption: string;
  tone: string;
}) {
  return (
    <div className={`rounded-md p-2 ${tone}`}>
      <p className="text-[10px] font-semibold uppercase tracking-wider opacity-80">
        {label}
      </p>
      <p className="text-base font-bold leading-none mt-0.5">{value}</p>
      <p className="text-[10px] mt-0.5 opacity-80">{caption}</p>
    </div>
  );
}
