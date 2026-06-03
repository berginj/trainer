import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { NextRequest } from "next/server";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

const databaseUrl = process.env.TEST_DATABASE_URL;
const describeWithDatabase = databaseUrl ? describe : describe.skip;
const runId = `route_${Date.now()}`;

process.env.AUTH_ENFORCEMENT = "on";

function accessHeaders(input: {
  userId: string;
  roles: string[];
  organizationIds: string[];
  teamIds?: string[];
  playerIds?: string[];
  consentGranted?: boolean;
  consentedPlayerIds?: string[];
}) {
  return new Headers({
    "content-type": "application/json",
    "x-user-id": input.userId,
    "x-roles": input.roles.join(","),
    "x-org-ids": input.organizationIds.join(","),
    "x-team-ids": input.teamIds?.join(",") ?? "",
    "x-player-ids": input.playerIds?.join(",") ?? "",
    "x-consent-granted": input.consentGranted ? "true" : "false",
    "x-consented-player-ids": input.consentedPlayerIds?.join(",") ?? ""
  });
}

function jsonRequest(url: string, headers: Headers, body?: unknown) {
  return new NextRequest(url, {
    method: body ? "POST" : "GET",
    headers,
    body: body ? JSON.stringify(body) : undefined
  });
}

describeWithDatabase("DB-backed route authorization", () => {
  let prisma: PrismaClient;
  let orgId: string;
  let otherOrgId: string;
  let coachId: string;
  let guardianId: string;
  let playerId: string;
  let teamId: string;
  let routineId: string;

  beforeAll(async () => {
    process.env.DATABASE_URL = databaseUrl;
    prisma = new PrismaClient({
      adapter: new PrismaPg({ connectionString: databaseUrl })
    });

    const org = await prisma.organization.create({
      data: { name: `Route Test ${runId}`, timezone: "America/New_York" }
    });
    const otherOrg = await prisma.organization.create({
      data: { name: `Other Route Test ${runId}`, timezone: "America/New_York" }
    });
    const season = await prisma.season.create({
      data: {
        organizationId: org.id,
        name: `Season ${runId}`,
        startDate: new Date("2026-06-01T00:00:00.000Z"),
        endDate: new Date("2026-08-01T00:00:00.000Z")
      }
    });
    const coach = await prisma.userProfile.create({
      data: {
        externalIdentityId: `coach:${runId}`,
        email: `coach-${runId}@example.test`,
        displayName: "Route Coach"
      }
    });
    const guardian = await prisma.userProfile.create({
      data: {
        externalIdentityId: `guardian:${runId}`,
        email: `guardian-${runId}@example.test`,
        displayName: "Route Guardian"
      }
    });
    const team = await prisma.team.create({
      data: {
        organizationId: org.id,
        seasonId: season.id,
        name: `Route Team ${runId}`,
        sport: "basketball",
        level: "12U"
      }
    });
    const player = await prisma.player.create({
      data: {
        organizationId: org.id,
        preferredName: "Route Player",
        dateOfBirth: new Date("2013-04-15T00:00:00.000Z"),
        sexAtBirth: "female",
        sports: ["basketball"],
        positions: ["guard"]
      }
    });
    const routine = await prisma.routine.create({
      data: {
        organizationId: org.id,
        sport: "basketball",
        level: "foundational",
        code: `route-routine-${runId}`,
        name: "Route Mobility",
        durationMin: 10,
        equipment: [],
        stopRules: {},
        progressionRules: {}
      }
    });

    await prisma.organizationMembership.createMany({
      data: [
        { organizationId: org.id, userId: coach.id, role: "team_coach" },
        { organizationId: org.id, userId: guardian.id, role: "guardian" }
      ]
    });
    await prisma.teamMembership.create({
      data: {
        organizationId: org.id,
        teamId: team.id,
        userId: coach.id,
        role: "team_coach"
      }
    });
    await prisma.teamPlayer.create({ data: { teamId: team.id, playerId: player.id } });
    await prisma.guardianPlayerLink.create({
      data: {
        guardianUserId: guardian.id,
        playerId: player.id,
        relationship: "parent"
      }
    });

    orgId = org.id;
    otherOrgId = otherOrg.id;
    coachId = coach.id;
    guardianId = guardian.id;
    playerId = player.id;
    teamId = team.id;
    routineId = routine.id;
  });

  afterAll(async () => {
    delete process.env.AUTH_ENFORCEMENT;

    if (!prisma) {
      return;
    }

    await prisma.organization.deleteMany({
      where: {
        id: { in: [orgId, otherOrgId].filter(Boolean) }
      }
    });
    await prisma.userProfile.deleteMany({
      where: {
        id: { in: [coachId, guardianId].filter(Boolean) }
      }
    });
    await prisma.$disconnect();
  });

  it("denies cross-tenant player writes before touching the database", async () => {
    const { POST } = await import("../../src/app/api/workload-entries/route");
    const response = await POST(
      jsonRequest(
        "https://trainer.test/api/workload-entries",
        accessHeaders({
          userId: coachId,
          roles: ["team_coach"],
          organizationIds: [otherOrgId],
          teamIds: [teamId],
          consentGranted: true,
          consentedPlayerIds: [playerId]
        }),
        {
          organizationId: orgId,
          playerId,
          teamId,
          date: "2026-06-02",
          sport: "basketball",
          sessionType: "practice",
          minutes: 45,
          sessionRpe: 5,
          participationStatus: "attended"
        }
      )
    );

    expect(response.status).toBe(403);
  });

  it("denies missing consent on sensitive player routes", async () => {
    const headers = accessHeaders({
      userId: guardianId,
      roles: ["guardian"],
      organizationIds: [orgId],
      playerIds: [playerId],
      consentGranted: false
    });
    const [{ GET: getGoals }, { GET: getAssignments }] = await Promise.all([
      import("../../src/app/api/goals/route"),
      import("../../src/app/api/routine-assignments/route")
    ]);

    const goalResponse = await getGoals(
      jsonRequest(`https://trainer.test/api/goals?organizationId=${orgId}&playerId=${playerId}`, headers)
    );
    const assignmentResponse = await getAssignments(
      jsonRequest(`https://trainer.test/api/routine-assignments?organizationId=${orgId}&playerId=${playerId}`, headers)
    );

    expect(goalResponse.status).toBe(403);
    expect(assignmentResponse.status).toBe(403);
  });

  it("allows consented staff to create and read routine/report data", async () => {
    const headers = accessHeaders({
      userId: coachId,
      roles: ["team_coach"],
      organizationIds: [orgId],
      teamIds: [teamId],
      consentGranted: true,
      consentedPlayerIds: [playerId]
    });
    const [{ POST: postAssignment }, { POST: postReport }, { GET: getReports }] = await Promise.all([
      import("../../src/app/api/routine-assignments/route"),
      import("../../src/app/api/reports/route"),
      import("../../src/app/api/reports/route")
    ]);

    const assignmentResponse = await postAssignment(
      jsonRequest("https://trainer.test/api/routine-assignments", headers, {
        organizationId: orgId,
        teamId,
        routineId,
        frequency: "weekly",
        dueDates: ["2026-06-03"]
      })
    );
    const reportResponse = await postReport(
      jsonRequest("https://trainer.test/api/reports", headers, {
        organizationId: orgId,
        playerId
      })
    );
    const reportsResponse = await getReports(
      jsonRequest(`https://trainer.test/api/reports?organizationId=${orgId}&playerId=${playerId}`, headers)
    );
    const reportsBody = (await reportsResponse.json()) as { reports: Array<{ playerId: string }> };

    expect(assignmentResponse.status).toBe(201);
    expect(reportResponse.status).toBe(201);
    expect(reportsResponse.status).toBe(200);
    expect(reportsBody.reports.some((report) => report.playerId === playerId)).toBe(true);
  });
});
