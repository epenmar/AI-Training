"use client";

import { useEffect, useRef } from "react";
import type { TextareaHTMLAttributes } from "react";

// Textarea that grows with its content. Used by every interactive that
// captures freeform text so users always see what they've typed.
export function AutoTextarea({
  value,
  className = "",
  ...rest
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null);

  // Resize on every value change.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${el.scrollHeight}px`;
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value as string | undefined}
      {...rest}
      rows={1}
      // block + w-full ensure the textarea fills its flex / grid
      // parent — without this, the textarea's default cols=20
      // intrinsic width can cause it to render narrow even with
      // flex-1.
      className={`block w-full resize-y overflow-hidden ${className}`}
      style={{ minHeight: "2.25rem" }}
    />
  );
}
