import type { Question, SessionConfig, Step } from "./types";
import { getUsmleExamProfile } from "./usmle";

export const EXAM_DAY_KEY = "stepwise-exam-day-v1";

export type ExamDayPreset = "Full-day simulation" | "Three-block rehearsal";
export type ExamDayStatus = "Tutorial" | "Between blocks" | "In block" | "On break" | "Complete";
export type ExamBlockStatus = "Ready" | "Active" | "Complete";

export interface ExamDayBlock {
  index: number;
  status: ExamBlockStatus;
  questionIds: string[];
  startedAt?: string;
  completedAt?: string;
  elapsedSeconds: number;
  answered: number;
  correct: number;
  accuracy: number;
  breakSecondsEarned: number;
  allottedSeconds?: number;
  timePenaltySeconds?: number;
}

export interface ExamDayRun {
  version: 1;
  id: string;
  step: Step;
  examDate: string;
  preset: ExamDayPreset;
  status: ExamDayStatus;
  createdAt: string;
  updatedAt: string;
  tutorialStartedAt?: string;
  tutorialCompletedAt?: string;
  tutorialSecondsUsed: number;
  blockMinutes: number;
  maxItemsPerBlock: number;
  officialBlockCount: number;
  startingBreakSeconds: number;
  breakRemainingSeconds: number;
  breakStartedAt?: string;
  pendingTestPenaltySeconds?: number;
  totalBreakOverrunSeconds?: number;
  recycledDemoContent: boolean;
  blocks: ExamDayBlock[];
}

