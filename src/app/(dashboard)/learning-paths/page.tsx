import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

// One color per Bloom phase — rotates through ASU palette
const PHASE_COLORS = [
  { bg: "bg-asu-gray/10", accent: "bg-asu-gray", text: "text-gray-700" },
  { bg: "bg-asu-blue/10", accent: "bg-asu-blue", text: "text-asu-blue" },
  { bg: "bg-asu-turquoise/10", accent: "bg-asu-turquoise", text: "text-asu-turquoise" },
  { bg: "bg-asu-green/10", accent: "bg-asu-green", text: "text-green-700" },
  { bg: "bg-asu-orange/10", accent: "bg-asu-orange", text: "text-asu-orange" },
  { bg: "bg-asu-gold/15", accent: "bg-asu-gold", text: "text-yellow-800" },
  { bg: "bg-asu-copper/10", accent: "bg-asu-copper", text: "text-asu-copper" },
  { bg: "bg-asu-pink/10", accent: "bg-asu-pink", text: "text-asu-pink" },
  { bg: "bg-asu-maroon/10", accent: "bg-asu-maroon", text: "text-asu-maroon" },
];

export default async function LearningPathsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: phases } = await supabase
    .from("bloom_phases")
    .select("*")
    .order("sort_order");

  // Count items per phase
  const { data: lessonItems } = await supabase
    .from("lesson_flow")
    .select("bloom_phase_id");

  const countByPhase = new Map<number, number>();
  (lessonItems ?? []).forEach((item) => {
    countByPhase.set(
      item.bloom_phase_id,
      (countByPhase.get(item.bloom_phase_id) ?? 0) + 1
    );
  });

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-700">Learning Paths</h2>
        <p className="text-gray-500">
          9 phases organized by Bloom&apos;s Taxonomy, from foundational
          understanding to advanced creation. Work through them in order or
          jump to the phase that matches your current level.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {(phases ?? []).map((phase) => {
          const color = PHASE_COLORS[phase.id] ?? PHASE_COLORS[0];
          const itemCount = countByPhase.get(phase.id) ?? 0;
          return (
            <Link
              key={phase.id}
              href={`/learning-paths/${phase.id}`}
              className={`group relative block rounded-lg border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:-translate-y-0.5 transition-all focus:outline-none focus:ring-2 focus:ring-asu-maroon focus:ring-offset-2`}
            >
              {/* Accent stripe */}
              <div className={`h-1.5 w-full ${color.accent}`} />

              <div className="p-5">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className={`inline-flex items-center justify-center w-9 h-9 rounded-lg ${color.bg} ${color.text} font-bold text-sm`}>
                    {phase.id}
                  </div>
                  <span className="text-xs text-gray-400 font-medium">
                    {itemCount} {itemCount === 1 ? "item" : "items"}
                  </span>
                </div>
                <h3 className="text-base font-semibold text-gray-700 group-hover:text-asu-maroon transition-colors">
                  {phase.name}
                </h3>
                <p className="text-xs text-gray-400 mt-0.5 uppercase tracking-wide font-medium">
                  {phase.bloom_levels}
                </p>
                {phase.description && (
                  <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                    {phase.description}
                  </p>
                )}
                <span className="inline-flex items-center gap-1 text-sm font-medium text-asu-maroon mt-3 group-hover:gap-2 transition-all">
                  Explore phase
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                  </svg>
                </span>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
