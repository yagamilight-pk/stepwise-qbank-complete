"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useState } from "react";
import { generateStudyPlan, reviewFlashcard } from "./algorithms";
import { initialState } from "./data";
import type { AdminUser, AppState, Attempt, ContentReport, Flashcard, InfluencerProfile, LibraryActivity, Note, Question, ReviewRating, SessionRecord, StudyPlanSettings, StudyTask, UserSettings } from "./types";

const STORAGE_KEY = "stepwise-qbank-state-v7";
const LEGACY_STORAGE_KEYS = ["stepwise-qbank-state-v6", "stepwise-qbank-state-v5", "stepwise-qbank-state-v4", "stepwise-qbank-state-v3", "stepwise-qbank-state-v2", "stepwise-qbank-state-v1"];

type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "ADD_ATTEMPT"; attempt: Attempt }
  | { type: "TOGGLE_BOOKMARK"; questionId: string }
  | { type: "TOGGLE_FLAG"; questionId: string }
  | { type: "UPSERT_NOTE"; note: Note }
  | { type: "DELETE_NOTE"; id: string }
  | { type: "UPSERT_FLASHCARD"; card: Flashcard }
  | { type: "DELETE_FLASHCARD"; id: string }
  | { type: "REVIEW_FLASHCARD"; id: string; rating: ReviewRating }
  | { type: "ADD_SESSION"; session: SessionRecord }
  | { type: "UPDATE_SESSION"; id: string; patch: Partial<SessionRecord> }
  | { type: "SET_PLAN_SETTINGS"; settings: StudyPlanSettings }
  | { type: "SET_STUDY_TASKS"; tasks: StudyTask[] }
  | { type: "TOGGLE_TASK"; id: string }
  | { type: "SET_SETTINGS"; settings: Partial<UserSettings> }
  | { type: "UPSERT_QUESTION"; question: Question }
  | { type: "DELETE_QUESTION"; id: string }
  | { type: "SET_REPORT_STATUS"; id: string; status: ContentReport["status"] }
  | { type: "ADD_REPORT"; report: ContentReport }
  | { type: "TOGGLE_SAVED_ARTICLE"; articleId: string }
  | { type: "SET_LIBRARY_ACTIVITY"; activity: LibraryActivity }
  | { type: "UPDATE_ADMIN_USER"; id: string; patch: Partial<AdminUser> }
  | { type: "MARK_NOTIFICATIONS_READ" }
  | { type: "UPDATE_INFLUENCER_PAYOUT_METHOD"; influencerId: string; method: "PayPal" | "Stripe" | "Bank Wire"; account: string }
  | { type: "REQUEST_PAYOUT"; influencerId: string; amount: number; method: "PayPal" | "Stripe" | "Bank Wire"; account: string }
  | { type: "APPROVE_PAYOUT"; payoutId: string }
  | { type: "SET_ACTIVE_INFLUENCER"; influencerId: string }
  | { type: "LOGIN_INFLUENCER"; influencerId: string }
  | { type: "LOGOUT_INFLUENCER" }
  | { type: "ADD_INFLUENCER"; influencer: InfluencerProfile }
  | { type: "DELETE_INFLUENCER"; id: string }
  | { type: "UPSERT_INFLUENCER"; influencer: InfluencerProfile }
  | { type: "RESET" };

