import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { buildPainAlert } from "@/lib/safety-rules";
import { routineCompletionCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, routineCompletionCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const forbidden = requirePlayerDataEntryAccess(request.headers, {
    organizationId: parsed.data.organizationId,
    playerId: parsed.data.playerId,
    requiresConsent: true,
    allowLinkedUserEntry: true
  });

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const routineCompletion = await prisma.routineCompletion.create({
    data: parsed.data
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: getRequestActorId(request.headers),
    action: "routine_completion.created",
    entityType: "RoutineCompletion",
    entityId: routineCompletion.id,
    metadata: {
      playerId: parsed.data.playerId,
      painDuring: parsed.data.painDuring
    }
  });
  const alert = buildPainAlert({
    painAny: parsed.data.painDuring,
    activity: "other"
  });

  if (alert) {
    await prisma.alert.create({
      data: {
        organizationId: parsed.data.organizationId,
        playerId: parsed.data.playerId,
        severity: alert.severity,
        ruleCode: alert.ruleCode,
        sourceType: "routine_completion",
        sourceId: routineCompletion.id,
        reason: alert.reason,
        nextAction: alert.nextAction
      }
    });
  }

  return NextResponse.json({ routineCompletion }, { status: 201 });
}
