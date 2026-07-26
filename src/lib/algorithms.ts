import type { AppState, Attempt, Flashcard, LibraryActivity, MedicalArticle, Question, ReviewRating, SessionConfig, StudyPlanSettings, StudyTask } from "./types";
import { getUsmleExamProfile } from "./usmle";

export const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

export function questionStats(questionId: string, attempts: Attempt[]) {
  const relevant = attempts.filter((attempt) => attempt.questionId === questionId);
  const correct = relevant.filter((attempt) => attempt.correct).length;
  return {
    attempts: relevant.length,
    correct,
    accuracy: relevant.length ? Math.round((correct / relevant.length) * 100) : null,
    averageTime: relevant.length ? Math.round(relevant.reduce((sum, attempt) => sum + attempt.timeSec, 0) / relevant.length) : null,
    lastAttemptAt: relevant.at(-1)?.createdAt
  };
}

export function systemPerformance(questions: Question[], attempts: Attempt[]) {
  const systems = [...new Set(questions.map((question) => question.system))];
  return systems.map((system) => {
    const ids = new Set(questions.filter((question) => question.system === system).map((question) => question.id));
    const relevant = attempts.filter((attempt) => ids.has(attempt.questionId));
    const correct = relevant.filter((attempt) => attempt.correct).length;
    const accuracy = relevant.length ? Math.round((correct / relevant.length) * 100) : 0;
    const coverage = questions.filter((question) => question.system === system).length;
    const answered = new Set(relevant.map((attempt) => attempt.questionId)).size;
    const mastery = relevant.length
      ? clamp(Math.round(accuracy * 0.74 + Math.min(100, (answered / Math.max(coverage, 1)) * 100) * 0.26), 0, 100)
      : 0;
    return { system, attempts: relevant.length, correct, accuracy, coverage, answered, mastery };
  }).sort((a, b) => a.mastery - b.mastery || b.attempts - a.attempts);
}

function daysSince(date?: string) {
  if (!date) return 30;
  return Math.max(0, (Date.now() - new Date(date).getTime()) / 86_400_000);
}

function difficultyValue(difficulty: Question["difficulty"]) {
  return difficulty === "Easy" ? 0.25 : difficulty === "Medium" ? 0.58 : 0.9;
}

/**
 * Adaptive selection prioritizes weak, unseen, stale, and confidence-mismatched items.
 * A small deterministic jitter avoids identical blocks without making testing flaky.
 */
export function adaptiveScore(question: Question, attempts: Attempt[]) {
  const stats = questionStats(question.id, attempts);
  const weakness = stats.accuracy === null ? 0.62 : 1 - stats.accuracy / 100;
  const unseen = stats.attempts === 0 ? 1 : 0;
  const staleness = clamp(daysSince(stats.lastAttemptAt) / 21, 0, 1);
  const latest = attempts.filter((attempt) => attempt.questionId === question.id).at(-1);
  const confidenceMismatch = latest ? (latest.correct ? Math.max(0, 3 - latest.confidence) : latest.confidence / 5) : 0.4;
  const challengeFit = latest
    ? 1 - Math.abs((latest.correct ? 0.68 : 0.42) - difficultyValue(question.difficulty))
    : 0.65;
  const jitter = (question.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % 17) / 100;
  return unseen * 0.28 + weakness * 0.3 + staleness * 0.17 + confidenceMismatch * 0.13 + challengeFit * 0.12 + jitter;
}

