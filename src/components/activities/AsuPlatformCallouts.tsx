interface Props {
  skillId: number;
  activityTitle: string;
  activityDeliverable: string | null;
}

const BUILDER_SKILLS = new Set([6, 11, 14]);
const COMPARE_SKILLS = new Set([1, 2, 10, 11]);

export function AsuPlatformCallouts({
  skillId,
  activityTitle,
  activityDeliverable,
}: Props) {
  const showBuilder = BUILDER_SKILLS.has(skillId);
  const showCompare = COMPARE_SKILLS.has(skillId);
  if (!showBuilder && !showCompare) return null;

  const compareQuery = activityDeliverable
    ? `Help me with this activity: ${activityTitle}. Deliverable: ${activityDeliverable}`
    : `Help me with this activity: ${activityTitle}`;
  const compareHref = `https://compare.aiml.asu.edu/?query=${encodeURIComponent(
    compareQuery
  )}`;

  return (
    <div className="mb-6 space-y-3">
      {showBuilder && (
        <a
          href="https://platform.aiml.asu.edu/"
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-asu-maroon/5 border border-asu-maroon/25 rounded-lg p-4 hover:bg-asu-maroon/10 hover:border-asu-maroon/40 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-asu-maroon text-white flex items-center justify-center font-bold text-sm">
              ASU
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-asu-maroon inline-flex items-center gap-1">
                Build it in Create AI
                <svg
                  className="w-3.5 h-3.5 text-asu-maroon/70 group-hover:text-asu-maroon"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="opens in new tab"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                ASU&apos;s institutional AI platform for building custom
                assistants, agents, and reusable prompts — a good fit when
                this activity produces something you&apos;ll want to reuse.
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                platform.aiml.asu.edu
              </p>
            </div>
          </div>
        </a>
      )}

      {showCompare && (
        <a
          href={compareHref}
          target="_blank"
          rel="noopener noreferrer"
          className="group block bg-asu-blue/5 border border-asu-blue/25 rounded-lg p-4 hover:bg-asu-blue/10 hover:border-asu-blue/40 transition-colors"
        >
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 w-9 h-9 rounded-lg bg-asu-blue text-white flex items-center justify-center font-bold text-sm">
              ASU
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-asu-blue inline-flex items-center gap-1">
                Compare models side-by-side
                <svg
                  className="w-3.5 h-3.5 text-asu-blue/70 group-hover:text-asu-blue"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-label="opens in new tab"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </p>
              <p className="text-xs text-gray-600 mt-1">
                Run the same prompt against multiple models at once to see how
                they differ. This link pre-fills a starter prompt tied to this
                activity — edit it before you hit go.
              </p>
              <p className="text-xs text-gray-500 mt-1 font-mono">
                compare.aiml.asu.edu
              </p>
            </div>
          </div>
        </a>
      )}
    </div>
  );
}
