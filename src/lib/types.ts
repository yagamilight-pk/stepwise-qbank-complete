export type Step = "Step 1" | "Step 2 CK";
export type Difficulty = "Easy" | "Medium" | "Hard";
export type QuestionStatus = "Draft" | "In review" | "Published" | "Archived";
export type Confidence = 1 | 2 | 3 | 4 | 5;
export type ReviewRating = "again" | "hard" | "good" | "easy";
export type QuestionFormat = "Single best answer" | "Chart / tabular" | "Sequential set" | "Scientific abstract" | "Audio / video";
export type ContentUse = "Demo" | "Production";
export type RightsStatus = "Original" | "Licensed" | "Pending verification";

export interface Choice {
  id: string;
  text: string;
}

export interface QuestionOption {
  key: string;
  text: string;
  percent?: string;
  isCorrect: boolean;
}

export interface QuestionTaxonomy {
  subject: string;
  organSystem: string;
  topic: string;
  subtopic?: string;
}

export interface QuestionExplanation {
  main: string;
  educationalObjective: string;
  distractorAnalysis?: Record<string, string>;
}

export interface QuestionAiEnrichment {
  difficultyLevel: Difficulty | string;
  difficultyScore?: number;
  reasoningTraps?: string[];
  highYieldKeywords?: string[];
  clinicalPearl?: string;
}

export interface QuestionMedia {
  questionImages?: string[];
  explanationImages?: string[];
  audioUrl?: string;
  videoUrl?: string;
  transcript?: string;
  altText?: string[];
}

export interface EvidenceReference {
  id: string;
  title: string;
  source: string;
  url?: string;
  publishedAt?: string;
  accessedAt?: string;
}

export interface ContentGovernance {
  version: number;
  rightsStatus: RightsStatus;
  medicalReviewer?: string;
  medicalReviewedAt?: string;
  editor?: string;
  approvedBy?: string;
  approvedAt?: string;
  guidelineVersion?: string;
  retirementReason?: string;
}

export interface PatientChartRow {
  label: string;
  value: string;
  flag?: "high" | "low" | "critical";
}

export interface PatientChartSection {
  title: string;
  rows: PatientChartRow[];
}

export interface ScientificAbstract {
  title: string;
  background: string;
  methods: string;
  results: string;
  conclusion?: string;
}

export interface SequentialSet {
  setId: string;
  order: number;
  total: number;
  locksAfterSubmit: boolean;
}

export interface JsonlQuestion {
  id: string;
  questionId?: string;
  answerStats?: string;
  timestamp?: string;
  bankTitle?: string;
  blockName?: string;
  index?: number;
  stem: string;
  options: QuestionOption[];
  taxonomy: QuestionTaxonomy;
  explanation: QuestionExplanation;
  aiEnrichment?: QuestionAiEnrichment;
  media?: QuestionMedia;
  status: string;
}

export interface Question {
  id: string;
  questionId?: string;
  step: Step;
  format: QuestionFormat;
  contentUse: ContentUse;
  system: string;
  discipline: string;
  topic: string;
  subtopic?: string;
  bankTitle?: string;
  blockName?: string;
  difficulty: Difficulty;
  status: QuestionStatus;
  stem: string;
  choices: Choice[];
  options?: QuestionOption[];
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
  physicianTask?: string;
  competencies?: string[];
  references?: EvidenceReference[];
  governance?: ContentGovernance;
  patientChart?: PatientChartSection[];
  scientificAbstract?: ScientificAbstract;
  sequentialSet?: SequentialSet;
  answerStats?: string;
  taxonomy?: QuestionTaxonomy;
  richExplanation?: QuestionExplanation;
  aiEnrichment?: QuestionAiEnrichment;
  media?: QuestionMedia;
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
  examRunId?: string;
  examBlockIndex?: number;
  examBlockCount?: number;
  examDay?: boolean;
  timeLimitSeconds?: number;
}

export interface SessionRecord {
  id: string;
  createdAt: string;
  completedAt?: string;
  config: SessionConfig;
  questionIds: string[];
  currentIndex: number;
  answeredCount?: number;
  unansweredCount?: number;
  accuracy?: number;
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
  preparationStage?: "Early preparation" | "Building consistency" | "Dedicated period" | "Final review";
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

export interface LearnerProfile {
  name: string;
  email: string;
  medicalSchool: string;
  targetExam: Step;
  preparationStage: "Early preparation" | "Building consistency" | "Dedicated period" | "Final review";
  toolkitPriorities: string[];
  onboardingCompleted: boolean;
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

export interface InfluencerProfile {
  id: string;
  name: string;
  handle: string;
  email: string;
  password?: string;
  lastLogin?: string;
  avatarUrl?: string;
  commissionRate: number; // e.g. 0.30 for 30%
  tier: "Standard Partner" | "VIP Ambassador" | "Top Creator";
  defaultPromoCode: string; // e.g. "DRSARAH15"
  defaultDiscountPercent: number; // e.g. 15 for 15% off for student
  referralUrl: string;
  payoutMethod: "PayPal" | "Stripe" | "Bank Wire";
  payoutAccount: string;
  joinedDate: string;
  totalClicks: number;
  totalSignups: number;
}

export interface ReferralConversion {
  id: string;
  influencerId: string;
  customerMaskedEmail: string;
  planName: string;
  listPrice: number; // e.g. $200.00
  discountPercent: number; // e.g. 15 for 15%
  discountAmount: number; // listPrice * (discountPercent/100) e.g. $30.00
  customerPaid: number; // listPrice - discountAmount e.g. $170.00
  operationalCost: number; // 10% of listPrice e.g. $20.00
  netProfit: number; // listPrice - operationalCost - discountAmount e.g. $150.00
  influencerCommissionRate: number; // e.g. 0.30 (30%)
  commissionEarned: number; // netProfit * influencerCommissionRate e.g. $45.00
  promoCodeUsed: string;
  status: "Pending" | "Approved" | "Paid" | "Refunded";
  timestamp: string;
}

export interface PayoutRecord {
  id: string;
  influencerId: string;
  influencerName: string;
  amount: number;
  method: "PayPal" | "Stripe" | "Bank Wire";
  account: string;
  status: "Processing" | "Completed" | "Rejected";
  requestedAt: string;
  processedAt?: string;
  referenceNumber: string;
}

export interface MarketingAsset {
  id: string;
  title: string;
  category: "Banner" | "Social Story" | "Reel Overlay" | "Logo Pack" | "Copy Template";
  dimensions?: string;
  fileSize?: string;
  downloadUrl: string;
  previewText?: string;
  thumbnailUrl?: string;
}

export interface AppState {
  schemaVersion: number;
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
  learnerProfile: LearnerProfile;
  adminUsers: AdminUser[];
  reports: ContentReport[];
  notifications: NotificationItem[];
  savedArticles: string[];
  libraryActivity: LibraryActivity[];
  influencers: InfluencerProfile[];
  referralConversions: ReferralConversion[];
  payoutRecords: PayoutRecord[];
  activeInfluencerId: string;
  currentInfluencerId: string | null;
}
