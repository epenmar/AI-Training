"use client";

import { useState, useTransition } from "react";

type Skill = { id: number; short_name: string; display_order: number | null };
type Activity = { id: number; title: string; band: string; skill_id: number };

type Result = {
  channelId: string;
  channelName: string;
  ts: string;
  text: string;
  authorName: string;
  permalink: string | null;
  matched: string[];
};

function formatText(text: string) {
  return text.replace(/<@(\w+)>/g, "@user").replace(/<([^|>]+)\|([^>]+)>/g, "$2");
}

export function SlackRelevance({
  skills,
  activities,
}: {
  skills: Skill[];
  activities: Activity[];
}) {
  const [mode, setMode] = useState<"skill" | "activity" | "question">("skill");
  const [selId, setSelId] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [pending, startTransition] = useTransition();
  const [results, setResults] = useState<Result[] | null>(null);
  const [answer, setAnswer] = useState<string | null>(null);
  const [configured, setConfigured] = useState(true);
  const [label, setLabel] = useState("");
  const [error, setError] = useState("");

  const query = (payload: Record<string, unknown>) => {
    setError("");
    setResults(null);
    setAnswer(null);
    startTransition(async () => {
      try {
        const res = await fetch("/api/slack/search", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify(payload),
        });
        const data = await res.json();
        if (!res.ok) {
          setError("Couldn't search Slack. Try again.");
          return;
        }
        setConfigured(data.configured !== false);
        setLabel(data.label ?? "");
        setResults(data.results ?? []);
        setAnswer(data.answer ?? null);
      } catch {
        setError("Couldn't search Slack. Try again.");
      }
    });
  };

  const run = (id: string) => {
    if (!id) {
      setResults(null);
      return;
    }
    query({ mode, id: Number(id) });
  };

  const ask = () => {
    if (!question.trim()) return;
    query({ mode: "question", text: question.trim() });
  };

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-5 mb-6">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-1">
        Find relevant posts
      </h3>
      <p className="text-xs text-gray-500 mb-3">
        Pick a skill or activity, or ask a question, and we&apos;ll surface
        Slack posts from your connected channels that match — with a short
        answer synthesized from them.
      </p>

      {/* Mode toggle */}
      <div
        role="tablist"
        aria-label="Search by"
        className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg mb-3"
      >
        <button
          type="button"
          role="tab"
          aria-selected={mode === "skill"}
          onClick={() => {
            setMode("skill");
            setSelId("");
            setResults(null);
          }}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode === "skill"
              ? "bg-white text-asu-maroon shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          By skill
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "activity"}
          onClick={() => {
            setMode("activity");
            setSelId("");
            setResults(null);
          }}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode === "activity"
              ? "bg-white text-asu-maroon shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          By activity
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={mode === "question"}
          onClick={() => {
            setMode("question");
            setResults(null);
          }}
          className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
            mode === "question"
              ? "bg-white text-asu-maroon shadow-sm"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Ask a question
        </button>
      </div>

      {mode === "question" ? (
        <div className="flex gap-2 mb-3">
          <input
            type="text"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") ask();
            }}
            placeholder="e.g. How do I disclose AI use in my syllabus?"
            className="flex-1 text-sm border border-gray-300 rounded-md px-2.5 py-2 focus:outline-none focus:ring-2 focus:ring-asu-maroon"
          />
          <button
            type="button"
            onClick={ask}
            disabled={pending || !question.trim()}
            className="px-4 py-2 text-sm font-semibold rounded-md bg-asu-maroon text-white hover:bg-sidebar-hover disabled:opacity-50 cursor-pointer whitespace-nowrap"
          >
            Ask
          </button>
        </div>
      ) : (
        <select
          value={selId}
          onChange={(e) => {
            setSelId(e.target.value);
            run(e.target.value);
          }}
          className="w-full text-sm border border-gray-300 rounded-md px-2.5 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-asu-maroon mb-3"
        >
          <option value="">
            {mode === "skill" ? "Choose a skill…" : "Choose an activity…"}
          </option>
          {mode === "skill"
            ? skills.map((s) => (
                <option key={s.id} value={s.id}>
                  Skill {s.display_order ?? s.id}: {s.short_name}
                </option>
              ))
            : activities.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.title} ({a.band})
                </option>
              ))}
        </select>
      )}

      {/* AI-synthesized answer (question mode) */}
      {!pending && answer && (
        <div className="rounded-lg bg-asu-blue/5 border border-asu-blue/20 p-3 mb-3">
          <p className="text-[11px] font-bold uppercase tracking-wider text-asu-blue mb-1">
            Answer from your channels
          </p>
          <p className="text-sm text-gray-700 whitespace-pre-line">{answer}</p>
          <p className="text-[11px] text-gray-400 mt-1.5">
            Synthesized from the posts below. Verify against the source.
          </p>
        </div>
      )}

      {pending && <p className="text-sm text-gray-500">Searching Slack…</p>}
      {error && (
        <p className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {!pending && results && !configured && (
        <div className="rounded-lg bg-asu-gold/10 border border-asu-gold/40 p-4">
          <p className="text-sm text-gray-700">
            Slack isn&apos;t connected yet. Once an admin sets{" "}
            <code className="bg-gray-100 px-1 rounded">SLACK_BOT_TOKEN</code>{" "}
            and the app is added to the channels, relevant posts will show
            up here automatically.
          </p>
        </div>
      )}

      {!pending && results && configured && results.length === 0 && (
        <p className="text-sm text-gray-500">
          No recent posts in the connected channels matched{" "}
          <span className="font-medium">{label}</span>. Try another
          selection, or check back as the channels fill up.
        </p>
      )}

      {!pending && results && configured && results.length > 0 && (
        <ul className="space-y-2">
          {results.map((r) => (
            <li
              key={`${r.channelId}-${r.ts}`}
              className="rounded-lg border border-gray-200 p-3"
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-semibold text-asu-maroon">
                  #{r.channelName}
                </span>
                <span className="text-[11px] text-gray-400">
                  {r.authorName}
                </span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-line line-clamp-4">
                {formatText(r.text)}
              </p>
              <div className="mt-1.5 flex items-center justify-between gap-2">
                <div className="flex flex-wrap gap-1">
                  {r.matched.slice(0, 4).map((m) => (
                    <span
                      key={m}
                      className="text-[10px] font-medium bg-asu-blue/10 text-asu-blue px-1.5 py-0.5 rounded"
                    >
                      {m}
                    </span>
                  ))}
                </div>
                {r.permalink && (
                  <a
                    href={r.permalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-semibold text-asu-maroon hover:underline whitespace-nowrap"
                  >
                    Open in Slack →
                  </a>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
