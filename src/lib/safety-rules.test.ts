import { describe, expect, it } from "vitest";
import {
  buildBaseballRestConflictAlert,
  buildBaseballPitchCountAlert,
  buildBaselineMissingFlag,
  buildBenchmarkConfidenceFlag,
  buildMonthlyEvaluationDueFlag,
  buildPainAlert,
  buildReadinessDropAlert,
  buildSoftballExposureAlert,
  buildWorkloadSpikeAlert,
  canRenderBenchmark,
  canRenderRanking,
  getAgeOnDate,
  resolveBaseballRestDays
} from "./safety-rules";

describe("getAgeOnDate", () => {
  it("calculates age using the outing date", () => {
    expect(getAgeOnDate(new Date("2012-05-02T00:00:00.000Z"), new Date("2026-05-01T00:00:00.000Z"))).toBe(13);
    expect(getAgeOnDate(new Date("2012-05-01T00:00:00.000Z"), new Date("2026-05-01T00:00:00.000Z"))).toBe(14);
  });
});

describe("expanded alert rules", () => {
  it("creates softball exposure guidance and red alerts", () => {
    expect(buildSoftballExposureAlert({ consecutivePitchDays: 2 })).toMatchObject({
      severity: "yellow",
      ruleCode: "softball_consecutive_exposure"
    });
    expect(buildSoftballExposureAlert({ consecutivePitchDays: 2, painAny: true })).toMatchObject({
      severity: "red",
      ruleCode: "softball_exposure_pain"
    });
  });

  it("creates readiness and workload alerts only above threshold", () => {
    expect(buildReadinessDropAlert({ currentScore: 2, sevenDayAverage: 4 })).toMatchObject({
      ruleCode: "readiness_drop"
    });
    expect(buildReadinessDropAlert({ currentScore: 3.5, sevenDayAverage: 4 })).toBeNull();
    expect(buildWorkloadSpikeAlert({ currentVolume: 80, recentAverage: 40 })).toMatchObject({
      ruleCode: "workload_spike"
    });
    expect(buildWorkloadSpikeAlert({ currentVolume: 50, recentAverage: 40 })).toBeNull();
  });

  it("creates informational flags for missing baselines and due evaluations", () => {
    expect(buildBaselineMissingFlag(false)).toMatchObject({ severity: "blue", ruleCode: "baseline_missing" });
    expect(
      buildMonthlyEvaluationDueFlag({
        lastEvaluationDate: new Date("2026-03-01T00:00:00.000Z"),
        asOfDate: new Date("2026-05-01T00:00:00.000Z")
      })
    ).toMatchObject({ severity: "blue", ruleCode: "monthly_eval_due" });
  });

  it("flags low-confidence benchmark contexts", () => {
    expect(buildBenchmarkConfidenceFlag({ benchmarkPolicy: "local_only", confidenceLevel: "moderate" })).toMatchObject({
      ruleCode: "low_confidence_benchmark"
    });
    expect(buildBenchmarkConfidenceFlag({ benchmarkPolicy: "hard_coded", confidenceLevel: "strong" })).toBeNull();
  });
});

describe("resolveBaseballRestDays", () => {
  it("handles 9 to 14 year old threshold boundaries", () => {
    expect(resolveBaseballRestDays(10, 20)).toEqual({ dailyMax: 75, requiredRestDays: 0 });
    expect(resolveBaseballRestDays(10, 21)).toEqual({ dailyMax: 75, requiredRestDays: 1 });
    expect(resolveBaseballRestDays(12, 50)).toEqual({ dailyMax: 95, requiredRestDays: 2 });
    expect(resolveBaseballRestDays(14, 66)).toEqual({ dailyMax: 95, requiredRestDays: 4 });
  });

  it("handles 15 to 16 year old threshold boundaries", () => {
    expect(resolveBaseballRestDays(15, 30)).toEqual({ dailyMax: 95, requiredRestDays: 0 });
    expect(resolveBaseballRestDays(15, 31)).toEqual({ dailyMax: 95, requiredRestDays: 1 });
    expect(resolveBaseballRestDays(16, 76)).toEqual({ dailyMax: 95, requiredRestDays: 4 });
  });

  it("returns no enforced rest for unsupported ages", () => {
    expect(resolveBaseballRestDays(8, 50)).toEqual({ dailyMax: 0, requiredRestDays: 0 });
  });
});

describe("metric display guards", () => {
  it("blocks benchmark rendering for within-player-only metrics", () => {
    expect(canRenderBenchmark({ benchmarkPolicy: "within_player_only" })).toBe(false);
    expect(canRenderBenchmark({ benchmarkPolicy: "hard_coded" })).toBe(true);
  });

  it("blocks rankings unless explicitly allowed", () => {
    expect(canRenderRanking({ rankingAllowed: false })).toBe(false);
    expect(canRenderRanking({ rankingAllowed: true })).toBe(true);
  });
});

describe("alert drafts", () => {
  it("creates red alerts for activity pain", () => {
    expect(buildPainAlert({ painAny: true, activity: "throwing" })).toMatchObject({
      severity: "red",
      ruleCode: "pain_activity"
    });
  });

  it("prioritizes consecutive pain as a red alert", () => {
    expect(buildPainAlert({ painAny: true, activity: "other", consecutivePainDays: 2 })).toMatchObject({
      severity: "red",
      ruleCode: "pain_consecutive"
    });
  });

  it("creates baseball rest conflict alerts only when marked available too soon", () => {
    expect(
      buildBaseballRestConflictAlert({
        requiredRestDays: 3,
        daysSinceLastOuting: 1,
        markedAvailable: true
      })
    ).toMatchObject({
      severity: "red",
      ruleCode: "baseball_rest_conflict"
    });

    expect(
      buildBaseballRestConflictAlert({
        requiredRestDays: 3,
        daysSinceLastOuting: 3,
        markedAvailable: true
      })
    ).toBeNull();
  });

  it("creates red alerts when baseball daily pitch max is exceeded", () => {
    expect(buildBaseballPitchCountAlert({ age: 10, pitches: 76 })).toMatchObject({
      severity: "red",
      ruleCode: "baseball_daily_pitch_max_exceeded"
    });
    expect(buildBaseballPitchCountAlert({ age: 10, pitches: 75 })).toBeNull();
  });
});
