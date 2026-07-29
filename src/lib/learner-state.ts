import { z } from "zod";
import type {
  AppState,
  Attempt,
  Flashcard,
  LearnerProfile,
  LibraryActivity,
  Note,
  SessionRecord,
  StudyPlanSettings,
  StudyTask,
  UserSettings,
} from "./types";

export const LEARNER_STATE_SCHEMA_VERSION = 2;

const id = z.string().trim().min(1).max(128);
const timestamp = z.string().datetime();
const step = z.enum(["Step 1", "Step 2 CK"]);
const preparationStage = z.enum([
  "Early preparation",
  "Building consistency",
  "Dedicated period",
  "Final review",
]);

const attemptSchema = z.object({
  id,
  questionId: id,
  selectedChoiceId: id,
  correct: z.boolean(),
  confidence: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5)]),
  timeSec: z.number().int().min(0).max(86_400),
  createdAt: timestamp,
  sessionId: id,
  mode: z.enum(["Tutor", "Timed", "Exam", "Adaptive"]),
}).strict();

const noteSchema = z.object({
  id,
  questionId: id.optional(),
  title: z.string().trim().min(1).max(240),
  body: z.string().max(100_000),
  tags: z.array(z.string().trim().min(1).max(80)).max(50),
  createdAt: timestamp,
  updatedAt: timestamp,
}).strict();

const flashcardSchema = z.object({
  id,
  questionId: id.optional(),
  front: z.string().trim().min(1).max(10_000),
  back: z.string().trim().min(1).max(30_000),
  tags: z.array(z.string().trim().min(1).max(80)).max(50),
  interval: z.number().int().min(0).max(36_500),
  ease: z.number().min(1.3).max(5),
  repetitions: z.number().int().min(0).max(100_000),
  lapses: z.number().int().min(0).max(100_000),
  dueAt: timestamp,
  lastReviewedAt: timestamp.optional(),
  createdAt: timestamp,
}).strict();

const sessionConfigSchema = z.object({
  step,
  mode: z.enum(["Tutor", "Timed", "Exam", "Adaptive"]),
  count: z.number().int().min(1).max(100),
  systems: z.array(z.string().trim().min(1).max(120)).max(100),
  disciplines: z.array(z.string().trim().min(1).max(120)).max(100),
  difficulties: z.array(z.enum(["Easy", "Medium", "Hard"])).max(3),
  include: z.enum(["All", "Unused", "Incorrect", "Flagged", "Bookmarked"]),
  timePerQuestionSec: z.number().int().min(10).max(3_600),
  questionIds: z.array(id).max(100).optional(),
  examRunId: id.optional(),
  examBlockIndex: z.number().int().min(0).max(100).optional(),
  examBlockCount: z.number().int().min(1).max(100).optional(),
  examDay: z.boolean().optional(),
  timeLimitSeconds: z.number().int().min(1).max(172_800).optional(),
}).strict();

const sessionSchema = z.object({
  id,
  createdAt: timestamp,
  completedAt: timestamp.optional(),
  config: sessionConfigSchema,
  questionIds: z.array(id).max(100),
  currentIndex: z.number().int().min(0).max(100),
  answeredCount: z.number().int().min(0).max(100).optional(),
  unansweredCount: z.number().int().min(0).max(100).optional(),
  accuracy: z.number().min(0).max(100).optional(),
}).strict();

const planSettingsSchema = z.object({
  examDate: z.string().date(),
  weeklyDays: z.array(z.number().int().min(0).max(6)).max(7),
  weekdayMinutes: z.number().int().min(0).max(1_440),
  weekendMinutes: z.number().int().min(0).max(1_440),
  targetStep: step,
  targetScore: z.number().min(0).max(300),
  preparationStage: preparationStage.optional(),
}).strict();

const studyTaskSchema = z.object({
  id,
  date: z.string().date(),
  type: z.enum(["Questions", "Review", "Flashcards", "Assessment"]),
  title: z.string().trim().min(1).max(240),
  detail: z.string().max(1_000),
  minutes: z.number().int().min(0).max(1_440),
  completed: z.boolean(),
  priority: z.enum(["Core", "Weakness", "Maintenance"]),
}).strict();

