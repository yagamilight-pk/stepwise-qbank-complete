import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { Permission, Query, Role } from "node-appwrite";
import { logAuditEvent } from "@/lib/audit";
import { createAdminServices, isAppwriteAdminConfigured, STEPWISE_TABLES } from "@/lib/appwrite-server";
import { initialState } from "@/lib/data";
import {
  betaMastery,
  calculateItemStatistics,
  type ItemObservation,
} from "@/lib/psychometrics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MAX_ATTEMPTS_PER_RUN = 50_000;

function masteryRowId(userId: string, system: string) {
  return crypto.createHash("sha256").update(`mastery:${userId}:system:${system}`).digest("hex").slice(0, 32);
}

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isAppwriteAdminConfigured()) {
    return NextResponse.json({ error: "Psychometric database is unavailable" }, { status: 503 });
  }

  const { tables, config } = createAdminServices();
  const rows: Array<Record<string, unknown>> = [];
  let cursor: string | undefined;
  let total = 0;
  while (rows.length < MAX_ATTEMPTS_PER_RUN) {
    const page = await tables.listRows({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.attempts,
      queries: [
        Query.equal("scoringVerified", true),
        Query.orderAsc("$id"),
        Query.limit(500),
        ...(cursor ? [Query.cursorAfter(cursor)] : []),
      ],
    });
    total = page.total;
    rows.push(...page.rows as unknown as Array<Record<string, unknown>>);
    if (page.rows.length < 500) break;
    cursor = page.rows.at(-1)?.$id;
    if (!cursor) break;
  }
  if (total > rows.length) {
    await logAuditEvent({
      event: "psychometrics.run.capacity_exceeded",
      level: "error",
      details: { total, maximum: MAX_ATTEMPTS_PER_RUN },
    });
    return NextResponse.json(
      { error: "Attempt volume exceeds the in-request aggregation limit" },
      { status: 503 },
    );
  }

  const questionMap = new Map(initialState.questions.map(question => [question.id, question]));
  const observations: ItemObservation[] = rows.flatMap(row => {
    const learnerId = typeof row.userId === "string" ? row.userId : "";
    const itemId = typeof row.questionId === "string" ? row.questionId : "";
    const selectedChoiceId = typeof row.selectedChoiceId === "string" ? row.selectedChoiceId : "";
    const createdAt = typeof row.createdAt === "string" ? row.createdAt : "";
    if (!learnerId || !itemId || !selectedChoiceId || !createdAt || !questionMap.has(itemId)) return [];
    return [{
      learnerId,
      itemId,
      selectedChoiceId,
      correct: row.correct === true,
      timeSec: typeof row.timeSec === "number" ? row.timeSec : 0,
      confidence: typeof row.confidence === "number" ? row.confidence : undefined,
      createdAt,
    }];
  });

  const calculatedAt = new Date().toISOString();
  let eligibleItems = 0;
  for (const question of initialState.questions) {
    const statistics = calculateItemStatistics(
      question.id,
      observations,
      question.choices.map(choice => choice.id),
      question.correctChoiceId,
    );
    if (statistics.eligibleForOperationalUse) eligibleItems += 1;
    await tables.upsertRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.itemStatistics,
      rowId: question.id,
      data: {
        questionId: question.id,
        sampleSize: statistics.sampleSize,
        exposureCount: statistics.sampleSize,
        eligible: statistics.eligibleForOperationalUse,
        lastCalculatedAt: calculatedAt,
        ...(statistics.proportionCorrect !== null ? { pValue: statistics.proportionCorrect } : {}),
        ...(statistics.pointBiserial !== null ? { pointBiserial: statistics.pointBiserial } : {}),
        ...(statistics.upperLowerDiscrimination !== null
          ? { discrimination: statistics.upperLowerDiscrimination }
          : {}),
        ...(statistics.distractorEfficiency !== null
          ? { distractorEfficiency: statistics.distractorEfficiency }
          : {}),
        ...(statistics.medianTimeSec !== null ? { medianTimeSec: Math.round(statistics.medianTimeSec) } : {}),
        ...(statistics.meanConfidence !== null ? { meanConfidence: statistics.meanConfidence } : {}),
      },
    });
  }

  const masteryGroups = new Map<string, ItemObservation[]>();
  for (const observation of observations) {
    const system = questionMap.get(observation.itemId)?.system;
    if (!system) continue;
    const key = `${observation.learnerId}\u0000${system}`;
    const group = masteryGroups.get(key) ?? [];
    group.push(observation);
    masteryGroups.set(key, group);
  }
  for (const [key, group] of masteryGroups) {
    const [userId, system] = key.split("\u0000");
    const posterior = betaMastery(group);
    await tables.upsertRow({
      databaseId: config.databaseId,
      tableId: STEPWISE_TABLES.mastery,
      rowId: masteryRowId(userId, system),
      permissions: [Permission.read(Role.user(userId))],
      data: {
        userId,
        dimensionType: "system",
        dimensionKey: system,
        alpha: posterior.alpha,
        beta: posterior.beta,
        mastery: posterior.mean,
        attempts: group.length,
        updatedAt: calculatedAt,
      },
    });
  }

  await logAuditEvent({
    event: "psychometrics.run.completed",
    details: {
      verifiedAttempts: observations.length,
      itemCount: initialState.questions.length,
      eligibleItems,
      masteryRows: masteryGroups.size,
    },
  });
  return NextResponse.json({
    success: true,
    verifiedAttempts: observations.length,
    itemCount: initialState.questions.length,
    eligibleItems,
    masteryRows: masteryGroups.size,
  });
}
