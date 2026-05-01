import { z } from "zod";
import { roleSchema } from "./contracts";

export const organizationCreateSchema = z.object({
  name: z.string().min(1),
  timezone: z.string().min(1).default("America/New_York")
});

export const seasonCreateSchema = z.object({
  organizationId: z.string().min(1),
  name: z.string().min(1),
  startDate: z.coerce.date(),
  endDate: z.coerce.date()
});

export const teamCreateSchema = z.object({
  organizationId: z.string().min(1),
  seasonId: z.string().min(1),
  name: z.string().min(1),
  sport: z.enum(["basketball", "baseball", "softball"]),
  sexCategory: z.string().min(1).optional(),
  level: z.string().min(1)
});

export const playerCreateSchema = z.object({
  organizationId: z.string().min(1),
  preferredName: z.string().min(1),
  dateOfBirth: z.coerce.date(),
  sexAtBirth: z.string().min(1).optional(),
  sports: z.array(z.enum(["basketball", "baseball", "softball"])).default([]),
  positions: z.array(z.string().min(1)).default([]),
  dominantHand: z.string().min(1).optional(),
  dominantFoot: z.string().min(1).optional()
});

export const userProfileCreateSchema = z.object({
  externalIdentityId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1)
});

export const membershipCreateSchema = z.object({
  organizationId: z.string().min(1),
  userId: z.string().min(1),
  role: roleSchema
});

export const readinessCheckCreateSchema = z
  .object({
    organizationId: z.string().min(1),
    playerId: z.string().min(1),
    date: z.coerce.date(),
    sleepHours: z.number().min(0).max(24).optional(),
    sleepQuality: z.number().int().min(1).max(5).optional(),
    sorenessScore: z.number().int().min(0).max(10).optional(),
    painAny: z.boolean().default(false),
    painBodyParts: z.array(z.string().min(1)).default([]),
    energyScore: z.number().int().min(1).max(5).optional(),
    moodScore: z.number().int().min(1).max(5).optional(),
    notes: z.string().max(2000).optional(),
    enteredByUserId: z.string().min(1).optional()
  })
  .refine((value) => !value.painAny || value.painBodyParts.length > 0, {
    message: "Body part is required when pain is reported.",
    path: ["painBodyParts"]
  });

export const workloadEntryCreateSchema = z.object({
  organizationId: z.string().min(1),
  playerId: z.string().min(1),
  teamId: z.string().min(1).optional(),
  date: z.coerce.date(),
  sport: z.enum(["basketball", "baseball", "softball"]),
  sessionType: z.string().min(1),
  minutes: z.number().int().min(0).optional(),
  sessionRpe: z.number().int().min(0).max(10).optional(),
  throws: z.number().int().min(0).optional(),
  pitches: z.number().int().min(0).optional(),
  innings: z.number().min(0).optional(),
  participationStatus: z.string().min(1),
  notes: z.string().max(2000).optional(),
  enteredByUserId: z.string().min(1).optional()
});

export const guardianCreateSchema = z.object({
  organizationId: z.string().min(1),
  externalIdentityId: z.string().min(1),
  email: z.string().email(),
  displayName: z.string().min(1),
  playerId: z.string().min(1).optional(),
  relationship: z.string().min(1).default("guardian")
});

export const evaluationCreateSchema = z.object({
  organizationId: z.string().min(1),
  playerId: z.string().min(1),
  evaluatorUserId: z.string().min(1).optional(),
  evaluationType: z.string().min(1),
  date: z.coerce.date(),
  notes: z.string().max(2000).optional()
});

export const measurementCreateSchema = z
  .object({
    organizationId: z.string().min(1),
    playerId: z.string().min(1),
    evaluationId: z.string().min(1).optional(),
    workloadEntryId: z.string().min(1).optional(),
    metricDefinitionId: z.string().min(1),
    valueNumber: z.number().optional(),
    valueText: z.string().optional(),
    valueBoolean: z.boolean().optional(),
    protocolVersion: z.string().min(1),
    context: z.record(z.string(), z.unknown()).default({}),
    enteredByUserId: z.string().min(1).optional(),
    enteredByRole: roleSchema.optional()
  })
  .refine(
    (value) =>
      [value.valueNumber, value.valueText, value.valueBoolean].filter((field) => field !== undefined).length === 1,
    {
      message: "Exactly one measurement value field is required.",
      path: ["value"]
    }
  );

export const routineAssignmentCreateSchema = z
  .object({
    organizationId: z.string().min(1),
    routineId: z.string().min(1),
    playerId: z.string().min(1).optional(),
    teamId: z.string().min(1).optional(),
    assignedById: z.string().min(1).optional(),
    dueDates: z.array(z.coerce.date()).default([]),
    frequency: z.string().min(1)
  })
  .refine((value) => Boolean(value.playerId || value.teamId), {
    message: "Routine assignment requires a playerId or teamId.",
    path: ["playerId"]
  });

export const routineCompletionCreateSchema = z.object({
  organizationId: z.string().min(1),
  assignmentId: z.string().min(1),
  playerId: z.string().min(1),
  date: z.coerce.date(),
  completed: z.boolean(),
  quality: z.string().min(1).optional(),
  painDuring: z.boolean().default(false),
  rpe: z.number().int().min(0).max(10).optional(),
  notes: z.string().max(2000).optional()
});

export const consentRecordUpsertSchema = z.object({
  organizationId: z.string().min(1),
  playerId: z.string().min(1),
  guardianUserId: z.string().min(1),
  consentType: z.enum(["readiness", "workload", "reports", "media"]),
  status: z.enum(["granted", "revoked", "pending"]),
  version: z.string().min(1)
});

export const alertStatusUpdateSchema = z.object({
  status: z.enum(["acknowledged", "resolved"]),
  actorUserId: z.string().min(1).optional()
});

export const benchmarkImportSchema = z.object({
  organizationId: z.string().min(1).optional(),
  metricDefinitionId: z.string().min(1),
  ageBand: z.string().min(1).optional(),
  sexScope: z.string().min(1).optional(),
  maturityScope: z.string().min(1).optional(),
  levelScope: z.string().min(1).optional(),
  sourceTitle: z.string().min(1),
  sourceCitation: z.string().min(1),
  confidence: z.enum(["strong", "moderate", "consensus", "weak"]),
  lowerBound: z.number().optional(),
  midBound: z.number().optional(),
  upperBound: z.number().optional(),
  notes: z.string().max(2000).optional()
});

export const goalCreateSchema = z.object({
  organizationId: z.string().min(1),
  playerId: z.string().min(1),
  metricDefinitionId: z.string().min(1).optional(),
  targetType: z.string().min(1),
  targetValue: z.string().min(1).optional(),
  dueDate: z.coerce.date().optional()
});

export const teamPlayerCreateSchema = z.object({
  teamId: z.string().min(1),
  playerId: z.string().min(1)
});
