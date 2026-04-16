import Link from "next/link";

const quickLinks = [
  {
    title: "Take Self-Assessment",
    description: "14 scenario-based questions to measure your AI skills",
    href: "/assessment",
    color: "bg-asu-maroon",
    textColor: "text-white",
  },
  {
    title: "Learning Paths",
    description: "9 Bloom's Taxonomy phases with curated resources",
    href: "/learning-paths",
    color: "bg-asu-blue",
    textColor: "text-white",
  },
  {
    title: "Activities",
    description: "42 hands-on activities to build your skills",
    href: "/activities",
    color: "bg-asu-green",
    textColor: "text-white",
  },
  {
    title: "Community",
    description: "Share your work and see what others are building",
    href: "/community",
    color: "bg-asu-turquoise",
    textColor: "text-white",
  },
];

export default function DashboardHome() {
  return (
    <div className="max-w-5xl mx-auto space-y-8">
      {/* Welcome Section */}
      <section>
        <h2 className="text-2xl font-bold text-gray-700">
          Welcome to the AI Skills Training Dashboard
        </h2>
        <p className="mt-2 text-gray-500">
          Assess, track, and develop your AI skills with personalized learning
          paths built on Andrew Maynard&apos;s 14 AI Skill Statements and
          Bloom&apos;s Taxonomy.
        </p>
      </section>

      {/* Quick Links Grid */}
      <section aria-labelledby="quick-links-heading">
        <h3 id="quick-links-heading" className="sr-only">
          Quick links
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`${link.color} ${link.textColor} rounded-lg p-6 hover:opacity-90 transition-opacity`}
            >
              <h4 className="text-lg font-semibold">{link.title}</h4>
              <p className="mt-1 text-sm opacity-80">{link.description}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* Getting Started Card */}
      <section className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-700 mb-3">
          Getting Started
        </h3>
        <ol className="space-y-3 text-sm text-gray-600">
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-asu-maroon text-white rounded-full flex items-center justify-center text-xs font-bold">
              1
            </span>
            <span>
              <strong>Take the self-assessment</strong> — 14 scenario-based
              questions that reveal your current AI skill levels.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-asu-maroon text-white rounded-full flex items-center justify-center text-xs font-bold">
              2
            </span>
            <span>
              <strong>Review your results</strong> — See your strengths and
              personalized activity recommendations.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-asu-maroon text-white rounded-full flex items-center justify-center text-xs font-bold">
              3
            </span>
            <span>
              <strong>Follow learning paths</strong> — Work through Bloom&apos;s
              Taxonomy phases at your own pace.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-asu-maroon text-white rounded-full flex items-center justify-center text-xs font-bold">
              4
            </span>
            <span>
              <strong>Complete activities</strong> — Hands-on projects that
              produce real deliverables.
            </span>
          </li>
          <li className="flex items-start gap-3">
            <span className="flex-shrink-0 w-6 h-6 bg-asu-maroon text-white rounded-full flex items-center justify-center text-xs font-bold">
              5
            </span>
            <span>
              <strong>Retake and track progress</strong> — Measure growth over
              time.
            </span>
          </li>
        </ol>
      </section>
    </div>
  );
}
