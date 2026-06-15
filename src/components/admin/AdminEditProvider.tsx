"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AdminEditContextValue = {
  // The viewer's real admin status (from the server).
  isAdmin: boolean;
  // Admin status AFTER the "view as standard user" preview is applied.
  // Every admin-only surface (edit pill, reviewer notes, edit
  // affordances, sidebar link) should key off this, so previewing
  // hides all admin chrome and the page renders exactly as a normal
  // user would see it.
  effectiveIsAdmin: boolean;
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  previewAsUser: boolean;
  setPreviewAsUser: (on: boolean) => void;
};

const AdminEditContext = createContext<AdminEditContextValue>({
  isAdmin: false,
  effectiveIsAdmin: false,
  editMode: false,
  setEditMode: () => {},
  previewAsUser: false,
  setPreviewAsUser: () => {},
});

export function useAdminEdit() {
  return useContext(AdminEditContext);
}

export function AdminEditProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: ReactNode;
}) {
  const [editMode, setEditModeRaw] = useState(false);
  const [previewAsUser, setPreviewAsUserRaw] = useState(false);

  const setEditMode = (on: boolean) => {
    if (!isAdmin || previewAsUser) return;
    setEditModeRaw(on);
  };
  const setPreviewAsUser = (on: boolean) => {
    if (!isAdmin) return;
    // Entering preview turns off edit mode so the page is truly clean.
    if (on) setEditModeRaw(false);
    setPreviewAsUserRaw(on);
  };

  const effectiveIsAdmin = isAdmin && !previewAsUser;

  return (
    <AdminEditContext.Provider
      value={{
        isAdmin,
        effectiveIsAdmin,
        editMode,
        setEditMode,
        previewAsUser,
        setPreviewAsUser,
      }}
    >
      {children}
    </AdminEditContext.Provider>
  );
}
