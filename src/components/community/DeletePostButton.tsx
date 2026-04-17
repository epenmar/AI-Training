"use client";

import { useTransition } from "react";
import { usePathname, useRouter } from "next/navigation";
import { deletePost } from "@/app/(dashboard)/community/actions";

export function DeletePostButton({ postId }: { postId: string }) {
  const [pending, startTransition] = useTransition();
  const router = useRouter();
  const pathname = usePathname();

  const handleClick = () => {
    if (!window.confirm("Delete this post? This cannot be undone.")) return;
    startTransition(async () => {
      const res = await deletePost(postId);
      if (res && "success" in res && pathname !== "/community") {
        router.push("/community");
      }
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
