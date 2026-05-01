import { NextResponse, type NextRequest } from "next/server";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { buildPainAlert } from "@/lib/safety-rules";
import { readinessCheckCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, readinessCheckCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const readinessCheck = await prisma.readinessCheck.create({
    data: parsed.data
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: parsed.data.enteredByUserId ?? null,
    action: "readiness_check.created",
    entityType: "ReadinessCheck",
    entityId: readinessCheck.id,
    metadata: {
      playerId: parsed.data.playerId,
      painAny: parsed.data.painAny
    }
  });
  const alert = buildPainAlert({
    painAny: parsed.data.painAny,
    activity: parsed.data.painBodyParts.some((part) => /arm|throw|pitch|shoulder|elbow/i.test(part)) ? "throwing" : "other"
  });

  if (alert) {
    await prisma.alert.create({
      data: {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId,
        severity: alert.severity,
        ruleCode: alert.ruleCode,
        bodyPart: parsed.data.painBodyParts.join(", "),
        sourceType: "readiness_check",
        sourceId: readinessCheck.id,
        reason: alert.reason,
        nextAction: alert.nextAction
      }
    });
  }

  return NextResponse.json({ readinessCheck }, { status: 201 });
}
