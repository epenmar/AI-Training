import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChannelFeed } from "@/components/slack/ChannelFeed";
import { SlackRelevance } from "@/components/slack/SlackRelevance";
import { SLACK_CHANNELS } from "@/lib/slackChannels";

export default async function SlackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: skills }, { data: activities }] = await Promise.all([
    supabase
      .from("skills")
      .select("id, short_name, display_order")
      .eq("is_active", true)
      .order("display_order", { nullsFirst: false }),
    supabase
      .from("level_up_activities")
      .select("id, title, band, skill_id")
      .eq("is_active", true)
      .order("skill_id"),
  ]);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Slack</h2>
        <p className="text-gray-500">
          Surface posts from your team&apos;s Slack channels that relate to a
          skill or activity, or browse the latest in each channel.
        </p>
      </div>

      {/* Relevance finder */}
      <SlackRelevance skills={skills ?? []} activities={activities ?? []} />

      {/* Channel feeds */}
      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 mb-3">
        Browse channels
      </h3>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {SLACK_CHANNELS.map((c) => (
          <ChannelFeed key={c.id} channelId={c.id} channelName={c.name} />
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Channel feeds refresh every 5 minutes. Posting requires opening Slack
        directly.
      </p>
    </div>
  );
}
