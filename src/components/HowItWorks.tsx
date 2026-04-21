import Link from "next/link";

type Cta = { href: string; label: string };

type Step = {
  n: number;
  title: string;
  body: string;
  ctas: Cta[];
  color: {
    ringBg: string; // outer halo behind big icon circle
    fill: string; // filled circle color
    badge: string; // number badge pill
    chip: string; // CTA chip bg
    chipHover: string;
    text: string;
    line: string; // connector line color between circles
  };
  icon: React.ReactNode;
};

function buildSteps(hasAssessment: boolean): Step[] {
  return [
  {
    n: 1,
    title: hasAssessment ? "Retake the assessment" : "Take the assessment",
    body: hasAssessment
      ? "Revisit the 14 scenarios anytime to see how your skill levels have shifted since last time."
      : "14 quick scenarios place you across the Maynard skills — Foundational, Intermediate, or Advanced on each.",
    ctas: [
      {
        href: "/assessment",
        label: hasAssessment ? "Retake assessment" : "Start assessment",
      },
    ],
    color: {
      ringBg: "bg-asu-blue/10",
      fill: "bg-asu-blue",
      badge: "bg-white text-asu-blue ring-2 ring-asu-blue",
      chip: "bg-asu-blue text-white",
      chipHover: "hover:bg-asu-blue/90",
      text: "text-asu-blue",
      line: "bg-asu-blue/30",
    },
    icon: (
      <svg
        className="w-12 h-12 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
        />
      </svg>
    ),
  },
  {
    n: 2,
    title: "Explore the activities",
    body: "Each score surfaces hands-on activities that bridge you to the next level, each with a step-by-step guide and a concrete deliverable.",
    ctas: [
      { href: "/activities?filter=recommended", label: "See my activities" },
      { href: "/activities?filter=all", label: "Browse all activities" },
    ],
    color: {
      ringBg: "bg-asu-green/10",
      fill: "bg-asu-green",
      badge: "bg-white text-asu-green ring-2 ring-asu-green",
      chip: "bg-asu-green text-white",
      chipHover: "hover:bg-asu-green/90",
      text: "text-green-800",
      line: "bg-asu-green/30",
    },
    icon: (
      <svg
        className="w-12 h-12 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
        />
      </svg>
    ),
  },
  {
    n: 3,
    title: "Learn about AI through hands-on interaction",
    body: "Doing is how the skills stick. Learning paths line up readings, videos, and tools to deepen what you practiced.",
    ctas: [
      { href: "/learning-paths?filter=recommended", label: "View my learning" },
      { href: "/learning-paths?filter=all", label: "Browse all skills" },
    ],
    color: {
      ringBg: "bg-asu-maroon/10",
      fill: "bg-asu-maroon",
      badge: "bg-white text-asu-maroon ring-2 ring-asu-maroon",
      chip: "bg-asu-maroon text-white",
      chipHover: "hover:bg-sidebar-hover",
      text: "text-asu-maroon",
      line: "bg-asu-maroon/30",
    },
    icon: (
      <svg
        className="w-12 h-12 text-white"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={1.8}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  ];
}

export function HowItWorks({ hasAssessment }: { hasAssessment: boolean }) {
  const STEPS = buildSteps(hasAssessment);
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="bg-gradient-to-br from-white via-gray-50 to-white rounded-xl border border-gray-200 p-6 md:p-8"
    >
      <div className="mb-7 text-center md:text-left">
        <p className="text-xs font-bold uppercase tracking-widest text-asu-maroon mb-1">
          How this platform works
        </p>
        <h3
          id="how-it-works-heading"
          className="text-xl md:text-2xl font-bold text-gray-700"
        >
          Assess · Do · Learn
        </h3>
      </div>

      {/* Infographic row: big icon circles connected by a flowing line */}
      <ol className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-4">
        {STEPS.map((step, idx) => (
          <li key={step.n} className="relative flex flex-col items-center">
            {/* Connector line (desktop only, between this circle and the next) */}
            {idx < STEPS.length - 1 && (
              <div
                className="hidden md:block absolute top-12 left-[calc(50%+3.5rem)] right-[calc(-50%+3.5rem)] h-0.5 bg-gray-200"
                aria-hidden="true"
              >
                <div
                  className={`h-full ${step.color.line}`}
                  style={{
                    backgroundImage:
                      "repeating-linear-gradient(to right, currentColor 0 8px, transparent 8px 14px)",
                    backgroundColor: "transparent",
                    color: "rgb(156 163 175)",
                  }}
                />
              </div>
            )}

            {/* Big iconographic circle */}
            <div className="relative flex items-center justify-center mb-4">
              <div
                className={`w-24 h-24 rounded-full ${step.color.ringBg} flex items-center justify-center`}
                aria-hidden="true"
              >
                <div
                  className={`w-20 h-20 rounded-full ${step.color.fill} flex items-center justify-center shadow-lg`}
                >
                  {step.icon}
                </div>
              </div>
              {/* Step number badge */}
              <span
                className={`absolute -top-1 -right-1 w-8 h-8 rounded-full ${step.color.badge} flex items-center justify-center text-sm font-bold shadow-sm`}
                aria-label={`Step ${step.n}`}
              >
                {step.n}
              </span>
            </div>

            {/* Text block */}
            <div className="text-center max-w-xs">
              <h4 className="text-base font-bold text-gray-700 leading-snug">
                {step.title}
              </h4>
              <p className="text-xs text-gray-500 mt-1.5 leading-relaxed">
                {step.body}
              </p>

              {/* CTAs */}
              <div className="flex flex-wrap justify-center gap-2 mt-4">
                {step.ctas.map((cta, i) => (
                  <Link
                    key={cta.href}
                    href={cta.href}
                    className={`inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                      i === 0
                        ? `${step.color.chip} ${step.color.chipHover}`
                        : `bg-white border border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50`
                    }`}
                  >
                    {cta.label}
                  </Link>
                ))}
              </div>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
