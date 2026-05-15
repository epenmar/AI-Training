"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@supabase/ssr";
import { saveAndComplete } from "@/app/(dashboard)/activities/actions";

interface Props {
  activityId: number;
  isComplete: boolean;
  initialNotes: string;
  completedAt: string | null;
  deliverable: string | null;
}

// localStorage keys the deliverable hand-offs use to prefill the
// downstream community form. The community pages read these on mount.
const DISCUSSION_PREFILL_KEY = (id: number) => `deliverable-prefill-discussion-${id}`;
const PROJECT_PREFILL_KEY = (id: number) => `deliverable-prefill-project-${id}`;

export function CompletionPanel({
  activityId,
  isComplete,
  initialNotes,
  completedAt,
  deliverable,
}: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [notes, setNotes] = useState(initialNotes);
  const [status, setStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [error, setError] = useState("");
  const [summarizing, setSummarizing] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  function notesChanged() {
    return notes !== initialNotes;
  }

  // ---- Save privately ------------------------------------------------
  const handleSavePrivately = () => {
    setError("");
    setStatus("saving");
    startTransition(async () => {
      const res = await saveAndComplete(activityId, notes);
      if (res.error) {
        setError(res.error);
        setStatus("idle");
      } else {
        setStatus("saved");
        setTimeout(() => setStatus("idle"), 2000);
        router.refresh();
      }
    });
  };

  // ---- Post to Discussions ------------------------------------------
  // Save + complete, then navigate the user to the community discussion
  // page with their notes prefilled in localStorage so the form opens
  // with what they wrote in the deliverable.
  const handlePostToDiscussions = () => {
    setError("");
    startTransition(async () => {
      const res = await saveAndComplete(activityId, notes);
      if (res.error) {
        setError(res.error);
        return;
      }
      try {
        window.localStorage.setItem(
          DISCUSSION_PREFILL_KEY(activityId),
          notes
        );
      } catch {
        // ignore localStorage errors — the form still works empty
      }
      router.push(
        `/community?tab=questions&activity=${activityId}&prefill=1#new-post`
      );
    });
  };

  // ---- Share project ------------------------------------------------
  const handleShareProject = () => {
    setError("");
    startTransition(async () => {
      const res = await saveAndComplete(activityId, notes);
      if (res.error) {
        setError(res.error);
        return;
      }
      try {
        window.localStorage.setItem(
          PROJECT_PREFILL_KEY(activityId),
          notes
        );
      } catch {
        // ignore
      }
      router.push(`/community/new?activity=${activityId}&prefill=1`);
    });
  };

  // ---- Summarize my work --------------------------------------------
  // Sweeps localStorage for keys starting with `activity-${id}-`, POSTs
  // to /api/summarize-work, and inserts the AI-drafted summary at the
  // top of the textarea.
  const handleSummarize = async () => {
    setError("");
    setSummarizing(true);
    try {
      const prefix = `activity-${activityId}-`;
      const entries: { key: string; value: string }[] = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (!key || !key.startsWith(prefix)) continue;
        const value = window.localStorage.getItem(key);
        if (value == null) continue;
        entries.push({ key, value });
      }
      const res = await fetch("/api/summarize-work", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ activityId, entries }),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data?.error === "not_configured") {
          setError(
            "Summarize my work is not configured yet — ask an admin to set the Create AI env vars."
          );
        } else {
          setError("Couldn't draft a summary. Try again in a moment.");
        }
        return;
      }
      const summary = (data?.summary ?? "").trim();
      if (!summary) {
        setError("AI returned an empty summary. Try again.");
        return;
      }
      // Append rather than replace — preserves anything the learner
      // already wrote. Mark the inserted block so it's easy to find.
      setNotes((prev) => {
        const sep = prev.trim() ? "\n\n" : "";
        return `${prev}${sep}— AI-drafted summary —\n${summary}`;
      });
      textareaRef.current?.focus();
    } catch {
      setError("Couldn't draft a summary. Try again in a moment.");
    } finally {
      setSummarizing(false);
    }
  };

  // ---- Drag-and-drop screenshots ------------------------------------
  // Uploads image files to the Supabase `community-media` bucket and
  // appends `![screenshot](url)` to the textarea. Files trigger via
  // drop, paste, or the file-picker button.
  const ACCEPT = "image/png,image/jpeg,image/gif,image/webp";
  const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

  const uploadFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You need to be signed in to upload.");
      return;
    }
    setUploading(true);
    setError("");
    const inserted: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setError(`"${file.name}" isn't an image — skipped.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        setError(`"${file.name}" is over 10 MB — skipped.`);
        continue;
      }
      const ext = (file.name.split(".").pop() || "png").toLowerCase();
      const safeExt = /^[a-z0-9]+$/.test(ext) ? ext : "png";
      const path = `${user.id}/deliverable-${activityId}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 7)}.${safeExt}`;
      const { error: upErr } = await supabase.storage
        .from("community-media")
        .upload(path, file, {
          contentType: file.type,
          upsert: false,
        });
      if (upErr) {
        setError(`Upload failed: ${upErr.message}`);
        continue;
      }
      const { data: pub } = supabase.storage
        .from("community-media")
        .getPublicUrl(path);
      if (pub?.publicUrl) {
        inserted.push(`![screenshot](${pub.publicUrl})`);
      }
    }
    if (inserted.length > 0) {
      setNotes((prev) => {
        const sep = prev.trim() ? "\n\n" : "";
        return `${prev}${sep}${inserted.join("\n\n")}`;
      });
    }
    setUploading(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    void uploadFiles(files);
  };

  const onPickFiles = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    void uploadFiles(files);
    e.target.value = ""; // reset so the same file can be picked again
  };

  const onPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    const files: File[] = [];
    for (const item of items) {
      if (item.kind === "file") {
        const f = item.getAsFile();
        if (f) files.push(f);
      }
    }
    if (files.length > 0) {
      e.preventDefault();
      void uploadFiles(files);
    }
  };

  // -------------------------------------------------------------------

  return (
    <div
      className={`rounded-lg border-2 p-5 ${
        isComplete
          ? "border-asu-green bg-asu-green/5"
          : "border-gray-200 bg-white"
      }`}
    >
      <header className="mb-3">
        <h3 className="text-base font-semibold text-gray-700">Deliverable</h3>
        {deliverable && (
          <p className="text-sm text-gray-600 mt-1">{deliverable}</p>
        )}
      </header>

      {/* Textarea + Summarize button + drag-drop overlay */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-1.5 gap-3 flex-wrap">
          <label
            htmlFor="deliverable-notes"
            className="text-sm font-medium text-gray-700"
          >
            Your notes
          </label>
          <button
            type="button"
            onClick={handleSummarize}
            disabled={summarizing || uploading}
            className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 rounded-md border border-asu-blue/40 text-asu-blue bg-white hover:bg-asu-blue/5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            title="Use AI to draft a deliverable summary from what you've entered into the activity's widgets"
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
                d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.847.814a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456z"
              />
            </svg>
            {summarizing ? "Drafting…" : "Summarize my work"}
          </button>
        </div>
        <div
          onDrop={onDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragEnter={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          className={`relative rounded-lg border-2 ${
            dragOver
              ? "border-asu-blue border-dashed bg-asu-blue/5"
              : "border-gray-300"
          } transition-colors`}
        >
          <textarea
            ref={textareaRef}
            id="deliverable-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            onPaste={onPaste}
            rows={6}
            placeholder="Write what you took away from this activity. Drop screenshots in or paste them; we'll add them as image links."
            className="w-full text-sm border-0 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:rounded-lg bg-transparent"
          />
          {dragOver && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none rounded-lg bg-asu-blue/5">
              <p className="text-sm font-medium text-asu-blue">
                Drop image(s) to upload
              </p>
            </div>
          )}
        </div>
        <div className="mt-1.5 flex items-center justify-between flex-wrap gap-2">
          <p className="text-xs text-gray-500">
            Drag a screenshot in, paste from your clipboard, or{" "}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="text-asu-maroon hover:underline cursor-pointer"
            >
              choose a file
            </button>
            . Saved in your browser until you save below.
          </p>
          {uploading && (
            <span className="text-xs text-asu-blue">Uploading…</span>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          onChange={onPickFiles}
          className="hidden"
        />
      </div>

      {/* Instruction line */}
      <p className="text-xs text-gray-600 mb-3">
        Click <span className="font-semibold">Post to Discussions</span> if
        you learned something exciting or challenging that you&apos;d like
        to share with others — otherwise just save it for yourself.
      </p>

      {/* Primary actions */}
      <div className="flex flex-wrap gap-2 mb-3">
        <button
          onClick={handleSavePrivately}
          disabled={pending || (!notesChanged() && isComplete)}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-asu-green text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          {status === "saving"
            ? "Saving…"
            : status === "saved"
              ? "Saved ✓"
              : isComplete
                ? "Save privately"
                : "Save privately"}
        </button>
        <button
          onClick={handlePostToDiscussions}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-asu-blue text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
          Post to Discussions
        </button>
        <button
          onClick={handleShareProject}
          disabled={pending}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg border border-asu-maroon/40 text-asu-maroon bg-white hover:bg-asu-maroon/5 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          Share project
        </button>
      </div>

      {isComplete && completedAt && (
        <p className="text-xs text-gray-500">
          Marked complete on{" "}
          {new Date(completedAt).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          })}
          .
        </p>
      )}

      {error && (
        <p className="text-sm text-red-600 mt-2" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
