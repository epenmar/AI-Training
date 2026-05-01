import { AsuPlatformCallouts } from "./AsuPlatformCallouts";
import { ToolSuggester } from "./ToolSuggester";

interface Props {
  skillId: number;
  band: string;
  activityId: number;
  activityTitle: string;
  activityDeliverable: string | null;
  showPlatform: boolean;
  showExternal: boolean;
}

// Renders the ASU platform callouts (Compare AI, Build in Create AI) and / or
// the external-tool suggester depending on what the step opted in to.
// Each component already carries its own visual identity, the
// ToolSuggester explicitly labels itself as external (non-ASU).
export function AsuResourcesPanel({
  skillId,
  band,
  activityId,
  activityTitle,
  activityDeliverable,
  showPlatform,
  showExternal,
}: Props) {
  if (!showPlatform && !showExternal) return null;
  return (
    <div className="space-y-3">
      {showPlatform && (
        <AsuPlatformCallouts
          skillId={skillId}
          band={band}
          activityTitle={activityTitle}
          activityDeliverable={activityDeliverable}
        />
      )}
      {showExternal && <ToolSuggester activityId={activityId} />}
    </div>
  );
}
