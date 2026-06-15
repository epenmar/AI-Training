"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/app/(dashboard)/admin/actions";
import { openRoleEmail, isAccessRole } from "./roleEmail";

const ROLES = [
  { value: "user", label: "User (no admin)" },
  { value: "commenter", label: "Commenter (notes only)" },
  { value: "editor", label: "Editor (notes + edit)" },
  { value: "superadmin", label: "Superadmin (everything)" },
];

export function UserRoleSelect({
  userId,
  email,
  role,
  isSelf,
}: {
  userId: string;
  email: string;
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

  // Anyone with an admin access role can be emailed about it, any time
  // — not just on the change. The button click is a fresh user gesture
  // so the mailto reliably opens the default mail app.
  const canEmail = !isSelf && isAccessRole(role);

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-1.5">
        {canEmail && (
          <button
            type="button"
            onClick={() => openRoleEmail(email, role)}
            title={`Email ${email} about their ${role} access`}
            className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:underline cursor-pointer"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
              />
            </svg>
            Email
          </button>
        )}
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
      </div>
      {isSelf && <span className="text-[10px] text-gray-400">you</span>}
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
