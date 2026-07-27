import type { Confidence, Question, SessionConfig } from "./types";

export const ACTIVE_SESSION_KEY = "stepwise-active-session-v1";
export const SESSION_CONFIG_KEY = "stepwise-session-config";

export interface LocalSessionResult {
  questionId: string;
  selectedChoiceId: string;
  correct: boolean;
  confidence: Confidence;
  timeSec: number;
}

export interface SessionDraft {
  version: 1;
  sessionId: string;
  config: SessionConfig;
  questionIds: string[];
  index: number;
  selected: Record<string, string>;
  confidence: Record<string, Confidence>;
  submitted: string[];
  lockedSequential?: string[];
  struck: Record<string, string[]>;
  results: LocalSessionResult[];
  elapsedSeconds: number;
  elapsedByQuestion: Record<string, number>;
  savedAt: string;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function isStringRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every((item) => typeof item === "string");
}

function isConfidenceRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every(
    (item) => Number.isInteger(item) && Number(item) >= 1 && Number(item) <= 5
  );
}

function isStringArrayRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every(
    (item) => Array.isArray(item) && item.every((entry) => typeof entry === "string")
  );
}

function isNumberRecord(value: unknown) {
  return isRecord(value) && Object.values(value).every((item) => Number.isFinite(item));
}

export function isSessionConfig(value: unknown): value is SessionConfig {
  if (!isRecord(value)) return false;
  return (value.step === "Step 1" || value.step === "Step 2 CK")
    && ["Tutor", "Timed", "Exam", "Adaptive"].includes(String(value.mode))
    && Number.isFinite(value.count)
    && Number(value.count) > 0
    && Array.isArray(value.systems)
    && value.systems.every((item) => typeof item === "string")
    && Array.isArray(value.disciplines)
    && value.disciplines.every((item) => typeof item === "string")
    && Array.isArray(value.difficulties)
    && value.difficulties.every((item) => ["Easy", "Medium", "Hard"].includes(String(item)))
    && ["All", "Unused", "Incorrect", "Flagged", "Bookmarked"].includes(String(value.include))
    && Number.isFinite(value.timePerQuestionSec)
    && Number(value.timePerQuestionSec) > 0
    && (value.questionIds === undefined || (
      Array.isArray(value.questionIds) && value.questionIds.every((item) => typeof item === "string")
    ))
    && (value.timeLimitSeconds === undefined || (
      Number.isFinite(value.timeLimitSeconds) && Number(value.timeLimitSeconds) >= 0
    ));
}

export function arrangeQuestionsForSession(questions: Question[]): Question[] {
  const emittedSets = new Set<string>();
  const arranged: Question[] = [];
  for (const question of questions) {
    const setId = question.sequentialSet?.setId;
    if (!setId) {
      arranged.push(question);
      continue;
    }
    if (emittedSets.has(setId)) continue;
    emittedSets.add(setId);
    arranged.push(
      ...questions
        .filter((candidate) => candidate.sequentialSet?.setId === setId)
        .sort((left, right) => (left.sequentialSet?.order ?? 0) - (right.sequentialSet?.order ?? 0))
    );
  }
  return arranged;
}

export interface SessionScore {
  total: number;
  answered: number;
  unanswered: number;
  correct: number;
  incorrect: number;
  accuracy: number;
}

export function scoreSession(total: number, results: LocalSessionResult[]): SessionScore {
  const boundedTotal = Math.max(0, total);
  const uniqueResults = new Map(results.map((result) => [result.questionId, result]));
  const answered = Math.min(boundedTotal, uniqueResults.size);
  const correct = [...uniqueResults.values()].filter((result) => result.correct).length;
  const unanswered = Math.max(0, boundedTotal - answered);
  return {
    total: boundedTotal,
    answered,
    unanswered,
    correct,
    incorrect: Math.max(0, answered - correct),
    accuracy: boundedTotal ? Math.round((correct / boundedTotal) * 100) : 0
  };
}

export function buildSessionResults(
  questions: Question[],
  selected: Record<string, string>,
  confidence: Record<string, Confidence>,
  elapsedByQuestion: Record<string, number>,
  fallbackTime = 1
): LocalSessionResult[] {
  return questions.flatMap((question) => {
    const selectedChoiceId = selected[question.id];
    if (!selectedChoiceId) return [];
    return [{
      questionId: question.id,
      selectedChoiceId,
      correct: selectedChoiceId === question.correctChoiceId,
      confidence: confidence[question.id] ?? 3,
      timeSec: Math.max(1, Math.round(elapsedByQuestion[question.id] ?? fallbackTime))
    }];
  });
}

export function isSessionDraft(value: unknown): value is SessionDraft {
  if (!isRecord(value)) return false;
  const candidate = value as Partial<SessionDraft>;
  return candidate.version === 1
    && typeof candidate.sessionId === "string"
    && isSessionConfig(candidate.config)
    && Array.isArray(candidate.questionIds)
    && candidate.questionIds.every((item) => typeof item === "string")
    && Number.isInteger(candidate.index)
    && Number(candidate.index) >= 0
    && isStringRecord(candidate.selected)
    && isConfidenceRecord(candidate.confidence)
    && Array.isArray(candidate.submitted)
    && candidate.submitted.every((item) => typeof item === "string")
    && (candidate.lockedSequential === undefined || (
      Array.isArray(candidate.lockedSequential)
      && candidate.lockedSequential.every((item) => typeof item === "string")
    ))
    && isStringArrayRecord(candidate.struck)
    && Array.isArray(candidate.results)
    && candidate.results.every((result) => Boolean(
      result
      && typeof result.questionId === "string"
      && typeof result.selectedChoiceId === "string"
      && typeof result.correct === "boolean"
      && Number.isInteger(result.confidence)
      && result.confidence >= 1
      && result.confidence <= 5
      && Number.isFinite(result.timeSec)
    ))
    && Number.isFinite(candidate.elapsedSeconds)
    && isNumberRecord(candidate.elapsedByQuestion)
    && typeof candidate.savedAt === "string";
}

export function readSessionDraft(storage: Storage): SessionDraft | null {
  try {
    const raw = storage.getItem(ACTIVE_SESSION_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isSessionDraft(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

export function writeSessionDraft(storage: Storage, draft: SessionDraft): boolean {
  try {
    storage.setItem(ACTIVE_SESSION_KEY, JSON.stringify(draft));
    return true;
  } catch {
    return false;
  }
}

export function clearSessionDraft(storage: Storage) {
  try {
    storage.removeItem(ACTIVE_SESSION_KEY);
  } catch {}
}
