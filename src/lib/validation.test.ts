import { describe, expect, it } from "vitest";
import {
  measurementCreateSchema,
  readinessCheckCreateSchema,
  routineAssignmentCreateSchema,
  teamCreateSchema,
  teamPlayerCreateSchema
} from "./validation";

describe("workflow validation schemas", () => {
  it("requires a body part when pain is reported", () => {
    const result = readinessCheckCreateSchema.safeParse({
      organizationId: "org_1",
      playerId: "player_1",
      date: "2026-05-01",
      painAny: true,
      painBodyParts: []
    });

    expect(result.success).toBe(false);
  });

  it("accepts a team create payload", () => {
    expect(
      teamCreateSchema.parse({
        organizationId: "org_1",
        seasonId: "season_1",
        name: "12U Baseball",
        sport: "baseball",
        level: "12U"
      })
    ).toMatchObject({
      sport: "baseball"
    });
  });

  it("requires exactly one measurement value", () => {
    expect(
      measurementCreateSchema.safeParse({
        organizationId: "org_1",
        playerId: "player_1",
        metricDefinitionId: "metric_1",
        protocolVersion: "launch_v1",
        valueNumber: 10,
        valueText: "ten"
      }).success
    ).toBe(false);
  });

  it("requires routine assignments to target a player or team", () => {
    expect(
      routineAssignmentCreateSchema.safeParse({
        organizationId: "org_1",
        routineId: "routine_1",
        frequency: "weekly"
      }).success
    ).toBe(false);
  });

  it("accepts team-player assignment payloads", () => {
    expect(teamPlayerCreateSchema.parse({ teamId: "team_1", playerId: "player_1" })).toEqual({
      teamId: "team_1",
      playerId: "player_1"
    });
  });
});
