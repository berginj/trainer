import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { requirePlayerAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { buildMonthlyPlayerReportSnapshot } from "@/lib/reports";
import { getRequestActorId } from "@/lib/request-auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const body = (await request.json()) as {
    organizationId?: string;
    playerId?: string;
    generatedByUserId?: string;
  };

  if (!body.organizationId || !body.playerId) {
    return apiErrorResponse("VALIDATION_FAILED", "organizationId and playerId are required.", 400);
  }

  const prisma = getPrisma();
  const player = await prisma.player.findUnique({
    where: { id: body.playerId }
  });

  if (!player || player.organizationId !== body.organizationId) {
    return apiErrorResponse("NOT_FOUND", "Player was not found.", 404);
  }

  const authResponse = requirePlayerAccess(request.headers, {
    organizationId: body.organizationId,
    playerId: body.playerId,
    requiresConsent: true
  });

  if (authResponse) {
    return authResponse;
  }

  const actorUserId = getRequestActorId(request.headers, body.generatedByUserId);

  const [readinessCount, workloadCount, openAlertCount, routineCompletionCount] = await Promise.all([
    prisma.readinessCheck.count({ where: { organizationId: body.organizationId, playerId: body.playerId } }),
    prisma.workloadEntry.count({ where: { organizationId: body.organizationId, playerId: body.playerId } }),
    prisma.alert.count({ where: { organizationId: body.organizationId, playerId: body.playerId, status: "open" } }),
    prisma.routineCompletion.count({ where: { organizationId: body.organizationId, playerId: body.playerId } })
  ]);
  const snapshotPayload = buildMonthlyPlayerReportSnapshot({
    player: {
      id: player.id,
      preferredName: player.preferredName
    },
    readinessCount,
    workloadCount,
    openAlertCount,
    routineCompletionCount,
    generatedAt: new Date()
  });
  const report = await prisma.report.create({
    data: {
      organizationId: body.organizationId,
      playerId: body.playerId,
      reportType: "monthly_player",
      generatedByUserId: actorUserId ?? body.generatedByUserId,
      snapshotPayload: snapshotPayload as Prisma.InputJsonValue
    }
  });

  await writeAuditEvent(prisma, {
    organizationId: body.organizationId,
    actorUserId,
    action: "report.generated",
    entityType: "Report",
    entityId: report.id,
    metadata: {
      playerId: body.playerId,
      reportType: "monthly_player"
    }
  });

  return NextResponse.json({ report }, { status: 201 });
}
