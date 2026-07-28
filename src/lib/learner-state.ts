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

export const LEARNER_STATE_SCHEMA_VERSION = 1;

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

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

export function isLearnerState(value: unknown): value is LearnerState {
  if (!isRecord(value)) return false;
  return typeof value.schemaVersion === "number"
    && Array.isArray(value.attempts)
    && Array.isArray(value.notes)
    && Array.isArray(value.flashcards)
    && Array.isArray(value.bookmarks)
    && value.bookmarks.every((item) => typeof item === "string")
    && Array.isArray(value.flagged)
    && value.flagged.every((item) => typeof item === "string")
    && Array.isArray(value.sessions)
    && isRecord(value.planSettings)
    && Array.isArray(value.studyTasks)
    && isRecord(value.settings)
    && isRecord(value.learnerProfile)
    && Array.isArray(value.savedArticles)
    && value.savedArticles.every((item) => typeof item === "string")
    && Array.isArray(value.libraryActivity);
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
