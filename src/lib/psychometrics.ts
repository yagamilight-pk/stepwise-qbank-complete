import type { Attempt, Difficulty, Question } from "./types";

const DAY_MS = 86_400_000;

export type CalibratedItemResponse = {
  correct: boolean;
  difficulty: number;
};

export type ItemObservation = {
  learnerId: string;
  itemId: string;
  correct: boolean;
  selectedChoiceId: string;
  timeSec: number;
  confidence?: number;
  createdAt: string;
};

export type ItemStatistics = {
  itemId: string;
  sampleSize: number;
  learnerCount: number;
  difficulty: number | null;
  proportionCorrect: number | null;
  pointBiserial: number | null;
  upperLowerDiscrimination: number | null;
  medianTimeSec: number | null;
  meanConfidence: number | null;
  distractors: Record<string, { count: number; proportion: number }>;
  distractorEfficiency: number | null;
  eligibleForOperationalUse: boolean;
  flags: string[];
};

export type AdaptiveScoreBreakdown = {
  score: number;
  information: number;
  masteryGap: number;
  recency: number;
  exposureControl: number;
  calibrationRepair: number;
  theta: number;
  standardError: number;
};

const clamp = (value: number, minimum: number, maximum: number) =>
  Math.min(maximum, Math.max(minimum, value));

export function raschProbability(theta: number, difficulty: number) {
  return 1 / (1 + Math.exp(-(theta - difficulty)));
}

export function raschInformation(theta: number, difficulty: number) {
  const probability = raschProbability(theta, difficulty);
  return probability * (1 - probability);
}

export function difficultyFromProportion(proportionCorrect: number) {
  const proportion = clamp(proportionCorrect, 0.05, 0.95);
  return Math.log((1 - proportion) / proportion);
}

export function curatedDifficulty(difficulty: Difficulty) {
  return difficulty === "Easy" ? -0.8 : difficulty === "Hard" ? 0.8 : 0;
}

/**
 * Estimates learner ability using an EAP Rasch model with a standard-normal
 * prior. The standard error is posterior uncertainty, not an exam-score CI.
 */
export function estimateAbilityEap(responses: CalibratedItemResponse[]) {
  if (!responses.length) {
    return { theta: 0, standardError: 1, responses: 0 };
  }

  const grid = Array.from({ length: 81 }, (_, index) => -4 + index * 0.1);
  const logWeights = grid.map(theta => {
    const logPrior = -0.5 * theta * theta;
    return responses.reduce((sum, response) => {
      const probability = clamp(raschProbability(theta, response.difficulty), 1e-8, 1 - 1e-8);
      return sum + Math.log(response.correct ? probability : 1 - probability);
    }, logPrior);
  });
  const maximum = Math.max(...logWeights);
  const weights = logWeights.map(value => Math.exp(value - maximum));
  const total = weights.reduce((sum, value) => sum + value, 0);
  const theta = grid.reduce((sum, value, index) => sum + value * weights[index], 0) / total;
  const variance = grid.reduce((sum, value, index) => sum + ((value - theta) ** 2) * weights[index], 0) / total;
  return {
    theta: Number(theta.toFixed(3)),
    standardError: Number(Math.sqrt(variance).toFixed(3)),
    responses: responses.length,
  };
}

function latestAttemptsByQuestion(attempts: Attempt[]) {
  const latest = new Map<string, Attempt>();
  for (const attempt of [...attempts].sort((left, right) => left.createdAt.localeCompare(right.createdAt))) {
    latest.set(attempt.questionId, attempt);
  }
  return latest;
}

export function estimateLearnerAbility(questions: Question[], attempts: Attempt[]) {
  const questionMap = new Map(questions.map(question => [question.id, question]));
  const latest = latestAttemptsByQuestion(attempts);
  const responses = [...latest.values()].flatMap(attempt => {
    const question = questionMap.get(attempt.questionId);
    return question ? [{ correct: attempt.correct, difficulty: curatedDifficulty(question.difficulty) }] : [];
  });
  return estimateAbilityEap(responses);
}

/**
 * Beta-binomial mastery with time decay keeps uncertainty explicit and lets
 * recent evidence matter without erasing older learning history.
 */
