import { describe, expect, it, vi } from "vitest";
import {
  DATA_RETENTION_POLICY,
  buildPlayerDataExport,
  buildPlayerDeletePlan,
  buildRetentionPlan,
  countPlayerDeletePlan,
  countRetentionPlan,
  type LifecyclePrisma
} from "./data-lifecycle";

function modelMock(findManyResult: unknown[] = [], countResult = 0) {
  return {
    findFirst: vi.fn().mockResolvedValue(findManyResult[0] ?? null),
    findMany: vi.fn().mockResolvedValue(findManyResult),
    count: vi.fn().mockResolvedValue(countResult)
  };
}

function fakePrisma() {
  return {
    player: modelMock([{ id: "player_1", organizationId: "org_1", preferredName: "Avery" }], 1),
    guardianPlayerLink: modelMock([{ id: "guardian_link_1", playerId: "player_1" }], 2),
    consentRecord: modelMock([{ id: "consent_1", playerId: "player_1" }], 3),
    teamPlayer: modelMock([{ id: "team_player_1", playerId: "player_1" }], 4),
    readinessCheck: modelMock([{ id: "readiness_1", playerId: "player_1" }], 5),
    workloadEntry: modelMock([{ id: "workload_1", playerId: "player_1" }], 6),
    measurement: modelMock([{ id: "measurement_1", playerId: "player_1" }], 7),
    evaluation: modelMock([{ id: "evaluation_1", playerId: "player_1" }], 8),
    routineAssignment: modelMock([{ id: "assignment_1", playerId: "player_1" }], 9),
    routineCompletion: modelMock([{ id: "completion_1", playerId: "player_1" }], 10),
    alert: modelMock([{ id: "alert_1", playerId: "player_1" }], 11),
    goal: modelMock([{ id: "goal_1", playerId: "player_1" }], 12),
    report: modelMock([{ id: "report_1", playerId: "player_1" }], 13),
    appointmentAthleteMatch: modelMock([{ id: "appointment_match_1", playerId: "player_1" }], 14),
    paymentAthleteMatch: modelMock([{ id: "payment_match_1", playerId: "player_1" }], 15),
    externalPlayerIdentity: modelMock([{ id: "external_identity_1", playerId: "player_1" }], 16),
    playerGameStatLine: modelMock([{ id: "stat_line_1", playerId: "player_1" }], 17),
    playerSeasonStatSnapshot: modelMock([{ id: "season_snapshot_1", playerId: "player_1" }], 18),
    auditEvent: modelMock([{ id: "audit_1", entityId: "player_1" }], 19),
    invitation: modelMock([], 20),
    externalCalendarIntegration: modelMock([], 21),
    paymentImportBatch: modelMock([], 22),
    sportStatImportBatch: modelMock([], 23)
  } as unknown as LifecyclePrisma;
}

describe("data lifecycle helpers", () => {
  it("builds player export sections with organization and player scoping", async () => {
    const prisma = fakePrisma();
    const exportPayload = await buildPlayerDataExport(prisma, {
      organizationId: "org_1",
      playerId: "player_1"
    });

    expect(exportPayload.scope).toEqual({ organizationId: "org_1", playerId: "player_1" });
    expect(exportPayload.profile).toMatchObject({ id: "player_1" });
    expect(exportPayload.readiness).toEqual([{ id: "readiness_1", playerId: "player_1" }]);
    expect(exportPayload.reports).toEqual([{ id: "report_1", playerId: "player_1" }]);
    expect(prisma.player.findFirst).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
        id: "player_1"
      }
    });
    expect(prisma.auditEvent.findMany).toHaveBeenCalledWith({
      where: {
        organizationId: "org_1",
        OR: [{ entityId: "player_1" }, { metadata: { path: ["playerId"], equals: "player_1" } }]
      },
      orderBy: { occurredAt: "desc" }
    });
  });

  it("plans disconnects before deleting the player record", () => {
    const plan = buildPlayerDeletePlan({
      organizationId: "org_1",
      playerId: "player_1"
    });

    expect(plan.map((item) => item.model)).toEqual([
      "AppointmentAthleteMatch",
      "PaymentAthleteMatch",
      "ExternalPlayerIdentity",
      "PlayerGameStatLine",
      "PlayerSeasonStatSnapshot",
      "Player"
    ]);
    expect(plan.at(-1)).toEqual({
      model: "Player",
      action: "delete",
      where: {
        organizationId: "org_1",
        id: "player_1"
      }
    });
  });

  it("counts the player delete plan without mutating records", async () => {
    const counted = await countPlayerDeletePlan(fakePrisma(), {
      organizationId: "org_1",
      playerId: "player_1"
    });

    expect(counted.map((item) => item.count)).toEqual([14, 15, 16, 17, 18, 1]);
  });

  it("builds retention cutoffs from policy windows", () => {
    const now = new Date("2026-06-02T12:00:00.000Z");
    const plan = buildRetentionPlan({ organizationId: "org_1", now });

    expect(plan[0]).toMatchObject({
      model: "Invitation",
      where: {
        organizationId: "org_1",
        status: "expired"
      }
    });
    expect(plan[0].cutoff.toISOString()).toBe("2026-05-03T12:00:00.000Z");
    expect(DATA_RETENTION_POLICY.expiredInvitationGraceDays).toBe(30);
  });

  it("counts retention plan candidates", async () => {
    const counted = await countRetentionPlan(fakePrisma(), {
      organizationId: "org_1",
      now: new Date("2026-06-02T12:00:00.000Z")
    });

    expect(counted.map((item) => [item.model, item.count])).toEqual([
      ["Invitation", 20],
      ["ExternalCalendarIntegration", 21],
      ["PaymentImportBatch", 22],
      ["SportStatImportBatch", 23]
    ]);
  });
});