function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case "HYDRATE": return action.state;
    case "ADD_ATTEMPT": return { ...state, attempts: [...state.attempts, action.attempt] };
    case "TOGGLE_BOOKMARK": return { ...state, bookmarks: state.bookmarks.includes(action.questionId) ? state.bookmarks.filter((id) => id !== action.questionId) : [...state.bookmarks, action.questionId] };
    case "TOGGLE_FLAG": return { ...state, flagged: state.flagged.includes(action.questionId) ? state.flagged.filter((id) => id !== action.questionId) : [...state.flagged, action.questionId] };
    case "UPSERT_NOTE": return { ...state, notes: state.notes.some((note) => note.id === action.note.id) ? state.notes.map((note) => note.id === action.note.id ? action.note : note) : [action.note, ...state.notes] };
    case "DELETE_NOTE": return { ...state, notes: state.notes.filter((note) => note.id !== action.id) };
    case "UPSERT_FLASHCARD": return { ...state, flashcards: state.flashcards.some((card) => card.id === action.card.id) ? state.flashcards.map((card) => card.id === action.card.id ? action.card : card) : [action.card, ...state.flashcards] };
    case "DELETE_FLASHCARD": return { ...state, flashcards: state.flashcards.filter((card) => card.id !== action.id) };
    case "REVIEW_FLASHCARD": return { ...state, flashcards: state.flashcards.map((card) => card.id === action.id ? reviewFlashcard(card, action.rating) : card) };
    case "ADD_SESSION": return { ...state, sessions: [action.session, ...state.sessions] };
    case "UPDATE_SESSION": return { ...state, sessions: state.sessions.map((session) => session.id === action.id ? { ...session, ...action.patch } : session) };
    case "SET_PLAN_SETTINGS": return { ...state, planSettings: action.settings };
    case "SET_STUDY_TASKS": return { ...state, studyTasks: action.tasks };
    case "TOGGLE_TASK": return { ...state, studyTasks: state.studyTasks.map((task) => task.id === action.id ? { ...task, completed: !task.completed } : task) };
    case "SET_SETTINGS": return { ...state, settings: { ...state.settings, ...action.settings } };
    case "UPSERT_QUESTION": return { ...state, questions: state.questions.some((question) => question.id === action.question.id) ? state.questions.map((question) => question.id === action.question.id ? action.question : question) : [action.question, ...state.questions] };
    case "DELETE_QUESTION": return { ...state, questions: state.questions.filter((question) => question.id !== action.id) };
    case "SET_REPORT_STATUS": return { ...state, reports: state.reports.map((report) => report.id === action.id ? { ...report, status: action.status } : report) };
    case "ADD_REPORT": return { ...state, reports: [action.report, ...state.reports] };
    case "TOGGLE_SAVED_ARTICLE": return { ...state, savedArticles: state.savedArticles.includes(action.articleId) ? state.savedArticles.filter((id) => id !== action.articleId) : [...state.savedArticles, action.articleId] };
    case "SET_LIBRARY_ACTIVITY": return { ...state, libraryActivity: state.libraryActivity.some((item) => item.articleId === action.activity.articleId) ? state.libraryActivity.map((item) => item.articleId === action.activity.articleId ? action.activity : item) : [action.activity, ...state.libraryActivity] };
    case "UPDATE_ADMIN_USER": return { ...state, adminUsers: state.adminUsers.map((user) => user.id === action.id ? { ...user, ...action.patch } : user) };
    case "UPDATE_INFLUENCER_PAYOUT_METHOD": return { ...state, influencers: state.influencers.map((inf) => inf.id === action.influencerId ? { ...inf, payoutMethod: action.method, payoutAccount: action.account } : inf) };
    case "REQUEST_PAYOUT": {
      const inf = state.influencers.find((i) => i.id === action.influencerId);
      const newRecord = {
        id: `pay_${Date.now().toString(36)}`,
        influencerId: action.influencerId,
        influencerName: inf?.name || "Influencer Partner",
        amount: action.amount,
        method: action.method,
        account: action.account,
        status: "Processing" as const,
        requestedAt: new Date().toISOString(),
        referenceNumber: `PAY-REQ-${Math.floor(100000 + Math.random() * 900000)}`
      };
      return { ...state, payoutRecords: [newRecord, ...state.payoutRecords] };
    }
    case "APPROVE_PAYOUT": {
      const targetPayout = state.payoutRecords.find((p) => p.id === action.payoutId);
      if (!targetPayout) return state;
      const updatedPayouts = state.payoutRecords.map((p) => p.id === action.payoutId ? { ...p, status: "Completed" as const, processedAt: new Date().toISOString() } : p);
      const updatedConversions = state.referralConversions.map((c) => c.influencerId === targetPayout.influencerId && c.status === "Approved" ? { ...c, status: "Paid" as const } : c);
      return { ...state, payoutRecords: updatedPayouts, referralConversions: updatedConversions };
    }
    case "SET_ACTIVE_INFLUENCER": return { ...state, activeInfluencerId: action.influencerId };
    case "LOGIN_INFLUENCER": return { ...state, currentInfluencerId: action.influencerId, activeInfluencerId: action.influencerId, influencers: state.influencers.map(i => i.id === action.influencerId ? { ...i, lastLogin: new Date().toISOString() } : i) };
    case "LOGOUT_INFLUENCER": return { ...state, currentInfluencerId: null };
    case "ADD_INFLUENCER": return { ...state, influencers: [action.influencer, ...state.influencers] };
    case "DELETE_INFLUENCER": return { ...state, influencers: state.influencers.filter(i => i.id !== action.id), currentInfluencerId: state.currentInfluencerId === action.id ? null : state.currentInfluencerId };
    case "UPSERT_INFLUENCER": return { ...state, influencers: state.influencers.some((inf) => inf.id === action.influencer.id) ? state.influencers.map((inf) => inf.id === action.influencer.id ? action.influencer : inf) : [...state.influencers, action.influencer] };
    case "MARK_NOTIFICATIONS_READ": return { ...state, notifications: state.notifications.map((notification) => ({ ...notification, read: true })) };
    case "RESET": return initialState;
    default: return state;
  }
}