export function betaMastery(
  attempts: Pick<Attempt, "correct" | "createdAt">[],
  now = new Date(),
  halfLifeDays = 90,
) {
  let alpha = 1;
  let beta = 1;
  for (const attempt of attempts) {
    const ageDays = Math.max(0, (now.getTime() - new Date(attempt.createdAt).getTime()) / DAY_MS);
    const weight = 2 ** (-ageDays / Math.max(halfLifeDays, 1));
    if (attempt.correct) alpha += weight;
    else beta += weight;
  }
  const mean = alpha / (alpha + beta);
  const variance = (alpha * beta) / (((alpha + beta) ** 2) * (alpha + beta + 1));
  return {
    alpha: Number(alpha.toFixed(3)),
    beta: Number(beta.toFixed(3)),
    mean: Number(mean.toFixed(4)),
    standardDeviation: Number(Math.sqrt(variance).toFixed(4)),
    evidenceWeight: Number((alpha + beta - 2).toFixed(3)),
  };
}

function median(values: number[]) {
  if (!values.length) return null;
  const ordered = [...values].sort((left, right) => left - right);
  const midpoint = Math.floor(ordered.length / 2);
  return ordered.length % 2
    ? ordered[midpoint]
    : (ordered[midpoint - 1] + ordered[midpoint]) / 2;
}

function correlation(left: number[], right: number[]) {
  if (left.length < 3 || left.length !== right.length) return null;
  const leftMean = left.reduce((sum, value) => sum + value, 0) / left.length;
  const rightMean = right.reduce((sum, value) => sum + value, 0) / right.length;
  let covariance = 0;
  let leftVariance = 0;
  let rightVariance = 0;
  for (let index = 0; index < left.length; index += 1) {
    const leftDelta = left[index] - leftMean;
    const rightDelta = right[index] - rightMean;
    covariance += leftDelta * rightDelta;
    leftVariance += leftDelta ** 2;
    rightVariance += rightDelta ** 2;
  }
  const denominator = Math.sqrt(leftVariance * rightVariance);
  return denominator ? covariance / denominator : null;
}

function deduplicateObservations(observations: ItemObservation[]) {
  const latest = new Map<string, ItemObservation>();
  for (const observation of [...observations].sort((left, right) => left.createdAt.localeCompare(right.createdAt))) {
    latest.set(`${observation.learnerId}:${observation.itemId}`, observation);
  }
  return [...latest.values()];
}

/**
 * Calculates classical item statistics from one latest response per learner
 * and item. Operational use is blocked below 30 independent learners.
 */
