import "server-only";

import crypto from "node:crypto";
import { AppwriteException, Permission, Role, type Models } from "node-appwrite";
import { createAdminServices, STEPWISE_TABLES } from "./appwrite-server";
import { initialState } from "./data";
import type { LearnerState } from "./learner-state";

type AppwriteUser = Models.User<Models.Preferences>;

function rowId(namespace: string, userId: string, objectId: string) {
  return crypto.createHash("sha256").update(`${namespace}:${userId}:${objectId}`).digest("hex").slice(0, 32);
}

function userReadPermission(userId: string) {
  return [Permission.read(Role.user(userId))];
}

function stableJson(value: unknown) {
  return JSON.stringify(value);
}

function artifactMap(state: LearnerState) {
  const entries: Array<[string, { type: string; objectId: string; data: unknown; updatedAt: string }]> = [];
  const now = new Date().toISOString();
  for (const note of state.notes) {
    entries.push([`note:${note.id}`, { type: "note", objectId: note.id, data: note, updatedAt: note.updatedAt }]);
  }
  for (const card of state.flashcards) {
    entries.push([`flashcard:${card.id}`, { type: "flashcard", objectId: card.id, data: card, updatedAt: card.lastReviewedAt ?? card.createdAt }]);
  }
  for (const task of state.studyTasks) {
    entries.push([`study_task:${task.id}`, { type: "study_task", objectId: task.id, data: task, updatedAt: `${task.date}T12:00:00.000Z` }]);
  }
  for (const questionId of state.bookmarks) {
    entries.push([`bookmark:${questionId}`, { type: "bookmark", objectId: questionId, data: { questionId }, updatedAt: now }]);
  }
  for (const questionId of state.flagged) {
    entries.push([`flag:${questionId}`, { type: "flag", objectId: questionId, data: { questionId }, updatedAt: now }]);
  }
  for (const articleId of state.savedArticles) {
    entries.push([`saved_article:${articleId}`, { type: "saved_article", objectId: articleId, data: { articleId }, updatedAt: now }]);
  }
  for (const activity of state.libraryActivity) {
    entries.push([`library_activity:${activity.articleId}`, { type: "library_activity", objectId: activity.articleId, data: activity, updatedAt: activity.lastOpenedAt }]);
  }
  entries.push(["settings:account", { type: "settings", objectId: "account", data: state.settings, updatedAt: now }]);
  entries.push(["study_plan:active", {
    type: "study_plan",
    objectId: "active",
    data: state.planSettings,
    updatedAt: now,
  }]);
  return new Map(entries);
}

async function inBatches(tasks: Array<() => Promise<void>>, size = 20) {
  for (let index = 0; index < tasks.length; index += size) {
    const results = await Promise.allSettled(tasks.slice(index, index + size).map((task) => task()));
    const failure = results.find((result): result is PromiseRejectedResult => result.status === "rejected");
    if (failure) throw failure.reason;
  }
}

async function upsertRow(input: {
  tableId: string;
  rowId: string;
  data: Record<string, unknown>;
  permissions?: string[];
}) {
  const { tables, config } = createAdminServices();
  try {
    await tables.updateRow({
      databaseId: config.databaseId,
      tableId: input.tableId,
      rowId: input.rowId,
      data: input.data,
      permissions: input.permissions,
    });
  } catch (error) {
    if (!(error instanceof AppwriteException) || error.code !== 404) throw error;
    await tables.createRow({
      databaseId: config.databaseId,
      tableId: input.tableId,
      rowId: input.rowId,
      data: input.data,
      permissions: input.permissions,
    });
  }
}

