import { metricDefinitionSchema, type MetricDefinition, type MetricDefinitionInput } from "./contracts";

export const seedMetricDefinitions = [
  {
    code: "sleep_hours",
    displayName: "Sleep hours",
    sportScope: "universal",
    domain: "readiness",
    valueType: "decimal",
    unit: "hours",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "moderate"
  },
  {
    code: "soreness_score",
    displayName: "Soreness score",
    sportScope: "universal",
    domain: "readiness",
    valueType: "integer",
    unit: "score",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "moderate"
  },
  {
    code: "pain_any",
    displayName: "Pain reported",
    sportScope: "universal",
    domain: "safety",
    valueType: "boolean",
    unit: null,
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "strong"
  },
  {
    code: "pain_throwing_arm",
    displayName: "Throwing arm pain",
    sportScope: "multi",
    domain: "safety",
    valueType: "boolean",
    unit: null,
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "strong"
  },
  {
    code: "energy_score",
    displayName: "Energy score",
    sportScope: "universal",
    domain: "readiness",
    valueType: "integer",
    unit: "score",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "moderate"
  },
  {
    code: "session_rpe",
    displayName: "Session RPE",
    sportScope: "universal",
    domain: "workload",
    valueType: "integer",
    unit: "score",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "moderate"
  },
  {
    code: "session_minutes",
    displayName: "Session minutes",
    sportScope: "universal",
    domain: "workload",
    valueType: "integer",
    unit: "minutes",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "moderate"
  },
  {
    code: "height_cm",
    displayName: "Height",
    sportScope: "universal",
    domain: "growth",
    valueType: "decimal",
    unit: "cm",
    benchmarkPolicy: "admin_imported",
    confidenceLevel: "strong"
  },
  {
    code: "body_mass_kg",
    displayName: "Body mass",
    sportScope: "universal",
    domain: "growth",
    valueType: "decimal",
    unit: "kg",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "moderate"
  },
  {
    code: "sprint_10m_s",
    displayName: "10 m sprint",
    sportScope: "universal",
    domain: "physical",
    valueType: "decimal",
    unit: "s",
    benchmarkPolicy: "admin_imported",
    confidenceLevel: "moderate"
  },
  {
    code: "broad_jump_cm",
    displayName: "Standing broad jump",
    sportScope: "universal",
    domain: "physical",
    valueType: "decimal",
    unit: "cm",
    benchmarkPolicy: "admin_imported",
    confidenceLevel: "moderate"
  },
  {
    code: "vertical_jump_cm",
    displayName: "Vertical jump",
    sportScope: "universal",
    domain: "physical",
    valueType: "decimal",
    unit: "cm",
    benchmarkPolicy: "local_only",
    confidenceLevel: "moderate"
  },
  {
    code: "single_leg_balance_s_left",
    displayName: "Single-leg balance left",
    sportScope: "universal",
    domain: "movement",
    valueType: "decimal",
    unit: "s",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "consensus"
  },
  {
    code: "single_leg_balance_s_right",
    displayName: "Single-leg balance right",
    sportScope: "universal",
    domain: "movement",
    valueType: "decimal",
    unit: "s",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "consensus"
  },
  {
    code: "ankle_knee_to_wall_cm_left",
    displayName: "Ankle knee-to-wall left",
    sportScope: "universal",
    domain: "movement",
    valueType: "decimal",
    unit: "cm",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "consensus"
  },
  {
    code: "ankle_knee_to_wall_cm_right",
    displayName: "Ankle knee-to-wall right",
    sportScope: "universal",
    domain: "movement",
    valueType: "decimal",
    unit: "cm",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "consensus"
  },
  {
    code: "basketball_ft_20_made",
    displayName: "Free throws made out of 20",
    sportScope: "basketball",
    domain: "skill",
    valueType: "integer",
    unit: "made",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "weak"
  },
  {
    code: "basketball_spot_shooting_left_corner_made",
    displayName: "Left corner spot shooting made",
    sportScope: "basketball",
    domain: "skill",
    valueType: "integer",
    unit: "made",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "weak"
  },
  {
    code: "basketball_ballhandling_course_time_s",
    displayName: "Ball-handling course time",
    sportScope: "basketball",
    domain: "skill",
    valueType: "decimal",
    unit: "s",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "weak"
  },
  {
    code: "baseball_pitch_count",
    displayName: "Pitch count",
    sportScope: "baseball",
    domain: "workload",
    valueType: "integer",
    unit: "pitches",
    benchmarkPolicy: "hard_coded",
    confidenceLevel: "strong"
  },
  {
    code: "baseball_pitch_velocity_mph",
    displayName: "Pitch velocity",
    sportScope: "baseball",
    domain: "skill",
    valueType: "decimal",
    unit: "mph",
    benchmarkPolicy: "local_only",
    confidenceLevel: "moderate"
  },
  {
    code: "baseball_strike_pct",
    displayName: "Strike percentage",
    sportScope: "baseball",
    domain: "skill",
    valueType: "percent",
    unit: "%",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "moderate"
  },
  {
    code: "baseball_throw_velocity_mph",
    displayName: "Throwing velocity",
    sportScope: "baseball",
    domain: "skill",
    valueType: "decimal",
    unit: "mph",
    benchmarkPolicy: "local_only",
    confidenceLevel: "moderate"
  },
  {
    code: "softball_pitch_velocity_mph",
    displayName: "Softball pitch velocity",
    sportScope: "softball",
    domain: "skill",
    valueType: "decimal",
    unit: "mph",
    benchmarkPolicy: "local_only",
    confidenceLevel: "weak"
  },
  {
    code: "softball_innings_pitched",
    displayName: "Softball innings pitched",
    sportScope: "softball",
    domain: "workload",
    valueType: "decimal",
    unit: "innings",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "consensus"
  },
  {
    code: "softball_consecutive_pitch_days",
    displayName: "Softball consecutive pitch days",
    sportScope: "softball",
    domain: "workload",
    valueType: "integer",
    unit: "days",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "consensus"
  },
  {
    code: "softball_strike_pct",
    displayName: "Softball strike percentage",
    sportScope: "softball",
    domain: "skill",
    valueType: "percent",
    unit: "%",
    benchmarkPolicy: "within_player_only",
    confidenceLevel: "moderate"
  }
] satisfies MetricDefinitionInput[];

export const seedRoutineCodes = [
  "basketball_beginner_ball_control_12m",
  "basketball_intermediate_landing_and_footwork_18m",
  "baseball_beginner_armcare_12m",
  "baseball_intermediate_accel_and_rotation_18m",
  "softball_beginner_armcare_and_hip_mobility_12m",
  "softball_intermediate_pitcher_recovery_15m"
] as const;

export function parseSeedMetricDefinitions(): MetricDefinition[] {
  return seedMetricDefinitions.map((metric) => metricDefinitionSchema.parse(metric));
}
