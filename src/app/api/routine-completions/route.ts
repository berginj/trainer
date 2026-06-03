import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { buildMissedWarmupAlert, buildPainAlert, buildRoutineNonComplianceAlert } from "@/lib/safety-rules";
import { routineCompletionCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

function getUtcWeekKey(date: Date) {
  const startOfYear = Date.UTC(date.getUTCFullYear(), 0, 1);
  const dayOfYear = Math.floor((Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()) - startOfYear) / 86400000);
  const week = Math.floor((dayOfYear + new Date(startOfYear).getUTCDay()) / 7);

  return `${date.getUTCFullYear()}-${week}`;
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, routineCompletionCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const forbidden = requirePlayerDataEntryAccess(request.headers, {
    organizationId: parsed.data.organizationId,
    playerId: parsed.data.playerId,
    requiresConsent: true,
    allowLinkedUserEntry: true
  });

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const assignment = await prisma.routineAssignment.findFirst({
    where: {
      id: parsed.data.assignmentId,
      organizationId: parsed.data.organizationId,
      status: "active",
      OR: [
        { playerId: parsed.data.playerId },
        {
          team: {
            teamPlayers: {
              some: {
                playerId: parsed.data.playerId,
                status: "active"
              }
            }
          }
        }
      ]
    },
    include: {
      routine: {
        select: {
          code: true,
          name: true
        }
      }
    }
  });

  if (!assignment) {
    return apiErrorResponse("NOT_FOUND", "Active assignment was not found for this player.", 404);
  }

  const actorUserId = getRequestActorId(request.headers);
  const routineCompletion = await prisma.routineCompletion.upsert({
    where: {
      assignmentId_playerId_date: {
        assignmentId: parsed.data.assignmentId,
        playerId: parsed.data.playerId,
        date: parsed.data.date
      }
    },
    create: {
      ...parsed.data,
      completedByUserId: actorUserId
    },
    update: {
      completed: parsed.data.completed,
      quality: parsed.data.quality,
      painDuring: parsed.data.painDuring,
      rpe: parsed.data.rpe,
      notes: parsed.data.notes,
      completedByUserId: actorUserId
    }
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "routine_completion.created",
    entityType: "RoutineCompletion",
    entityId: routineCompletion.id,
    metadata: {
      playerId: parsed.data.playerId,
      painDuring: parsed.data.painDuring
    }
  });
  const alert = buildPainAlert({
    painAny: parsed.data.painDuring,
    activity: "other"
  });

  if (alert) {
    const existingAlert = await prisma.alert.findFirst({
      where: {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId,
        sourceType: "routine_completion",
        sourceId: routineCompletion.id,
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
          sourceType: "routine_completion",
          sourceId: routineCompletion.id,
          reason: alert.reason,
          nextAction: alert.nextAction
        }
      });
    }
  }

  if (!parsed.data.completed) {
    const lookbackStart = new Date(parsed.data.date);
    lookbackStart.setUTCDate(lookbackStart.getUTCDate() - 14);
    const missedCompletions = await prisma.routineCompletion.findMany({
      where: {
        organizationId: parsed.data.organizationId,
        assignmentId: parsed.data.assignmentId,
        playerId: parsed.data.playerId,
        completed: false,
        date: {
          gte: lookbackStart,
          lte: parsed.data.date
        }
      },
      select: {
        date: true
      }
    });
    const missedWeeks = new Set(missedCompletions.map((completion) => getUtcWeekKey(completion.date))).size;
    const nonComplianceAlert = buildRoutineNonComplianceAlert({ missedWeeks });

    if (nonComplianceAlert) {
      const existingAlert = await prisma.alert.findFirst({
        where: {
          organizationId: parsed.data.organizationId,
          playerId: parsed.data.playerId,
          sourceType: "routine_assignment",
          sourceId: parsed.data.assignmentId,
          ruleCode: nonComplianceAlert.ruleCode,
          status: "open"
        }
      });

      if (!existingAlert) {
        await prisma.alert.create({
          data: {
            organizationId: parsed.data.organizationId,
            playerId: parsed.data.playerId,
            severity: nonComplianceAlert.severity,
            ruleCode: nonComplianceAlert.ruleCode,
            sourceType: "routine_assignment",
            sourceId: parsed.data.assignmentId,
            reason: nonComplianceAlert.reason,
            nextAction: nonComplianceAlert.nextAction
          }
        });
      }
    }

    if (/\bwarm[- ]?up\b/i.test(`${assignment.routine.code} ${assignment.routine.name}`)) {
      const missedWarmups = await prisma.routineCompletion.count({
        where: {
          organizationId: parsed.data.organizationId,
          playerId: parsed.data.playerId,
          completed: false,
          date: {
            gte: lookbackStart,
            lte: parsed.data.date
          },
          assignment: {
            routine: {
              OR: [
                { code: { contains: "warm", mode: "insensitive" } },
                { name: { contains: "warm", mode: "insensitive" } }
              ]
            }
          }
        }
      });
      const missedWarmupAlert = buildMissedWarmupAlert({ missedWarmups });

      if (missedWarmupAlert) {
        const existingAlert = await prisma.alert.findFirst({
          where: {
            organizationId: parsed.data.organizationId,
            playerId: parsed.data.playerId,
            sourceType: "warmup_compliance",
            ruleCode: missedWarmupAlert.ruleCode,
            status: "open"
          }
        });

        if (!existingAlert) {
          await prisma.alert.create({
            data: {
              organizationId: parsed.data.organizationId,
              playerId: parsed.data.playerId,
              severity: missedWarmupAlert.severity,
              ruleCode: missedWarmupAlert.ruleCode,
              sourceType: "warmup_compliance",
              sourceId: parsed.data.assignmentId,
              reason: missedWarmupAlert.reason,
              nextAction: missedWarmupAlert.nextAction
            }
          });
        }
      }
    }
  }

  return NextResponse.json({ routineCompletion }, { status: 201 });
}
