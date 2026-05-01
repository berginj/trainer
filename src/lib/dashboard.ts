type ReadinessSummary = {
  date: Date | string;
  energyScore: number | null;
  sorenessScore: number | null;
  painAny: boolean;
};

type AlertSummary = {
  severity: "red" | "yellow" | "blue";
  ruleCode: string;
  reason: string;
  nextAction: string;
};

type RoutineAssignmentSummary = {
  id: string;
  frequency: string;
  routine: {
    name: string;
    sport: string;
    durationMin: number;
  };
};

type PlayerDashboardInput = {
  player: {
    id: string;
    preferredName: string;
    activeStatus: string;
  };
  latestReadiness: ReadinessSummary | null;
  openAlerts: AlertSummary[];
  routineAssignments: RoutineAssignmentSummary[];
  upcomingEvaluationDate: Date | string | null;
};

type TeamDashboardInput = {
  team: {
    id: string;
    name: string;
    sport: string;
  };
  players: Array<{
    player: {
      id: string;
      preferredName: string;
    };
  }>;
  openAlerts: Array<AlertSummary & { playerId: string }>;
};

export function buildPlayerDashboard(input: PlayerDashboardInput) {
  const redAlertCount = input.openAlerts.filter((alert) => alert.severity === "red").length;

  return {
    player: input.player,
    status: redAlertCount > 0 ? "modify_or_hold" : "available",
    latestReadiness: input.latestReadiness,
    openAlerts: input.openAlerts,
    assignedRoutines: input.routineAssignments,
    upcomingEvaluationDate: input.upcomingEvaluationDate,
    message:
      redAlertCount > 0
        ? "Review current flags before increasing training load."
        : "Focus on consistent routines and personal progress."
  };
}

export function buildTeamDashboard(input: TeamDashboardInput) {
  const alertPlayerIds = new Set(input.openAlerts.map((alert) => alert.playerId));

  return {
    team: input.team,
    rosterCount: input.players.length,
    modifyCount: alertPlayerIds.size,
    players: input.players.map(({ player }) => ({
      id: player.id,
      preferredName: player.preferredName,
      status: alertPlayerIds.has(player.id) ? "modify_or_hold" : "available"
    })),
    openAlerts: input.openAlerts
  };
}
