import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { measurementCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, measurementCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const measurement = await prisma.measurement.create({
    data: {
      ...parsed.data,
      context: parsed.data.context as Prisma.InputJsonValue
    }
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: parsed.data.enteredByUserId ?? null,
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
