"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { generateStudyPlan, reviewFlashcard } from "./algorithms";
import { initialState } from "./data";
import { isLearnerState, mergeLearnerState, selectLearnerState, type LearnerState } from "./learner-state";
import type { AdminUser, AppState, Attempt, ContentReport, Flashcard, InfluencerProfile, LearnerProfile, LibraryActivity, Note, Question, ReviewRating, SessionRecord, StudyPlanSettings, StudyTask, UserSettings } from "./types";

const STORAGE_KEY = "stepwise-qbank-state-v8";
const LEGACY_STORAGE_KEYS = ["stepwise-qbank-state-v7", "stepwise-qbank-state-v6", "stepwise-qbank-state-v5", "stepwise-qbank-state-v4", "stepwise-qbank-state-v3", "stepwise-qbank-state-v2", "stepwise-qbank-state-v1"];

type Action =
  | { type: "HYDRATE"; state: AppState }
  | { type: "HYDRATE_LEARNER"; state: LearnerState }
  | { type: "ADD_ATTEMPT"; attempt: Attempt }
  | { type: "UPSERT_ATTEMPT"; attempt: Attempt }
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
  | { type: "SET_LEARNER_PROFILE"; profile: Partial<LearnerProfile> }
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
    case "HYDRATE_LEARNER": return mergeLearnerState(state, action.state);
    case "ADD_ATTEMPT": return { ...state, attempts: [...state.attempts, action.attempt] };
    case "UPSERT_ATTEMPT": return {
      ...state,
      attempts: state.attempts.some((attempt) => attempt.sessionId === action.attempt.sessionId && attempt.questionId === action.attempt.questionId)
        ? state.attempts.map((attempt) => attempt.sessionId === action.attempt.sessionId && attempt.questionId === action.attempt.questionId ? action.attempt : attempt)
        : [...state.attempts, action.attempt]
    };
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
    case "SET_LEARNER_PROFILE": return { ...state, learnerProfile: { ...state.learnerProfile, ...action.profile } };
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
  persistenceStatus: "loading" | "ready" | "error";
  cloudStatus: "loading" | "syncing" | "ready" | "disabled" | "error";
  dispatch: React.Dispatch<Action>;
  resetDemo: () => void;
  rebuildPlan: (settings?: StudyPlanSettings) => void;
}

const StoreContext = createContext<StoreValue | null>(null);

function isAppState(value: unknown): value is Partial<AppState> {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<AppState>;
  return Array.isArray(candidate.questions)
    && Array.isArray(candidate.attempts ?? [])
    && Boolean(candidate.settings && typeof candidate.settings === "object")
    && Boolean(candidate.planSettings && typeof candidate.planSettings === "object");
}

function normalizeQuestion(question: Question): Question {
  return {
    ...question,
    format: question.format ?? "Single best answer",
    contentUse: question.contentUse ?? "Demo",
    competencies: question.competencies ?? [],
    references: question.references ?? [],
    governance: question.governance ?? {
      version: 1,
      rightsStatus: "Pending verification"
    }
  };
}

function normalizeState(value: Partial<AppState>): AppState {
  const seededQuestions = new Map(initialState.questions.map((question) => [question.id, normalizeQuestion(question)]));
  for (const question of value.questions ?? []) seededQuestions.set(question.id, normalizeQuestion(question));
  return {
    ...initialState,
    ...value,
    schemaVersion: initialState.schemaVersion,
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
    learnerProfile: { ...initialState.learnerProfile, ...(value.learnerProfile ?? {}) },
    adminUsers: value.adminUsers?.length ? value.adminUsers : initialState.adminUsers,
    reports: value.reports ?? initialState.reports,
    notifications: value.notifications?.length ? value.notifications : initialState.notifications,
    savedArticles: value.savedArticles ?? initialState.savedArticles,
    libraryActivity: value.libraryActivity ?? initialState.libraryActivity
  };
}

