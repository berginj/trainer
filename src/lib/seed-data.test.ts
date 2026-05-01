import { describe, expect, it } from "vitest";
import { parseSeedMetricDefinitions, seedMetricDefinitions, seedRoutineCodes } from "./seed-data";

describe("seedMetricDefinitions", () => {
  it("contains the MVP metric inventory", () => {
    expect(seedMetricDefinitions).toHaveLength(27);
    expect(seedMetricDefinitions.map((metric) => metric.code)).toContain("baseball_pitch_count");
    expect(seedMetricDefinitions.map((metric) => metric.code)).toContain("softball_consecutive_pitch_days");
  });

  it("parses through the metric definition contract", () => {
    expect(parseSeedMetricDefinitions()).toHaveLength(seedMetricDefinitions.length);
  });

  it("keeps sensitive youth metrics out of rankings by default", () => {
    const sensitiveCodes = ["pain_any", "body_mass_kg", "baseball_pitch_velocity_mph", "softball_pitch_velocity_mph"];

    const parsedMetrics = parseSeedMetricDefinitions();

    for (const code of sensitiveCodes) {
      expect(parsedMetrics.find((metric) => metric.code === code)?.rankingAllowed).toBe(false);
    }
  });
});

describe("seedRoutineCodes", () => {
  it("contains the MVP routine library", () => {
    expect(seedRoutineCodes).toEqual([
      "basketball_beginner_ball_control_12m",
      "basketball_intermediate_landing_and_footwork_18m",
      "baseball_beginner_armcare_12m",
      "baseball_intermediate_accel_and_rotation_18m",
      "softball_beginner_armcare_and_hip_mobility_12m",
      "softball_intermediate_pitcher_recovery_15m"
    ]);
  });
});
