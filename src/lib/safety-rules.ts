import type { MetricDefinition } from "./contracts";

export type BaseballRestResult = {
  dailyMax: number;
  requiredRestDays: number;
};

export type AlertDraft = {
  severity: "red" | "yellow" | "blue";
  ruleCode: string;
  reason: string;
  nextAction: string;
};

const baseballRestBands = [
  {
    minAge: 9,
    maxAge: 10,
    dailyMax: 75,
    thresholds: [
      { min: 1, max: 20, restDays: 0 },
      { min: 21, max: 35, restDays: 1 },
      { min: 36, max: 50, restDays: 2 },
      { min: 51, max: 65, restDays: 3 },
      { min: 66, max: Number.POSITIVE_INFINITY, restDays: 4 }
    ]
  },
  {
    minAge: 11,
    maxAge: 14,
    dailyMax: 95,
    thresholds: [
      { min: 1, max: 20, restDays: 0 },
      { min: 21, max: 35, restDays: 1 },
      { min: 36, max: 50, restDays: 2 },
      { min: 51, max: 65, restDays: 3 },
      { min: 66, max: Number.POSITIVE_INFINITY, restDays: 4 }
    ]
  },
  {
    minAge: 15,
    maxAge: 16,
    dailyMax: 95,
    thresholds: [
      { min: 1, max: 30, restDays: 0 },
      { min: 31, max: 45, restDays: 1 },
      { min: 46, max: 60, restDays: 2 },
      { min: 61, max: 75, restDays: 3 },
      { min: 76, max: Number.POSITIVE_INFINITY, restDays: 4 }
    ]
  }
] as const;

export function getAgeOnDate(dateOfBirth: Date, onDate: Date): number {
  let age = onDate.getUTCFullYear() - dateOfBirth.getUTCFullYear();
  const monthDelta = onDate.getUTCMonth() - dateOfBirth.getUTCMonth();
  const beforeBirthday =
    monthDelta < 0 || (monthDelta === 0 && onDate.getUTCDate() < dateOfBirth.getUTCDate());

  if (beforeBirthday) {
    age -= 1;
  }

  return age;
}

export function resolveBaseballRestDays(age: number, pitches: number): BaseballRestResult {
  if (!Number.isInteger(age) || age < 0) {
    throw new Error("Age must be a non-negative integer.");
  }

  if (!Number.isInteger(pitches) || pitches < 0) {
    throw new Error("Pitch count must be a non-negative integer.");
  }

  const band = baseballRestBands.find(({ minAge, maxAge }) => age >= minAge && age <= maxAge);

  if (!band) {
    return {
      dailyMax: 0,
      requiredRestDays: 0
    };
  }

  const threshold = band.thresholds.find(({ min, max }) => pitches >= min && pitches <= max);

  return {
    dailyMax: band.dailyMax,
    requiredRestDays: threshold?.restDays ?? 0
  };
}

export function canRenderBenchmark(metric: Pick<MetricDefinition, "benchmarkPolicy">): boolean {
  return metric.benchmarkPolicy !== "within_player_only";
}

export function canRenderRanking(metric: Pick<MetricDefinition, "rankingAllowed">): boolean {
  return metric.rankingAllowed;
}

export function buildPainAlert(input: {
  painAny: boolean;
  activity?: "throwing" | "pitching" | "jumping" | "sprinting" | "other";
  consecutivePainDays?: number;
}): AlertDraft | null {
  if (!input.painAny) {
    return null;
  }

  if (input.consecutivePainDays && input.consecutivePainDays >= 2) {
    return {
      severity: "red",
      ruleCode: "pain_consecutive",
      reason: "Pain was reported on consecutive days.",
      nextAction: "Reduce load and recommend qualified professional review if symptoms persist."
    };
  }

  if (
    input.activity === "throwing" ||
    input.activity === "pitching" ||
    input.activity === "jumping" ||
    input.activity === "sprinting"
  ) {
    return {
      severity: "red",
      ruleCode: "pain_activity",
      reason: `Pain was reported during ${input.activity}.`,
      nextAction: "Reduce load and notify the coach or guardian."
    };
  }

  return {
    severity: "yellow",
    ruleCode: "pain_reported",
    reason: "Pain was reported.",
    nextAction: "Monitor symptoms and modify activity if pain persists or worsens."
  };
}

export function buildBaseballRestConflictAlert(input: {
  requiredRestDays: number;
  daysSinceLastOuting: number;
  markedAvailable: boolean;
}): AlertDraft | null {
  if (!input.markedAvailable || input.daysSinceLastOuting >= input.requiredRestDays) {
    return null;
  }

  return {
    severity: "red",
    ruleCode: "baseball_rest_conflict",
    reason: "Baseball pitcher is marked available during a required rest window.",
    nextAction: "Mark unavailable or modify activity until the rest window is complete."
  };
}

export function buildBaseballPitchCountAlert(input: { age: number; pitches: number }): AlertDraft | null {
  const rest = resolveBaseballRestDays(input.age, input.pitches);

  if (rest.dailyMax === 0 || input.pitches <= rest.dailyMax) {
    return null;
  }

  return {
    severity: "red",
    ruleCode: "baseball_daily_pitch_max_exceeded",
    reason: "Baseball pitch count exceeds the age-based daily maximum.",
    nextAction: "Stop pitching and review workload before the next outing."
  };
}

