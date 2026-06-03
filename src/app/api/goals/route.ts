import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerAccess, requirePlayerDataEntryAccess, requireTenantAccess } from "@/lib/auth-guards";
import { apiErrorResponse } from "@/lib/api-response";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { goalCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId") ?? "";
  const playerId = request.nextUrl.searchParams.get("playerId") ?? "";
  const status = request.nextUrl.searchParams.get("status") ?? "";

  if (!organizationId) {
    return apiErrorResponse("VALIDATION_FAILED", "organizationId is required.", 400);
  }

  if (status && !["active", "inactive", "archived"].includes(status)) {
    return apiErrorResponse("VALIDATION_FAILED", "status must be active, inactive, or archived.", 400);
  }

  const forbidden = playerId
    ? requirePlayerAccess(request.headers, {
        organizationId,
        playerId,
        requiresConsent: true
      })
    : requireTenantAccess(request.headers, organizationId);

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const goals = await prisma.goal.findMany({
    where: {
      organizationId,
      ...(playerId ? { playerId } : {}),
      ...(status ? { status: status as "active" | "inactive" | "archived" } : {})
    },
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
    },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { createdAt: "desc" }],
    take: 100
  });

  return NextResponse.json({ goals });
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, goalCreateSchema);

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
