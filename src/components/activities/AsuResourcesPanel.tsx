import { AsuPlatformCallouts } from "./AsuPlatformCallouts";
import { ToolSuggester } from "./ToolSuggester";

interface Props {
  skillId: number;
  band: string;
  activityId: number;
  activityTitle: string;
  activityDeliverable: string | null;
}

// Renders the ASU platform callouts (Compare AI, Build in Create AI) and
// the external-tool suggester as flat siblings, no wrapping "resources"
// box. Each callout already carries its own visual identity, the
// ToolSuggester below explicitly labels itself as external (non-ASU).
export function AsuResourcesPanel({
  skillId,
  band,
  activityId,
  activityTitle,
  activityDeliverable,
}: Props) {
  return (
    <div className="space-y-3">
      <AsuPlatformCallouts
        skillId={skillId}
        band={band}
        activityTitle={activityTitle}
        activityDeliverable={activityDeliverable}
      />
      <ToolSuggester activityId={activityId} />
    </div>
  );
}
