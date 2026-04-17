"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

type ChatMessage = { role: "user" | "assistant"; content: string };

const SUGGESTIONS: string[] = [
  "Suggest a different activity at this level",
  "Explain this in simpler terms",
  "Give me a concrete example I can try now",
  "What tool should I use for this?",
  "How does this apply to instructional design?",
];

export function AiAssistant() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function send(content: string) {
    const trimmed = content.trim();
    if (!trimmed || pending) return;
    setError("");
    const next: ChatMessage[] = [
      ...messages,
      { role: "user", content: trimmed },
    ];
    setMessages(next);
    setInput("");
    setPending(true);
    try {
      const res = await fetch("/api/assistant", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next, pathname }),
      });
      if (!res.ok) {
        const data = (await res.json().catch(() => ({}))) as {
          error?: string;
        };
        if (data.error === "not_configured") {
          setError(
            "Assistant is not configured yet — ask an admin to set the Create AI env vars."
          );
        } else {
          setError("Something went wrong. Try again.");
        }
        setMessages(messages); // roll back user message
        return;
      }
      const { reply } = (await res.json()) as { reply: string };
      setMessages([...next, { role: "assistant", content: reply }]);
    } catch {
      setError("Network error. Try again.");
      setMessages(messages);
    } finally {
      setPending(false);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send(input);
    }
  }

  return (
    <>
      {!open && (
        <button
          type="button"
          onClick={() => {
            setOpen(true);
            setTimeout(() => inputRef.current?.focus(), 50);
          }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-3 rounded-full bg-asu-maroon text-white shadow-lg hover:bg-sidebar-hover transition-colors cursor-pointer"
          aria-label="Open AI assistant"
        >
          <svg
            className="w-5 h-5"
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
          <span className="text-sm font-medium">Ask AI</span>
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-labelledby="ai-assistant-title"
          aria-modal="false"
          className="fixed bottom-6 right-6 z-40 w-[22rem] sm:w-[26rem] max-w-[calc(100vw-2rem)] h-[32rem] max-h-[calc(100vh-3rem)] bg-white border border-gray-200 rounded-xl shadow-2xl flex flex-col overflow-hidden"
        >
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 bg-asu-maroon text-white">
            <div className="flex items-center gap-2">
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
              <h2
                id="ai-assistant-title"
                className="text-sm font-semibold"
              >
                AI Assistant
              </h2>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="p-1 rounded hover:bg-white/10 cursor-pointer"
              aria-label="Close assistant"
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
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <div
            ref={scrollRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-3 bg-gray-50"
          >
            {messages.length === 0 && (
              <div className="text-xs text-gray-500 leading-relaxed">
                Ask me anything about what you&apos;re looking at, or pick a
                starter below.
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${
                  m.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`max-w-[85%] text-sm rounded-lg px-3 py-2 whitespace-pre-line ${
                    m.role === "user"
                      ? "bg-asu-maroon text-white"
                      : "bg-white border border-gray-200 text-gray-700"
                  }`}
                >
                  {m.content}
                </div>
              </div>
            ))}
            {pending && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 text-gray-400 text-sm rounded-lg px-3 py-2">
                  Thinking…
                </div>
              </div>
            )}
            {error && (
              <p className="text-xs text-red-600" role="alert">
                {error}
              </p>
            )}
          </div>

          {messages.length === 0 && (
            <div className="px-4 py-2 border-t border-gray-200 bg-white">
              <div className="flex flex-wrap gap-1.5">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => send(s)}
                    disabled={pending}
                    className="text-xs px-2.5 py-1.5 rounded-full border border-gray-200 text-gray-700 bg-white hover:border-asu-maroon/40 hover:text-asu-maroon disabled:opacity-50 cursor-pointer transition-colors"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSubmit}
            className="border-t border-gray-200 p-3 bg-white"
          >
            <div className="flex gap-2 items-end">
              <textarea
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask about this page…"
                rows={2}
                disabled={pending}
                className="flex-1 text-sm border border-gray-300 rounded-lg px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:border-transparent disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={pending || !input.trim()}
                className="px-3 py-2 rounded-lg bg-asu-maroon text-white text-sm font-medium hover:bg-sidebar-hover disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                aria-label="Send"
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
