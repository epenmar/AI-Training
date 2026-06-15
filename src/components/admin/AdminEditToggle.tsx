"use client";

import { useAdminEdit } from "./AdminEditProvider";

// Floating pill, bottom-left, visible only to admins. Toggles edit
// mode on/off across the whole dashboard. When on, EditableText
// fields show their edit affordance.
export function AdminEditToggle() {
  const { isAdmin, editMode, setEditMode } = useAdminEdit();
  if (!isAdmin) return null;

  return (
    <button
      type="button"
      onClick={() => setEditMode(!editMode)}
      className={`fixed bottom-4 left-4 z-40 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold shadow-lg transition-colors cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-asu-maroon ${
        editMode
          ? "bg-asu-maroon text-white hover:bg-sidebar-hover"
          : "bg-white text-asu-maroon border border-asu-maroon/30 hover:bg-asu-maroon/5"
      }`}
      aria-pressed={editMode}
    >
      <svg
        className="w-4 h-4"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
      </svg>
      {editMode ? "Editing — click to finish" : "Edit this page"}
    </button>
  );
}
