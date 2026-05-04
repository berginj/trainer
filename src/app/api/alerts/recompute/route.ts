import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { validationErrorResponse } from "@/lib/api-response";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import {
  buildBaselineMissingFlag,
  buildBenchmarkConfidenceFlag,
  buildGoalResetDueFlag,
  buildMonthlyEvaluationDueFlag
} from "@/lib/safety-rules";

export const runtime = "nodejs";

const recomputeSchema = z.object({
  organizationId: z.string().min(1),
  playerId: z.string().min(1),
  asOfDate: z.coerce.date().default(() => new Date()),
  actorUserId: z.string().min(1).optional()
});

export async function POST(request: NextRequest) {
  const parsed = recomputeSchema.safeParse(await request.json());

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const forbidden = requirePlayerDataEntryAccess(request.headers, {
    organizationId: parsed.data.organizationId,
    playerId: parsed.data.playerId,
    requiresConsent: true
  });

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const [evaluationCount, latestEvaluation, lowConfidenceMetrics, dueGoals] = await Promise.all([
    prisma.evaluation.count({
      where: {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId
      }
    }),
    prisma.evaluation.findFirst({
      where: {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId
      },
      orderBy: { date: "desc" }
    }),
    prisma.metricDefinition.findMany({
      where: {
        OR: [{ benchmarkPolicy: "local_only" }, { confidenceLevel: "weak" }]
      },
      take: 10
    }),
    prisma.goal.findMany({
      where: {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId,
        status: "active",
        dueDate: {
          lte: parsed.data.asOfDate
        }
      },
      take: 10
    })
  ]);
  const alertDrafts = [
    buildBaselineMissingFlag(evaluationCount > 0),
    buildMonthlyEvaluationDueFlag({
      lastEvaluationDate: latestEvaluation?.date ?? null,
      asOfDate: parsed.data.asOfDate
    }),
    ...lowConfidenceMetrics.map((metric) => buildBenchmarkConfidenceFlag(metric)),
    ...dueGoals.map((goal) =>
      buildGoalResetDueFlag({
        dueDate: goal.dueDate,
        asOfDate: parsed.data.asOfDate
      })
    )
  ].filter((alert) => alert !== null);
  const existingOpenAlerts = await prisma.alert.findMany({
    where: {
      organizationId: parsed.data.organizationId,
      playerId: parsed.data.playerId,
      status: "open",
      sourceType: "alert_recompute",
      ruleCode: {
        in: alertDrafts.map((alert) => alert.ruleCode)
      }
    },
    select: {
      ruleCode: true
    }
  });
  const existingRuleCodes = new Set(existingOpenAlerts.map((alert) => alert.ruleCode));
  const newAlertDrafts = alertDrafts.filter((alert) => !existingRuleCodes.has(alert.ruleCode));
  const alerts = await Promise.all(
    newAlertDrafts.map((alert) =>
      prisma.alert.create({
        data: {
          organizationId: parsed.data.organizationId,
          playerId: parsed.data.playerId,
          severity: alert.severity,
          ruleCode: alert.ruleCode,
          sourceType: "alert_recompute",
          reason: alert.reason,
          nextAction: alert.nextAction
        }
      })
    )
  );

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: getRequestActorId(request.headers, parsed.data.actorUserId),
    action: "alerts.recomputed",
    entityType: "Player",
    entityId: parsed.data.playerId,
    metadata: {
      alertCount: alerts.length,
      skippedDuplicateCount: alertDrafts.length - newAlertDrafts.length
    }
  });

  return NextResponse.json({ alerts }, { status: 201 });
}