export function selectQuestions(state: AppState, config: SessionConfig): Question[] {
  const attemptedIds = new Set(state.attempts.map((attempt) => attempt.questionId));
  const incorrectIds = new Set(state.attempts.filter((attempt) => !attempt.correct).map((attempt) => attempt.questionId));
  let pool = state.questions.filter((question) => question.status === "Published" && question.step === config.step);
  if (config.questionIds?.length) {
    const requested = new Set(config.questionIds);
    pool = pool.filter((question) => requested.has(question.id));
  }

  if (config.systems.length) pool = pool.filter((question) => config.systems.includes(question.system));
  if (config.disciplines.length) pool = pool.filter((question) => config.disciplines.includes(question.discipline));
  if (config.difficulties.length) pool = pool.filter((question) => config.difficulties.includes(question.difficulty));
  if (config.include === "Unused") pool = pool.filter((question) => !attemptedIds.has(question.id));
  if (config.include === "Incorrect") pool = pool.filter((question) => incorrectIds.has(question.id));
  if (config.include === "Flagged") pool = pool.filter((question) => state.flagged.includes(question.id));
  if (config.include === "Bookmarked") pool = pool.filter((question) => state.bookmarks.includes(question.id));

  const ranked = [...pool].sort((a, b) => {
    if (config.mode === "Adaptive") return adaptiveScore(b, state.attempts) - adaptiveScore(a, state.attempts);
    const aHash = a.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    const bHash = b.id.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
    return (aHash % 11) - (bHash % 11);
  });

  return ranked.slice(0, Math.min(config.count, ranked.length));
}

export function reviewFlashcard(card: Flashcard, rating: ReviewRating, now = new Date()): Flashcard {
  let { interval, ease, repetitions, lapses } = card;
  if (rating === "again") {
    interval = 0;
    repetitions = 0;
    lapses += 1;
    ease = Math.max(1.3, ease - 0.2);
  } else if (rating === "hard") {
    interval = Math.max(1, Math.round(Math.max(interval, 1) * 1.2));
    repetitions += 1;
    ease = Math.max(1.3, ease - 0.15);
  } else if (rating === "good") {
    interval = repetitions === 0 ? 1 : repetitions === 1 ? 3 : Math.max(3, Math.round(interval * ease));
    repetitions += 1;
  } else {
    interval = repetitions === 0 ? 3 : Math.max(5, Math.round(interval * ease * 1.3));
    repetitions += 1;
    ease = Math.min(3.1, ease + 0.15);
  }

  const due = new Date(now);
  if (rating === "again") due.setMinutes(due.getMinutes() + 10);
  else due.setDate(due.getDate() + interval);

  return {
    ...card,
    interval,
    ease: Number(ease.toFixed(2)),
    repetitions,
    lapses,
    lastReviewedAt: now.toISOString(),
    dueAt: due.toISOString()
  };
}


/**
 * Orders review cards by urgency. Overdue cards come first, then cards with
 * more lapses, then shorter intervals. Stable id ordering keeps the queue
 * deterministic for tests and repeatable demos.
 */
export function buildFlashcardReviewQueue(cards: Flashcard[], now = new Date()) {
  const time = now.getTime();
  return [...cards].sort((a, b) => {
    const aDue = new Date(a.dueAt).getTime();
    const bDue = new Date(b.dueAt).getTime();
    const aOverdue = Math.max(0, time - aDue);
    const bOverdue = Math.max(0, time - bDue);
    if (aOverdue !== bOverdue) return bOverdue - aOverdue;
    if (a.lapses !== b.lapses) return b.lapses - a.lapses;
    if (a.interval !== b.interval) return a.interval - b.interval;
    return a.id.localeCompare(b.id);
  });
}

/**
 * Estimates recall from the spacing interval and time since the last review.
 * This is an explainable frontend forecast, not a medical or psychometric claim.
 */
