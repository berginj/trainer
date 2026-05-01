import { describe, expect, it } from "vitest";
import { metricDefinitionSchema, roleSchema } from "./contracts";

describe("roleSchema", () => {
  it("accepts MVP roles from the build plan", () => {
    expect(roleSchema.parse("guardian")).toBe("guardian");
    expect(roleSchema.parse("team_coach")).toBe("team_coach");
    expect(roleSchema.parse("platform_admin")).toBe("platform_admin");
  });
});

describe("metricDefinitionSchema", () => {
  it("defaults rankingAllowed to false for safety", () => {
    const metric = metricDefinitionSchema.parse({
      code: "pain_any",
      displayName: "Pain reported",
      sportScope: "universal",
      domain: "safety",
      valueType: "boolean",
      unit: null,
      benchmarkPolicy: "within_player_only",
      confidenceLevel: "strong"
    });

    expect(metric.rankingAllowed).toBe(false);
  });
});
