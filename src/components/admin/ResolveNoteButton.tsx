"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  resolveEditComment,
  reopenEditComment,
} from "@/app/(dashboard)/admin/actions";

export function ResolveNoteButton({
  commentId,
  resolved,
}: {
  commentId: string;
  resolved: boolean;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    startTransition(async () => {
      if (resolved) {
        await reopenEditComment(commentId, "/admin/comments");
      } else {
        await resolveEditComment(commentId, "/admin/comments");
      }
      router.refresh();
    });
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      className={`flex-shrink-0 text-xs font-semibold px-2.5 py-1 rounded-md border disabled:opacity-50 cursor-pointer ${
        resolved
          ? "border-gray-300 text-gray-600 hover:bg-gray-50"
          : "border-asu-green/40 text-green-700 hover:bg-asu-green/5"
      }`}
    >
      {pending ? "…" : resolved ? "Reopen" : "Resolve"}
    </button>
  );
}
