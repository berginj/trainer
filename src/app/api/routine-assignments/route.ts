import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess, requireTeamEntryAccess, requireTenantAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { routineAssignmentCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId") ?? undefined;
  const teamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
  const playerId = request.nextUrl.searchParams.get("playerId") ?? undefined;

  if (!organizationId) {
    return apiErrorResponse("VALIDATION_FAILED", "organizationId is required.", 400);
  }

  const forbidden = teamId
    ? requireTeamEntryAccess(request.headers, { organizationId, teamId })
    : playerId
      ? requirePlayerDataEntryAccess(request.headers, {
          organizationId,
          playerId,
          requiresConsent: true,
          allowLinkedUserEntry: true
        })
      : requireTenantAccess(request.headers, organizationId);

  if (forbidden) {
    return forbidden;
  }

  const assignments = await getPrisma().routineAssignment.findMany({
    where: {
      organizationId,
      status: "active",
      ...(teamId ? { teamId } : {}),
      ...(playerId
        ? {
            OR: [
              { playerId },
              {
                team: {
                  teamPlayers: {
                    some: {
                      playerId,
                      status: "active"
                    }
                  }
                }
              }
            ]
          }
        : {})
    },
    include: {
      routine: true,
      team: true,
      player: true,
      completions: playerId
        ? {
            where: { playerId },
            orderBy: { date: "desc" },
            take: 10
          }
        : {
            orderBy: { date: "desc" },
            take: 25
          }
    },
    orderBy: { createdAt: "desc" }
  });

  return NextResponse.json({
    assignments: assignments.map((assignment) => ({
      id: assignment.id,
      organizationId: assignment.organizationId,
      frequency: assignment.frequency,
      dueDates: assignment.dueDates,
      status: assignment.status,
      routine: {
        id: assignment.routine.id,
        name: assignment.routine.name,
        sport: assignment.routine.sport,
        level: assignment.routine.level,
        durationMin: assignment.routine.durationMin,
        stopRules: assignment.routine.stopRules
      },
      team: assignment.team
        ? {
            id: assignment.team.id,
            name: assignment.team.brandDisplayName ?? assignment.team.name,
            brandPrimaryColor: assignment.team.brandPrimaryColor,
            brandSecondaryColor: assignment.team.brandSecondaryColor,
            brandAccentColor: assignment.team.brandAccentColor,
            brandLogoUrl: assignment.team.brandLogoUrl
          }
        : null,
      player: assignment.player
        ? {
            id: assignment.player.id,
            preferredName: assignment.player.preferredName
          }
        : null,
      completions: assignment.completions
    }))
  });
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, routineAssignmentCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const authResponse = parsed.data.teamId
    ? requireTeamEntryAccess(request.headers, {
        organizationId: parsed.data.organizationId,
        teamId: parsed.data.teamId
      })
    : parsed.data.playerId
      ? requirePlayerDataEntryAccess(request.headers, {
          organizationId: parsed.data.organizationId,
          playerId: parsed.data.playerId,
          requiresConsent: true
        })
      : null;

  if (authResponse) {
    return authResponse;
  }

  const prisma = getPrisma();
  const routine = await prisma.routine.findUnique({
    where: { id: parsed.data.routineId }
  });

  if (!routine) {
    return apiErrorResponse("NOT_FOUND", "Routine was not found.", 404);
  }

  if (routine.organizationId && routine.organizationId !== parsed.data.organizationId) {
    return apiErrorResponse("NOT_FOUND", "Routine was not found for this organization.", 404);
  }

  if (parsed.data.teamId) {
    const team = await prisma.team.findFirst({
      where: {
        id: parsed.data.teamId,
        organizationId: parsed.data.organizationId
      }
    });

    if (!team) {
      return apiErrorResponse("NOT_FOUND", "Team was not found for this organization.", 404);
    }
  }

  if (parsed.data.playerId) {
    const player = await prisma.player.findFirst({
      where: {
        id: parsed.data.playerId,
        organizationId: parsed.data.organizationId
      }
    });

    if (!player) {
      return apiErrorResponse("NOT_FOUND", "Player was not found for this organization.", 404);
    }
  }

  if (parsed.data.playerId && (routine.sport === "baseball" || routine.sport === "softball")) {
    const openThrowingPainAlert = await prisma.alert.findFirst({
      where: {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId,
        status: "open",
        OR: [
          { ruleCode: "pain_activity" },
          { ruleCode: "pain_consecutive" },
          { bodyPart: { contains: "arm", mode: "insensitive" } },
          { bodyPart: { contains: "shoulder", mode: "insensitive" } },
          { bodyPart: { contains: "elbow", mode: "insensitive" } }
        ]
      }
    });

    if (openThrowingPainAlert) {
      return apiErrorResponse(
        "FORBIDDEN",
        "Throwing or pitching routines are suppressed while relevant pain alerts are open.",
        403
      );
    }
  }

  const actorUserId = getRequestActorId(request.headers, parsed.data.assignedById);
  const routineAssignment = await prisma.routineAssignment.create({
    data: {
      ...parsed.data,
      assignedById: actorUserId ?? parsed.data.assignedById
    }
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "routine_assignment.created",
    entityType: "RoutineAssignment",
    entityId: routineAssignment.id,
    metadata: {
      playerId: parsed.data.playerId ?? null,
      teamId: parsed.data.teamId ?? null
    }
  });

  return NextResponse.json({ routineAssignment }, { status: 201 });
}
