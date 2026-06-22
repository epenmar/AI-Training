// Single source of truth for the Slack channels the dashboard reads.
// Replace these placeholder IDs with the real channel IDs from your
// workspace once the Slack app is installed and SLACK_BOT_TOKEN is set.
// (In Slack: channel name → View channel details → ID at the bottom.)
export const SLACK_CHANNELS: { id: string; name: string }[] = [
  { id: "C094XUNEHC6", name: "ai-training-main" },
  { id: "C062HRAVBQR", name: "instructional-design" },
  { id: "CN0498SNP", name: "community" },
  { id: "C0994NHG4NS", name: "announcements" },
];

export const ALLOWED_CHANNEL_IDS = new Set(SLACK_CHANNELS.map((c) => c.id));

export function channelName(id: string): string {
  return SLACK_CHANNELS.find((c) => c.id === id)?.name ?? id;
}
