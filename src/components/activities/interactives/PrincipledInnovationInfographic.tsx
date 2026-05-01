"use client";

import { useState } from "react";

export type PrincipledInnovationInfographicData = {
  prompt?: string;
};

type PrincipleKey = "curiosity" | "care" | "clarity" | "intentionality";

const PRINCIPLES: {
  key: PrincipleKey;
  label: string;
  ring: string;
  badge: string;
  whatItAsks: string;
  detail: {
    lookFor: string[];
    commonTension: string;
    aiUseExample: string;
  };
}[] = [
  {
    key: "curiosity",
    label: "Curiosity",
    ring: "border-asu-blue/60 bg-asu-blue/5",
    badge: "bg-asu-blue text-white",
    whatItAsks: "What's worth exploring here?",
    detail: {
      lookFor: [
        "Genuine open questions in the situation, not foregone conclusions in disguise.",
        "Possibilities the team hasn't surfaced yet.",
        "What you'd learn either way, even if the experiment fails.",
      ],
      commonTension:
        "Curiosity wants to try the new thing. Care wants to protect the people who'd be affected if it goes wrong.",
      aiUseExample:
        "An AI tool you've never used could help students debate a topic in new ways. Curiosity says pilot it; care will ask whether you've protected students from bad debate partners.",
    },
  },
  {
    key: "care",
    label: "Care",
    ring: "border-asu-green/60 bg-asu-green/5",
    badge: "bg-asu-green text-white",
    whatItAsks: "Who's affected, and how do we protect them?",
    detail: {
      lookFor: [
        "Stakeholders who don't get a vote, students, future learners, colleagues whose work depends on consistency.",
        "What's the cost if this goes wrong, who bears it.",
        "What you'd put in place to catch a mistake before it propagates.",
      ],
      commonTension:
        "Care wants safeguards. Intentionality wants a definite call. Care alone leads to indefinite delay; intentionality alone risks moving too fast.",
      aiUseExample:
        "An AI grader could be fast, but if its consistency varies between students, care asks whether the savings are worth the inequity.",
    },
  },
  {
    key: "clarity",
    label: "Clarity",
    ring: "border-asu-maroon/60 bg-asu-maroon/5",
    badge: "bg-asu-maroon text-white",
    whatItAsks: "What's the trade-off, named explicitly?",
    detail: {
      lookFor: [
        "Two options where reasonable people disagree, named without hedging.",
        "What you're choosing to give up, not just what you're choosing to gain.",
        "The constraint that's doing the most work in the decision.",
      ],
      commonTension:
        "Clarity wants the trade-off out loud. Curiosity sometimes wants the trade-off blurred so an experiment can happen at all.",
      aiUseExample:
        "Adopting AI feedback at scale gives faculty time back, at the cost of personal connection in feedback loops. Clarity says: name that.",
    },
  },
  {
    key: "intentionality",
    label: "Intentionality",
    ring: "border-asu-gold/70 bg-asu-gold/10",
    badge: "bg-yellow-700 text-white",
    whatItAsks: "What deliberate choice are we making, vs. drifting?",
    detail: {
      lookFor: [
        "A position the team can defend in six months, not a default that crept in.",
        "Why now, and why this approach, named in a sentence.",
        "What would change the call.",
      ],
      commonTension:
        "Intentionality wants a definite stance. Care wants safeguards before the stance crystallizes. The healthy synthesis is intentional incrementalism.",
      aiUseExample:
        "\"We're piloting AI grading in two sections this term, with a faculty review on every score, and we'll re-decide in May based on inter-rater agreement.\" That's intentional. \"We tried AI grading\" is drift.",
    },
  },
];

export function PrincipledInnovationInfographic({
  data,
}: {
  data: PrincipledInnovationInfographicData;
}) {
  const [open, setOpen] = useState<PrincipleKey | null>(null);

  return (
    <div className="rounded-lg border border-asu-maroon/25 bg-asu-maroon/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}

      <div className="grid grid-cols-2 gap-3">
        {PRINCIPLES.map((p) => {
          const isOpen = open === p.key;
          return (
            <button
              key={p.key}
              type="button"
              onClick={() => setOpen(isOpen ? null : p.key)}
              aria-expanded={isOpen}
              aria-label={`${p.label}: ${p.whatItAsks}`}
              className={`text-left rounded-lg border-2 p-3 cursor-pointer transition-shadow hover:shadow-sm focus:outline-none focus-visible:ring-2 focus-visible:ring-asu-maroon focus-visible:ring-offset-1 ${
                isOpen ? "shadow-sm ring-2 ring-asu-maroon/30" : ""
              } ${p.ring}`}
            >
              <span
                className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${p.badge}`}
              >
                {p.label}
              </span>
              <p className="text-sm font-semibold text-gray-700 mt-2 leading-snug">
                {p.whatItAsks}
              </p>
              <p className="text-[11px] text-asu-maroon mt-2 font-semibold">
                {isOpen ? "Hide details ▴" : "Tap for details ▾"}
              </p>
            </button>
          );
        })}
      </div>

      {open != null && (
        <div className="mt-3 rounded-lg bg-white border border-gray-200 p-4">
          {(() => {
            const p = PRINCIPLES.find((x) => x.key === open)!;
            return (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-asu-blue mb-1">
                    What to look for
                  </p>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                    {p.detail.lookFor.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-amber-700 mb-1">
                    Common tension
                  </p>
                  <p className="text-sm text-gray-700">
                    {p.detail.commonTension}
                  </p>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-asu-maroon mb-1">
                    What this looks like in an AI decision
                  </p>
                  <p className="text-sm text-gray-700 italic">
                    {p.detail.aiUseExample}
                  </p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <p className="text-[11px] text-gray-500 mt-3">
        ASU&apos;s Principled Innovation framework treats curiosity, care,
        clarity, and intentionality as a single set, not a checklist. The
        good cases are usually where two of them pull against each other.
      </p>
    </div>
  );
}
