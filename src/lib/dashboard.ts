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

type GoalSummary = {
  id: string;
  targetType: string;
  targetValue: string | null;
  dueDate: Date | string | null;
  status: string;
  metricDefinition: {
    displayName: string;
    unit: string | null;
  } | null;
};

type PlayerDashboardInput = {
  player: {
    id: string;
    preferredName: string;
    activeStatus: string;
  };
  teams?: Array<{
    id: string;
    name: string;
    brandDisplayName: string | null;
    brandPrimaryColor: string;
    brandSecondaryColor: string;
    brandAccentColor: string;
    brandLogoUrl: string | null;
  }>;
  latestReadiness: ReadinessSummary | null;
  openAlerts: AlertSummary[];
  routineAssignments: RoutineAssignmentSummary[];
  goals?: GoalSummary[];
  upcomingEvaluationDate: Date | string | null;
};

type TeamDashboardInput = {
  team: {
    id: string;
    name: string;
    sport: string;
    brandDisplayName?: string | null;
    brandPrimaryColor?: string;
    brandSecondaryColor?: string;
    brandAccentColor?: string;
    brandLogoUrl?: string | null;
  };
  players: Array<{
    player: {
      id: string;
      preferredName: string;
    };
    guardianCount?: number;
    pendingInviteCount?: number;
    consentGranted?: boolean;
  }>;
  openAlerts: Array<AlertSummary & { playerId: string }>;
};

export function buildPlayerDashboard(input: PlayerDashboardInput) {
  const redAlertCount = input.openAlerts.filter((alert) => alert.severity === "red").length;

  return {
    player: input.player,
    teams: (input.teams ?? []).map((team) => ({
      id: team.id,
      name: team.brandDisplayName ?? team.name,
      brand: {
        primaryColor: team.brandPrimaryColor,
        secondaryColor: team.brandSecondaryColor,
        accentColor: team.brandAccentColor,
        logoUrl: team.brandLogoUrl
      }
    })),
    status: redAlertCount > 0 ? "modify_or_hold" : "available",
    latestReadiness: input.latestReadiness,
    openAlerts: input.openAlerts,
    assignedRoutines: input.routineAssignments,
    goals: input.goals ?? [],
    upcomingEvaluationDate: input.upcomingEvaluationDate,
    message:
      redAlertCount > 0
        ? "Review current flags before increasing training load."
        : "Focus on consistent routines and personal progress."
  };
}

export function buildTeamDashboard(input: TeamDashboardInput) {
  const alertPlayerIds = new Set(input.openAlerts.map((alert) => alert.playerId));
  const guardianGapCount = input.players.filter(({ guardianCount = 0 }) => guardianCount === 0).length;
  const consentGapCount = input.players.filter(({ consentGranted = false }) => !consentGranted).length;
  const pendingInviteCount = input.players.reduce((count, player) => count + (player.pendingInviteCount ?? 0), 0);

  return {
    team: input.team,
    brand: {
      displayName: input.team.brandDisplayName ?? input.team.name,
      primaryColor: input.team.brandPrimaryColor ?? "#7a1020",
      secondaryColor: input.team.brandSecondaryColor ?? "#f4c542",
      accentColor: input.team.brandAccentColor ?? "#ffffff",
      logoUrl: input.team.brandLogoUrl ?? null
    },
    rosterCount: input.players.length,
    modifyCount: alertPlayerIds.size,
    guardianGapCount,
    consentGapCount,
    pendingInviteCount,
    players: input.players.map(({ player, guardianCount = 0, pendingInviteCount: playerPendingInviteCount = 0, consentGranted = false }) => ({
      id: player.id,
      preferredName: player.preferredName,
      status: alertPlayerIds.has(player.id) ? "modify_or_hold" : "available",
      guardianStatus: guardianCount > 0 ? "linked" : playerPendingInviteCount > 0 ? "invited" : "missing",
      consentStatus: consentGranted ? "active" : "missing",
      pendingInviteCount: playerPendingInviteCount
    })),
    openAlerts: input.openAlerts
  };
}
