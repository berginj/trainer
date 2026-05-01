import { NextResponse, type NextRequest } from "next/server";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { evaluationCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, evaluationCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const evaluation = await prisma.evaluation.create({
    data: parsed.data
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: parsed.data.evaluatorUserId ?? null,
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
