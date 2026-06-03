import { NextResponse, type NextRequest } from "next/server";
import { requireTeamEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { teamBrandingUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = await parseJsonWithSchema(request, teamBrandingUpdateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const existingTeam = await prisma.team.findUnique({
    where: { id }
  });

  if (!existingTeam) {
    return apiErrorResponse("NOT_FOUND", "Team was not found.", 404);
  }

  const forbidden = requireTeamEntryAccess(request.headers, {
    organizationId: existingTeam.organizationId,
    teamId: existingTeam.id
  });

  if (forbidden) {
    return forbidden;
  }

  const team = await prisma.team.update({
    where: { id },
    data: parsed.data
  });

  await writeAuditEvent(prisma, {
    organizationId: team.organizationId,
    actorUserId: getRequestActorId(request.headers),
    action: "team.branding_updated",
    entityType: "Team",
    entityId: team.id,
    metadata: {
      brandDisplayName: team.brandDisplayName,
      brandPrimaryColor: team.brandPrimaryColor,
      brandSecondaryColor: team.brandSecondaryColor,
      brandAccentColor: team.brandAccentColor,
      brandLogoUrl: team.brandLogoUrl
    }
  });

  return NextResponse.json({ team });
}
