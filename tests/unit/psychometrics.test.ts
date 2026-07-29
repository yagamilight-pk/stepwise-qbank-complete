import { describe, expect, it } from "vitest";
import { demoQuestions } from "@/lib/data";
import {
  betaMastery,
  calculateItemStatistics,
  curatedDifficulty,
  difficultyFromProportion,
  estimateAbilityEap,
  estimateLearnerAbility,
  raschInformation,
  raschProbability,
  scoreAdaptiveCandidate,
  type ItemObservation,
} from "@/lib/psychometrics";
import type { Attempt } from "@/lib/types";

describe("Rasch ability and information", () => {
  it("has probability .5 and maximum information when ability matches difficulty", () => {
    expect(raschProbability(0, 0)).toBeCloseTo(0.5, 8);
    expect(raschInformation(0, 0)).toBeCloseTo(0.25, 8);
    expect(raschInformation(3, 0)).toBeLessThan(0.1);
    expect(curatedDifficulty("Easy")).toBeLessThan(curatedDifficulty("Hard"));
    expect(difficultyFromProportion(0.8)).toBeLessThan(0);
  });

  it("moves EAP ability in the evidence direction and reports uncertainty", () => {
    const strong = estimateAbilityEap(Array.from({ length: 12 }, () => ({ correct: true, difficulty: 0 })));
    const weak = estimateAbilityEap(Array.from({ length: 12 }, () => ({ correct: false, difficulty: 0 })));
    expect(strong.theta).toBeGreaterThan(1);
    expect(weak.theta).toBeLessThan(-1);
    expect(strong.standardError).toBeGreaterThan(0);
    expect(estimateAbilityEap([])).toEqual({ theta: 0, standardError: 1, responses: 0 });
  });

  it("uses the latest response for each item in learner estimation", () => {
    const question = demoQuestions[0];
    const attempts: Attempt[] = [
      { id: "a1", questionId: question.id, selectedChoiceId: "x", correct: false, confidence: 4, timeSec: 80, createdAt: "2026-01-01T00:00:00.000Z", sessionId: "s1", mode: "Tutor" },
      { id: "a2", questionId: question.id, selectedChoiceId: question.correctChoiceId, correct: true, confidence: 4, timeSec: 70, createdAt: "2026-01-02T00:00:00.000Z", sessionId: "s2", mode: "Tutor" },
    ];
    const estimate = estimateLearnerAbility([question], attempts);
    expect(estimate.responses).toBe(1);
    expect(estimate.theta).toBeGreaterThan(0);
  });
});

describe("mastery and item quality", () => {
  it("represents mastery as a Beta posterior with recency weighting", () => {
    const mastery = betaMastery([
      { correct: true, createdAt: "2026-01-09T00:00:00.000Z" },
      { correct: true, createdAt: "2026-01-08T00:00:00.000Z" },
      { correct: false, createdAt: "2025-01-01T00:00:00.000Z" },
    ], new Date("2026-01-10T00:00:00.000Z"));
    expect(mastery.mean).toBeGreaterThan(0.6);
    expect(mastery.standardDeviation).toBeGreaterThan(0);
    expect(betaMastery([], new Date()).mean).toBe(0.5);
  });

  it("blocks small samples from operational item statistics", () => {
    const stats = calculateItemStatistics("item-1", [{
      learnerId: "learner-1",
      itemId: "item-1",
      correct: true,
      selectedChoiceId: "B",
      timeSec: 70,
      confidence: 4,
      createdAt: "2026-01-01T00:00:00.000Z",
    }], ["A", "B", "C"], "B");
    expect(stats.eligibleForOperationalUse).toBe(false);
    expect(stats.flags).toContain("insufficient_sample");
    expect(stats.proportionCorrect).toBe(1);
  });

  it("calculates discrimination, timing, and distractor behavior from independent learners", () => {
    const observations: ItemObservation[] = [];
    for (let learner = 0; learner < 40; learner += 1) {
      const strong = learner < 20;
      for (let item = 0; item < 5; item += 1) {
        const correct = item === 0 ? strong : strong || learner % 5 > item;
        observations.push({
          learnerId: `learner-${learner}`,
          itemId: `item-${item}`,
          correct,
          selectedChoiceId: correct ? "B" : learner % 2 ? "A" : "C",
          timeSec: 60 + learner,
          confidence: correct ? 4 : 2,
          createdAt: "2026-01-01T00:00:00.000Z",
        });
      }
    }
    const stats = calculateItemStatistics("item-0", observations, ["A", "B", "C"], "B");
    expect(stats.eligibleForOperationalUse).toBe(true);
    expect(stats.sampleSize).toBe(40);
    expect(stats.pointBiserial).toBeGreaterThan(0);
    expect(stats.upperLowerDiscrimination).toBeGreaterThan(0);
    expect(stats.medianTimeSec).toBe(79.5);
    expect(stats.distractorEfficiency).toBe(1);
  });
});

describe("adaptive selection", () => {
  it("returns an explainable bounded score and targets unseen exposure", () => {
    const now = new Date("2026-01-10T00:00:00.000Z");
    const [unseen, seen] = demoQuestions.slice(0, 2);
    const attempts: Attempt[] = [{
      id: "a1",
      questionId: seen.id,
      selectedChoiceId: seen.correctChoiceId,
      correct: true,
      confidence: 5,
      timeSec: 70,
      createdAt: "2026-01-09T00:00:00.000Z",
      sessionId: "s1",
      mode: "Adaptive",
    }];
    const unseenScore = scoreAdaptiveCandidate(unseen, [unseen, seen], attempts, now);
    const seenScore = scoreAdaptiveCandidate(seen, [unseen, seen], attempts, now);
    expect(unseenScore.exposureControl).toBe(1);
    expect(seenScore.exposureControl).toBe(0.5);
    expect(unseenScore.recency).toBe(1);
    expect(unseenScore.score).toBeGreaterThan(0);
    expect(unseenScore.information).toBeLessThanOrEqual(1);
  });
});
