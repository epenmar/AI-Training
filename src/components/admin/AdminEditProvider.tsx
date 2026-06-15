"use client";

import {
  createContext,
  useContext,
  useState,
  type ReactNode,
} from "react";

type AdminEditContextValue = {
  // Raw capabilities from the server (role-derived).
  canComment: boolean;
  canEdit: boolean;
  canManageUsers: boolean;
  // Preview-applied versions. "View as student" turns page chrome off.
  showNotes: boolean; // can leave reviewer notes AND not previewing
  showEdit: boolean; // can inline-edit AND not previewing
  // Back-compat: any page admin chrome visible.
  effectiveIsAdmin: boolean;
  isAdmin: boolean; // raw: has any admin chrome capability
  editMode: boolean;
  setEditMode: (on: boolean) => void;
  previewAsUser: boolean;
  setPreviewAsUser: (on: boolean) => void;
};

const AdminEditContext = createContext<AdminEditContextValue>({
  canComment: false,
  canEdit: false,
  canManageUsers: false,
  showNotes: false,
  showEdit: false,
  effectiveIsAdmin: false,
  isAdmin: false,
  editMode: false,
  setEditMode: () => {},
  previewAsUser: false,
  setPreviewAsUser: () => {},
});

export function useAdminEdit() {
  return useContext(AdminEditContext);
}

export function AdminEditProvider({
  canComment,
  canEdit,
  canManageUsers,
  children,
}: {
  canComment: boolean;
  canEdit: boolean;
  canManageUsers: boolean;
  children: ReactNode;
}) {
  const [editMode, setEditModeRaw] = useState(false);
  const [previewAsUser, setPreviewAsUserRaw] = useState(false);

  const anyAdmin = canComment || canEdit || canManageUsers;

  const setEditMode = (on: boolean) => {
    if (!canEdit || previewAsUser) return;
    setEditModeRaw(on);
  };
  const setPreviewAsUser = (on: boolean) => {
    if (!anyAdmin) return;
    if (on) setEditModeRaw(false);
    setPreviewAsUserRaw(on);
  };

  return (
    <AdminEditContext.Provider
      value={{
        canComment,
        canEdit,
        canManageUsers,
        showNotes: canComment && !previewAsUser,
        showEdit: canEdit && !previewAsUser,
        effectiveIsAdmin: anyAdmin && !previewAsUser,
        isAdmin: anyAdmin,
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
