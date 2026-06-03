import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { goalUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = await parseJsonWithSchema(request, goalUpdateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const existingGoal = await prisma.goal.findUnique({
    where: { id }
  });

  if (!existingGoal) {
    return apiErrorResponse("NOT_FOUND", "Goal was not found.", 404);
  }

  const forbidden = requirePlayerDataEntryAccess(request.headers, {
    organizationId: existingGoal.organizationId,
    playerId: existingGoal.playerId,
    requiresConsent: true
  });

  if (forbidden) {
    return forbidden;
  }

  const goal = await prisma.goal.update({
    where: { id },
    data: parsed.data,
    include: {
      metricDefinition: {
        select: {
          id: true,
          code: true,
          displayName: true,
          unit: true
        }
      },
      player: {
        select: {
          id: true,
          preferredName: true
        }
      }
    }
  });

  await writeAuditEvent(prisma, {
    organizationId: existingGoal.organizationId,
    actorUserId: getRequestActorId(request.headers),
    action: "goal.updated",
    entityType: "Goal",
    entityId: goal.id,
    metadata: parsed.data
  });

  return NextResponse.json({ goal });
}
