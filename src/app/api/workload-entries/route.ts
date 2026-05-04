import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess, requireTeamEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { buildBaseballPitchCountAlert, buildSoftballExposureAlert, getAgeOnDate } from "@/lib/safety-rules";
import { workloadEntryCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, workloadEntryCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const authResponse = parsed.data.teamId
    ? requireTeamEntryAccess(request.headers, {
        organizationId: parsed.data.organizationId,
        teamId: parsed.data.teamId
      })
    : requirePlayerDataEntryAccess(request.headers, {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId,
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

  if (parsed.data.sport === "baseball" && parsed.data.pitches && parsed.data.pitches > 0) {
    const player = await prisma.player.findUnique({
      where: { id: parsed.data.playerId }
    });
    const alert = player
      ? buildBaseballPitchCountAlert({
          age: getAgeOnDate(player.dateOfBirth, parsed.data.date),
          pitches: parsed.data.pitches
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
