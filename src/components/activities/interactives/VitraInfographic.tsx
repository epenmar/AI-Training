"use client";

import { useState } from "react";

export type VitraInfographicData = {
  prompt?: string;
};

const VITRA_URL =
  "https://canvas.asu.edu/courses/157584/pages/the-important-role-of-vendor-it-risk-assessment-vitra";

type StatusKey = "approved" | "review" | "rejected";

const STATUSES: {
  key: StatusKey;
  label: string;
  ring: string;
  badge: string;
  meansShort: string;
  detail: {
    canDo: string[];
    cannotDo: string[];
    nextStep: string;
  };
}[] = [
  {
    key: "approved",
    label: "Approved",
    ring: "border-asu-green/60 bg-asu-green/5",
    badge: "bg-asu-green text-white",
    meansShort: "Cleared by ASU IT for institutional use.",
    detail: {
      canDo: [
        "Use with student data (with FERPA-appropriate handling).",
        "Recommend in formal courses and university work.",
        "Cite as ASU-vetted in your audit brief.",
      ],
      cannotDo: [
        "Use unvetted features released after the assessment date — those need a fresh review.",
        "Assume approval covers a different account tier or plan.",
      ],
      nextStep:
        "Note the approval date in your brief. Approvals can lapse if the vendor changes data handling.",
    },
  },
  {
    key: "review",
    label: "Under review",
    ring: "border-asu-orange/60 bg-asu-orange/5",
    badge: "bg-asu-orange text-white",
    meansShort: "Submitted; ASU IT hasn't finished assessment yet.",
    detail: {
      canDo: [
        "Use with de-identified data only.",
        "Pilot the tool on internal-to-you tasks while you wait.",
        "Document your provisional findings in the brief, marked as preliminary.",
      ],
      cannotDo: [
        "Put real student data in until the assessment closes.",
        "Roll out departmentally before approval.",
      ],
      nextStep:
        "Check back periodically; ask your IT liaison for the expected timeline.",
    },
  },
  {
    key: "rejected",
    label: "Not submitted (or rejected)",
    ring: "border-red-300 bg-red-50",
    badge: "bg-red-600 text-white",
    meansShort: "No assessment on file, or the request was declined.",
    detail: {
      canDo: [
        "Use only with public, non-sensitive data.",
        "Recommend a VITRA submission as the path forward in your brief.",
      ],
      cannotDo: [
        "Use with student records, course rosters, FERPA-protected information.",
        "Sign departmental contracts in advance of approval.",
      ],
      nextStep:
        "If this tool matters, submit a VITRA request via your IT liaison or the ASU IT portal. Don't wait for someone else to do it.",
    },
  },
];

export function VitraInfographic({ data }: { data: VitraInfographicData }) {
  const [open, setOpen] = useState<StatusKey | null>(null);

  return (
    <div className="rounded-lg border border-asu-maroon/25 bg-asu-maroon/5 p-4">
      {data.prompt && (
        <p className="text-sm font-medium text-gray-700 mb-3">{data.prompt}</p>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {STATUSES.map((s) => {
          const isOpen = open === s.key;
          return (
            <button
              key={s.key}
              type="button"
              onClick={() => setOpen(isOpen ? null : s.key)}
              aria-expanded={isOpen}
              className={`text-left rounded-lg border-2 p-3 cursor-pointer transition-shadow hover:shadow-sm ${
                isOpen ? "shadow-sm ring-2 ring-asu-maroon/30" : ""
              } ${s.ring}`}
            >
              <span
                className={`inline-block text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded ${s.badge}`}
              >
                {s.label}
              </span>
              <p className="text-sm text-gray-700 mt-2 leading-snug">
                {s.meansShort}
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
            const s = STATUSES.find((x) => x.key === open)!;
            return (
              <div className="space-y-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-asu-green mb-1">
                    What you can do
                  </p>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                    {s.detail.canDo.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-red-600 mb-1">
                    What you can&apos;t do
                  </p>
                  <ul className="text-sm text-gray-700 list-disc pl-5 space-y-1">
                    {s.detail.cannotDo.map((line, i) => (
                      <li key={i}>{line}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-asu-blue mb-1">
                    Next step
                  </p>
                  <p className="text-sm text-gray-700">{s.detail.nextStep}</p>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      <p className="text-[11px] text-gray-500 mt-3">
        Want the full process from ASU IT?{" "}
        <a
          href={VITRA_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="text-asu-maroon underline hover:opacity-80"
        >
          Read the VITRA explainer
        </a>{" "}
        (Canvas, ~5 min) — but the three states above cover what you need
        for your brief.
      </p>
    </div>
  );
}
