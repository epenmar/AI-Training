"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { createQuestion } from "@/app/(dashboard)/community/actions";

interface Skill {
  id: number;
  short_name: string;
}

export function AskQuestionForm({ skills }: { skills: Skill[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(false);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [skillId, setSkillId] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [error, setError] = useState("");

  function reset() {
    setTitle("");
    setBody("");
    setSkillId("");
    setAnonymous(false);
    setError("");
    setExpanded(false);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    startTransition(async () => {
      const res = await createQuestion({
        title,
        body,
        skillId: skillId ? parseInt(skillId, 10) : null,
        anonymous,
      });
      if (res?.error) {
        setError(res.error);
        return;
      }
      reset();
      router.refresh();
    });
  }

  if (!expanded) {
    return (
      <button
        type="button"
        onClick={() => setExpanded(true)}
        className="w-full text-left bg-white border border-gray-200 rounded-lg px-4 py-3 text-sm text-gray-500 hover:border-asu-blue/40 hover:bg-asu-blue/5 transition-colors flex items-center gap-3"
      >
        <svg
          className="w-5 h-5 text-asu-blue flex-shrink-0"
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
        Ask the community a question…
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-gray-200 rounded-lg p-4 space-y-3"
    >
      <div>
        <label
          htmlFor="q-title"
          className="block text-xs font-medium text-gray-500 mb-1"
        >
          Question
        </label>
        <input
          id="q-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What are you trying to figure out?"
          maxLength={200}
          required
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asu-blue focus:border-transparent"
        />
      </div>

      <div>
        <label
          htmlFor="q-body"
          className="block text-xs font-medium text-gray-500 mb-1"
        >
          Details
        </label>
        <textarea
          id="q-body"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share context: what you've tried, what tools you're using, and what a helpful answer would look like."
          rows={5}
          maxLength={5000}
          required
          className="w-full text-sm border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-2 focus:ring-asu-blue focus:border-transparent resize-y"
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
        <div className="flex-1 min-w-0">
          <label
            htmlFor="q-skill"
            className="block text-xs font-medium text-gray-500 mb-1"
          >
            Skill tag (optional)
          </label>
          <select
            id="q-skill"
            value={skillId}
            onChange={(e) => setSkillId(e.target.value)}
            className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-asu-blue focus:border-transparent"
          >
            <option value="">No skill tag</option>
            {skills.map((s) => (
              <option key={s.id} value={s.id}>
                Skill {s.id}: {s.short_name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex items-center gap-2 text-sm text-gray-600 sm:pt-5">
          <input
            type="checkbox"
            checked={anonymous}
            onChange={(e) => setAnonymous(e.target.checked)}
            className="rounded border-gray-300 text-asu-blue focus:ring-asu-blue"
          />
          Post anonymously
        </label>
      </div>

      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      <div className="flex items-center justify-end gap-2 pt-1">
        <button
          type="button"
          onClick={reset}
          disabled={pending}
          className="px-3 py-2 text-sm font-medium text-gray-600 hover:text-gray-800 disabled:opacity-50"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={pending}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-asu-blue text-white hover:bg-asu-blue/90 disabled:opacity-60 transition-colors"
        >
          {pending ? "Posting…" : "Post question"}
        </button>
      </div>
    </form>
  );
}
