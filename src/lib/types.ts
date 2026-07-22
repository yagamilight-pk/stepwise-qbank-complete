export type Step = "Step 1" | "Step 2 CK";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type QuestionStatus = "Draft" | "In review" | "Published" | "Archived";
export type Confidence = 1 | 2 | 3 | 4 | 5;
export type ReviewRating = "again" | "hard" | "good" | "easy";

export interface Choice {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  step: Step;
  system: string;
  discipline: string;
  topic: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  stem: string;
  choices: Choice[];
  correctChoiceId: string;
  explanation: string;
  objective: string;
  pearls: string[];
  wrongChoiceNotes: Record<string, string>;
  tags: string[];
  author: string;
  updatedAt: string;
  averageTimeSec: number;
  globalAccuracy: number;
  sourceLabel?: string;
}

export interface Attempt {
  id: string;
  questionId: string;
  selectedChoiceId: string;
  correct: boolean;
  confidence: Confidence;
  timeSec: number;
  createdAt: string;
  sessionId: string;
  mode: SessionMode;
}

export interface Note {
  id: string;
  questionId?: string;
  title: string;
  body: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface Flashcard {
  id: string;
  questionId?: string;
  front: string;
  back: string;
  tags: string[];
  interval: number;
  ease: number;
  repetitions: number;
  lapses: number;
  dueAt: string;
  lastReviewedAt?: string;
  createdAt: string;
}

export type SessionMode = "Tutor" | "Timed" | "Exam" | "Adaptive";

export interface SessionConfig {
  step: Step;
  mode: SessionMode;
  count: number;
  systems: string[];
  disciplines: string[];
  difficulties: Difficulty[];
  include: "All" | "Unused" | "Incorrect" | "Flagged" | "Bookmarked";
  timePerQuestionSec: number;
  questionIds?: string[];
}

export interface SessionRecord {
  id: string;
  createdAt: string;
  completedAt?: string;
  config: SessionConfig;
  questionIds: string[];
  currentIndex: number;
}

export interface StudyTask {
  id: string;
  date: string;
  type: "Questions" | "Review" | "Flashcards" | "Assessment";
  title: string;
  detail: string;
  minutes: number;
  completed: boolean;
  priority: "Core" | "Weakness" | "Maintenance";
}

export interface StudyPlanSettings {
  examDate: string;
  weeklyDays: number[];
  weekdayMinutes: number;
  weekendMinutes: number;
  targetStep: Step;
  targetScore: number;
}

export interface UserSettings {
  theme: "light" | "dark" | "system";
  reducedMotion: boolean;
  sound: boolean;
  showTimer: boolean;
  dailyGoal: number;
  emailDigest: boolean;
  compactMode: boolean;
  planReminders: boolean;
  cardReminders: boolean;
  communityActivity: boolean;
  highContrast: boolean;
  largeText: boolean;
}

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  plan: "Trial" | "Core" | "Pro" | "Institution";
  status: "Active" | "At risk" | "Paused";
  joinedAt: string;
  lastActiveAt: string;
  questionsAnswered: number;
  accuracy: number;
}

export interface MedicalArticleSection {
  id: string;
  title: string;
  body: string;
  bullets?: string[];
  table?: { headers: string[]; rows: string[][] };
  callout?: string;
}

export interface MedicalArticle {
  id: string;
  title: string;
  step: Step | "Both";
  system: string;
  category: string;
  summary: string;
  readingMinutes: number;
  difficulty: Difficulty;
  updatedAt: string;
  keywords: string[];
  tags: string[];
  relatedQuestionIds: string[];
  sections: MedicalArticleSection[];
}

export interface LibraryActivity {
  articleId: string;
  progress: number;
  completed: boolean;
  lastOpenedAt: string;
}

export interface ContentReport {
  id: string;
  questionId: string;
  reason: "Medical accuracy" | "Ambiguous wording" | "Typo" | "Outdated guideline";
  detail: string;
  reporter: string;
  createdAt: string;
  status: "Open" | "Resolved";
}

export interface NotificationItem {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
}

export interface AppState {
  questions: Question[];
  attempts: Attempt[];
  notes: Note[];
  flashcards: Flashcard[];
  bookmarks: string[];
  flagged: string[];
  sessions: SessionRecord[];
  planSettings: StudyPlanSettings;
  studyTasks: StudyTask[];
  settings: UserSettings;
  adminUsers: AdminUser[];
  reports: ContentReport[];
  notifications: NotificationItem[];
  savedArticles: string[];
  libraryActivity: LibraryActivity[];
}
