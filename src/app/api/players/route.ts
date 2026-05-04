import { NextResponse, type NextRequest } from "next/server";
import { requireOrganizationManagementAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { playerCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, playerCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const forbidden = requireOrganizationManagementAccess(request.headers, parsed.data.organizationId);

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const player = await prisma.player.create({
    data: parsed.data
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: getRequestActorId(request.headers),
    action: "player.created",
    entityType: "Player",
    entityId: player.id
  });

  return NextResponse.json({ player }, { status: 201 });
}
