import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { evaluationCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, evaluationCreateSchema);

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
  const actorUserId = getRequestActorId(request.headers, parsed.data.evaluatorUserId);
  const evaluation = await prisma.evaluation.create({
    data: {
      ...parsed.data,
      evaluatorUserId: actorUserId ?? parsed.data.evaluatorUserId
    }
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "evaluation.created",
    entityType: "Evaluation",
    entityId: evaluation.id,
    metadata: {
      playerId: parsed.data.playerId,
      evaluationType: parsed.data.evaluationType
    }
  });

  return NextResponse.json({ evaluation }, { status: 201 });
}