const settingsSchema = z.object({
  theme: z.enum(["light", "dark", "system"]),
  reducedMotion: z.boolean(),
  sound: z.boolean(),
  showTimer: z.boolean(),
  dailyGoal: z.number().int().min(0).max(500),
  emailDigest: z.boolean(),
  compactMode: z.boolean(),
  planReminders: z.boolean(),
  cardReminders: z.boolean(),
  communityActivity: z.boolean(),
  highContrast: z.boolean(),
  largeText: z.boolean(),
}).strict();

const learnerProfileSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().email().max(320),
  emailVerified: z.boolean().optional(),
  medicalSchool: z.string().max(200),
  targetExam: step,
  preparationStage,
  toolkitPriorities: z.array(z.string().trim().min(1).max(120)).max(20),
  onboardingCompleted: z.boolean(),
}).strict();

const libraryActivitySchema = z.object({
  articleId: id,
  progress: z.number().min(0).max(100),
  completed: z.boolean(),
  lastOpenedAt: timestamp,
}).strict();

export const learnerStateSchema = z.object({
  schemaVersion: z.number().int().min(1).max(LEARNER_STATE_SCHEMA_VERSION),
  attempts: z.array(attemptSchema).max(50_000),
  notes: z.array(noteSchema).max(10_000),
  flashcards: z.array(flashcardSchema).max(20_000),
  bookmarks: z.array(id).max(50_000),
  flagged: z.array(id).max(50_000),
  sessions: z.array(sessionSchema).max(10_000),
  planSettings: planSettingsSchema,
  studyTasks: z.array(studyTaskSchema).max(20_000),
  settings: settingsSchema,
  learnerProfile: learnerProfileSchema,
  savedArticles: z.array(id).max(10_000),
  libraryActivity: z.array(libraryActivitySchema).max(10_000),
}).strict();

export interface LearnerState {
  schemaVersion: number;
  attempts: Attempt[];
  notes: Note[];
  flashcards: Flashcard[];
  bookmarks: string[];
  flagged: string[];
  sessions: SessionRecord[];
  planSettings: StudyPlanSettings;
  studyTasks: StudyTask[];
  settings: UserSettings;
  learnerProfile: LearnerProfile;
  savedArticles: string[];
  libraryActivity: LibraryActivity[];
}

export function parseLearnerState(value: unknown): LearnerState | null {
  const parsed = learnerStateSchema.safeParse(value);
  if (!parsed.success) return null;
  return {
    ...parsed.data,
    schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
  } as LearnerState;
}

export function isLearnerState(value: unknown): value is LearnerState {
  return parseLearnerState(value) !== null;
}

export function selectLearnerState(state: AppState): LearnerState {
  return {
    schemaVersion: LEARNER_STATE_SCHEMA_VERSION,
    attempts: state.attempts,
    notes: state.notes,
    flashcards: state.flashcards,
    bookmarks: state.bookmarks,
    flagged: state.flagged,
    sessions: state.sessions,
    planSettings: state.planSettings,
    studyTasks: state.studyTasks,
    settings: state.settings,
    learnerProfile: state.learnerProfile,
    savedArticles: state.savedArticles,
    libraryActivity: state.libraryActivity,
  };
}

export function mergeLearnerState(state: AppState, remote: LearnerState): AppState {
  return {
    ...state,
    attempts: remote.attempts,
    notes: remote.notes,
    flashcards: remote.flashcards,
    bookmarks: remote.bookmarks,
    flagged: remote.flagged,
    sessions: remote.sessions,
    planSettings: remote.planSettings,
    studyTasks: remote.studyTasks,
    settings: remote.settings,
    learnerProfile: remote.learnerProfile,
    savedArticles: remote.savedArticles,
    libraryActivity: remote.libraryActivity,
  };
}
