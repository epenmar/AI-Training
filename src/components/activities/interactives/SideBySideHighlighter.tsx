"use client";

import {
  HighlighterWorkspace,
  type HighlighterWorkspaceData,
} from "./HighlighterWorkspace";

// Two HighlighterWorkspaces in a side-by-side layout (stacks on
// narrow screens). Each pane has its own storageKey and persists
// independently — designed for "select a small piece and compare
// before vs. after" annotation work.
export type SideBySideHighlighterData = {
  prompt?: string;
  leftHeading?: string;
  rightHeading?: string;
  left: HighlighterWorkspaceData;
  right: HighlighterWorkspaceData;
};

export function SideBySideHighlighter({
  data,
}: {
  data: SideBySideHighlighterData;
}) {
  return (
    <div className="space-y-3">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700">{data.prompt}</p>
      )}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div>
          {data.leftHeading && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-asu-maroon mb-1.5">
              {data.leftHeading}
            </p>
          )}
          <HighlighterWorkspace data={data.left} />
        </div>
        <div>
          {data.rightHeading && (
            <p className="text-[11px] font-bold uppercase tracking-wider text-asu-blue mb-1.5">
              {data.rightHeading}
            </p>
          )}
          <HighlighterWorkspace data={data.right} />
        </div>
      </div>
    </div>
  );
}
