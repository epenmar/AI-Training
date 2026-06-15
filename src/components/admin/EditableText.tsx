"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useAdminEdit } from "./AdminEditProvider";
import { updateContent } from "@/app/(dashboard)/admin/actions";

interface Props {
  table: string;
  rowId: string | number;
  column: string;
  value: string;
  // How to render the read-only view. The children are the *rendered*
  // version (e.g. markdown turned into spans); `value` is the raw
  // source the editor opens. When children is omitted, the raw value
  // is shown as plain text.
  children?: React.ReactNode;
  // Element/area styling for the read-only display wrapper.
  className?: string;
  // Use a single-line input instead of a textarea (titles, short labels).
  singleLine?: boolean;
  // Path to revalidate after a save.
  revalidate?: string;
  // Accessible label for the editor.
  label?: string;
}

// Renders its content normally. When the viewer is an admin AND edit
// mode is on, it gains a hover affordance; clicking opens an inline
// editor over the raw source. Saving calls the server action, which
// writes the field and logs a revision. Non-admins / edit-mode-off
// render exactly the read-only content with zero extra markup beyond
// a wrapper span.
export function EditableText({
  table,
  rowId,
  column,
  value,
  children,
  className = "",
  singleLine = false,
  revalidate,
  label,
}: Props) {
  const { isAdmin, editMode } = useAdminEdit();
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const fieldRef = useRef<HTMLTextAreaElement | HTMLInputElement>(null);

  // Keep the draft in sync if the underlying value changes (e.g. after
  // a router.refresh following a save elsewhere).
  useEffect(() => {
    if (!editing) setDraft(value);
  }, [value, editing]);

  useEffect(() => {
    if (editing) fieldRef.current?.focus();
  }, [editing]);

  const active = isAdmin && editMode;

  const handleSave = () => {
    setError("");
    startTransition(async () => {
      const res = await updateContent({
        table,
        rowId: String(rowId),
        column,
        value: draft,
        revalidate,
      });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setEditing(false);
      router.refresh();
    });
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
    setError("");
  };

  // Read-only render (everyone, all the time when not actively editing
  // this field).
  if (!editing) {
    const content = children ?? value;
    if (!active) {
      // Plain passthrough — no wrapper behaviour for non-editors.
      return <span className={className}>{content}</span>;
    }
    // Edit-mode affordance: dashed outline on hover, pencil on click.
    return (
      <span
        className={`group/edit relative inline cursor-text rounded-sm outline-dashed outline-1 outline-asu-maroon/30 hover:outline-asu-maroon/70 hover:bg-asu-gold/10 transition-colors ${className}`}
        onClick={() => setEditing(true)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            setEditing(true);
          }
        }}
        title="Click to edit"
      >
        {content}
        <span
          aria-hidden="true"
          className="ml-1 inline-flex align-middle text-asu-maroon opacity-0 group-hover/edit:opacity-100 transition-opacity"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            />
          </svg>
        </span>
      </span>
    );
  }

  // Active editor.
  return (
    <span className="block my-1 rounded-lg border-2 border-asu-maroon/40 bg-white p-2 not-prose">
      {label && (
        <span className="block text-[11px] font-bold uppercase tracking-wider text-asu-maroon mb-1">
          {label}
        </span>
      )}
      {singleLine ? (
        <input
          ref={fieldRef as React.RefObject<HTMLInputElement>}
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className="w-full text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-asu-maroon"
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCancel();
            if (e.key === "Enter") handleSave();
          }}
        />
      ) : (
        <textarea
          ref={fieldRef as React.RefObject<HTMLTextAreaElement>}
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          rows={Math.min(16, Math.max(3, draft.split("\n").length + 1))}
          className="w-full text-sm font-mono leading-relaxed border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-asu-maroon resize-y"
          onKeyDown={(e) => {
            if (e.key === "Escape") handleCancel();
          }}
        />
      )}
      <span className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSave}
          disabled={pending}
          className="px-3 py-1.5 text-xs font-semibold rounded-md bg-asu-maroon text-white hover:bg-sidebar-hover disabled:opacity-50 cursor-pointer"
        >
          {pending ? "Saving…" : "Save"}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          disabled={pending}
          className="px-3 py-1.5 text-xs font-semibold rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 cursor-pointer"
        >
          Cancel
        </button>
        <span className="text-[11px] text-gray-400">
          Editing raw source · saves a revision
        </span>
      </span>
      {error && (
        <span className="block text-xs text-red-600 mt-1" role="alert">
          {error}
        </span>
      )}
    </span>
  );
}
