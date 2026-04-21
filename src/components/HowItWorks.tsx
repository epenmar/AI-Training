import Link from "next/link";

type Step = {
  n: number;
  title: string;
  body: string;
  href: string;
  linkLabel: string;
  color: {
    ring: string;
    bg: string;
    text: string;
    icon: string;
  };
  icon: React.ReactNode;
};

const STEPS: Step[] = [
  {
    n: 1,
    title: "Take the assessment",
    body: "14 quick scenarios tell you where you land across the Maynard skills — Foundational, Intermediate, or Advanced on each.",
    href: "/assessment",
    linkLabel: "Start the assessment",
    color: {
      ring: "ring-asu-blue/30",
      bg: "bg-asu-blue/10",
      text: "text-asu-blue",
      icon: "text-asu-blue",
    },
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
      />
    ),
  },
  {
    n: 2,
    title: "Explore the activities",
    body: "Each score surfaces hands-on activities that bridge you to the next level — each with a step-by-step guide and a concrete deliverable.",
    href: "/activities",
    linkLabel: "Browse activities",
    color: {
      ring: "ring-asu-green/30",
      bg: "bg-asu-green/10",
      text: "text-green-800",
      icon: "text-asu-green",
    },
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
      />
    ),
  },
  {
    n: 3,
    title: "Learn about AI through hands-on interaction",
    body: "Doing is how the skills stick. As you work through activities, the learning paths line up readings, videos, and tools to deepen what you practiced.",
    href: "/learning-paths",
    linkLabel: "Open learning paths",
    color: {
      ring: "ring-asu-maroon/30",
      bg: "bg-asu-maroon/10",
      text: "text-asu-maroon",
      icon: "text-asu-maroon",
    },
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.8}
        d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
      />
    ),
  },
];

export function HowItWorks() {
  return (
    <section
      aria-labelledby="how-it-works-heading"
      className="bg-white rounded-lg border border-gray-200 p-6"
    >
      <div className="mb-5">
        <h3
          id="how-it-works-heading"
          className="text-lg font-semibold text-gray-700"
        >
          How to use this platform
        </h3>
        <p className="text-sm text-gray-500 mt-0.5">
          Three steps. What you do in step 1 shapes what the platform
          surfaces in steps 2 and 3.
        </p>
      </div>

      <ol className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 relative">
        {STEPS.map((step, idx) => (
          <li key={step.n} className="relative flex">
            <div
              className={`flex-1 rounded-lg border border-gray-200 p-4 bg-white hover:ring-2 hover:${step.color.ring} transition-shadow flex flex-col`}
            >
              <div className="flex items-center gap-3 mb-2">
                <div
                  className={`w-10 h-10 rounded-full ${step.color.bg} ${step.color.text} flex items-center justify-center font-bold text-sm flex-shrink-0`}
                  aria-hidden="true"
                >
                  {step.n}
                </div>
                <svg
                  className={`w-5 h-5 ${step.color.icon}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  {step.icon}
                </svg>
              </div>
              <p className="text-sm font-semibold text-gray-700">
                {step.title}
              </p>
              <p className="text-xs text-gray-500 mt-1 leading-relaxed flex-1">
                {step.body}
              </p>
              <Link
                href={step.href}
                className={`inline-flex items-center gap-1 text-xs font-semibold mt-3 ${step.color.text} hover:gap-1.5 transition-all`}
              >
                {step.linkLabel}
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 8l4 4m0 0l-4 4m4-4H3"
                  />
                </svg>
              </Link>
            </div>

            {/* Connector arrow between cards — horizontal on md+, hidden on mobile */}
            {idx < STEPS.length - 1 && (
              <div
                className="hidden md:flex absolute top-1/2 -right-2 -translate-y-1/2 z-10 w-4 h-4 items-center justify-center bg-white rounded-full"
                aria-hidden="true"
              >
                <svg
                  className="w-4 h-4 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2.5}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            )}
          </li>
        ))}
      </ol>
    </section>
  );
}
