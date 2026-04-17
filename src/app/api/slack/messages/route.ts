import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * Slack read-only proxy. Fetches conversation history for the given channel_id
 * on the server using SLACK_BOT_TOKEN from env, so the token never reaches the
 * browser. Cached for 5 minutes per channel.
 */

type SlackMessage = {
  ts: string;
  user?: string;
  text: string;
  username?: string;
};

type CacheEntry = { at: number; messages: SlackMessage[]; users: Record<string, string> };
const cache = new Map<string, CacheEntry>();
const CACHE_TTL_MS = 5 * 60 * 1000;

const ALLOWED_CHANNELS = new Set([
  "C094XUNEHC6",
  "C062HRAVBQR",
  "CN0498SNP",
  "C0994NHG4NS",
]);

async function fetchUserName(userId: string, token: string): Promise<string> {
  const res = await fetch(
    `https://slack.com/api/users.info?user=${userId}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const data = await res.json();
  return data?.user?.real_name || data?.user?.name || userId;
}

export async function GET(request: Request) {
  // Require authenticated user
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    return NextResponse.json(
      { error: "slack_not_configured", messages: [] },
      { status: 200 }
    );
  }

  const { searchParams } = new URL(request.url);
  const channelId = searchParams.get("channel");
  if (!channelId || !ALLOWED_CHANNELS.has(channelId)) {
    return NextResponse.json({ error: "invalid_channel" }, { status: 400 });
  }

  // Cache hit
  const cached = cache.get(channelId);
  if (cached && Date.now() - cached.at < CACHE_TTL_MS) {
    return NextResponse.json({
      messages: cached.messages,
      users: cached.users,
      cached: true,
    });
  }

  // Fetch channel history
  const histRes = await fetch(
    `https://slack.com/api/conversations.history?channel=${channelId}&limit=15`,
    { headers: { Authorization: `Bearer ${token}` } }
  );
  const histData = await histRes.json();

  if (!histData.ok) {
    return NextResponse.json(
      { error: histData.error ?? "slack_error" },
      { status: 502 }
    );
  }

  const messages: SlackMessage[] = (histData.messages ?? [])
    .filter((m: { subtype?: string; text?: string }) => !m.subtype && m.text)
    .map((m: { ts: string; user?: string; text: string }) => ({
      ts: m.ts,
      user: m.user,
      text: m.text,
    }));

  // Batch-fetch user names (deduped)
  const userIds = Array.from(
    new Set(messages.map((m) => m.user).filter(Boolean) as string[])
  );
  const users: Record<string, string> = {};
  await Promise.all(
    userIds.map(async (id) => {
      users[id] = await fetchUserName(id, token);
    })
  );

  cache.set(channelId, { at: Date.now(), messages, users });

  return NextResponse.json({ messages, users, cached: false });
}
