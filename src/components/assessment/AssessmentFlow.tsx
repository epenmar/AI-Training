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
          <h1 className="text-2xl font-bold text-gray-700 mb-4">
            Before you begin
          </h1>
          <div className="space-y-4 text-gray-600 leading-relaxed">
            <p>
              This assessment works best when you answer honestly about where
              you are <strong>right now</strong> — not where you want to be, or
              where you think you should be.
            </p>
            <p>
              Your responses shape the learning path we recommend. An inflated
              score points you toward activities that will feel too abstract;
              an underestimate points you toward things you&apos;ve already
              mastered. Neither helps you grow.
            </p>
            <p>
              There are no wrong answers, and nothing you select is shared with
              anyone. You can retake this at any time as your skills develop.
            </p>
            <p className="text-sm text-gray-500">
              14 scenario questions · about 10 minutes
            </p>
          </div>
          <button
            onClick={() => setStarted(true)}
            className="mt-6 px-5 py-2.5 text-sm font-medium rounded-lg bg-asu-maroon text-white hover:bg-sidebar-hover cursor-pointer transition-colors"
          >
            Start assessment
          </button>
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
                    className="mt-1 accent-asu-maroon"
                  />
                  <div>
                    <span className="text-gray-700">{opt.option_text}</span>
                    <span className="block text-xs text-gray-400 mt-1">
                      {opt.level_label}
                    </span>
                  </div>
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
