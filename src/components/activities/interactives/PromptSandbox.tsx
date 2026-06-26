"use client";

import { useEffect, useRef, useState } from "react";

export type PromptSandboxData = {
  starter: string;
  hint?: string;
  copyLabel?: string;
  // Carry a prior chip_selector's picks into this prompt: read the
  // selection at `storageKey` and substitute it for `token` in the
  // starter. Live-updates until the user edits the prompt by hand.
  fillFrom?: { storageKey: string; token: string };
};

const CHIP_SYNC_EVENT = "chip-selector:storage-update";

// Read a chip_selector's selection as a comma-joined string (selected
// ids + any "Other" freeform), or "" if nothing is stored yet.
function readSelection(storageKey: string): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return "";
    const p = JSON.parse(raw) as {
      selected?: string[];
      otherText?: string;
    };
    const sel = Array.isArray(p.selected)
      ? p.selected.filter((s) => s && s !== "__other__")
      : [];
    const other =
      typeof p.otherText === "string" && p.otherText.trim()
        ? [p.otherText.trim()]
        : [];
    return [...sel, ...other].join(", ");
  } catch {
    return "";
  }
}

function fillStarter(
  starter: string,
  fillFrom?: { storageKey: string; token: string }
): string {
  if (!fillFrom) return starter;
  const sel = readSelection(fillFrom.storageKey);
  return sel ? starter.split(fillFrom.token).join(sel) : starter;
}

export function PromptSandbox({ data }: { data: PromptSandboxData }) {
  const [text, setText] = useState(data.starter);
  const [copied, setCopied] = useState(false);
  // Once the user edits the prompt, stop auto-filling from step 2.
  const dirty = useRef(false);

  useEffect(() => {
    if (!data.fillFrom) return;
    const apply = () => {
      if (dirty.current) return;
      setText(fillStarter(data.starter, data.fillFrom));
    };
    apply();
    const onSync = (e: Event) => {
      const ce = e as CustomEvent<{ key: string }>;
      if (ce.detail?.key === data.fillFrom!.storageKey) apply();
    };
    const onStorage = (e: StorageEvent) => {
      if (e.key === data.fillFrom!.storageKey) apply();
    };
    window.addEventListener(CHIP_SYNC_EVENT, onSync);
    window.addEventListener("storage", onStorage);
    return () => {
      window.removeEventListener(CHIP_SYNC_EVENT, onSync);
      window.removeEventListener("storage", onStorage);
    };
  }, [data.fillFrom, data.starter]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  return (
    <div className="rounded-lg border border-asu-maroon/25 bg-asu-maroon/5 p-4">
      <label
        htmlFor="prompt-sandbox-textarea"
        className="block text-[11px] font-semibold uppercase tracking-wider text-asu-maroon mb-2"
      >
        Try this prompt
      </label>
      <textarea
        id="prompt-sandbox-textarea"
        aria-label="Editable starter prompt"
        value={text}
        onChange={(e) => {
          dirty.current = true;
          setText(e.target.value);
        }}
        rows={Math.max(3, Math.min(10, text.split("\n").length + 1))}
        className="w-full text-sm text-gray-700 bg-white border border-gray-200 rounded-md p-3 font-mono leading-relaxed focus:border-asu-maroon focus:outline-none focus:ring-2 focus:ring-asu-maroon"
      />
      {data.hint && (
        <p className="text-xs text-gray-500 mt-2 italic">{data.hint}</p>
      )}
      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover cursor-pointer"
        >
          {copied ? "Copied!" : data.copyLabel ?? "Copy prompt"}
        </button>
        <button
          type="button"
          onClick={() => {
            dirty.current = false;
            setText(fillStarter(data.starter, data.fillFrom));
          }}
          className="text-xs text-gray-500 hover:text-asu-maroon cursor-pointer"
        >
          Reset to starter
        </button>
      </div>
    </div>
  );
}
