import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ChannelFeed } from "@/components/slack/ChannelFeed";

const CHANNELS = [
  { id: "C094XUNEHC6", name: "ai-training-main" },
  { id: "C062HRAVBQR", name: "instructional-design" },
  { id: "CN0498SNP", name: "community" },
  { id: "C0994NHG4NS", name: "announcements" },
];

export default async function SlackPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Slack</h2>
        <p className="text-gray-500">
          Recent messages from your team&apos;s Slack channels. Click any
          channel to open it in Slack and join the conversation.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {CHANNELS.map((c) => (
          <ChannelFeed key={c.id} channelId={c.id} channelName={c.name} />
        ))}
      </div>

      <p className="text-xs text-gray-400 mt-6 text-center">
        Messages refresh every 5 minutes. Posting requires opening Slack directly.
      </p>
    </div>
  );
}
