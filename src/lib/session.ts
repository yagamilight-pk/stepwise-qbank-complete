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
  struck: Record<string, string[]>;
  results: LocalSessionResult[];
  elapsedSeconds: number;
  elapsedByQuestion: Record<string, number>;
  savedAt: string;
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
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<SessionDraft>;
  return candidate.version === 1
    && typeof candidate.sessionId === "string"
    && Boolean(candidate.config && typeof candidate.config === "object")
    && Array.isArray(candidate.questionIds)
    && typeof candidate.selected === "object"
    && typeof candidate.confidence === "object"
    && Array.isArray(candidate.submitted)
    && Array.isArray(candidate.results)
    && Number.isFinite(candidate.elapsedSeconds);
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
