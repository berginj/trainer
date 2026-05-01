import { z } from "zod";

export const roleSchema = z.enum([
  "platform_admin",
  "org_admin",
  "league_admin",
  "team_coach",
  "assistant_coach",
  "guardian",
  "player",
  "evaluator"
]);

export type Role = z.infer<typeof roleSchema>;

export const alertSeveritySchema = z.enum(["red", "yellow", "blue"]);

export type AlertSeverity = z.infer<typeof alertSeveritySchema>;

export const metricDefinitionSchema = z.object({
  code: z.string().min(1),
  displayName: z.string().min(1),
  sportScope: z.enum(["universal", "basketball", "baseball", "softball", "multi"]),
  domain: z.enum(["readiness", "workload", "physical", "skill", "movement", "growth", "safety"]),
  valueType: z.enum(["integer", "decimal", "percent", "boolean", "enum", "rubric", "text"]),
  unit: z.string().nullable(),
  benchmarkPolicy: z.enum(["hard_coded", "admin_imported", "local_only", "within_player_only"]),
  confidenceLevel: z.enum(["strong", "moderate", "consensus", "weak"]),
  rankingAllowed: z.boolean().default(false)
});

export type MetricDefinition = z.infer<typeof metricDefinitionSchema>;
export type MetricDefinitionInput = z.input<typeof metricDefinitionSchema>;