export function StepwiseProvider({
  children,
  cloudSyncEnabled = false,
}: {
  children: React.ReactNode;
  cloudSyncEnabled?: boolean;
}) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [hydrated, setHydrated] = useState(false);
  const [persistenceStatus, setPersistenceStatus] = useState<StoreValue["persistenceStatus"]>("loading");
  const [cloudStatus, setCloudStatus] = useState<StoreValue["cloudStatus"]>(
    cloudSyncEnabled ? "loading" : "disabled",
  );
  const cloudEnabledRef = useRef(false);
  const cloudRevisionRef = useRef(0);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
          ?? LEGACY_STORAGE_KEYS.map((key) => localStorage.getItem(key)).find(Boolean)
          ?? null;
        if (stored) {
          const parsed: unknown = JSON.parse(stored);
          if (isAppState(parsed)) dispatch({ type: "HYDRATE", state: normalizeState(parsed) });
        }
      } catch (error) {
        console.warn("Unable to restore Stepwise demo state", error);
        setPersistenceStatus("error");
      } finally {
        setHydrated(true);
        setPersistenceStatus((current) => current === "error" ? "error" : "ready");
      }
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!cloudSyncEnabled) {
      cloudEnabledRef.current = false;
      return;
    }
    const controller = new AbortController();
    const restoreCloudState = async () => {
      try {
        const response = await fetch("/api/state", { cache: "no-store", signal: controller.signal });
        const payload: unknown = await response.json().catch(() => null);
        const remoteUser = payload && typeof payload === "object" && "user" in payload
          ? (payload as { user?: unknown }).user
          : null;
        let remoteProfile: Partial<LearnerProfile> = {};
        if (remoteUser && typeof remoteUser === "object") {
          const candidate = remoteUser as { name?: unknown; email?: unknown; emailVerified?: unknown };
          remoteProfile = {
            ...(typeof candidate.name === "string" && candidate.name ? { name: candidate.name } : {}),
            ...(typeof candidate.email === "string" && candidate.email ? { email: candidate.email } : {}),
            ...(typeof candidate.emailVerified === "boolean" ? { emailVerified: candidate.emailVerified } : {}),
          };
        }
        if (response.status === 401 || response.status === 503) {
          setCloudStatus("disabled");
          return;
        }
        if (response.status === 404) {
          cloudRevisionRef.current = 0;
          dispatch({ type: "SET_LEARNER_PROFILE", profile: remoteProfile });
          cloudEnabledRef.current = true;
          setCloudStatus("ready");
          return;
        }
        if (!response.ok) throw new Error(`Cloud restore failed (${response.status})`);
        const remoteState = payload && typeof payload === "object" && "state" in payload
          ? (payload as { state: unknown }).state
          : null;
        if (!isLearnerState(remoteState)) throw new Error("Cloud state response is invalid");
        const remoteRevision = payload && typeof payload === "object" && "revision" in payload
          ? Number((payload as { revision?: unknown }).revision)
          : 0;
        cloudRevisionRef.current = Number.isInteger(remoteRevision) && remoteRevision >= 0 ? remoteRevision : 0;
        dispatch({ type: "HYDRATE_LEARNER", state: remoteState });
        dispatch({ type: "SET_LEARNER_PROFILE", profile: remoteProfile });
        cloudEnabledRef.current = true;
        setCloudStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("Unable to restore Stepwise cloud state", error);
        setCloudStatus("error");
      }
    };
    restoreCloudState();
    return () => controller.abort();
  }, [cloudSyncEnabled, hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    const save = () => {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
        setPersistenceStatus("ready");
      } catch (error) {
        console.warn("Unable to save Stepwise demo state", error);
        setPersistenceStatus("error");
      }
    };
    const idleWindow = window as Window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (idleWindow.requestIdleCallback) {
      const idleId = idleWindow.requestIdleCallback(save, { timeout: 500 });
      return () => idleWindow.cancelIdleCallback?.(idleId);
    }
    const timer = window.setTimeout(save, 120);
    return () => window.clearTimeout(timer);
  }, [state, hydrated]);

  useEffect(() => {
    if (!hydrated || !cloudEnabledRef.current) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setCloudStatus("syncing");
      try {
        const response = await fetch("/api/state", {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            state: selectLearnerState(state),
            baseRevision: cloudRevisionRef.current,
          }),
          signal: controller.signal,
        });
        const payload = await response.json().catch(() => null) as { revision?: unknown } | null;
        if (!response.ok) throw new Error(response.status === 409 ? "Cloud state changed on another device" : `Cloud save failed (${response.status})`);
        const revision = Number(payload?.revision);
        if (Number.isInteger(revision) && revision >= 0) cloudRevisionRef.current = revision;
        setCloudStatus("ready");
      } catch (error) {
        if (controller.signal.aborted) return;
        console.warn("Unable to save Stepwise cloud state", error);
        setCloudStatus("error");
      }
    }, 750);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
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

  const value = useMemo(() => ({ state, hydrated, persistenceStatus, cloudStatus, dispatch, resetDemo, rebuildPlan }), [state, hydrated, persistenceStatus, cloudStatus, resetDemo, rebuildPlan]);
  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStepwise() {
  const value = useContext(StoreContext);
  if (!value) throw new Error("useStepwise must be used inside StepwiseProvider");
  return value;
}
