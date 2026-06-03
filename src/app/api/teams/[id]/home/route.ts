import { NextResponse, type NextRequest } from "next/server";
import { requireTeamEntryAccess } from "@/lib/auth-guards";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const prisma = getPrisma();
  const team = await prisma.team.findUnique({
    where: { id },
    include: {
      teamPlayers: {
        where: { status: "active" },
        include: {
          player: {
            include: {
              routineCompletions: {
                orderBy: { date: "desc" },
                take: 20
              },
              alerts: {
                where: { status: "open" },
                orderBy: { createdAt: "desc" },
                take: 10
              }
            }
          }
        }
      },
      routineAssignments: {
        where: { status: "active" },
        include: {
          routine: true,
          completions: {
            orderBy: { date: "desc" },
            take: 100
          }
        },
        orderBy: { createdAt: "desc" }
      }
    }
  });

  if (!team) {
    return apiErrorResponse("NOT_FOUND", "Team was not found.", 404);
  }

  const forbidden = requireTeamEntryAccess(request.headers, {
    organizationId: team.organizationId,
    teamId: team.id
  });

  if (forbidden) {
    return forbidden;
  }

  const playerIds = team.teamPlayers.map(({ playerId }) => playerId);
  const completionPlayerIds = new Set(
    team.routineAssignments.flatMap((assignment) => assignment.completions.map((completion) => completion.playerId))
  );

  return NextResponse.json({
    team: {
      id: team.id,
      name: team.brandDisplayName ?? team.name,
      sport: team.sport,
      brand: {
        primaryColor: team.brandPrimaryColor,
        secondaryColor: team.brandSecondaryColor,
        accentColor: team.brandAccentColor,
        logoUrl: team.brandLogoUrl
      }
    },
    summary: {
      rosterCount: playerIds.length,
      activeAssignments: team.routineAssignments.length,
      completedPlayerCount: completionPlayerIds.size,
      openAlertCount: team.teamPlayers.reduce((count, { player }) => count + player.alerts.length, 0)
    },
    players: team.teamPlayers.map(({ player }) => ({
      id: player.id,
      preferredName: player.preferredName,
      completionCount: player.routineCompletions.length,
      openAlerts: player.alerts.map((alert) => ({
        severity: alert.severity,
        reason: alert.reason,
        nextAction: alert.nextAction
      }))
    })),
    assignments: team.routineAssignments.map((assignment) => ({
      id: assignment.id,
      frequency: assignment.frequency,
      dueDates: assignment.dueDates,
      routine: {
        id: assignment.routine.id,
        name: assignment.routine.name,
        durationMin: assignment.routine.durationMin
      },
      completionCount: assignment.completions.length
    }))
  });
}
