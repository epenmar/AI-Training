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
      className={`resize-y overflow-hidden ${className}`}
      style={{ minHeight: "2.25rem" }}
    />
  );
}
