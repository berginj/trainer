type PlayerReportInput = {
  player: {
    id: string;
    preferredName: string;
  };
  readinessCount: number;
  workloadCount: number;
  openAlertCount: number;
  routineCompletionCount: number;
  personalBestCount?: number;
  benchmarkContextCount?: number;
  coachPriorities?: string[];
  homeRoutineSchedule?: string[];
  parentNotes?: string;
  generatedAt: Date;
};

export function buildMonthlyPlayerReportSnapshot(input: PlayerReportInput) {
  return {
    reportVersion: "monthly_player_v1",
    generatedAt: input.generatedAt.toISOString(),
    player: input.player,
    developmentSnapshot: {
      readinessCheckCount: input.readinessCount,
      workloadEntryCount: input.workloadCount,
      routineCompletionCount: input.routineCompletionCount,
      openAlertCount: input.openAlertCount,
      personalBestCount: input.personalBestCount ?? 0,
      benchmarkContextCount: input.benchmarkContextCount ?? 0
    },
    readinessTrend:
      input.readinessCount > 0
        ? "Readiness data is available for trend review."
        : "Readiness trend is not available yet.",
    workloadSummary:
      input.workloadCount > 0 ? "Workload entries are available for review." : "Workload history is not available yet.",
    currentPainFlags:
      input.openAlertCount > 0 ? "Open alerts require review before increasing load." : "No open alerts in this snapshot.",
    coachPriorities: input.coachPriorities ?? ["Maintain consistent routines and monthly evaluation rhythm."],
    homeRoutineSchedule: input.homeRoutineSchedule ?? [],
    parentNotes: input.parentNotes ?? "",
    whatChangedSinceLastMonth: "Comparison requires a prior report snapshot.",
    benchmarkNote: "Benchmark cards must show confidence labels and avoid unsupported public rankings.",
    nextActions:
      input.openAlertCount > 0
        ? ["Review open alerts before increasing load."]
        : ["Continue assigned routines and monthly evaluation rhythm."]
  };
}
