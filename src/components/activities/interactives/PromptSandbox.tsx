"use client";

import { useState } from "react";

export type PromptSandboxData = {
  starter: string;
  hint?: string;
  copyLabel?: string;
};

export function PromptSandbox({ data }: { data: PromptSandboxData }) {
  const [text, setText] = useState(data.starter);
  const [copied, setCopied] = useState(false);

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
        onChange={(e) => setText(e.target.value)}
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
          onClick={() => setText(data.starter)}
          className="text-xs text-gray-500 hover:text-asu-maroon cursor-pointer"
        >
          Reset to starter
        </button>
      </div>
    </div>
  );
}
