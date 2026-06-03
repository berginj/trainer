import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { requirePlayerAccess, requirePlayerDataEntryAccess, requireTenantAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { buildMonthlyPlayerReportSnapshot } from "@/lib/reports";
import { getRequestAccessContext, getRequestActorId, shouldEnforceAuth } from "@/lib/request-auth";

export const runtime = "nodejs";

function isReportStaff(context: ReturnType<typeof getRequestAccessContext>) {
  return Boolean(
    context?.roles.some((role) =>
      ["platform_admin", "org_admin", "team_coach", "assistant_coach", "evaluator"].includes(role)
    )
  );
}

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const playerId = request.nextUrl.searchParams.get("playerId");

  if (!organizationId) {
    return apiErrorResponse("VALIDATION_FAILED", "organizationId is required.", 400);
  }

  const context = getRequestAccessContext(request.headers);

  if (shouldEnforceAuth() && !context) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  const staffAccess = (!context && !shouldEnforceAuth()) || isReportStaff(context);
  const linkedPlayerIds = context?.linkedPlayerIds ?? [];
  const effectivePlayerIds = staffAccess
    ? playerId
      ? [playerId]
      : undefined
    : playerId
      ? linkedPlayerIds.includes(playerId)
        ? [playerId]
        : []
      : linkedPlayerIds;

  if (!staffAccess && context && !context.consentGranted) {
    return apiErrorResponse("FORBIDDEN", "Consent is required before reports can be viewed.", 403);
  }

  const forbidden = staffAccess
    ? requireTenantAccess(request.headers, organizationId)
    : playerId
      ? requirePlayerAccess(request.headers, {
          organizationId,
          playerId,
          requiresConsent: true
        })
      : null;

  if (forbidden) {
    return forbidden;
  }

  if (!staffAccess && effectivePlayerIds?.length === 0) {
    return NextResponse.json({ reports: [] });
  }

  const reports = await getPrisma().report.findMany({
    where: {
      organizationId,
      ...(effectivePlayerIds ? { playerId: { in: effectivePlayerIds } } : {})
    },
    include: {
      player: {
        select: {
          preferredName: true
        }
      },
      team: {
        select: {
          name: true,
          brandDisplayName: true
        }
      }
    },
    orderBy: { generatedAt: "desc" },
    take: 25
  });

  return NextResponse.json({
    reports: reports.map((report) => ({
      id: report.id,
      reportType: report.reportType,
      generatedAt: report.generatedAt,
      playerId: report.playerId,
      playerName: report.player?.preferredName ?? null,
      teamId: report.teamId,
      teamName: report.team ? (report.team.brandDisplayName ?? report.team.name) : null
    }))
  });
}

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
    where: { id: body.playerId },
    include: {
      teamPlayers: {
        where: { status: "active" },
        select: { teamId: true }
      }
    }
  });

  if (!player || player.organizationId !== body.organizationId) {
    return apiErrorResponse("NOT_FOUND", "Player was not found.", 404);
  }

  const context = getRequestAccessContext(request.headers);

  if (shouldEnforceAuth()) {
    if (!context) {
      return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
    }

    const isAdmin = context.roles.some((role) => role === "platform_admin" || role === "org_admin");
    const assignedTeamId = player.teamPlayers.find((teamPlayer) =>
      context.assignedTeamIds.includes(teamPlayer.teamId)
    )?.teamId;
    const isAssignedCoach =
      context.roles.some((role) => ["team_coach", "assistant_coach", "evaluator"].includes(role)) &&
      Boolean(assignedTeamId);

    if (!isAdmin && !isAssignedCoach) {
      return apiErrorResponse("FORBIDDEN", "Coach or administrator access is required to generate reports.", 403);
    }

    const consentResponse = requirePlayerDataEntryAccess(request.headers, {
      organizationId: body.organizationId,
      playerId: body.playerId,
      teamId: assignedTeamId,
      requiresConsent: true
    });

    if (consentResponse) {
      return consentResponse;
    }
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