export function calculateItemStatistics(
  itemId: string,
  observations: ItemObservation[],
  choiceIds: string[],
  correctChoiceId: string,
  minimumSample = 30,
): ItemStatistics {
  const deduplicated = deduplicateObservations(observations);
  const itemResponses = deduplicated.filter(observation => observation.itemId === itemId);
  const learnerTotals = new Map<string, number>();
  for (const observation of deduplicated) {
    if (observation.itemId === itemId) continue;
    learnerTotals.set(observation.learnerId, (learnerTotals.get(observation.learnerId) ?? 0) + Number(observation.correct));
  }

  const correctness = itemResponses.map(response => Number(response.correct));
  const restScores = itemResponses.map(response => learnerTotals.get(response.learnerId) ?? 0);
  const pointBiserial = correlation(correctness, restScores);
  const proportionCorrect = itemResponses.length
    ? correctness.reduce((sum, value) => sum + value, 0) / itemResponses.length
    : null;

  const ranked = [...itemResponses].sort(
    (left, right) => (learnerTotals.get(right.learnerId) ?? 0) - (learnerTotals.get(left.learnerId) ?? 0),
  );
  const groupSize = Math.floor(ranked.length * 0.27);
  const upper = groupSize ? ranked.slice(0, groupSize) : [];
  const lower = groupSize ? ranked.slice(-groupSize) : [];
  const upperLowerDiscrimination = groupSize
    ? upper.filter(response => response.correct).length / groupSize
      - lower.filter(response => response.correct).length / groupSize
    : null;

  const distractors = Object.fromEntries(choiceIds
    .filter(choiceId => choiceId !== correctChoiceId)
    .map(choiceId => {
      const count = itemResponses.filter(response => response.selectedChoiceId === choiceId).length;
      return [choiceId, {
        count,
        proportion: itemResponses.length ? Number((count / itemResponses.length).toFixed(4)) : 0,
      }];
    }));
  const distractorValues = Object.values(distractors);
  const distractorEfficiency = itemResponses.length && distractorValues.length
    ? distractorValues.filter(distractor => distractor.proportion >= 0.05).length / distractorValues.length
    : null;
  const flags: string[] = [];
  if (itemResponses.length < minimumSample) flags.push("insufficient_sample");
  if (pointBiserial !== null && pointBiserial < 0.1) flags.push("low_discrimination");
  if (proportionCorrect !== null && (proportionCorrect < 0.2 || proportionCorrect > 0.95)) flags.push("extreme_difficulty");
  if (distractorEfficiency !== null && distractorEfficiency < 0.5) flags.push("weak_distractors");

  return {
    itemId,
    sampleSize: itemResponses.length,
    learnerCount: new Set(itemResponses.map(response => response.learnerId)).size,
    difficulty: proportionCorrect === null ? null : Number(difficultyFromProportion(proportionCorrect).toFixed(3)),
    proportionCorrect: proportionCorrect === null ? null : Number(proportionCorrect.toFixed(4)),
    pointBiserial: pointBiserial === null ? null : Number(pointBiserial.toFixed(4)),
    upperLowerDiscrimination: upperLowerDiscrimination === null
      ? null
      : Number(upperLowerDiscrimination.toFixed(4)),
    medianTimeSec: median(itemResponses.map(response => response.timeSec)),
    meanConfidence: itemResponses.some(response => response.confidence !== undefined)
      ? Number((itemResponses.reduce((sum, response) => sum + (response.confidence ?? 0), 0)
        / itemResponses.filter(response => response.confidence !== undefined).length).toFixed(3))
      : null,
    distractors,
    distractorEfficiency: distractorEfficiency === null ? null : Number(distractorEfficiency.toFixed(4)),
    eligibleForOperationalUse: itemResponses.length >= minimumSample
      && new Set(itemResponses.map(response => response.learnerId)).size >= minimumSample
      && pointBiserial !== null,
    flags,
  };
}

export function scoreAdaptiveCandidate(
  question: Question,
  allQuestions: Question[],
  attempts: Attempt[],
  now = new Date(),
): AdaptiveScoreBreakdown {
  const ability = estimateLearnerAbility(allQuestions, attempts);
  const questionAttempts = attempts.filter(attempt => attempt.questionId === question.id);
  const systemIds = new Set(allQuestions
    .filter(candidate => candidate.system === question.system)
    .map(candidate => candidate.id));
  const systemMastery = betaMastery(attempts.filter(attempt => systemIds.has(attempt.questionId)), now);
  const difficulty = curatedDifficulty(question.difficulty);
  const information = raschInformation(ability.theta, difficulty) / 0.25;
  const latest = [...questionAttempts].sort((left, right) => left.createdAt.localeCompare(right.createdAt)).at(-1);
  const ageDays = latest
    ? Math.max(0, (now.getTime() - new Date(latest.createdAt).getTime()) / DAY_MS)
    : Number.POSITIVE_INFINITY;
  const recency = latest ? clamp(ageDays / 45, 0, 1) : 1;
  const exposureControl = 1 / (1 + questionAttempts.length);
  const calibrationRepair = latest
    ? latest.correct
      ? clamp((3 - latest.confidence) / 2, 0, 1)
      : clamp(latest.confidence / 5, 0, 1)
    : 0.5;
  const masteryGap = 1 - systemMastery.mean;
  const score = information * 0.32
    + masteryGap * 0.28
    + recency * 0.16
    + exposureControl * 0.12
    + calibrationRepair * 0.12;

  return {
    score: Number(score.toFixed(6)),
    information: Number(information.toFixed(4)),
    masteryGap: Number(masteryGap.toFixed(4)),
    recency: Number(recency.toFixed(4)),
    exposureControl: Number(exposureControl.toFixed(4)),
    calibrationRepair: Number(calibrationRepair.toFixed(4)),
    theta: ability.theta,
    standardError: ability.standardError,
  };
}
