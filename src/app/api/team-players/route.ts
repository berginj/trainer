import { NextResponse, type NextRequest } from "next/server";
import { requireOrganizationManagementAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { teamPlayerCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, teamPlayerCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const team = await prisma.team.findUnique({
    where: { id: parsed.data.teamId }
  });

  if (!team) {
    return apiErrorResponse("NOT_FOUND", "Team was not found.", 404);
  }

  const player = await prisma.player.findUnique({
    where: { id: parsed.data.playerId }
  });

  if (!player || player.organizationId !== team.organizationId) {
    return apiErrorResponse("NOT_FOUND", "Player was not found for this organization.", 404);
  }

  const forbidden = requireOrganizationManagementAccess(request.headers, team.organizationId);

  if (forbidden) {
    return forbidden;
  }

  const teamPlayer = await prisma.teamPlayer.upsert({
    where: {
      teamId_playerId: parsed.data
    },
    create: parsed.data,
    update: {
      status: "active"
    }
  });

  await writeAuditEvent(prisma, {
    organizationId: team.organizationId,
    actorUserId: getRequestActorId(request.headers),
    action: "team_player.assigned",
    entityType: "TeamPlayer",
    entityId: teamPlayer.id,
    metadata: parsed.data
  });

  return NextResponse.json({ teamPlayer }, { status: 201 });
}
