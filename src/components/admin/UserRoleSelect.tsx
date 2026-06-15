"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/app/(dashboard)/admin/actions";

const ROLES = [
  { value: "user", label: "User (no admin)" },
  { value: "commenter", label: "Commenter (notes only)" },
  { value: "editor", label: "Editor (notes + edit)" },
  { value: "superadmin", label: "Superadmin (everything)" },
];

export function UserRoleSelect({
  userId,
  role,
  isSelf,
}: {
  userId: string;
  role: string;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const onChange = (next: string) => {
    setError("");
    startTransition(async () => {
      const res = await setUserRole(userId, next);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-end gap-1">
      <select
        value={role}
        disabled={pending || (isSelf && role === "superadmin")}
        onChange={(e) => onChange(e.target.value)}
        className="text-xs border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500 disabled:opacity-50"
        aria-label="Set role"
      >
        {ROLES.map((r) => (
          <option key={r.value} value={r.value}>
            {r.label}
          </option>
        ))}
      </select>
      {isSelf && (
        <span className="text-[10px] text-gray-400">you</span>
      )}
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
