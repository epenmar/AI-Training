"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { setUserRole } from "@/app/(dashboard)/admin/actions";
import { buildRoleMailto, openRoleEmail, isAccessRole } from "./roleEmail";

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
  // After a successful access grant we surface a reliable "Email them"
  // link. Auto-firing a mailto after an await is blocked by some
  // browsers (the user gesture is gone), so the link is the dependable
  // path; we still best-effort auto-open.
  const [mailto, setMailto] = useState<string | null>(null);

  const onChange = (next: string) => {
    setError("");
    setMailto(null);
    startTransition(async () => {
      const res = await setUserRole(userId, next);
      if ("error" in res) {
        setError(res.error);
        return;
      }
      if (!isSelf && isAccessRole(next) && next !== role) {
        const url = buildRoleMailto(email, next);
        setMailto(url);
        openRoleEmail(email, next); // best effort
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
      {mailto && (
        <a
          href={mailto}
          className="inline-flex items-center gap-1 text-[11px] font-semibold text-violet-700 hover:underline"
        >
          <svg
            className="w-3 h-3"
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
          Email them about this
        </a>
      )}
      {isSelf && <span className="text-[10px] text-gray-400">you</span>}
      {error && <span className="text-[10px] text-red-600">{error}</span>}
    </div>
  );
}
