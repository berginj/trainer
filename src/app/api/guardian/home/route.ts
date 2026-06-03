import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";
import { getRequestAccessContext } from "@/lib/request-auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const context = getRequestAccessContext(request.headers);

  if (!context) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  if (!context.roles.includes("guardian") && !context.roles.includes("player")) {
    return apiErrorResponse("FORBIDDEN", "Guardian or player access is required.", 403);
  }

  const playerIds = context.linkedPlayerIds;
  const prisma = getPrisma();
  const weekStart = new Date();
  weekStart.setDate(weekStart.getDate() - 7);
  const [players, assignments, consents, links, recentCompletions, reports] = await Promise.all([
    prisma.player.findMany({
      where: {
        id: { in: playerIds },
        activeStatus: "active"
      },
      include: {
        teamPlayers: {
          where: { status: "active" },
          include: { team: true }
        },
        alerts: {
          where: { status: "open" },
          orderBy: { createdAt: "desc" },
          take: 10
        }
      },
      orderBy: { preferredName: "asc" }
    }),
    prisma.routineAssignment.findMany({
      where: {
        status: "active",
        OR: [
          { playerId: { in: playerIds } },
          {
            team: {
              teamPlayers: {
                some: {
                  playerId: { in: playerIds },
                  status: "active"
                }
              }
            }
          }
        ]
      },
      include: {
        routine: true,
        team: {
          include: {
            teamPlayers: {
              where: {
                playerId: { in: playerIds },
                status: "active"
              }
            }
          }
        },
        player: true,
        completions: {
          where: {
            playerId: { in: playerIds }
          },
          orderBy: { date: "desc" },
          take: 50
        }
      },
      orderBy: { createdAt: "desc" }
    }),
    prisma.consentRecord.findMany({
      where: {
        guardianUserId: context.userId,
        playerId: { in: playerIds }
      },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.guardianPlayerLink.findMany({
      where: {
        guardianUserId: context.userId,
        playerId: { in: playerIds },
        status: "active"
      }
    }),
    prisma.routineCompletion.findMany({
      where: {
        playerId: { in: playerIds },
        date: { gte: weekStart }
      },
      orderBy: { date: "desc" }
    }),
    prisma.report.findMany({
      where: {
        playerId: { in: playerIds },
        reportType: "monthly_player"
      },
      orderBy: { generatedAt: "desc" },
      take: Math.max(playerIds.length * 3, 3)
    })
  ]);
  const consentByPlayer = new Map<string, typeof consents>();
  const linkByPlayer = new Map(links.map((link) => [link.playerId, link]));
  const completionsByPlayer = new Map<string, typeof recentCompletions>();
  const reportsByPlayer = new Map<string, typeof reports>();

  for (const consent of consents) {
    consentByPlayer.set(consent.playerId, [...(consentByPlayer.get(consent.playerId) ?? []), consent]);
  }

  for (const completion of recentCompletions) {
    completionsByPlayer.set(completion.playerId, [
      ...(completionsByPlayer.get(completion.playerId) ?? []),
      completion
    ]);
  }

  for (const report of reports) {
    if (!report.playerId) {
      continue;
    }

    reportsByPlayer.set(report.playerId, [...(reportsByPlayer.get(report.playerId) ?? []), report]);
  }

  return NextResponse.json({
    players: players.map((player) => {
      const completions = completionsByPlayer.get(player.id) ?? [];
      const link = linkByPlayer.get(player.id);
      const selfLinked = context.roles.includes("player") && link?.relationship === "self";

      return {
        id: player.id,
        organizationId: player.organizationId,
        preferredName: player.preferredName,
        relationship: link?.relationship,
        teams: player.teamPlayers.map(({ team }) => ({
          id: team.id,
          name: team.brandDisplayName ?? team.name,
          brand: {
            primaryColor: team.brandPrimaryColor,
            secondaryColor: team.brandSecondaryColor,
            accentColor: team.brandAccentColor,
            logoUrl: team.brandLogoUrl
          }
        })),
        consent: {
          granted: selfLinked || (consentByPlayer.get(player.id) ?? []).some((consent) => consent.status === "granted")
        },
        weeklySummary: {
          completedCount: completions.filter((completion) => completion.completed).length,
          skippedCount: completions.filter((completion) => !completion.completed && !completion.painDuring).length,
          painCount: completions.filter((completion) => completion.painDuring).length
        },
        reports: (reportsByPlayer.get(player.id) ?? []).slice(0, 3).map((report) => ({
          id: report.id,
          reportType: report.reportType,
          generatedAt: report.generatedAt
        })),
        alerts: player.alerts.map((alert) => ({
          severity: alert.severity,
          reason: alert.reason,
          nextAction: alert.nextAction
        }))
      };
    }),
    assignments: assignments.flatMap((assignment) => {
      const targetPlayerIds = assignment.playerId
        ? [assignment.playerId]
        : (assignment.team?.teamPlayers.map(({ playerId }) => playerId) ?? []);

      return targetPlayerIds.map((playerId) => ({
        id: assignment.id,
        organizationId: assignment.organizationId,
        playerId,
        dueDates: assignment.dueDates,
        frequency: assignment.frequency,
        routine: {
          id: assignment.routine.id,
          name: assignment.routine.name,
          durationMin: assignment.routine.durationMin,
          stopRules: assignment.routine.stopRules
        },
        team: assignment.team
          ? {
              id: assignment.team.id,
              name: assignment.team.brandDisplayName ?? assignment.team.name,
              brand: {
                primaryColor: assignment.team.brandPrimaryColor,
                secondaryColor: assignment.team.brandSecondaryColor,
                accentColor: assignment.team.brandAccentColor,
                logoUrl: assignment.team.brandLogoUrl
              }
            }
          : null,
        completions: assignment.completions.filter((completion) => completion.playerId === playerId)
      }));
    })
  });
}
