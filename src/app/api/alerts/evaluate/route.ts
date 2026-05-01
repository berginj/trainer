import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { validationErrorResponse } from "@/lib/api-response";
import {
  buildBaseballRestConflictAlert,
  buildBaselineMissingFlag,
  buildBenchmarkConfidenceFlag,
  buildMonthlyEvaluationDueFlag,
  buildPainAlert,
  buildReadinessDropAlert,
  buildSoftballExposureAlert,
  buildWorkloadSpikeAlert
} from "@/lib/safety-rules";

export const runtime = "nodejs";

const requestSchema = z.object({
  pain: z
    .object({
      painAny: z.boolean(),
      activity: z.enum(["throwing", "pitching", "jumping", "sprinting", "other"]).optional(),
      consecutivePainDays: z.number().int().min(0).optional()
    })
    .optional(),
  baseballRest: z
    .object({
      requiredRestDays: z.number().int().min(0),
      daysSinceLastOuting: z.number().int().min(0),
      markedAvailable: z.boolean()
    })
    .optional(),
  softballExposure: z
    .object({
      consecutivePitchDays: z.number().int().min(0),
      painAny: z.boolean().optional(),
      fatigueMarked: z.boolean().optional()
    })
    .optional(),
  readiness: z
    .object({
      currentScore: z.number(),
      sevenDayAverage: z.number(),
      dropThreshold: z.number().optional()
    })
    .optional(),
  workload: z
    .object({
      currentVolume: z.number().min(0),
      recentAverage: z.number().min(0),
      multiplier: z.number().optional()
    })
    .optional(),
  baseline: z
    .object({
      hasBaseline: z.boolean()
    })
    .optional(),
  monthlyEvaluation: z
    .object({
      lastEvaluationDate: z.coerce.date().nullable(),
      asOfDate: z.coerce.date(),
      intervalDays: z.number().int().min(1).optional()
    })
    .optional(),
  benchmark: z
    .object({
      benchmarkPolicy: z.enum(["hard_coded", "admin_imported", "local_only", "within_player_only"]),
      confidenceLevel: z.enum(["strong", "moderate", "consensus", "weak"])
    })
    .optional()
});

export async function POST(request: NextRequest) {
  const parsed = requestSchema.safeParse(await request.json());

  if (!parsed.success) {
    return validationErrorResponse(parsed.error);
  }

  const alerts = [
    parsed.data.pain ? buildPainAlert(parsed.data.pain) : null,
    parsed.data.baseballRest ? buildBaseballRestConflictAlert(parsed.data.baseballRest) : null,
    parsed.data.softballExposure ? buildSoftballExposureAlert(parsed.data.softballExposure) : null,
    parsed.data.readiness ? buildReadinessDropAlert(parsed.data.readiness) : null,
    parsed.data.workload ? buildWorkloadSpikeAlert(parsed.data.workload) : null,
    parsed.data.baseline ? buildBaselineMissingFlag(parsed.data.baseline.hasBaseline) : null,
    parsed.data.monthlyEvaluation ? buildMonthlyEvaluationDueFlag(parsed.data.monthlyEvaluation) : null,
    parsed.data.benchmark ? buildBenchmarkConfidenceFlag(parsed.data.benchmark) : null
  ].filter((alert) => alert !== null);

  return NextResponse.json({ alerts });
}
