import { NextResponse, type NextRequest } from "next/server";
import { requireConsentRecordAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { consentRecordUpsertSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, consentRecordUpsertSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const forbidden = requireConsentRecordAccess(request.headers, {
    organizationId: parsed.data.organizationId,
    playerId: parsed.data.playerId,
    guardianUserId: parsed.data.guardianUserId
  });

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const consentRecord = await prisma.consentRecord.create({
    data: {
      ...parsed.data,
      grantedAt: parsed.data.status === "granted" ? new Date() : null,
      revokedAt: parsed.data.status === "revoked" ? new Date() : null
    }
  });

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: getRequestActorId(request.headers, parsed.data.guardianUserId),
    action: `consent.${parsed.data.status}`,
    entityType: "ConsentRecord",
    entityId: consentRecord.id,
    metadata: {
      playerId: parsed.data.playerId,
      consentType: parsed.data.consentType,
      version: parsed.data.version
    }
  });

  return NextResponse.json({ consentRecord }, { status: 201 });
}