interface StoreValue {
  state: AppState;
  hydrated: boolean;
  dispatch: React.Dispatch<Action>;
  resetDemo: () => void;
  rebuildPlan: (settings?: StudyPlanSettings) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function isAppState(value: unknown): value is Partial<AppState> {
  return Boolean(value && typeof value === "object" && "questions" in value && "settings" in value);
}

function normalizeState(value: Partial<AppState>): AppState {
  const seededQuestions = new Map(initialState.questions.map((question) => [question.id, question]));
  for (const question of value.questions ?? []) seededQuestions.set(question.id, question);
  return {
    ...initialState,
    ...value,
    questions: [...seededQuestions.values()],
    attempts: value.attempts ?? initialState.attempts,
    notes: value.notes ?? initialState.notes,
    flashcards: value.flashcards ?? initialState.flashcards,
    bookmarks: value.bookmarks ?? initialState.bookmarks,
    flagged: value.flagged ?? initialState.flagged,
    sessions: value.sessions ?? initialState.sessions,
    studyTasks: value.studyTasks?.length ? value.studyTasks : initialState.studyTasks,
    planSettings: { ...initialState.planSettings, ...(value.planSettings ?? {}) },
    settings: { ...initialState.settings, ...(value.settings ?? {}) },
    adminUsers: value.adminUsers?.length ? value.adminUsers : initialState.adminUsers,
    reports: value.reports ?? initialState.reports,
    notifications: value.notifications?.length ? value.notifications : initialState.notifications,
    savedArticles: value.savedArticles ?? initialState.savedArticles,
    libraryActivity: value.libraryActivity ?? initialState.libraryActivity
  };
}

export function StepwiseProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed: unknown = JSON.parse(stored);
        if (isAppState(parsed)) dispatch({ type: "HYDRATE", state: normalizeState(parsed) });
      }
    } catch (error) {
      console.warn("Unable to restore Stepwise demo state", error);
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }, [state, hydrated]);

  useEffect(() => {
    const root = document.documentElement;
    const wantsDark = state.settings.theme === "dark" || (state.settings.theme === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    root.dataset.theme = wantsDark ? "dark" : "light";
    root.dataset.motion = state.settings.reducedMotion ? "reduced" : "full";
    root.dataset.density = state.settings.compactMode ? "compact" : "comfortable";
    root.dataset.contrast = state.settings.highContrast ? "high" : "standard";
    root.dataset.textSize = state.settings.largeText ? "large" : "standard";
  }, [state.settings]);

  const resetDemo = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    LEGACY_STORAGE_KEYS.forEach((key) => localStorage.removeItem(key));
    dispatch({ type: "RESET" });
  }, []);

  const rebuildPlan = useCallback((settings = state.planSettings) => {
    dispatch({ type: "SET_PLAN_SETTINGS", settings });
    dispatch({ type: "SET_STUDY_TASKS", tasks: generateStudyPlan(settings, state.questions, state.attempts) });
  }, [state.planSettings, state.questions, state.attempts]);

  const value = useMemo(() => ({ state, hydrated, dispatch, resetDemo, rebuildPlan }), [state, hydrated, resetDemo, rebuildPlan]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStepwise() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStepwise must be used inside StepwiseProvider");
  return value;
}
