import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validationErrorResponse } from "@/lib/api-response";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import {
  buildBaselineMissingFlag,
  buildBenchmarkConfidenceFlag,
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

  const prisma = getPrisma();
  const [evaluationCount, latestEvaluation, lowConfidenceMetrics] = await Promise.all([
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
    })
  ]);
  const alertDrafts = [
    buildBaselineMissingFlag(evaluationCount > 0),
    buildMonthlyEvaluationDueFlag({
      lastEvaluationDate: latestEvaluation?.date ?? null,
      asOfDate: parsed.data.asOfDate
    }),
    ...lowConfidenceMetrics.map((metric) => buildBenchmarkConfidenceFlag(metric))
  ].filter((alert) => alert !== null);
  const alerts = await Promise.all(
    alertDrafts.map((alert) =>
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
    actorUserId: parsed.data.actorUserId ?? null,
    action: "alerts.recomputed",
    entityType: "Player",
    entityId: parsed.data.playerId,
    metadata: {
      alertCount: alerts.length
    }
  });

  return NextResponse.json({ alerts }, { status: 201 });
}
