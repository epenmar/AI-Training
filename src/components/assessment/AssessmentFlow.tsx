"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type {
  AssessmentQuestion,
  AssessmentOption,
  Skill,
} from "@/types/database";
import { useRouter } from "next/navigation";

type QuestionWithOptions = AssessmentQuestion & {
  options: AssessmentOption[];
  skill: Skill;
};

interface Props {
  questions: QuestionWithOptions[];
}

const BAND_THRESHOLDS = [
  { max: 14, label: "New to this" },
  { max: 28, label: "Foundational" },
  { max: 35, label: "Intermediate" },
  { max: 42, label: "Advanced" },
] as const;

function getBand(score: number): string {
  for (const t of BAND_THRESHOLDS) {
    if (score <= t.max) return t.label;
  }
  return "Advanced";
}

export function AssessmentFlow({ questions }: Props) {
  const router = useRouter();
  const [started, setStarted] = useState(false);
  const [current, setCurrent] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const q = questions[current];
  const total = questions.length;
  const answered = Object.keys(answers).length;
  const allAnswered = answered === total;

  if (!started) {
    return (
      <div className="max-w-3xl mx-auto">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
          <h1 className="text-2xl font-bold text-gray-700 mb-2">
            There&apos;s no right answer.
          </h1>
          <p className="text-gray-500 mb-6">
            Your honest starting point is what makes the path useful.
          </p>

          {/* Visual: honest answer today → personalized path → growth */}
          <figure className="mb-6">
            <svg
              viewBox="0 0 480 140"
              className="w-full h-auto"
              role="img"
              aria-labelledby="journey-title journey-desc"
            >
              <title id="journey-title">
                Where you are today connects through personalized steps to
                where you&apos;re growing
              </title>
              <desc id="journey-desc">
                Your honest answer about your current skill level feeds into
                a tailored learning path.
              </desc>
              {/* Dashed path */}
              <path
                d="M 90 80 Q 240 20 390 80"
                fill="none"
                stroke="#8C1D40"
                strokeWidth="2"
                strokeDasharray="5 5"
              />
              {/* Milestone dots along the path */}
              <circle cx="180" cy="55" r="4" fill="#FFC627" />
              <circle cx="240" cy="45" r="4" fill="#FFC627" />
              <circle cx="300" cy="55" r="4" fill="#FFC627" />
              {/* Left marker: YOU today */}
              <circle cx="90" cy="80" r="28" fill="#00A3E0" />
              <circle cx="90" cy="70" r="7" fill="#ffffff" />
              <path
                d="M 76 96 Q 90 82 104 96 Z"
                fill="#ffffff"
              />
              <text
                x="90"
                y="130"
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#191919"
              >
                You today
              </text>
              {/* Right marker: YOU growing */}
              <circle cx="390" cy="80" r="28" fill="#FFC627" />
              <path
                d="M 390 60 L 394 74 L 408 74 L 397 82 L 401 96 L 390 88 L 379 96 L 383 82 L 372 74 L 386 74 Z"
                fill="#ffffff"
              />
              <text
                x="390"
                y="130"
                textAnchor="middle"
                fontSize="12"
                fontWeight="600"
                fill="#191919"
              >
                You growing
              </text>
              {/* Path label */}
              <text
                x="240"
                y="15"
                textAnchor="middle"
                fontSize="11"
                fontStyle="italic"
                fill="#747474"
              >
                Your personalized next steps
              </text>
            </svg>
          </figure>

          <p className="text-gray-600 leading-relaxed mb-5">
            Pick the option that sounds most like what you&apos;d actually do{" "}
            <strong>today</strong> — not what you want to do, or think you
            should do. Inflating your answers sends you to activities that
            feel too abstract; underselling sends you to things
            you&apos;ve already mastered.
          </p>

          <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <svg
                className="w-5 h-5 text-asu-green flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>
                <strong className="text-gray-700">No wrong answers</strong>
                <span className="block text-xs text-gray-500">
                  It&apos;s not a test
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <svg
                className="w-5 h-5 text-asu-blue flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
              <span>
                <strong className="text-gray-700">Private</strong>
                <span className="block text-xs text-gray-500">
                  Nothing is shared
                </span>
              </span>
            </li>
            <li className="flex items-start gap-2 text-sm text-gray-600">
              <svg
                className="w-5 h-5 text-asu-maroon flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              <span>
                <strong className="text-gray-700">Retake anytime</strong>
                <span className="block text-xs text-gray-500">
                  Track growth over time
                </span>
              </span>
            </li>
          </ul>

          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="text-sm text-gray-500">
              14 scenarios · about 10 minutes
            </p>
            <button
              onClick={() => setStarted(true)}
              className="px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover cursor-pointer transition-colors"
            >
              Start assessment
            </button>
          </div>
        </div>
      </div>
    );
  }

  function selectOption(questionId: number, optionKey: string) {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  }

  function goNext() {
    if (current < total - 1) setCurrent(current + 1);
  }

  function goPrev() {
    if (current > 0) setCurrent(current - 1);
  }

  async function handleSubmit() {
    if (!allAnswered) return;
    setSubmitting(true);
    setError("");

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("You must be signed in.");
      setSubmitting(false);
      return;
    }

    // Calculate scores
    const responses = questions.map((q) => {
      const selectedKey = answers[q.id];
      const option = q.options.find((o) => o.option_key === selectedKey)!;
      return {
        question_id: q.id,
        selected_option_key: selectedKey,
        score: option.score,
        level_label: option.level_label,
      };
    });

    const totalScore = responses.reduce((sum, r) => sum + r.score, 0);
    const overallBand = getBand(totalScore);

    // Ensure profile exists (handles accounts created before profile trigger).
    // Leave display_name null so the account-setup flow prompts on first visit.
    await supabase
      .from("profiles")
      .upsert(
        { id: user.id, email: user.email ?? "" },
        { onConflict: "id", ignoreDuplicates: true }
      );

    // Insert attempt
    const { data: attempt, error: attemptErr } = await supabase
      .from("assessment_attempts")
      .insert({ user_id: user.id, total_score: totalScore, overall_band: overallBand })
      .select("id")
      .single();

    if (attemptErr || !attempt) {
      setError(attemptErr?.message ?? "Failed to save assessment. Please try again.");
      setSubmitting(false);
      return;
    }

    // Insert responses
    const { error: respErr } = await supabase
      .from("assessment_responses")
      .insert(
        responses.map((r) => ({
          attempt_id: attempt.id,
          ...r,
        }))
      );

    if (respErr) {
      setError("Failed to save responses. Please try again.");
      setSubmitting(false);
      return;
    }

    router.push(`/assessment/results/${attempt.id}`);
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress bar */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-500 mb-2">
          <span>
            Question {current + 1} of {total}
          </span>
          <span>{answered} of {total} answered</span>
        </div>
        <div
          className="w-full bg-gray-200 rounded-full h-2"
          role="progressbar"
          aria-valuenow={answered}
          aria-valuemin={0}
          aria-valuemax={total}
          aria-label={`${answered} of ${total} questions answered`}
        >
          <div
            className="bg-asu-maroon h-2 rounded-full transition-all duration-300"
            style={{ width: `${(answered / total) * 100}%` }}
          />
        </div>
      </div>

      {/* Question card */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="mb-2">
          <span className="inline-block bg-asu-maroon/10 text-asu-maroon text-xs font-semibold px-3 py-1 rounded-full">
            Skill {q.skill_id}: {q.skill.short_name}
          </span>
        </div>
        <h2 className="text-lg font-semibold text-gray-700 mb-6">
          {q.scenario}
        </h2>

        {/* Options */}
        <fieldset>
          <legend className="sr-only">
            Select your response for skill {q.skill_id}
          </legend>
          <div className="space-y-3">
            {q.options.map((opt) => {
              const isSelected = answers[q.id] === opt.option_key;
              return (
                <label
                  key={opt.option_key}
                  className={`flex items-start gap-3 p-4 rounded-lg border-2 cursor-pointer transition-colors ${
                    isSelected
                      ? "border-asu-maroon bg-asu-maroon/5"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <input
                    type="radio"
                    name={`question-${q.id}`}
                    value={opt.option_key}
                    checked={isSelected}
                    onChange={() => selectOption(q.id, opt.option_key)}
                    autoComplete="off"
                    className="mt-1 accent-asu-maroon"
                  />
                  <span className="text-gray-700">{opt.option_text}</span>
                </label>
              );
            })}
          </div>
        </fieldset>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between mt-6">
        <button
          onClick={goPrev}
          disabled={current === 0}
          className="px-5 py-2.5 text-sm font-medium rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
        >
          Previous
        </button>

        {/* Question dots */}
        <div className="hidden sm:flex gap-1.5 flex-wrap justify-center max-w-md">
          {questions.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              aria-label={`Go to question ${i + 1}${answers[questions[i].id] ? " (answered)" : ""}`}
              className={`w-3 h-3 rounded-full cursor-pointer transition-colors ${
                i === current
                  ? "bg-asu-maroon"
                  : answers[questions[i].id]
                    ? "bg-asu-gold"
                    : "bg-gray-300"
              }`}
            />
          ))}
        </div>

        {current < total - 1 ? (
          <button
            onClick={goNext}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover cursor-pointer transition-colors"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={!allAnswered || submitting}
            className="px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-gold text-gray-900 hover:bg-asu-gold/90 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition-colors"
          >
            {submitting ? "Submitting..." : "Submit Assessment"}
          </button>
        )}
      </div>

      {error && (
        <p className="text-red-600 text-sm mt-4 text-center" role="alert">
          {error}
        </p>
      )}

      {/* Keyboard nav hint */}
      <p className="text-center text-xs text-gray-400 mt-4">
        Navigate with the dots above or use Previous / Next buttons
      </p>
    </div>
  );
}
