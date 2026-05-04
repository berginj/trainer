import { NextResponse, type NextRequest } from "next/server";
import { requireOrganizationManagementAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { seasonCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, seasonCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const forbidden = requireOrganizationManagementAccess(request.headers, parsed.data.organizationId);

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const season = await prisma.season.create({
    data: parsed.data
  });

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: getRequestActorId(request.headers),
    action: "season.created",
    entityType: "Season",
    entityId: season.id
  });

  return NextResponse.json({ season }, { status: 201 });
}
