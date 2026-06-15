"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AdminEditContextValue = {
  isAdmin: boolean;
  editMode: boolean;
  setEditMode: (on: boolean) => void;
};

const AdminEditContext = createContext<AdminEditContextValue>({
  isAdmin: false,
  editMode: false,
  setEditMode: () => {},
});

export function useAdminEdit() {
  return useContext(AdminEditContext);
}

// Wraps the dashboard. Holds whether the viewer is an admin (from the
// server) and the current edit-mode toggle state. Non-admins get a
// context where editMode can never turn on, so EditableText renders
// inert for everyone else.
export function AdminEditProvider({
  isAdmin,
  children,
}: {
  isAdmin: boolean;
  children: ReactNode;
}) {
  const [editMode, setEditModeRaw] = useState(false);
  const setEditMode = (on: boolean) => {
    if (!isAdmin) return;
    setEditModeRaw(on);
  };
  return (
    <AdminEditContext.Provider value={{ isAdmin, editMode, setEditMode }}>
      {children}
    </AdminEditContext.Provider>
  );
}
