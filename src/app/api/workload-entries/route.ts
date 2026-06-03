import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import {
  buildBaseballPitchCountAlert,
  buildBaseballRestConflictAlert,
  buildSoftballExposureAlert,
  getAgeOnDate,
  isParticipationMarkedAvailable,
  resolveBaseballRestDays
} from "@/lib/safety-rules";
import { workloadEntryCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, workloadEntryCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const authResponse = requirePlayerDataEntryAccess(request.headers, {
    organizationId: parsed.data.organizationId,
    playerId: parsed.data.playerId,
    teamId: parsed.data.teamId,
    requiresConsent: true
  });

  if (authResponse) {
    return authResponse;
  }

  const prisma = getPrisma();
  const actorUserId = getRequestActorId(request.headers, parsed.data.enteredByUserId);
  const workloadEntry = await prisma.workloadEntry.create({
    data: {
      ...parsed.data,
      enteredByUserId: actorUserId ?? parsed.data.enteredByUserId
    }
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "workload_entry.created",
    entityType: "WorkloadEntry",
    entityId: workloadEntry.id,
    metadata: {
      playerId: parsed.data.playerId,
      sport: parsed.data.sport,
      pitches: parsed.data.pitches ?? null
    }
  });

  if (parsed.data.sport === "baseball") {
    const player = await prisma.player.findUnique({
      where: { id: parsed.data.playerId }
    });

    if (player && parsed.data.pitches && parsed.data.pitches > 0) {
      const alert = buildBaseballPitchCountAlert({
        age: getAgeOnDate(player.dateOfBirth, parsed.data.date),
        pitches: parsed.data.pitches
      });

      if (alert) {
        await prisma.alert.create({
          data: {
            organizationId: parsed.data.organizationId,
            playerId: parsed.data.playerId,
            severity: alert.severity,
            ruleCode: alert.ruleCode,
            sourceType: "workload_entry",
            sourceId: workloadEntry.id,
            reason: alert.reason,
            nextAction: alert.nextAction
          }
        });
      }
    }

    if (player && isParticipationMarkedAvailable(parsed.data.participationStatus)) {
      const previousPitchingOuting = await prisma.workloadEntry.findFirst({
        where: {
          organizationId: parsed.data.organizationId,
          playerId: parsed.data.playerId,
          sport: "baseball",
          date: { lt: parsed.data.date },
          pitches: { gt: 0 }
        },
        orderBy: { date: "desc" }
      });
      const previousPitchCount = previousPitchingOuting?.pitches ?? 0;
      const rest = previousPitchingOuting
        ? resolveBaseballRestDays(getAgeOnDate(player.dateOfBirth, previousPitchingOuting.date), previousPitchCount)
        : null;
      const daysSinceLastOuting = previousPitchingOuting
        ? Math.floor((parsed.data.date.getTime() - previousPitchingOuting.date.getTime()) / (1000 * 60 * 60 * 24))
        : Number.POSITIVE_INFINITY;
      const alert =
        rest && rest.requiredRestDays > 0
          ? buildBaseballRestConflictAlert({
              requiredRestDays: rest.requiredRestDays,
              daysSinceLastOuting,
              markedAvailable: true
            })
          : null;

      if (alert) {
      await prisma.alert.create({
        data: {
          organizationId: parsed.data.organizationId,
          playerId: parsed.data.playerId,
          severity: alert.severity,
          ruleCode: alert.ruleCode,
          sourceType: "workload_entry",
          sourceId: workloadEntry.id,
          reason: alert.reason,
          nextAction: alert.nextAction
        }
      });
    }
    }
  }

  if (parsed.data.sport === "softball" && ((parsed.data.pitches ?? 0) > 0 || (parsed.data.innings ?? 0) > 0)) {
    const yesterday = new Date(parsed.data.date);
    yesterday.setUTCDate(yesterday.getUTCDate() - 1);
    const previousExposure = await prisma.workloadEntry.findFirst({
      where: {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId,
        sport: "softball",
        date: {
          gte: yesterday,
          lt: parsed.data.date
        },
        OR: [{ pitches: { gt: 0 } }, { innings: { gt: 0 } }]
      }
    });
    const alert = buildSoftballExposureAlert({
      consecutivePitchDays: previousExposure ? 2 : 1
    });

    if (alert) {
      await prisma.alert.create({
        data: {
          organizationId: parsed.data.organizationId,
          playerId: parsed.data.playerId,
          severity: alert.severity,
          ruleCode: alert.ruleCode,
          sourceType: "workload_entry",
          sourceId: workloadEntry.id,
          reason: alert.reason,
          nextAction: alert.nextAction
        }
      });
    }
  }

  return NextResponse.json({ workloadEntry }, { status: 201 });
}
