import { expect, test, type Page, type Request } from "@playwright/test";

const orgId = "org-journey";
const teamId = "team-journey";
const playerId = "player-journey";
const routineId = "routine-journey";
const reportId = "report-journey";
const today = "2026-06-02";

const mePayload = {
  user: {
    id: "coach-journey",
    email: "coach@example.test",
    displayName: "Casey Coach"
  },
  access: {
    roles: ["org_admin", "team_coach"],
    userOrganizationIds: [orgId],
    assignedTeamIds: [teamId],
    linkedPlayerIds: [playerId],
    consentGranted: true,
    consentGrantedPlayerIds: [playerId]
  },
  organizations: [{ id: orgId, name: "Journey Sports", role: "org_admin", status: "active" }],
  teams: [
    {
      id: teamId,
      organizationId: orgId,
      name: "Journey 12U",
      role: "team_coach",
      brand: {
        primaryColor: "#7a1020",
        secondaryColor: "#f4c542",
        accentColor: "#ffffff"
      }
    }
  ],
  linkedPlayers: [{ id: playerId, preferredName: "Avery", relationship: "self" }],
  personas: [{ kind: "coach", label: "Coach", href: "/dashboards/team", primary: true }],
  nextActions: [{ persona: "coach", label: "Open Team Today", href: "/dashboards/team", priority: 1 }]
};

function formByHeading(page: Page, heading: string) {
  return page.locator("form").filter({ has: page.getByRole("heading", { name: heading }) });
}

async function jsonPayload(request: Request) {
  return JSON.parse(request.postData() ?? "{}") as Record<string, unknown>;
}

async function mockSignedInContext(page: Page) {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({ json: mePayload });
  });
}

