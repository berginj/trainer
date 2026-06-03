import { NextResponse, type NextRequest } from "next/server";
import type { ConsentType } from "@prisma/client";
import { requireOrganizationManagementAccess } from "@/lib/auth-guards";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");

  if (!organizationId) {
    return apiErrorResponse("VALIDATION_FAILED", "organizationId is required.", 400);
  }

  const forbidden = requireOrganizationManagementAccess(request.headers, organizationId);

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const [players, openAlerts, metricCount, weakBenchmarkCount, weakBenchmarks, recentAuditEvents] = await Promise.all([
    prisma.player.findMany({
      where: {
        organizationId,
        activeStatus: "active"
      },
      include: {
        guardianLinks: {
          where: { status: "active" }
        },
        consents: {
          where: { status: "granted" }
        },
        teamPlayers: {
          where: { status: "active" },
          include: { team: true }
        }
      },
      orderBy: { preferredName: "asc" }
    }),
    prisma.alert.findMany({
      where: {
        organizationId,
        status: "open"
      },
      include: {
        player: {
          select: {
            id: true,
            preferredName: true,
            teamPlayers: {
              where: { status: "active" },
              include: { team: true }
            }
          }
        }
      },
      orderBy: { createdAt: "desc" },
      take: 50
    }),
    prisma.metricDefinition.count(),
    prisma.benchmark.count({
      where: {
        confidence: "weak"
      }
    }),
    prisma.benchmark.findMany({
      where: {
        confidence: "weak"
      },
      include: {
        metricDefinition: {
          select: {
            code: true,
            displayName: true,
            sportScope: true,
            domain: true
          }
        }
      },
      orderBy: { updatedAt: "desc" },
      take: 25
    }),
    prisma.auditEvent.findMany({
      where: { organizationId },
      include: {
        actor: {
          select: {
            displayName: true,
            email: true
          }
        }
      },
      orderBy: { occurredAt: "desc" },
      take: 10
    })
  ]);
  const requiredConsentTypes: ConsentType[] = ["readiness", "workload", "reports"];
  const missingConsentPlayers = players.filter((player) => {
    const grantedTypes = new Set(player.consents.map((record) => record.consentType));

    return !requiredConsentTypes.every((consentType) => grantedTypes.has(consentType));
  });
  const playersWithoutGuardians = players.filter((player) => player.guardianLinks.length === 0);
  const alertsBySeverity = openAlerts.reduce(
    (counts, alert) => ({
      ...counts,
      [alert.severity]: counts[alert.severity] + 1
    }),
    { red: 0, yellow: 0, blue: 0 }
  );

  return NextResponse.json({
    summary: {
      rosterCount: players.length,
      missingConsentCount: missingConsentPlayers.length,
      playersWithoutGuardiansCount: playersWithoutGuardians.length,
      openAlertCount: openAlerts.length,
      alertsBySeverity,
      metricCount,
      weakBenchmarkCount,
      missingConsentPlayers: missingConsentPlayers.map((player) => ({
        id: player.id,
        preferredName: player.preferredName,
        teams: player.teamPlayers.map(({ team }) => team.brandDisplayName ?? team.name)
      })),
      playersWithoutGuardians: playersWithoutGuardians.map((player) => ({
        id: player.id,
        preferredName: player.preferredName,
        teams: player.teamPlayers.map(({ team }) => team.brandDisplayName ?? team.name)
      })),
      openAlerts: openAlerts.map((alert) => ({
        id: alert.id,
        playerId: alert.playerId,
        playerName: alert.player.preferredName,
        teams: alert.player.teamPlayers.map(({ team }) => team.brandDisplayName ?? team.name),
        severity: alert.severity,
        ruleCode: alert.ruleCode,
        reason: alert.reason,
        nextAction: alert.nextAction,
        createdAt: alert.createdAt
      })),
      weakBenchmarks: weakBenchmarks.map((benchmark) => ({
        id: benchmark.id,
        sourceTitle: benchmark.sourceTitle,
        sourceCitation: benchmark.sourceCitation,
        updatedAt: benchmark.updatedAt,
        metric: {
          code: benchmark.metricDefinition.code,
          displayName: benchmark.metricDefinition.displayName,
          sportScope: benchmark.metricDefinition.sportScope,
          domain: benchmark.metricDefinition.domain
        }
      })),
      recentAuditEvents: recentAuditEvents.map((event) => ({
        id: event.id,
        action: event.action,
        entityType: event.entityType,
        entityId: event.entityId,
        occurredAt: event.occurredAt,
        actorUserId: event.actorUserId,
        actorName: event.actor?.displayName ?? event.actor?.email ?? null
      }))
    }
  });
}