export function buildSoftballExposureAlert(input: {
  consecutivePitchDays: number;
  painAny?: boolean;
  fatigueMarked?: boolean;
}): AlertDraft | null {
  if (input.consecutivePitchDays < 2) {
    return null;
  }

  if (input.painAny || input.fatigueMarked) {
    return {
      severity: "red",
      ruleCode: "softball_exposure_pain",
      reason: "Softball pitcher has repeated consecutive-day exposure with pain or marked fatigue.",
      nextAction: "Reduce pitching exposure and notify the guardian or coach."
    };
  }

  return {
    severity: "yellow",
    ruleCode: "softball_consecutive_exposure",
    reason: "Softball pitcher has repeated consecutive-day exposure.",
    nextAction: "Review workload and consider rest before adding more pitching volume."
  };
}

export function buildReadinessDropAlert(input: {
  currentScore: number;
  sevenDayAverage: number;
  dropThreshold?: number;
}): AlertDraft | null {
  const threshold = input.dropThreshold ?? 1.5;

  if (input.sevenDayAverage - input.currentScore < threshold) {
    return null;
  }

  return {
    severity: "yellow",
    ruleCode: "readiness_drop",
    reason: "Readiness dropped sharply relative to the athlete's recent baseline.",
    nextAction: "Check in and consider modified workload."
  };
}

export function buildWorkloadSpikeAlert(input: {
  currentVolume: number;
  recentAverage: number;
  multiplier?: number;
}): AlertDraft | null {
  const multiplier = input.multiplier ?? 1.5;

  if (input.recentAverage <= 0 || input.currentVolume < input.recentAverage * multiplier) {
    return null;
  }

  return {
    severity: "yellow",
    ruleCode: "workload_spike",
    reason: "Workload is meaningfully above the athlete's recent normal.",
    nextAction: "Review workload plan before adding more volume."
  };
}

export function buildBaselineMissingFlag(hasBaseline: boolean): AlertDraft | null {
  if (hasBaseline) {
    return null;
  }

  return {
    severity: "blue",
    ruleCode: "baseline_missing",
    reason: "Player does not have a baseline evaluation.",
    nextAction: "Capture baseline before interpreting trends."
  };
}

export function buildMonthlyEvaluationDueFlag(input: {
  lastEvaluationDate: Date | null;
  asOfDate: Date;
  intervalDays?: number;
}): AlertDraft | null {
  const intervalDays = input.intervalDays ?? 30;

  if (!input.lastEvaluationDate) {
    return {
      severity: "blue",
      ruleCode: "monthly_eval_due",
      reason: "Player has no completed evaluation on record.",
      nextAction: "Schedule or complete an evaluation."
    };
  }

  const elapsedMs = input.asOfDate.getTime() - input.lastEvaluationDate.getTime();
  const elapsedDays = elapsedMs / (1000 * 60 * 60 * 24);

  if (elapsedDays < intervalDays) {
    return null;
  }

  return {
    severity: "blue",
    ruleCode: "monthly_eval_due",
    reason: "Monthly evaluation is due.",
    nextAction: "Schedule or complete the next evaluation."
  };
}

export function buildBenchmarkConfidenceFlag(metric: Pick<MetricDefinition, "benchmarkPolicy" | "confidenceLevel">): AlertDraft | null {
  if (metric.benchmarkPolicy !== "local_only" && metric.confidenceLevel !== "weak") {
    return null;
  }

  return {
    severity: "blue",
    ruleCode: "low_confidence_benchmark",
    reason: "Benchmark is low confidence or local-only.",
    nextAction: "Display confidence context and prefer within-player trends."
  };
}

export function buildMissedWarmupAlert(input: {
  missedWarmups: number;
  threshold?: number;
}): AlertDraft | null {
  const threshold = input.threshold ?? 3;

  if (input.missedWarmups < threshold) {
    return null;
  }

  return {
    severity: "yellow",
    ruleCode: "missed_warmups",
    reason: "Warm-up compliance has been missed repeatedly.",
    nextAction: "Reinforce warm-up completion before sessions."
  };
}

export function buildRoutineNonComplianceAlert(input: {
  missedWeeks: number;
  thresholdWeeks?: number;
}): AlertDraft | null {
  const thresholdWeeks = input.thresholdWeeks ?? 2;

  if (input.missedWeeks < thresholdWeeks) {
    return null;
  }

  return {
    severity: "yellow",
    ruleCode: "routine_noncompliance",
    reason: "Routine non-compliance has persisted for multiple weeks.",
    nextAction: "Reassign, simplify, or review the routine plan."
  };
}

export function buildGrowthPlusSymptomAlert(input: {
  heightIncreaseCm: number;
  days: number;
  painAny?: boolean;
  performanceDrop?: boolean;
}): AlertDraft | null {
  const rapidGrowth = input.days > 0 && input.heightIncreaseCm / input.days >= 0.035;

  if (!rapidGrowth || (!input.painAny && !input.performanceDrop)) {
    return null;
  }

  return {
    severity: "yellow",
    ruleCode: "growth_plus_symptom",
    reason: "Rapid recent growth is paired with pain or performance drop.",
    nextAction: "Add growth context and avoid overinterpreting performance changes."
  };
}

export function buildGoalResetDueFlag(input: {
  dueDate: Date | null;
  asOfDate: Date;
}): AlertDraft | null {
  if (!input.dueDate || input.dueDate > input.asOfDate) {
    return null;
  }

  return {
    severity: "blue",
    ruleCode: "goal_reset_due",
    reason: "A player goal is due for review.",
    nextAction: "Review and update the goal."
  };
}
