import { NextResponse, type NextRequest } from "next/server";
import type { ConsentType } from "@prisma/client";
import { requireTeamEntryAccess } from "@/lib/auth-guards";
import { apiErrorResponse } from "@/lib/api-response";
import { buildTeamDashboard } from "@/lib/dashboard";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const prisma = getPrisma();
  const requiredConsentTypes: ConsentType[] = ["readiness", "workload", "reports"];
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      teamPlayers: {
        where: { status: "active" },
        include: {
          player: {
            include: {
              guardianLinks: {
                where: { status: "active" }
              },
              consents: {
                where: { status: "granted" }
              },
              invitations: {
                where: {
                  role: "guardian",
                  status: "pending"
                }
              }
            }
          }
        }
      }
    }
  });

  if (!team) {
    return apiErrorResponse("NOT_FOUND", "Team was not found.", 404);
  }

  const forbidden = requireTeamEntryAccess(_request.headers, {
    organizationId: team.organizationId,
    teamId: team.id
  });

  if (forbidden) {
    return forbidden;
  }

  const playerIds = team.teamPlayers.map(({ playerId }) => playerId);
  const openAlerts = await prisma.alert.findMany({
    where: {
      organizationId: team.organizationId,
      playerId: { in: playerIds },
      status: "open"
    },
    orderBy: { createdAt: "desc" },
    take: 50
  });

  return NextResponse.json({
    dashboard: buildTeamDashboard({
      team: {
        id: team.id,
        name: team.name,
        sport: team.sport,
        brandDisplayName: team.brandDisplayName,
        brandPrimaryColor: team.brandPrimaryColor,
        brandSecondaryColor: team.brandSecondaryColor,
        brandAccentColor: team.brandAccentColor,
        brandLogoUrl: team.brandLogoUrl
      },
      players: team.teamPlayers.map(({ player }) => {
        const grantedConsentTypes = new Set(player.consents.map((consent) => consent.consentType));

        return {
          player,
          guardianCount: player.guardianLinks.length,
          pendingInviteCount: player.invitations.length,
          consentGranted: requiredConsentTypes.every((consentType) => grantedConsentTypes.has(consentType))
        };
      }),
      openAlerts: openAlerts.map((alert) => ({
        playerId: alert.playerId,
        severity: alert.severity,
        ruleCode: alert.ruleCode,
        reason: alert.reason,
        nextAction: alert.nextAction
      }))
    })
  });
}
