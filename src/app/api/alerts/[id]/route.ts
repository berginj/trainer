import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { getRequestActorId } from "@/lib/request-auth";
import { alertStatusUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const parsed = await parseJsonWithSchema(request, alertStatusUpdateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const { id } = await context.params;
  const prisma = getPrisma();
  const existingAlert = await prisma.alert.findUnique({
    where: { id }
  });

  if (!existingAlert) {
    return apiErrorResponse("NOT_FOUND", "Alert was not found.", 404);
  }

  const forbidden = requirePlayerDataEntryAccess(request.headers, {
    organizationId: existingAlert.organizationId,
    playerId: existingAlert.playerId,
    requiresConsent: true,
    allowLinkedUserEntry: true
  });

  if (forbidden) {
    return forbidden;
  }

  const alert = await prisma.alert.update({
    where: { id },
    data: {
      status: parsed.data.status,
      resolvedAt: parsed.data.status === "resolved" ? new Date() : null
    }
  });

  await writeAuditEvent(prisma, {
    organizationId: alert.organizationId,
    actorUserId: getRequestActorId(request.headers, parsed.data.actorUserId),
    action: `alert.${parsed.data.status}`,
    entityType: "Alert",
    entityId: alert.id,
    metadata: {
      playerId: alert.playerId,
      ruleCode: alert.ruleCode
    }
  });

  return NextResponse.json({ alert });
}
