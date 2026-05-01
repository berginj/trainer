import { describe, expect, it } from "vitest";
import { buildMonthlyPlayerReportSnapshot } from "./reports";

describe("buildMonthlyPlayerReportSnapshot", () => {
  it("creates immutable report payload shape", () => {
    expect(
      buildMonthlyPlayerReportSnapshot({
        player: {
          id: "player_1",
          preferredName: "Sam"
        },
        readinessCount: 10,
        workloadCount: 4,
        openAlertCount: 0,
        routineCompletionCount: 6,
        generatedAt: new Date("2026-05-01T12:00:00.000Z")
      })
    ).toMatchObject({
      reportVersion: "monthly_player_v1",
      generatedAt: "2026-05-01T12:00:00.000Z",
      developmentSnapshot: {
        readinessCheckCount: 10,
        workloadEntryCount: 4,
        routineCompletionCount: 6,
        openAlertCount: 0,
        personalBestCount: 0,
        benchmarkContextCount: 0
      },
      currentPainFlags: "No open alerts in this snapshot.",
      whatChangedSinceLastMonth: "Comparison requires a prior report snapshot."
    });
  });
});