test("mocked MVP journey covers setup, roster, readiness, workload, routine, and report", async ({ page }) => {
  await mockSignedInContext(page);

  const orgRequests: Record<string, unknown>[] = [];
  const seasonRequests: Record<string, unknown>[] = [];
  const playerRequests: Record<string, unknown>[] = [];
  const teamPlayerRequests: Record<string, unknown>[] = [];
  const inviteRequests: Record<string, unknown>[] = [];
  const readinessRequests: Record<string, unknown>[] = [];
  const workloadRequests: Record<string, unknown>[] = [];
  const assignmentRequests: Record<string, unknown>[] = [];
  const reportRequests: Record<string, unknown>[] = [];
  let assignmentCreated = false;
  let reportCreated = false;

  await page.route("**/api/orgs", async (route) => {
    orgRequests.push(await jsonPayload(route.request()));
    await route.fulfill({ status: 201, json: { organization: { id: orgId, name: "Journey Sports" } } });
  });
  await page.route("**/api/seasons", async (route) => {
    seasonRequests.push(await jsonPayload(route.request()));
    await route.fulfill({ status: 201, json: { season: { id: "season-journey", organizationId: orgId } } });
  });
  await page.route("**/api/players", async (route) => {
    playerRequests.push(await jsonPayload(route.request()));
    await route.fulfill({ status: 201, json: { player: { id: playerId, preferredName: "Avery" } } });
  });
  await page.route("**/api/team-players", async (route) => {
    teamPlayerRequests.push(await jsonPayload(route.request()));
    await route.fulfill({ status: 201, json: { teamPlayer: { id: "team-player-journey" } } });
  });
  await page.route("**/api/invitations", async (route) => {
    inviteRequests.push(await jsonPayload(route.request()));
    await route.fulfill({
      status: 201,
      json: {
        invitation: {
          id: "invite-journey",
          inviteUrl: "http://localhost:3000/signin?invite=journey"
        }
      }
    });
  });
  await page.route("**/api/readiness-checks", async (route) => {
    readinessRequests.push(await jsonPayload(route.request()));
    await route.fulfill({ status: 201, json: { readinessCheck: { id: "readiness-journey" } } });
  });
  await page.route("**/api/workload-entries", async (route) => {
    workloadRequests.push(await jsonPayload(route.request()));
    await route.fulfill({ status: 201, json: { workloadEntry: { id: "workload-journey" } } });
  });
  await page.route("**/api/routines?**", async (route) => {
    await route.fulfill({
      json: {
        routines: [
          {
            id: routineId,
            name: "Mobility reset",
            level: "foundational",
            sport: "basketball",
            durationMin: 12,
            stopRules: {}
          }
        ]
      }
    });
  });
  await page.route("**/api/routine-assignments?**", async (route) => {
    await route.fulfill({
      json: {
        assignments: assignmentCreated
          ? [
              {
                id: "assignment-journey",
                frequency: "weekly",
                dueDates: [today],
                routine: { name: "Mobility reset", durationMin: 12 },
                completions: []
              }
            ]
          : []
      }
    });
  });
  await page.route("**/api/routine-assignments", async (route) => {
    assignmentRequests.push(await jsonPayload(route.request()));
    assignmentCreated = true;
    await route.fulfill({ status: 201, json: { assignment: { id: "assignment-journey" } } });
  });
  await page.route(`**/api/teams/${teamId}/dashboard`, async (route) => {
    await route.fulfill({
      json: {
        dashboard: {
          players: [{ id: playerId, preferredName: "Avery" }]
        }
      }
    });
  });
  await page.route("**/api/reports?**", async (route) => {
    await route.fulfill({
      json: {
        reports: reportCreated
          ? [
              {
                id: reportId,
                reportType: "monthly_player",
                generatedAt: "2026-06-02T12:00:00.000Z",
                playerId,
                playerName: "Avery",
                teamId,
                teamName: "Journey 12U"
              }
            ]
          : []
      }
    });
  });
  await page.route("**/api/reports", async (route) => {
    reportRequests.push(await jsonPayload(route.request()));
    reportCreated = true;
    await route.fulfill({ status: 201, json: { report: { id: reportId } } });
  });

  await page.goto("/org/setup");
  const createOrg = formByHeading(page, "Create organization");
  await createOrg.getByLabel("Organization name").fill("Journey Sports");
  await createOrg.getByLabel("Timezone").fill("America/New_York");
  await createOrg.getByRole("button", { name: "Submit" }).click();
  await expect(createOrg).toContainText(orgId);

  const createSeason = formByHeading(page, "Create season");
  await createSeason.getByLabel("Organization ID").fill(orgId);
  await createSeason.getByLabel("Season name").fill("Summer 2026");
  await createSeason.getByLabel("Start date").fill("2026-06-01");
  await createSeason.getByLabel("End date").fill("2026-08-15");
  await createSeason.getByRole("button", { name: "Submit" }).click();
  await expect(createSeason).toContainText("season-journey");

  await page.goto("/roster");
  await page.getByLabel("Organization").selectOption(orgId);
  await page.getByLabel("Team").selectOption(teamId);
  await page.getByLabel("Preferred name").first().fill("Avery");
  await page.getByLabel("Date of birth").first().fill("2013-04-15");
  await page.getByLabel("Sex at birth").first().fill("female");
  await page.getByLabel("Dominant hand").first().fill("right");
  await page.getByLabel("Positions, comma-separated").first().fill("guard, wing");
  await page.getByLabel("Guardian email for invite").first().fill("parent@example.test");
  await page.getByLabel("Guardian relationship").first().fill("mother");
  await page.getByRole("button", { name: "Add players to roster" }).click();
  await expect(page.getByText("Added 1 player.")).toBeVisible();

  await page.goto("/readiness");
  const readiness = formByHeading(page, "Submit readiness");
  await readiness.getByLabel("Organization ID").fill(orgId);
  await readiness.getByLabel("Player ID").fill(playerId);
  await readiness.getByLabel("Date").fill(today);
  await readiness.getByLabel("Sleep hours").fill("8");
  await readiness.getByLabel("Soreness score").fill("2");
  await readiness.getByLabel("Energy score").fill("4");
  await readiness.getByLabel("Pain reported").check();
  await readiness.getByLabel("Pain body part").fill("knee");
  await readiness.getByRole("button", { name: "Submit" }).click();
  await expect(readiness).toContainText("readiness-journey");

  await page.goto("/workload");
  const workload = formByHeading(page, "Submit workload");
  await workload.getByLabel("Organization ID").fill(orgId);
  await workload.getByLabel("Player ID").fill(playerId);
  await workload.getByLabel("Team ID").fill(teamId);
  await workload.getByLabel("Date").fill(today);
  await workload.getByLabel("Sport").selectOption("basketball");
  await workload.getByLabel("Session type").fill("practice");
  await workload.getByLabel("Minutes").fill("45");
  await workload.getByLabel("Session RPE").fill("5");
  await workload.getByLabel("Participation status").fill("attended");
  await workload.getByRole("button", { name: "Submit" }).click();
  await expect(workload).toContainText("workload-journey");

  await page.goto("/routines");
  await page.getByLabel("Routine").selectOption(routineId);
  await page.getByLabel("Frequency").fill("weekly");
  await page.getByLabel("Due date").fill(today);
  await page.getByRole("button", { name: "Assign to team" }).click();
  await expect(page.getByText("Routine assigned to the team.")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mobility reset" })).toBeVisible();

  await page.goto("/reports");
  await page.getByLabel("Player").selectOption(playerId);
  await page.getByRole("button", { name: "Generate report" }).click();
  await expect(page.getByText("Generated report for Avery.")).toBeVisible();
  await expect(page.getByRole("link", { name: "View report" })).toHaveAttribute("href", `/reports/view?reportId=${reportId}`);

  expect(orgRequests[0]).toMatchObject({ name: "Journey Sports", timezone: "America/New_York" });
  expect(seasonRequests[0]).toMatchObject({
    organizationId: orgId,
    name: "Summer 2026",
    startDate: "2026-06-01",
    endDate: "2026-08-15"
  });
  expect(playerRequests[0]).toMatchObject({
    organizationId: orgId,
    preferredName: "Avery",
    dateOfBirth: "2013-04-15",
    positions: ["guard", "wing"]
  });
  expect(teamPlayerRequests[0]).toMatchObject({ teamId, playerId });
  expect(inviteRequests[0]).toMatchObject({
    organizationId: orgId,
    playerId,
    email: "parent@example.test",
    role: "guardian",
    relationship: "mother"
  });
  expect(readinessRequests[0]).toMatchObject({
    organizationId: orgId,
    playerId,
    date: today,
    sleepHours: 8,
    sorenessScore: 2,
    energyScore: 4,
    painAny: true,
    painBodyParts: ["knee"]
  });
  expect(workloadRequests[0]).toMatchObject({
    organizationId: orgId,
    playerId,
    teamId,
    date: today,
    sport: "basketball",
    sessionType: "practice",
    minutes: 45,
    sessionRpe: 5,
    participationStatus: "attended"
  });
  expect(assignmentRequests[0]).toMatchObject({
    organizationId: orgId,
    teamId,
    routineId,
    frequency: "weekly",
    dueDates: [today]
  });
  expect(reportRequests[0]).toMatchObject({ organizationId: orgId, playerId });
});
