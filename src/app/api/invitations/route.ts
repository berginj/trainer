import { NextResponse, type NextRequest } from "next/server";
import { requireOrganizationManagementAccess, requireTeamEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { createInvitationToken, hashInvitationToken } from "@/lib/auth-session";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { invitationCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, invitationCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const team = parsed.data.teamId
    ? await prisma.team.findFirst({
        where: {
          id: parsed.data.teamId,
          organizationId: parsed.data.organizationId
        }
      })
    : null;
  const player = parsed.data.playerId
    ? await prisma.player.findFirst({
        where: {
          id: parsed.data.playerId,
          organizationId: parsed.data.organizationId
        }
      })
    : null;

  if (parsed.data.teamId && !team) {
    return apiErrorResponse("NOT_FOUND", "Team was not found for this organization.", 404);
  }

  if (parsed.data.playerId && !player) {
    return apiErrorResponse("NOT_FOUND", "Player was not found for this organization.", 404);
  }

  const forbidden = parsed.data.teamId
    ? requireTeamEntryAccess(request.headers, {
        organizationId: parsed.data.organizationId,
        teamId: parsed.data.teamId
      })
    : requireOrganizationManagementAccess(request.headers, parsed.data.organizationId);

  if (forbidden) {
    return forbidden;
  }

  const token = createInvitationToken();
  const actorUserId = getRequestActorId(request.headers);
  const invitation = await prisma.invitation.create({
    data: {
      organizationId: parsed.data.organizationId,
      teamId: parsed.data.teamId,
      playerId: parsed.data.playerId,
      email: parsed.data.email.toLowerCase(),
      role: parsed.data.role,
      relationship: parsed.data.relationship,
      expiresAt: parsed.data.expiresAt,
      createdById: actorUserId,
      tokenHash: hashInvitationToken(token)
    }
  });
  const inviteUrl = new URL("/signin", request.url);

  inviteUrl.searchParams.set("invite", token);
  inviteUrl.searchParams.set("email", parsed.data.email.toLowerCase());

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "invitation.created",
    entityType: "Invitation",
    entityId: invitation.id,
    metadata: {
      teamId: parsed.data.teamId ?? null,
      playerId: parsed.data.playerId ?? null,
      role: parsed.data.role
    }
  });

  return NextResponse.json(
    {
      invitation: {
        ...invitation,
        tokenHash: undefined
      },
      inviteUrl: inviteUrl.toString()
    },
    { status: 201 }
  );
}
