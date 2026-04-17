"use client";

import { useTransition } from "react";
import { deletePost } from "@/app/(dashboard)/community/actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();

  const handleClick = () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      await deletePost(postId);
    });
  };

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      className="text-xs text-gray-400 hover:text-asu-maroon cursor-pointer disabled:opacity-50"
      aria-label="Delete post"
    >
      {pending ? "Deleting..." : "Delete"}
    </button>
  );
}
