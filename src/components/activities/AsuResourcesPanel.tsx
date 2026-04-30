import { AsuPlatformCallouts } from "./AsuPlatformCallouts";
import { ToolSuggester } from "./ToolSuggester";

interface Props {
  skillId: number;
  band: string;
  activityId: number;
  activityTitle: string;
  activityDeliverable: string | null;
}

export function AsuResourcesPanel({
  skillId,
  band,
  activityId,
  activityTitle,
  activityDeliverable,
}: Props) {
  return (
    <section
      aria-label="ASU resources for this activity"
      className="mb-6 rounded-xl border-2 border-asu-green/30 bg-asu-green/5 p-4 md:p-5"
    >
      <header className="mb-3 flex items-center gap-2">
        <span
          aria-hidden="true"
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-asu-green text-white text-[10px] font-extrabold tracking-tight"
        >
          ASU
        </span>
        <h3 className="text-sm font-semibold text-green-800">
          ASU resources for this activity
        </h3>
      </header>
      <AsuPlatformCallouts
        skillId={skillId}
        band={band}
        activityTitle={activityTitle}
        activityDeliverable={activityDeliverable}
      />
      <ToolSuggester activityId={activityId} />
    </section>
  );
}
