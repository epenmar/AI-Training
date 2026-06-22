import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { SLACK_CHANNELS, channelName } from "@/lib/slackChannels";
import {
  skillKeywords,
  activityKeywords,
  matchKeywords,
} from "@/lib/slackKeywords";

/**
 * Surfaces Slack posts relevant to a selected skill or activity.
 *
 * Slack bots can't use search.messages, so we pull recent
 * conversations.history from each connected channel (server-side, with
 * SLACK_BOT_TOKEN) and filter by keywords derived from the skill /
 * activity. Returns the top matches with permalinks.
 *
 * POST { mode: "skill" | "activity", id: number }
 */

type SlackRaw = {
  ts: string;
  user?: string;
  text?: string;
  subtype?: string;
};

type Result = {
  channelId: string;
  channelName: string;
  ts: string;
  text: string;
  authorName: string;
  permalink: string | null;
  matched: string[];
  score: number;
};

const HISTORY_LIMIT = 100; // messages pulled per channel before filtering
const MAX_RESULTS = 20;

// Short-lived cache of permalinks + user names so repeated searches
// don't hammer Slack.
const userCache = new Map<string, string>();
const permalinkCache = new Map<string, string | null>();

async function slackGet(
  method: string,
  params: Record<string, string>,
  token: string
) {
  const qs = new URLSearchParams(params).toString();
  const res = await fetch(`https://slack.com/api/${method}?${qs}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  return res.json();
}

async function resolveUser(userId: string, token: string): Promise<string> {
  if (!userId) return "Unknown";
  if (userCache.has(userId)) return userCache.get(userId)!;
  const data = await slackGet("users.info", { user: userId }, token);
  const name = data?.user?.real_name || data?.user?.name || userId;
  userCache.set(userId, name);
  return name;
}

async function resolvePermalink(
  channelId: string,
  ts: string,
  token: string
): Promise<string | null> {
  const key = `${channelId}:${ts}`;
  if (permalinkCache.has(key)) return permalinkCache.get(key)!;
  const data = await slackGet(
    "chat.getPermalink",
    { channel: channelId, message_ts: ts },
    token
  );
  const link = data?.ok ? (data.permalink as string) : null;
  permalinkCache.set(key, link);
  return link;
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const token = process.env.SLACK_BOT_TOKEN;
  if (!token) {
    return NextResponse.json({ configured: false, results: [] });
  }

  const body = (await request.json().catch(() => ({}))) as {
    mode?: string;
    id?: number;
  };
  if (
    (body.mode !== "skill" && body.mode !== "activity") ||
    typeof body.id !== "number"
  ) {
    return NextResponse.json({ error: "bad_request" }, { status: 400 });
  }

  // Resolve keywords from the DB.
  let keywords: string[] = [];
  let label = "";
  if (body.mode === "skill") {
    const { data: skill } = await supabase
      .from("skills")
      .select("id, short_name, statement")
      .eq("id", body.id)
      .single();
    if (!skill) return NextResponse.json({ error: "not_found" }, { status: 404 });
    keywords = skillKeywords(skill);
    label = skill.short_name;
  } else {
    const { data: act } = await supabase
      .from("level_up_activities")
      .select("title, description, skill_id")
      .eq("id", body.id)
      .single();
    if (!act) return NextResponse.json({ error: "not_found" }, { status: 404 });
    keywords = activityKeywords(act);
    label = act.title;
  }

  // Pull history from each connected channel and filter by keywords.
  const matched: Result[] = [];
  for (const ch of SLACK_CHANNELS) {
    const data = await slackGet(
      "conversations.history",
      { channel: ch.id, limit: String(HISTORY_LIMIT) },
      token
    );
    if (!data?.ok) continue; // channel not joined / not allowed — skip
    const msgs: SlackRaw[] = (data.messages ?? []).filter(
      (m: SlackRaw) => !m.subtype && m.text
    );
    for (const m of msgs) {
      const hits = matchKeywords(m.text ?? "", keywords);
      if (hits.length === 0) continue;
      // score: distinct keyword hits, with a small recency nudge
      const ageDays =
        (Date.now() / 1000 - Number(m.ts)) / 86400;
      const recency = ageDays < 30 ? 0.5 : 0;
      matched.push({
        channelId: ch.id,
        channelName: channelName(ch.id),
        ts: m.ts,
        text: m.text ?? "",
        authorName: m.user ?? "",
        permalink: null,
        matched: hits,
        score: hits.length + recency,
      });
    }
  }

  matched.sort((a, b) => b.score - a.score || Number(b.ts) - Number(a.ts));
  const top = matched.slice(0, MAX_RESULTS);

  // Resolve author names + permalinks only for the top results.
  for (const r of top) {
    r.authorName = await resolveUser(r.authorName, token);
    r.permalink = await resolvePermalink(r.channelId, r.ts, token);
  }

  return NextResponse.json({
    configured: true,
    label,
    keywords,
    results: top,
    scanned: SLACK_CHANNELS.length,
  });
}
