import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess, requireTeamEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { routineAssignmentCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

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
