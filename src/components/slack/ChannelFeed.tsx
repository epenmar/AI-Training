"use client";

import { useEffect, useState } from "react";

interface Props {
  channelId: string;
  channelName: string;
}

interface SlackMessage {
  ts: string;
  user?: string;
  text: string;
}

interface ApiResponse {
  error?: string;
  messages?: SlackMessage[];
  users?: Record<string, string>;
}

function formatText(text: string, users: Record<string, string>) {
  // Replace <@USERID> with names
  return text.replace(/<@(\w+)>/g, (_, id) => `@${users[id] ?? id}`);
}

export function ChannelFeed({ channelId, channelName }: Props) {
  const [state, setState] = useState<"loading" | "ready" | "not_configured" | "error">("loading");
  const [messages, setMessages] = useState<SlackMessage[]>([]);
  const [users, setUsers] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setState("loading");
      try {
        const res = await fetch(`/api/slack/messages?channel=${channelId}`);
        const data: ApiResponse = await res.json();
        if (cancelled) return;
        if (data.error === "slack_not_configured") {
          setState("not_configured");
          return;
        }
        if (data.error) {
          setErrorMsg(data.error);
          setState("error");
          return;
        }
        setMessages(data.messages ?? []);
        setUsers(data.users ?? {});
        setState("ready");
      } catch {
        if (!cancelled) {
          setErrorMsg("Could not reach Slack");
          setState("error");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [channelId]);

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">
          <span className="text-gray-400 mr-1">#</span>
          {channelName}
        </h3>
        <a
          href={`https://slack.com/app_redirect?channel=${channelId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-asu-maroon hover:underline font-medium"
        >
          Open in Slack →
        </a>
      </div>

      <div className="p-4 max-h-96 overflow-y-auto">
        {state === "loading" && (
          <p className="text-sm text-gray-400">Loading...</p>
        )}
        {state === "not_configured" && (
          <div className="text-center py-6">
            <p className="text-sm text-gray-500 mb-2">
              Slack integration not configured yet.
            </p>
            <p className="text-xs text-gray-400">
              An admin needs to set <code className="bg-gray-100 px-1 rounded">SLACK_BOT_TOKEN</code> in the environment.
            </p>
          </div>
        )}
        {state === "error" && (
          <p className="text-sm text-red-600">
            {errorMsg || "Something went wrong fetching messages."}
          </p>
        )}
        {state === "ready" && messages.length === 0 && (
          <p className="text-sm text-gray-400">No recent messages.</p>
        )}
        {state === "ready" && messages.length > 0 && (
          <ul className="space-y-3">
            {messages.map((m) => {
              const dateMs = parseFloat(m.ts) * 1000;
              return (
                <li key={m.ts} className="flex gap-3">
                  <div className="w-8 h-8 flex-shrink-0 rounded bg-asu-maroon/10 text-asu-maroon text-xs font-semibold flex items-center justify-center">
                    {(users[m.user ?? ""] ?? "?")[0]?.toUpperCase() ?? "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-sm font-semibold text-gray-700">
                        {users[m.user ?? ""] ?? "Unknown"}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(dateMs).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words mt-0.5">
                      {formatText(m.text, users)}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
