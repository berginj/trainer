import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess, requireTeamEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { routineAssignmentUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = await parseJsonWithSchema(request, routineAssignmentUpdateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const assignment = await prisma.routineAssignment.findUnique({
    where: { id }
  });

  if (!assignment) {
    return apiErrorResponse("NOT_FOUND", "Routine assignment was not found.", 404);
  }

  const forbidden = assignment.teamId
    ? requireTeamEntryAccess(request.headers, {
        organizationId: assignment.organizationId,
        teamId: assignment.teamId
      })
    : assignment.playerId
      ? requirePlayerDataEntryAccess(request.headers, {
          organizationId: assignment.organizationId,
          playerId: assignment.playerId,
          requiresConsent: true
        })
      : null;

  if (forbidden) {
    return forbidden;
  }

  const routineAssignment = await prisma.routineAssignment.update({
    where: { id },
    data: parsed.data
  });

  await writeAuditEvent(prisma, {
    organizationId: assignment.organizationId,
    actorUserId: getRequestActorId(request.headers),
    action: "routine_assignment.updated",
    entityType: "RoutineAssignment",
    entityId: assignment.id,
    metadata: parsed.data
  });

  return NextResponse.json({ routineAssignment });
}
