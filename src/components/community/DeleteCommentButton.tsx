"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteComment } from "@/app/(dashboard)/community/actions";

export function DeleteCommentButton({ commentId }: { commentId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = () => {
    if (!window.confirm("Delete this comment? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deleteComment(commentId);
      if (res && "success" in res) {
        router.refresh();
      }
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-gray-400 hover:text-asu-maroon cursor-pointer disabled:opacity-50"
      aria-label="Delete comment"
    >
      {pending ? "Deleting…" : "Delete"}
    </button>
  );
}
