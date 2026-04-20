"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { addComment } from "@/app/(dashboard)/community/actions";
import { DeleteCommentButton } from "./DeleteCommentButton";

export type CommentAuthor = {
  id: string;
  display_name: string | null;
  avatar_url: string | null;
};

export type CommentItem = {
  id: string;
  user_id: string;
  parent_comment_id: string | null;
  body: string;
  anonymous: boolean;
  created_at: string;
};

type Props = {
  postId: string;
  comments: CommentItem[];
  authors: Record<string, CommentAuthor>;
  currentUserId: string;
  isAdmin: boolean;
};

function formatWhen(ts: string) {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function Avatar({
  showName,
  author,
  size = 32,
}: {
  showName: boolean;
  author: CommentAuthor | undefined;
  size?: number;
}) {
  const dim = { width: size, height: size };
  if (showName && author?.avatar_url) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={author.avatar_url}
        alt=""
        style={dim}
        className="rounded-full object-cover flex-shrink-0"
      />
    );
  }
  if (showName && author?.display_name) {
    const initials = author.display_name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
    return (
      <div
        style={dim}
        className="rounded-full bg-asu-maroon text-white flex items-center justify-center text-[11px] font-medium flex-shrink-0"
      >
        {initials}
      </div>
    );
  }
  return (
    <div
      style={dim}
      className="rounded-full bg-gray-200 text-gray-500 flex items-center justify-center flex-shrink-0"
    >
      <svg
        className="w-1/2 h-1/2"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
      </svg>
    </div>
  );
}

function CommentForm({
  postId,
  parentCommentId,
  onDone,
  autoFocus,
  compact,
}: {
  postId: string;
  parentCommentId: string | null;
  onDone?: () => void;
  autoFocus?: boolean;
  compact?: boolean;
}) {
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  const submit = () => {
    setError(null);
    const trimmed = body.trim();
    if (!trimmed) {
      setError("Say something first");
      return;
    }
    startTransition(async () => {
      const res = await addComment({
        postId,
        body: trimmed,
        anonymous,
        parentCommentId,
      });
      if (res && "error" in res && res.error) {
        setError(res.error);
        return;
      }
      setBody("");
      setAnonymous(false);
      router.refresh();
      onDone?.();
    });
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
      className="space-y-2"
    >
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={parentCommentId ? "Write a reply…" : "Add a comment…"}
        rows={compact ? 2 : 3}
        autoFocus={autoFocus}
        maxLength={2000}
        className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm text-gray-700 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-asu-maroon/30 focus:border-asu-maroon/40 resize-y"
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label className="flex items-center gap-2 text-xs text-gray-600 cursor-pointer">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="accent-asu-maroon"
          />
          Post anonymously
        </label>
        <div className="flex items-center gap-2">
          {onDone && (
            <button
              type="button"
              onClick={() => {
                setBody("");
                setError(null);
                onDone();
              }}
              className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
            >
              Cancel
            </button>
          )}
          <button
            type="submit"
            disabled={pending || !body.trim()}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover transition-colors disabled:opacity-50"
          >
            {pending ? "Posting…" : parentCommentId ? "Reply" : "Post comment"}
          </button>
        </div>
      </div>
      {error && <p className="text-xs text-asu-maroon">{error}</p>}
    </form>
  );
}

function CommentRow({
  comment,
  author,
  currentUserId,
  isAdmin,
  postId,
  canReply,
}: {
  comment: CommentItem;
  author: CommentAuthor | undefined;
  currentUserId: string;
  isAdmin: boolean;
  postId: string;
  canReply: boolean;
}) {
  const [replying, setReplying] = useState(false);
  const showName = !comment.anonymous && !!author?.display_name;
  const displayName = showName ? author!.display_name : "Anonymous";
  const canDelete = comment.user_id === currentUserId || isAdmin;

  return (
    <div className="flex gap-3">
      <Avatar showName={showName} author={author} size={32} />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="text-sm font-medium text-gray-700">
            {displayName}
          </span>
          <span className="text-xs text-gray-400">
            {formatWhen(comment.created_at)}
          </span>
        </div>
        <p className="text-sm text-gray-700 whitespace-pre-line mt-0.5 leading-relaxed">
          {comment.body}
        </p>
        <div className="flex items-center gap-3 mt-1">
          {canReply && !replying && (
            <button
              type="button"
              onClick={() => setReplying(true)}
              className="text-xs text-gray-500 hover:text-asu-maroon"
            >
              Reply
            </button>
          )}
          {canDelete && <DeleteCommentButton commentId={comment.id} />}
        </div>
        {replying && (
          <div className="mt-2">
            <CommentForm
              postId={postId}
              parentCommentId={comment.id}
              onDone={() => setReplying(false)}
              autoFocus
              compact
            />
          </div>
        )}
      </div>
    </div>
  );
}

export function CommentSection({
  postId,
  comments,
  authors,
  currentUserId,
  isAdmin,
}: Props) {
  const topLevel = comments.filter((c) => !c.parent_comment_id);
  const repliesByParent = new Map<string, CommentItem[]>();
  for (const c of comments) {
    if (c.parent_comment_id) {
      const arr = repliesByParent.get(c.parent_comment_id) ?? [];
      arr.push(c);
      repliesByParent.set(c.parent_comment_id, arr);
    }
  }

  return (
    <section
      aria-labelledby="comments-heading"
      className="bg-white rounded-lg border border-gray-200 p-6 mt-6"
    >
      <h3
        id="comments-heading"
        className="text-lg font-semibold text-gray-700 mb-4"
      >
        Comments ({comments.length})
      </h3>

      <div className="mb-6">
        <CommentForm postId={postId} parentCommentId={null} />
      </div>

      {topLevel.length > 0 ? (
        <ul className="space-y-6">
          {topLevel.map((c) => {
            const replies = repliesByParent.get(c.id) ?? [];
            return (
              <li key={c.id} className="space-y-4">
                <CommentRow
                  comment={c}
                  author={authors[c.user_id]}
                  currentUserId={currentUserId}
                  isAdmin={isAdmin}
                  postId={postId}
                  canReply
                />
                {replies.length > 0 && (
                  <ul className="pl-10 space-y-4 border-l-2 border-gray-100 ml-4">
                    {replies.map((r) => (
                      <li key={r.id}>
                        <CommentRow
                          comment={r}
                          author={authors[r.user_id]}
                          currentUserId={currentUserId}
                          isAdmin={isAdmin}
                          postId={postId}
                          canReply={false}
                        />
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-gray-500">
          No comments yet. Be the first to say something.
        </p>
      )}
    </section>
  );
}
