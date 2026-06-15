"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  inviteUserRole,
  removePendingInvite,
} from "@/app/(dashboard)/admin/actions";
import { openRoleEmail } from "./roleEmail";

export function InviteUserForm() {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("commenter");
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");

  const submit = () => {
    setError("");
    setOk("");
    startTransition(async () => {
      const targetEmail = email;
      const res = await inviteUserRole({ email, role });
      if ("error" in res) {
        setError(res.error);
        return;
      }
      setOk(
        `Granted ${role} to ${targetEmail}. If they haven't signed in yet, it applies on their first login.`
      );
      setEmail("");
      router.refresh();
      // Pop a templated notification email in the default mail app.
      openRoleEmail(targetEmail, role);
    });
  };

  return (
    <div className="rounded-lg border border-violet-300 bg-violet-50 p-4 space-y-2">
      <p className="text-sm font-semibold text-violet-800">
        Add an admin by email
      </p>
      <p className="text-xs text-gray-600">
        They sign in with their ASU Google account. If they already have an
        account the role applies now; otherwise it&apos;s claimed on their
        first sign-in.
      </p>
      <div className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="name@asu.edu"
          className="flex-1 text-sm border border-gray-300 rounded-md px-2 py-1.5 focus:outline-none focus:ring-2 focus:ring-violet-500"
        />
        <select
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="text-sm border border-gray-300 rounded-md px-2 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-violet-500"
        >
          <option value="commenter">Commenter (notes only)</option>
          <option value="editor">Editor (notes + edit)</option>
          <option value="superadmin">Superadmin (everything)</option>
        </select>
        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="px-3 py-1.5 text-sm font-semibold rounded-md bg-violet-600 text-white hover:bg-violet-700 disabled:opacity-50 cursor-pointer whitespace-nowrap"
        >
          {pending ? "Granting…" : "Grant access"}
        </button>
      </div>
      {error && <p className="text-xs text-red-600">{error}</p>}
      {ok && <p className="text-xs text-green-700">{ok}</p>}
    </div>
  );
}

export function RemovePendingInviteButton({ email }: { email: string }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await removePendingInvite(email);
          router.refresh();
        })
      }
      className="text-xs font-semibold px-2.5 py-1 rounded-md border border-gray-300 text-gray-600 hover:bg-gray-50 disabled:opacity-50 cursor-pointer"
    >
      {pending ? "…" : "Cancel"}
    </button>
  );
}
