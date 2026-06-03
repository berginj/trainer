import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { buildGrowthPlusSymptomAlert } from "@/lib/safety-rules";
import { measurementCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

function decimalToNumber(value: unknown) {
  return value === null || value === undefined ? null : Number(value);
}

function isPerformanceDrop(input: {
  metricCode: string;
  currentValue: number | null;
  previousValue: number | null;
}) {
  if (input.currentValue === null || input.previousValue === null || input.previousValue === 0) {
    return false;
  }

  if (input.metricCode === "sprint_10m_s") {
    return input.currentValue > input.previousValue * 1.05;
  }

  if (input.metricCode === "vertical_jump_cm") {
    return input.currentValue < input.previousValue * 0.95;
  }

  return false;
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, measurementCreateSchema);

  if (parsed.response) {
    return parsed.response;
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
  const actorUserId = getRequestActorId(request.headers, parsed.data.enteredByUserId);
  const measurement = await prisma.measurement.create({
    data: {
      ...parsed.data,
      enteredByUserId: actorUserId ?? parsed.data.enteredByUserId,
      context: parsed.data.context as Prisma.InputJsonValue
    }
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "measurement.created",
    entityType: "Measurement",
    entityId: measurement.id,
    metadata: {
      playerId: parsed.data.playerId,
      metricDefinitionId: parsed.data.metricDefinitionId
    }
  });
  const metricDefinition = await prisma.metricDefinition.findUnique({
    where: { id: parsed.data.metricDefinitionId },
    select: { code: true }
  });

  if (metricDefinition) {
    const heightMetric = await prisma.metricDefinition.findFirst({
      where: {
        code: "height_cm",
        OR: [{ organizationId: parsed.data.organizationId }, { organizationId: null }]
      },
      select: { id: true }
    });
    const heightMeasurements = heightMetric
      ? await prisma.measurement.findMany({
          where: {
            organizationId: parsed.data.organizationId,
            playerId: parsed.data.playerId,
            metricDefinitionId: heightMetric.id,
            valueNumber: { not: null }
          },
          orderBy: { createdAt: "desc" },
          take: 2
        })
      : [];
    const latestHeight = heightMeasurements[0] ?? null;
    const previousHeight = heightMeasurements[1] ?? null;
    const heightIncreaseCm =
      latestHeight && previousHeight
        ? (decimalToNumber(latestHeight.valueNumber) ?? 0) - (decimalToNumber(previousHeight.valueNumber) ?? 0)
        : 0;
    const heightWindowDays =
      latestHeight && previousHeight
        ? Math.max(1, (latestHeight.createdAt.getTime() - previousHeight.createdAt.getTime()) / (1000 * 60 * 60 * 24))
        : 0;
    const recentPain = await prisma.readinessCheck.findFirst({
      where: {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId,
        painAny: true,
        date: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        }
      },
      select: { id: true }
    });
    const previousPerformanceMeasurement =
      metricDefinition.code === "sprint_10m_s" || metricDefinition.code === "vertical_jump_cm"
        ? await prisma.measurement.findFirst({
            where: {
              organizationId: parsed.data.organizationId,
              playerId: parsed.data.playerId,
              metricDefinitionId: parsed.data.metricDefinitionId,
              valueNumber: { not: null },
              id: { not: measurement.id },
              createdAt: { lt: measurement.createdAt }
            },
            orderBy: { createdAt: "desc" }
          })
        : null;
    const alert = buildGrowthPlusSymptomAlert({
      heightIncreaseCm,
      days: heightWindowDays,
      painAny: Boolean(recentPain),
      performanceDrop: isPerformanceDrop({
        metricCode: metricDefinition.code,
        currentValue: decimalToNumber(measurement.valueNumber),
        previousValue: decimalToNumber(previousPerformanceMeasurement?.valueNumber)
      })
    });

    if (alert) {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          organizationId: parsed.data.organizationId,
          playerId: parsed.data.playerId,
          ruleCode: alert.ruleCode,
          sourceType: "growth_context",
          status: "open"
        }
      });

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            organizationId: parsed.data.organizationId,
            playerId: parsed.data.playerId,
            severity: alert.severity,
            ruleCode: alert.ruleCode,
            sourceType: "growth_context",
            sourceId: measurement.id,
            reason: alert.reason,
            nextAction: alert.nextAction
          }
        });
      }
    }
  }

  return NextResponse.json({ measurement }, { status: 201 });
}