export function flashcardRetentionForecast(cards: Flashcard[], now = new Date()) {
  if (!cards.length) return { retention: 0, due: 0, learning: 0, mature: 0, streak: 0 };
  const nowTime = now.getTime();
  const predicted = cards.map((card) => {
    const anchor = new Date(card.lastReviewedAt ?? card.createdAt).getTime();
    const elapsedDays = Math.max(0, (nowTime - anchor) / 86_400_000);
    const stability = Math.max(1, card.interval || 1) * Math.max(1.05, card.ease / 2);
    return clamp(Math.exp(-elapsedDays / stability) * 100, 18, 99);
  });
  const reviewDates = new Set(cards.map((card) => card.lastReviewedAt ? localDateKey(new Date(card.lastReviewedAt)) : null).filter(Boolean) as string[]);
  let streak = 0;
  const cursor = new Date(now);
  if (!reviewDates.has(localDateKey(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (reviewDates.has(localDateKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return {
    retention: Math.round(predicted.reduce((sum, value) => sum + value, 0) / predicted.length),
    due: cards.filter((card) => new Date(card.dueAt).getTime() <= nowTime).length,
    learning: cards.filter((card) => card.repetitions < 2).length,
    mature: cards.filter((card) => card.interval >= 21).length,
    streak
  };
}

export const localDateKey = (date: Date) => [
  date.getFullYear(),
  String(date.getMonth() + 1).padStart(2, "0"),
  String(date.getDate()).padStart(2, "0")
].join("-");

export function generateStudyPlan(settings: StudyPlanSettings, questions: Question[], attempts: Attempt[]): StudyTask[] {
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const exam = new Date(`${settings.examDate}T12:00:00`);
  const finalDate = exam > today ? exam : new Date(today.getTime() + 42 * 86_400_000);
  const performance = systemPerformance(questions.filter((question) => question.step === settings.targetStep), attempts);
  const examProfile = getUsmleExamProfile(settings.targetStep, settings.examDate);
  const weakSystems = performance.slice(0, 4).map((entry) => entry.system);
  const tasks: StudyTask[] = [];
  let taskIndex = 0;

  const maxCalendarDays = 366;
  let calendarDays = 0;
  const assessmentCadence = settings.preparationStage === "Final review"
    ? 4
    : settings.preparationStage === "Dedicated period"
      ? 6
      : 8;

  for (let cursor = new Date(today); cursor <= finalDate && calendarDays < maxCalendarDays; cursor.setDate(cursor.getDate() + 1)) {
    calendarDays += 1;
    if (!settings.weeklyDays.includes(cursor.getDay())) continue;
    const minutes = cursor.getDay() === 0 || cursor.getDay() === 6 ? settings.weekendMinutes : settings.weekdayMinutes;
    const system = weakSystems[taskIndex % Math.max(weakSystems.length, 1)] || "Mixed systems";
    const daysLeft = Math.max(0, Math.ceil((finalDate.getTime() - cursor.getTime()) / 86_400_000));
    const latePhase = daysLeft < 21;
    const assessmentDay = taskIndex > 0 && taskIndex % assessmentCadence === 0;
    const date = localDateKey(cursor);

    if (assessmentDay) {
      tasks.push({
        id: `generated-${taskIndex}-assessment`, date, type: "Assessment", title: latePhase ? "Multi-block exam rehearsal" : "Readiness assessment",
        detail: latePhase ? `${examProfile.blockMinutes}-minute mixed blocks with planned breaks` : "Mixed benchmark block + review", minutes,
        completed: false, priority: "Core"
      });
    } else {
      const questionMinutes = Math.max(25, Math.round(minutes * 0.62));
      const count = Math.max(10, Math.round(questionMinutes / 1.55));
      const blockCount = Math.max(1, Math.ceil(count / examProfile.maxItemsPerBlock));
      tasks.push({
        id: `generated-${taskIndex}-q`, date, type: "Questions", title: latePhase ? `${blockCount}-block exam rehearsal` : `Adaptive ${system} block`,
        detail: latePhase ? `${blockCount} × ${examProfile.blockMinutes}-min blocks · up to ${examProfile.maxItemsPerBlock} items each` : `${count} questions · Weakness weighted`, minutes: questionMinutes,
        completed: false, priority: latePhase ? "Core" : "Weakness"
      });
      tasks.push({
        id: `generated-${taskIndex}-review`, date, type: taskIndex % 3 === 0 ? "Flashcards" : "Review",
        title: taskIndex % 3 === 0 ? "Spaced repetition review" : "Explanation consolidation",
        detail: taskIndex % 3 === 0 ? "Due cards + recent misses" : `${system} notes and incorrects`,
        minutes: Math.max(10, minutes - questionMinutes), completed: false, priority: "Maintenance"
      });
    }
    taskIndex += 1;
  }
  return tasks;
}

export function readinessEstimate(state: AppState, step: Question["step"]) {
  const questions = state.questions.filter((question) => question.step === step);
  const ids = new Set(questions.map((question) => question.id));
  const attempts = state.attempts.filter((attempt) => ids.has(attempt.questionId));
  if (!attempts.length) {
    return { score: 0, accuracy: 0, coverage: 0, calibrated: 0 };
  }
  const accuracy = attempts.filter((attempt) => attempt.correct).length / attempts.length;
  const uniqueCoverage = new Set(attempts.map((attempt) => attempt.questionId)).size / Math.max(questions.length, 1);
  const calibrated = 1 - attempts.reduce((sum, attempt) => sum + Math.abs((attempt.confidence - 1) / 4 - (attempt.correct ? 1 : 0)), 0) / attempts.length;
  const mastery = systemPerformance(questions, attempts).reduce((sum, item) => sum + item.mastery, 0) / Math.max(systemPerformance(questions, attempts).length, 1) / 100;
  const score = clamp(Math.round((accuracy * 0.48 + uniqueCoverage * 0.2 + calibrated * 0.12 + mastery * 0.2) * 100), 0, 100);
  return { score, accuracy: Math.round(accuracy * 100), coverage: Math.round(uniqueCoverage * 100), calibrated: Math.round(calibrated * 100) };
}


export function performanceWindow(attempts: Attempt[], days = 7, reference = new Date()) {
  const periodMs = Math.max(1, days) * 86_400_000;
  const end = reference.getTime();
  const currentStart = end - periodMs;
  const priorStart = currentStart - periodMs;
  const current = attempts.filter((attempt) => {
    const value = new Date(attempt.createdAt).getTime();
    return value > currentStart && value <= end;
  });
  const prior = attempts.filter((attempt) => {
    const value = new Date(attempt.createdAt).getTime();
    return value > priorStart && value <= currentStart;
  });
  const summarize = (items: Attempt[]) => ({
    count: items.length,
    accuracy: items.length ? Math.round(items.filter((attempt) => attempt.correct).length / items.length * 100) : 0,
    averageTime: items.length ? Math.round(items.reduce((sum, attempt) => sum + attempt.timeSec, 0) / items.length) : 0
  });
  const currentSummary = summarize(current);
  const priorSummary = summarize(prior);
  return {
    ...currentSummary,
    priorCount: priorSummary.count,
    priorAccuracy: priorSummary.accuracy,
    priorAverageTime: priorSummary.averageTime,
    accuracyDelta: currentSummary.accuracy - priorSummary.accuracy,
    paceDelta: priorSummary.averageTime && currentSummary.averageTime ? priorSummary.averageTime - currentSummary.averageTime : 0
  };
}

export function studyStreak(attempts: Attempt[], reference = new Date()) {
  const activeDates = new Set(attempts.map((attempt) => localDateKey(new Date(attempt.createdAt))));
  const ordered = [...activeDates].sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const key of ordered) {
    const date = new Date(`${key}T12:00:00.000Z`);
    if (previous && Math.round((date.getTime() - previous.getTime()) / 86_400_000) === 1) run += 1;
    else run = 1;
    best = Math.max(best, run);
    previous = date;
  }
  let current = 0;
  const cursor = new Date(reference);
  const todayKey = localDateKey(cursor);
  if (!activeDates.has(todayKey)) cursor.setDate(cursor.getDate() - 1);
  while (activeDates.has(localDateKey(cursor))) {
    current += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { current, best };
}

export function dailyActivity(attempts: Attempt[], days = 14) {
  const now = new Date();
  return Array.from({ length: days }, (_, index) => {
    const date = new Date(now);
    date.setDate(now.getDate() - (days - index - 1));
    const key = localDateKey(date);
    const relevant = attempts.filter((attempt) => localDateKey(new Date(attempt.createdAt)) === key);
    return {
      date: key,
      label: date.toLocaleDateString("en-US", { weekday: "short" }).slice(0, 2),
      attempts: relevant.length,
      accuracy: relevant.length ? Math.round((relevant.filter((attempt) => attempt.correct).length / relevant.length) * 100) : null
    };
  });
}


function stableHash(value: string) {
  let hash = 2166136261;
  for (const char of value) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

/**
 * Builds a deterministic cohort response distribution for the demo.
 * The correct option receives the question's seeded global accuracy and the
 * remaining share is allocated across distractors with stable item-specific weights.
 */
export function choicePeerDistribution(question: Question) {
  const accuracy = clamp(Math.round(question.globalAccuracy), 18, 96);
  const distractors = question.choices.filter((choice) => choice.id !== question.correctChoiceId);
  const remaining = 100 - accuracy;
  const weights = distractors.map((choice, index) => ({
    id: choice.id,
    weight: 3 + (stableHash(`${question.id}:${choice.id}:${index}`) % 17)
  }));
  const weightTotal = weights.reduce((sum, item) => sum + item.weight, 0);
  const raw = weights.map((item) => ({ id: item.id, value: remaining * item.weight / Math.max(weightTotal, 1) }));
  const allocated = raw.map((item) => ({ ...item, percent: Math.floor(item.value), fraction: item.value - Math.floor(item.value) }));
  let pointsLeft = remaining - allocated.reduce((sum, item) => sum + item.percent, 0);
  allocated.sort((a, b) => b.fraction - a.fraction).forEach((item) => {
    if (pointsLeft > 0) {
      item.percent += 1;
      pointsLeft -= 1;
    }
  });
  const byId = new Map(allocated.map((item) => [item.id, item.percent]));
  return question.choices.map((choice) => ({
    choiceId: choice.id,
    percent: choice.id === question.correctChoiceId ? accuracy : byId.get(choice.id) ?? 0
  }));
}


/**
 * Converts the selected distractor into an explainable reasoning-pattern label.
 * The classifier uses directional language, management sequencing, mechanism
 * wording, and a stable fallback so the same answer always yields the same trap.
 */
export function diagnoseReasoningTrap(question: Question, selectedChoiceId?: string) {
  if (!selectedChoiceId || selectedChoiceId === question.correctChoiceId) {
    return {
      label: "Key discriminator recognized",
      description: `You matched the decisive clue to the learning objective: ${question.objective}`,
      nextAction: "Rehearse the discriminator once, then move on."
    };
  }
  const selected = question.choices.find((choice) => choice.id === selectedChoiceId);
  const correct = question.choices.find((choice) => choice.id === question.correctChoiceId);
  const selectedText = selected?.text.toLowerCase() ?? "";
  const correctText = correct?.text.toLowerCase() ?? "";
  const note = question.wrongChoiceNotes[selectedChoiceId]?.toLowerCase() ?? "";
  const directional = ["increased", "decreased", "higher", "lower", "up", "down"];
  let label = "Plausible-distractor anchoring";
  let nextAction = "Name the single clue that rules this option out before choosing again.";
  if (directional.some((word) => selectedText.includes(word)) && directional.some((word) => correctText.includes(word))) {
    label = "Directionality reversal";
    nextAction = "Write the causal chain with arrows and verify the direction of each change.";
  } else if (/next|initial|first|management|treatment|diagnostic/.test(`${question.discipline} ${question.topic} ${note}`.toLowerCase())) {
    label = "Sequence-of-care error";
    nextAction = "Separate stabilization, diagnosis, and definitive treatment before selecting the next step.";
  } else if (/associated|seen in|can cause|risk factor/.test(note)) {
    label = "Association over mechanism";
    nextAction = "Ask which option directly explains the finding, not merely which one is associated with it.";
  } else if (/mechanism|pathophysi|directly|because/.test(`${question.stem} ${question.objective}`.toLowerCase())) {
    label = "Mechanism substitution";
    nextAction = "State the mechanism in one sentence, then compare every option against that sentence.";
  }
  return {
    label,
    description: question.wrongChoiceNotes[selectedChoiceId] ?? "The selected option is plausible but does not fit the question's decisive clue.",
    nextAction
  };
}

function normalCdf(value: number, mean: number, standardDeviation: number) {
  const z = (value - mean) / Math.max(standardDeviation, 0.001);
  const sign = z < 0 ? -1 : 1;
  const x = Math.abs(z) / Math.sqrt(2);
  const t = 1 / (1 + 0.3275911 * x);
  const erf = sign * (1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x));
  return 0.5 * (1 + erf);
}

/**
 * Produces an explainable percentile against a seeded demo cohort.
 * Accuracy carries more weight than pace; pace is rewarded only inside a safe range.
 */
export function peerBenchmark(attempts: Attempt[], questions: Question[]) {
  const questionIds = new Set(questions.map((question) => question.id));
  const relevant = attempts.filter((attempt) => questionIds.has(attempt.questionId));
  if (!relevant.length) {
    return {
      percentile: 0,
      band: "No attempts yet",
      accuracy: 0,
      averageTime: 0,
      cohortMedianAccuracy: 68,
      cohortMedianTime: 94,
      accuracyDelta: 0,
      paceDelta: 0
    };
  }
  const accuracy = relevant.filter((attempt) => attempt.correct).length / relevant.length * 100;
  const averageTime = relevant.reduce((sum, attempt) => sum + attempt.timeSec, 0) / relevant.length;
  const accuracyPercentile = normalCdf(accuracy, 68, 13) * 100;
  const safePaceScore = clamp(100 - Math.abs(88 - averageTime) * 0.9, 20, 100);
  const pacePercentile = normalCdf(safePaceScore, 70, 15) * 100;
  const percentile = clamp(Math.round(accuracyPercentile * 0.82 + pacePercentile * 0.18), 1, 99);
  const band = percentile >= 85 ? "Top 15%" : percentile >= 70 ? "Top 30%" : percentile >= 45 ? "Middle cohort" : "Developing";
  return {
    percentile,
    band,
    accuracy: Math.round(accuracy),
    averageTime: Math.round(averageTime),
    cohortMedianAccuracy: 68,
    cohortMedianTime: 94,
    accuracyDelta: Math.round(accuracy - 68),
    paceDelta: Math.round(94 - averageTime)
  };
}

function tokenize(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9+\- ]/g, " ").split(/\s+/).filter(Boolean);
}

/**
 * Medical-library ranking combines lexical relevance, exact phrase matching,
 * system weakness, saved/completed state, and a small recency signal.
 */
export function rankLibraryArticles(
  articles: MedicalArticle[],
  query: string,
  system: string,
  step: "All" | Question["step"],
  performance: ReturnType<typeof systemPerformance>,
  savedArticles: string[],
  activity: LibraryActivity[]
) {
  const tokens = tokenize(query);
  const weaknessBySystem = new Map(performance.map((entry) => [entry.system, 1 - entry.mastery / 100]));
  const activityById = new Map(activity.map((entry) => [entry.articleId, entry]));
  return articles
    .filter((article) => system === "All" || article.system === system)
    .filter((article) => step === "All" || article.step === "Both" || article.step === step)
    .map((article) => {
      const haystack = `${article.title} ${article.summary} ${article.system} ${article.category} ${article.keywords.join(" ")} ${article.tags.join(" ")}`.toLowerCase();
      const lexical = tokens.reduce((sum, token) => sum + (haystack.includes(token) ? article.title.toLowerCase().includes(token) ? 7 : 3 : 0), 0);
      const exactPhrase = query.trim().length > 2 && haystack.includes(query.trim().toLowerCase()) ? 9 : 0;
      const weakness = (weaknessBySystem.get(article.system) ?? 0.35) * 8;
      const saved = savedArticles.includes(article.id) ? 1.5 : 0;
      const completed = activityById.get(article.id)?.completed ? -1 : 1;
      const freshnessDays = Math.max(0, (Date.now() - new Date(`${article.updatedAt}T12:00:00`).getTime()) / 86_400_000);
      const freshness = clamp(1 - freshnessDays / 365, 0, 1);
      return { article, textRelevance: lexical + exactPhrase, score: lexical + exactPhrase + weakness + saved + completed + freshness };
    })
    .filter((entry) => !tokens.length || entry.textRelevance > 0)
    .sort((a, b) => b.score - a.score || a.article.title.localeCompare(b.article.title))
    .map((entry) => entry.article);
}


export interface CircleMemberSignal {
  id: string;
  verified: boolean;
  consented: boolean;
  eligibleQuestionCount: number;
}

/**
 * Unlocks shared error analytics only after privacy and activity thresholds are met.
 * No individual scores or question-level records are returned by this function.
 */
export function studyCircleEligibility(members: CircleMemberSignal[], minimumPeers = 3, minimumQuestions = 20) {
  const verified = members.filter((member) => member.verified);
  const consented = verified.filter((member) => member.consented);
  const historyEligible = consented.filter((member) => member.eligibleQuestionCount >= minimumQuestions);
  const peerProgress = clamp(Math.round(verified.length / Math.max(minimumPeers, 1) * 100), 0, 100);
  const consentProgress = clamp(Math.round(consented.length / Math.max(minimumPeers, 1) * 100), 0, 100);
  const historyProgress = clamp(Math.round(historyEligible.length / Math.max(minimumPeers, 1) * 100), 0, 100);
  return {
    verifiedPeers: verified.length,
    consentedPeers: consented.length,
    historyEligiblePeers: historyEligible.length,
    minimumPeers,
    minimumQuestions,
    peerProgress,
    consentProgress,
    historyProgress,
    overallProgress: Math.round((peerProgress + consentProgress + historyProgress) / 3),
    unlocked: verified.length >= minimumPeers && consented.length >= minimumPeers && historyEligible.length >= minimumPeers
  };
}

export function rollingAccuracy(attempts: Attempt[], blockSize = 3) {
  if (!attempts.length) return [0, 0, 0, 0, 0, 0, 0, 0];
  const ordered = [...attempts].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const result: number[] = [];
  for (let index = 0; index < ordered.length; index += blockSize) {
    const block = ordered.slice(index, index + blockSize);
    result.push(Math.round(block.filter((attempt) => attempt.correct).length / block.length * 100));
  }
  while (result.length < 8) {
    const prior = result.at(0) ?? 0;
    result.unshift(prior);
  }
  return result.slice(-8);
}

export function confidenceMatrix(attempts: Attempt[]) {
  const cells = [
    { key: "low-correct", label: "Low confidence · correct", matches: (attempt: Attempt) => attempt.confidence <= 3 && attempt.correct },
    { key: "high-correct", label: "High confidence · correct", matches: (attempt: Attempt) => attempt.confidence >= 4 && attempt.correct },
    { key: "low-miss", label: "Low confidence · missed", matches: (attempt: Attempt) => attempt.confidence <= 3 && !attempt.correct },
    { key: "high-miss", label: "High confidence · missed", matches: (attempt: Attempt) => attempt.confidence >= 4 && !attempt.correct }
  ];
  return cells.map((cell) => {
    const count = attempts.filter(cell.matches).length;
    return { key: cell.key, label: cell.label, count, percent: attempts.length ? Math.round(count / attempts.length * 100) : 0 };
  });
}
