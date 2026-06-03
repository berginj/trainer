import type { PrismaClient } from "@prisma/client";

export const DATA_RETENTION_POLICY = {
  expiredInvitationGraceDays: 30,
  revokedCalendarIntegrationGraceDays: 30,
  reviewedPaymentImportGraceDays: 365,
  reviewedSportStatImportGraceDays: 365
} as const;

export type LifecyclePrisma = Pick<
  PrismaClient,
  | "player"
  | "guardianPlayerLink"
  | "consentRecord"
  | "teamPlayer"
  | "readinessCheck"
  | "workloadEntry"
  | "measurement"
  | "evaluation"
  | "routineAssignment"
  | "routineCompletion"
  | "alert"
  | "goal"
  | "report"
  | "appointmentAthleteMatch"
  | "paymentAthleteMatch"
  | "externalPlayerIdentity"
  | "playerGameStatLine"
  | "playerSeasonStatSnapshot"
  | "auditEvent"
  | "invitation"
  | "externalCalendarIntegration"
  | "paymentImportBatch"
  | "sportStatImportBatch"
>;

export type PlayerLifecycleScope = {
  organizationId: string;
  playerId: string;
};

export type RetentionScope = {
  organizationId: string;
  now: Date;
};

export type DeletePlanItem = {
  model: string;
  action: "delete" | "disconnect" | "redact";
  where: Record<string, unknown>;
};

export type RetentionPlanItem = {
  model: string;
  reason: string;
  cutoff: Date;
  where: Record<string, unknown>;
};

function daysAgo(now: Date, days: number) {
  const cutoff = new Date(now);

  cutoff.setUTCDate(cutoff.getUTCDate() - days);

  return cutoff;
}

function playerWhere(scope: PlayerLifecycleScope) {
  return {
    organizationId: scope.organizationId,
    playerId: scope.playerId
  };
}

export function buildPlayerDeletePlan(scope: PlayerLifecycleScope): DeletePlanItem[] {
  const playerScoped = playerWhere(scope);

  return [
    {
      model: "AppointmentAthleteMatch",
      action: "disconnect",
      where: playerScoped
    },
    {
      model: "PaymentAthleteMatch",
      action: "disconnect",
      where: playerScoped
    },
    {
      model: "ExternalPlayerIdentity",
      action: "disconnect",
      where: playerScoped
    },
    {
      model: "PlayerGameStatLine",
      action: "disconnect",
      where: playerScoped
    },
    {
      model: "PlayerSeasonStatSnapshot",
      action: "disconnect",
      where: playerScoped
    },
    {
      model: "Player",
      action: "delete",
      where: {
        organizationId: scope.organizationId,
        id: scope.playerId
      }
    }
  ];
}

export function buildRetentionPlan(scope: RetentionScope): RetentionPlanItem[] {
  const expiredInvitationCutoff = daysAgo(scope.now, DATA_RETENTION_POLICY.expiredInvitationGraceDays);
  const revokedCalendarCutoff = daysAgo(scope.now, DATA_RETENTION_POLICY.revokedCalendarIntegrationGraceDays);
  const reviewedPaymentCutoff = daysAgo(scope.now, DATA_RETENTION_POLICY.reviewedPaymentImportGraceDays);
  const reviewedSportStatCutoff = daysAgo(scope.now, DATA_RETENTION_POLICY.reviewedSportStatImportGraceDays);

  return [
    {
      model: "Invitation",
      reason: "Expired invitations retain invitee email and token hashes only for the grace window.",
      cutoff: expiredInvitationCutoff,
      where: {
        organizationId: scope.organizationId,
        status: "expired",
        updatedAt: { lt: expiredInvitationCutoff }
      }
    },
    {
      model: "ExternalCalendarIntegration",
      reason: "Revoked calendar integrations should not keep encrypted provider tokens indefinitely.",
      cutoff: revokedCalendarCutoff,
      where: {
        organizationId: scope.organizationId,
        status: "revoked",
        updatedAt: { lt: revokedCalendarCutoff }
      }
    },
    {
      model: "PaymentImportBatch",
      reason: "Reviewed payment imports contain operational payment PII and raw CSV metadata.",
      cutoff: reviewedPaymentCutoff,
      where: {
        organizationId: scope.organizationId,
        importedAt: { lt: reviewedPaymentCutoff }
      }
    },
    {
      model: "SportStatImportBatch",
      reason: "Reviewed sport stat imports contain raw external sports metadata.",
      cutoff: reviewedSportStatCutoff,
      where: {
        organizationId: scope.organizationId,
        status: "reviewed",
        importedAt: { lt: reviewedSportStatCutoff }
      }
    }
  ];
}

