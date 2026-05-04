import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { measurementCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, measurementCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const forbidden = requirePlayerDataEntryAccess(request.headers, {
    organizationId: parsed.data.organizationId,
    playerId: parsed.data.playerId,
    requiresConsent: true
  });

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const actorUserId = getRequestActorId(request.headers, parsed.data.enteredByUserId);
  const measurement = await prisma.measurement.create({
    data: {
      ...parsed.data,
      enteredByUserId: actorUserId ?? parsed.data.enteredByUserId,
      context: parsed.data.context as Prisma.InputJsonValue
    }
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "measurement.created",
    entityType: "Measurement",
    entityId: measurement.id,
    metadata: {
      playerId: parsed.data.playerId,
      metricDefinitionId: parsed.data.metricDefinitionId
    }
  });

  return NextResponse.json({ measurement }, { status: 201 });
}
