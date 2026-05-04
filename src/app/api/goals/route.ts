import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerDataEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { goalCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, goalCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const forbidden = requirePlayerDataEntryAccess(request.headers, {
    organizationId: parsed.data.organizationId,
    playerId: parsed.data.playerId
  });

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const goal = await prisma.goal.create({
    data: parsed.data
  });

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: getRequestActorId(request.headers),
    action: "goal.created",
    entityType: "Goal",
    entityId: goal.id,
    metadata: {
      playerId: parsed.data.playerId
    }
  });

  return NextResponse.json({ goal }, { status: 201 });
}
