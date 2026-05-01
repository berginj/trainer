import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerAccess } from "@/lib/auth-guards";
import { apiErrorResponse } from "@/lib/api-response";
import { buildPlayerDashboard } from "@/lib/dashboard";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const prisma = getPrisma();
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      alerts: {
        where: { status: "open" },
        orderBy: { createdAt: "desc" },
        take: 10
      },
      readinessChecks: {
        orderBy: { date: "desc" },
        take: 1
      },
      routineAssignments: {
        where: { status: "active" },
        include: { routine: true },
        orderBy: { createdAt: "desc" },
        take: 10
      },
      evaluations: {
        orderBy: { date: "desc" },
        take: 1
      }
    }
  });

  if (!player) {
    return apiErrorResponse("NOT_FOUND", "Player was not found.", 404);
  }

  const authResponse = requirePlayerAccess(_request.headers, {
    organizationId: player.organizationId,
    playerId: player.id,
    requiresConsent: true
  });

  if (authResponse) {
    return authResponse;
  }

  return NextResponse.json({
    dashboard: buildPlayerDashboard({
      player: {
        id: player.id,
        preferredName: player.preferredName,
        activeStatus: player.activeStatus
      },
      latestReadiness: player.readinessChecks[0] ?? null,
      openAlerts: player.alerts.map((alert) => ({
        severity: alert.severity,
        ruleCode: alert.ruleCode,
        reason: alert.reason,
        nextAction: alert.nextAction
      })),
      routineAssignments: player.routineAssignments.map((assignment) => ({
        id: assignment.id,
        frequency: assignment.frequency,
        routine: {
          name: assignment.routine.name,
          sport: assignment.routine.sport,
          durationMin: assignment.routine.durationMin
        }
      })),
      upcomingEvaluationDate: player.evaluations[0]?.date ?? null
    })
  });
}