function runId() {
  return `exam-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;
}

function rotateQuestionIds(questions: Question[], blockIndex: number, count: number) {
  if (!questions.length) return [];
  const offset = (blockIndex * count) % questions.length;
  return Array.from({ length: Math.min(count, questions.length) }, (_, itemIndex) => (
    questions[(offset + itemIndex) % questions.length].id
  ));
}

export function createExamDayRun(
  step: Step,
  examDate: string,
  preset: ExamDayPreset,
  questions: Question[]
): ExamDayRun {
  const profile = getUsmleExamProfile(step, examDate);
  const eligible = questions.filter((question) => question.step === step && question.status === "Published");
  const blockCount = preset === "Full-day simulation" ? profile.blocksPerExam : Math.min(3, profile.blocksPerExam);
  const blockItemCount = Math.min(profile.maxItemsPerBlock, Math.max(eligible.length, 1));
  const now = new Date().toISOString();
  const breakSeconds = (preset === "Full-day simulation" ? profile.breakMinutes : 15) * 60;

  return {
    version: 1,
    id: runId(),
    step,
    examDate,
    preset,
    status: "Tutorial",
    createdAt: now,
    updatedAt: now,
    tutorialStartedAt: now,
    tutorialSecondsUsed: 0,
    blockMinutes: profile.blockMinutes,
    maxItemsPerBlock: profile.maxItemsPerBlock,
    officialBlockCount: profile.blocksPerExam,
    startingBreakSeconds: breakSeconds,
    breakRemainingSeconds: breakSeconds,
    pendingTestPenaltySeconds: 0,
    totalBreakOverrunSeconds: 0,
    recycledDemoContent: eligible.length < blockCount * profile.maxItemsPerBlock,
    blocks: Array.from({ length: blockCount }, (_, index) => ({
      index,
      status: "Ready",
      questionIds: rotateQuestionIds(eligible, index, blockItemCount),
      elapsedSeconds: 0,
      answered: 0,
      correct: 0,
      accuracy: 0,
      breakSecondsEarned: 0
    }))
  };
}

export function isExamDayRun(value: unknown): value is ExamDayRun {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ExamDayRun>;
  return candidate.version === 1
    && typeof candidate.id === "string"
    && (candidate.step === "Step 1" || candidate.step === "Step 2 CK")
    && typeof candidate.createdAt === "string"
    && ["Tutorial", "Between blocks", "In block", "On break", "Complete"].includes(candidate.status ?? "")
    && Array.isArray(candidate.blocks)
    && candidate.blocks.every((block) => Boolean(
      block
      && typeof block === "object"
      && typeof block.index === "number"
      && ["Ready", "Active", "Complete"].includes(block.status)
      && Array.isArray(block.questionIds)
    ))
    && Number.isFinite(candidate.breakRemainingSeconds);
}

function normalizeExamDayRun(run: ExamDayRun): ExamDayRun {
  const blockSeconds = Math.max(0, run.blockMinutes * 60);
  return {
    ...run,
    tutorialStartedAt: run.tutorialStartedAt ?? run.createdAt,
    pendingTestPenaltySeconds: Number.isFinite(run.pendingTestPenaltySeconds)
      ? Math.max(0, run.pendingTestPenaltySeconds ?? 0)
      : 0,
    totalBreakOverrunSeconds: Number.isFinite(run.totalBreakOverrunSeconds)
      ? Math.max(0, run.totalBreakOverrunSeconds ?? 0)
      : 0,
    blocks: run.blocks.map((block) => ({
      ...block,
      allottedSeconds: Number.isFinite(block.allottedSeconds)
        ? Math.max(0, block.allottedSeconds ?? blockSeconds)
        : blockSeconds,
      timePenaltySeconds: Number.isFinite(block.timePenaltySeconds)
        ? Math.max(0, block.timePenaltySeconds ?? 0)
        : 0
    }))
  };
}

export function readExamDayRun(storage: Storage): ExamDayRun | null {
  try {
    const raw = storage.getItem(EXAM_DAY_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    return isExamDayRun(parsed) ? normalizeExamDayRun(parsed) : null;
  } catch {
    return null;
  }
}

export function writeExamDayRun(storage: Storage, run: ExamDayRun) {
  try {
    storage.setItem(EXAM_DAY_KEY, JSON.stringify({ ...run, updatedAt: new Date().toISOString() }));
    return true;
  } catch {
    return false;
  }
}

export function clearExamDayRun(storage: Storage) {
  try {
    storage.removeItem(EXAM_DAY_KEY);
  } catch {}
}

export function completeTutorial(run: ExamDayRun, elapsedSeconds: number): ExamDayRun {
  const tutorialAllowance = getUsmleExamProfile(run.step, run.examDate).tutorialMinutes * 60;
  const used = Math.max(0, Math.min(tutorialAllowance, Math.round(elapsedSeconds)));
  const earned = Math.max(0, tutorialAllowance - used);
  return {
    ...run,
    status: "Between blocks",
    tutorialCompletedAt: new Date().toISOString(),
    tutorialSecondsUsed: used,
    breakRemainingSeconds: run.breakRemainingSeconds + earned,
    updatedAt: new Date().toISOString()
  };
}

export function startExamBlock(run: ExamDayRun, blockIndex: number): ExamDayRun {
  const blockSeconds = Math.max(0, run.blockMinutes * 60);
  const pendingPenalty = Math.max(0, run.pendingTestPenaltySeconds ?? 0);
  const appliedPenalty = Math.min(blockSeconds, pendingPenalty);
  const blocks = run.blocks.map((block) => block.index === blockIndex ? {
    ...block,
    status: "Active" as const,
    startedAt: block.startedAt ?? new Date().toISOString(),
    allottedSeconds: Math.max(0, blockSeconds - appliedPenalty),
    timePenaltySeconds: appliedPenalty
  } : block);
  return {
    ...run,
    status: "In block",
    blocks,
    breakStartedAt: undefined,
    pendingTestPenaltySeconds: Math.max(0, pendingPenalty - appliedPenalty),
    updatedAt: new Date().toISOString()
  };
}

export function completeExamBlock(
  run: ExamDayRun,
  blockIndex: number,
  elapsedSeconds: number,
  answered: number,
  correct: number
): ExamDayRun {
  const completedAt = new Date();
  const elapsed = Math.max(0, Math.round(elapsedSeconds));
  const targetBlock = run.blocks.find((block) => block.index === blockIndex);
  const allottedSeconds = targetBlock?.allottedSeconds ?? run.blockMinutes * 60;
  const earned = Math.max(0, allottedSeconds - elapsed);
  const blocks = run.blocks.map((block) => block.index === blockIndex ? {
    ...block,
    status: "Complete" as const,
    completedAt: completedAt.toISOString(),
    elapsedSeconds: elapsed,
    answered,
    correct,
    accuracy: block.questionIds.length ? Math.round((correct / block.questionIds.length) * 100) : 0,
    breakSecondsEarned: earned
  } : block);
  const complete = blocks.every((block) => block.status === "Complete");
  return {
    ...run,
    status: complete ? "Complete" : "On break",
    blocks,
    breakRemainingSeconds: run.breakRemainingSeconds + earned,
    breakStartedAt: complete ? undefined : completedAt.toISOString(),
    updatedAt: completedAt.toISOString()
  };
}

export function startExamBreak(run: ExamDayRun): ExamDayRun {
  if (run.breakRemainingSeconds <= 0 || run.status === "Complete") return run;
  return { ...run, status: "On break", breakStartedAt: new Date().toISOString(), updatedAt: new Date().toISOString() };
}

export function settleExamBreak(run: ExamDayRun, now = Date.now()): ExamDayRun {
  if (!run.breakStartedAt) return run;
  const started = Date.parse(run.breakStartedAt);
  const elapsed = Number.isFinite(started) ? Math.max(0, Math.floor((now - started) / 1000)) : 0;
  const overrun = Math.max(0, elapsed - run.breakRemainingSeconds);
  return {
    ...run,
    status: "Between blocks",
    breakRemainingSeconds: Math.max(0, run.breakRemainingSeconds - elapsed),
    pendingTestPenaltySeconds: Math.max(0, run.pendingTestPenaltySeconds ?? 0) + overrun,
    totalBreakOverrunSeconds: Math.max(0, run.totalBreakOverrunSeconds ?? 0) + overrun,
    breakStartedAt: undefined,
    updatedAt: new Date(now).toISOString()
  };
}

export function visibleBreakSeconds(run: ExamDayRun, now = Date.now()) {
  if (!run.breakStartedAt) return run.breakRemainingSeconds;
  const started = Date.parse(run.breakStartedAt);
  const elapsed = Number.isFinite(started) ? Math.max(0, Math.floor((now - started) / 1000)) : 0;
  return Math.max(0, run.breakRemainingSeconds - elapsed);
}

export function visibleBreakOverrunSeconds(run: ExamDayRun, now = Date.now()) {
  if (!run.breakStartedAt) return 0;
  const started = Date.parse(run.breakStartedAt);
  const elapsed = Number.isFinite(started) ? Math.max(0, Math.floor((now - started) / 1000)) : 0;
  return Math.max(0, elapsed - run.breakRemainingSeconds);
}

export function examBlockConfig(run: ExamDayRun, block: ExamDayBlock): SessionConfig {
  return {
    step: run.step,
    mode: "Exam",
    count: block.questionIds.length,
    systems: [],
    disciplines: [],
    difficulties: [],
    include: "All",
    timePerQuestionSec: Math.round((run.blockMinutes * 60) / Math.max(block.questionIds.length, 1)),
    questionIds: block.questionIds,
    examRunId: run.id,
    examBlockIndex: block.index,
    examBlockCount: run.blocks.length,
    examDay: true,
    timeLimitSeconds: block.allottedSeconds ?? run.blockMinutes * 60
  };
}