export async function buildPlayerDataExport(prisma: LifecyclePrisma, scope: PlayerLifecycleScope) {
  const baseWhere = {
    organizationId: scope.organizationId,
    playerId: scope.playerId
  };
  const [profile, guardians, consent, teams, readiness, workload, measurements, evaluations, routines, completions, alerts, goals, reports, appointmentMatches, paymentMatches, externalIdentities, gameStatLines, seasonStatSnapshots, auditEvents] =
    await Promise.all([
      prisma.player.findFirst({
        where: {
          organizationId: scope.organizationId,
          id: scope.playerId
        }
      }),
      prisma.guardianPlayerLink.findMany({ where: { playerId: scope.playerId } }),
      prisma.consentRecord.findMany({ where: baseWhere }),
      prisma.teamPlayer.findMany({ where: baseWhere }),
      prisma.readinessCheck.findMany({ where: baseWhere, orderBy: { date: "desc" } }),
      prisma.workloadEntry.findMany({ where: baseWhere, orderBy: { date: "desc" } }),
      prisma.measurement.findMany({ where: baseWhere, orderBy: { createdAt: "desc" } }),
      prisma.evaluation.findMany({ where: baseWhere, orderBy: { date: "desc" } }),
      prisma.routineAssignment.findMany({ where: { organizationId: scope.organizationId, playerId: scope.playerId } }),
      prisma.routineCompletion.findMany({ where: baseWhere, orderBy: { date: "desc" } }),
      prisma.alert.findMany({ where: baseWhere, orderBy: { createdAt: "desc" } }),
      prisma.goal.findMany({ where: baseWhere, orderBy: { createdAt: "desc" } }),
      prisma.report.findMany({
        where: { organizationId: scope.organizationId, playerId: scope.playerId },
        orderBy: { generatedAt: "desc" }
      }),
      prisma.appointmentAthleteMatch.findMany({ where: baseWhere }),
      prisma.paymentAthleteMatch.findMany({ where: baseWhere }),
      prisma.externalPlayerIdentity.findMany({ where: baseWhere }),
      prisma.playerGameStatLine.findMany({ where: baseWhere, orderBy: { createdAt: "desc" } }),
      prisma.playerSeasonStatSnapshot.findMany({ where: baseWhere, orderBy: { createdAt: "desc" } }),
      prisma.auditEvent.findMany({
        where: {
          organizationId: scope.organizationId,
          OR: [{ entityId: scope.playerId }, { metadata: { path: ["playerId"], equals: scope.playerId } }]
        },
        orderBy: { occurredAt: "desc" }
      })
    ]);

  return {
    exportedAt: new Date().toISOString(),
    scope,
    profile,
    guardians,
    consent,
    teams,
    readiness,
    workload,
    measurements,
    evaluations,
    routines,
    completions,
    alerts,
    goals,
    reports,
    appointmentMatches,
    paymentMatches,
    externalIdentities,
    gameStatLines,
    seasonStatSnapshots,
    auditEvents
  };
}

export async function countPlayerDeletePlan(prisma: LifecyclePrisma, scope: PlayerLifecycleScope) {
  const baseWhere = playerWhere(scope);
  const counts = await Promise.all([
    prisma.appointmentAthleteMatch.count({ where: baseWhere }),
    prisma.paymentAthleteMatch.count({ where: baseWhere }),
    prisma.externalPlayerIdentity.count({ where: baseWhere }),
    prisma.playerGameStatLine.count({ where: baseWhere }),
    prisma.playerSeasonStatSnapshot.count({ where: baseWhere }),
    prisma.player.count({ where: { organizationId: scope.organizationId, id: scope.playerId } })
  ]);

  return buildPlayerDeletePlan(scope).map((item, index) => ({
    ...item,
    count: counts[index]
  }));
}

export async function countRetentionPlan(prisma: LifecyclePrisma, scope: RetentionScope) {
  const plan = buildRetentionPlan(scope);
  const counts = await Promise.all([
    prisma.invitation.count({ where: plan[0].where }),
    prisma.externalCalendarIntegration.count({ where: plan[1].where }),
    prisma.paymentImportBatch.count({ where: plan[2].where }),
    prisma.sportStatImportBatch.count({ where: plan[3].where })
  ]);

  return plan.map((item, index) => ({
    ...item,
    count: counts[index]
  }));
}
