import { describe, expect, it } from "vitest";
import { buildPlayerDashboard, buildTeamDashboard } from "./dashboard";

describe("dashboard payload builders", () => {
  it("marks players with red alerts as modify or hold", () => {
    expect(
      buildPlayerDashboard({
        player: {
          id: "player_1",
          preferredName: "Sam",
          activeStatus: "active"
        },
        latestReadiness: null,
        openAlerts: [
          {
            severity: "red",
            ruleCode: "pain_activity",
            reason: "Pain was reported during throwing.",
            nextAction: "Reduce load and notify the coach or guardian."
          }
        ],
        routineAssignments: [],
        upcomingEvaluationDate: null
      }).status
    ).toBe("modify_or_hold");
  });

  it("summarizes team modification counts", () => {
    const dashboard = buildTeamDashboard({
      team: {
        id: "team_1",
        name: "12U Baseball",
        sport: "baseball"
      },
      players: [
        {
          player: {
            id: "player_1",
            preferredName: "Sam"
          }
        },
        {
          player: {
            id: "player_2",
            preferredName: "Ari"
          }
        }
      ],
      openAlerts: [
        {
          playerId: "player_1",
          severity: "yellow",
          ruleCode: "readiness_drop",
          reason: "Readiness dropped.",
          nextAction: "Check in and consider modified workload."
        }
      ]
    });

    expect(dashboard.rosterCount).toBe(2);
    expect(dashboard.modifyCount).toBe(1);
    expect(dashboard.players).toContainEqual({
      id: "player_1",
      preferredName: "Sam",
      status: "modify_or_hold"
    });
  });
});
