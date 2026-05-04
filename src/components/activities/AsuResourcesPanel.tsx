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
  // Scope the tool suggester to a specific step. When provided, the
  // "why" lines come back step-specific ("best for [this task]")
  // instead of activity-generic.
  stepNumber?: number;
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
  stepNumber,
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
      {showExternal && (
        <ToolSuggester activityId={activityId} stepNumber={stepNumber} />
      )}
    </div>
  );
}
