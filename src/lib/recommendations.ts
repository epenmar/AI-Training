/**
 * Maps a per-skill assessment response score to the activity band that
 * would bridge the user from their current level to the next one.
 *
 * Score 0 → "New → Foundational"
 * Score 1 → "Foundational → Intermediate"
 * Score 2 → "Intermediate → Advanced"
 * Score 3 → null (already Advanced; no bridging activity)
 */
export function scoreToRecommendedBand(score: number): string | null {
  switch (score) {
    case 0:
      return "New → Foundational";
    case 1:
      return "Foundational → Intermediate";
    case 2:
      return "Intermediate → Advanced";
    default:
      return null;
  }
}

/**
 * Maps a score to the lesson_flow `learning_level` the user should consume
 * next to move up one band. Used for the personalized learning-paths view.
 */
export function scoreToTargetLevel(score: number): string | null {
  switch (score) {
    case 0:
      return "Foundational";
    case 1:
      return "Intermediate";
    case 2:
      return "Advanced";
    default:
      return null;
  }
}

export type RecommendationTarget = {
  skillId: number;
  score: number;
  band: string;
  targetLevel: string;
};

/**
 * Given the latest assessment responses (with score + question->skill map),
 * return one recommended (skillId, band, targetLevel) target per skill,
 * lowest score first.
 */
export function buildRecommendations(
  responses: { question_id: number; score: number }[],
  questionSkillMap: Map<number, number>
): RecommendationTarget[] {
  const targets: RecommendationTarget[] = [];
  const seenSkills = new Set<number>();

  const sorted = [...responses].sort((a, b) => a.score - b.score);

  for (const r of sorted) {
    const skillId = questionSkillMap.get(r.question_id);
    if (!skillId || seenSkills.has(skillId)) continue;
    const band = scoreToRecommendedBand(r.score);
    const targetLevel = scoreToTargetLevel(r.score);
    if (!band || !targetLevel) continue;
    targets.push({ skillId, score: r.score, band, targetLevel });
    seenSkills.add(skillId);
  }
  return targets;
}