export async function syncNormalizedLearnerData(input: {
  user: AppwriteUser;
  state: LearnerState;
  previousState: LearnerState | null;
  revision: number;
}) {
  const { user, state, previousState, revision } = input;
  const now = new Date().toISOString();

  await upsertRow({
    tableId: STEPWISE_TABLES.profiles,
    rowId: user.$id,
    permissions: userReadPermission(user.$id),
    data: {
      userId: user.$id,
      name: user.name || state.learnerProfile.name,
      email: user.email,
      emailVerified: user.emailVerification,
      ...(state.learnerProfile.medicalSchool ? { medicalSchool: state.learnerProfile.medicalSchool } : {}),
      targetExam: state.learnerProfile.targetExam,
      preparationStage: state.learnerProfile.preparationStage,
      onboardingCompleted: state.learnerProfile.onboardingCompleted,
      preferences: stableJson({
        toolkitPriorities: state.learnerProfile.toolkitPriorities,
      }),
      stateRevision: revision,
      lastSyncedAt: now,
    },
  });

  const previousAttemptIds = new Set(previousState?.attempts.map((attempt) => attempt.id) ?? []);
  const answerKeys = new Map(initialState.questions.map((question) => [question.id, question.correctChoiceId]));
  const newAttempts = state.attempts.filter((attempt) => !previousAttemptIds.has(attempt.id));
  await inBatches(newAttempts.map((attempt) => async () => {
    const authoritativeAnswer = answerKeys.get(attempt.questionId);
    const scoringVerified = typeof authoritativeAnswer === "string";
    const correct = scoringVerified ? attempt.selectedChoiceId === authoritativeAnswer : attempt.correct;
    try {
      const { tables, config } = createAdminServices();
      await tables.createRow({
        databaseId: config.databaseId,
        tableId: STEPWISE_TABLES.attempts,
        rowId: rowId("attempt", user.$id, attempt.id),
        permissions: userReadPermission(user.$id),
        data: {
          userId: user.$id,
          attemptId: attempt.id,
          questionId: attempt.questionId,
          sessionId: attempt.sessionId,
          selectedChoiceId: attempt.selectedChoiceId,
          correct,
          scoringVerified,
          confidence: attempt.confidence,
          timeSec: attempt.timeSec,
          mode: attempt.mode,
          createdAt: attempt.createdAt,
        },
      });
    } catch (error) {
      if (!(error instanceof AppwriteException) || error.code !== 409) throw error;
    }
  }));

  const previousSessions = new Map(previousState?.sessions.map((session) => [session.id, stableJson(session)]) ?? []);
  const changedSessions = state.sessions.filter((session) => previousSessions.get(session.id) !== stableJson(session));
  await inBatches(changedSessions.map((session) => async () => {
    await upsertRow({
      tableId: STEPWISE_TABLES.sessions,
      rowId: rowId("session", user.$id, session.id),
      permissions: userReadPermission(user.$id),
      data: {
        userId: user.$id,
        sessionId: session.id,
        status: session.completedAt ? "completed" : "active",
        config: stableJson(session.config),
        questionIds: stableJson(session.questionIds),
        currentIndex: session.currentIndex,
        answeredCount: session.answeredCount ?? 0,
        createdAt: session.createdAt,
        updatedAt: now,
        ...(session.unansweredCount !== undefined ? { unansweredCount: session.unansweredCount } : {}),
        ...(session.accuracy !== undefined ? { accuracy: session.accuracy } : {}),
        ...(session.completedAt ? { completedAt: session.completedAt } : {}),
      },
    });
  }));

  const previousArtifacts = previousState ? artifactMap(previousState) : new Map();
  const nextArtifacts = artifactMap(state);
  const artifactTasks: Array<() => Promise<void>> = [];
  for (const [key, artifact] of nextArtifacts) {
    if (stableJson(previousArtifacts.get(key)) === stableJson(artifact)) continue;
    artifactTasks.push(async () => {
      await upsertRow({
        tableId: STEPWISE_TABLES.artifacts,
        rowId: rowId("artifact", user.$id, key),
        permissions: userReadPermission(user.$id),
        data: {
          userId: user.$id,
          artifactKey: key,
          artifactType: artifact.type,
          objectId: artifact.objectId,
          data: stableJson(artifact.data),
          deleted: false,
          updatedAt: artifact.updatedAt,
        },
      });
    });
  }
  for (const [key, artifact] of previousArtifacts) {
    if (nextArtifacts.has(key)) continue;
    artifactTasks.push(async () => {
      await upsertRow({
        tableId: STEPWISE_TABLES.artifacts,
        rowId: rowId("artifact", user.$id, key),
        permissions: userReadPermission(user.$id),
        data: {
          userId: user.$id,
          artifactKey: key,
          artifactType: artifact.type,
          objectId: artifact.objectId,
          data: "{}",
          deleted: true,
          updatedAt: now,
        },
      });
    });
  }
  await inBatches(artifactTasks);
}
