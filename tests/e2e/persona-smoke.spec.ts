import { expect, test, type Page } from "@playwright/test";

const today = new Date().toISOString().slice(0, 10);

const routeChecks = [
  { path: "/workflows", text: "Internal workflow cockpit" },
  { path: "/signin", text: "Sign in to your workspace" },
  { path: "/guardian/home", text: "Today's plan for linked athletes" },
  { path: "/athlete/home", text: "Athlete home" },
  { path: "/dashboards/team", text: "Team Today" },
  { path: "/roster", text: "Add players without hunting for IDs" },
  { path: "/routines", text: "Assign home work" },
  { path: "/reports", text: "Player report center" },
  { path: "/reports/view", text: "Report viewer" },
  { path: "/admin", text: "Safety and setup overview" },
  { path: "/dashboards/player", text: "Player view" }
];

const signedOutAccessChecks = [
  { path: "/guardian/home", heading: "Sign in to open parent home" },
  { path: "/athlete/home", heading: "Sign in to open athlete home" },
  { path: "/dashboards/team", heading: "Sign in to open Team Today" },
  { path: "/roster", heading: "Sign in to manage roster" },
  { path: "/routines", heading: "Sign in to assign routines" },
  { path: "/reports", heading: "Sign in to view reports" },
  { path: "/admin", heading: "Sign in to view admin controls" },
  { path: "/dashboards/player", heading: "Sign in to view player detail" },
  { path: "/player/profile", heading: "Sign in to manage goals" }
];

const guardianHomePayload = {
  players: [
    {
      id: "player-1",
      organizationId: "org-1",
      preferredName: "Jordan",
      relationship: "child",
      consent: { granted: true },
      weeklySummary: {
        completedCount: 3,
        skippedCount: 1,
        painCount: 0
      },
      reports: [
        {
          id: "report-1",
          reportType: "monthly",
          generatedAt: "2026-05-31T12:00:00.000Z"
        }
      ],
      teams: [
        {
          id: "team-1",
          name: "Cyclones 12U",
          brand: {
            primaryColor: "#7a1020",
            secondaryColor: "#f4c542",
            accentColor: "#ffffff",
            logoUrl: null
          }
        }
      ],
      alerts: [
        {
          severity: "warning",
          reason: "Soreness is elevated.",
          nextAction: "Use the modified routine today."
        }
      ]
    },
    {
      id: "player-2",
      organizationId: "org-1",
      preferredName: "Riley",
      relationship: "child",
      consent: { granted: false },
      weeklySummary: {
        completedCount: 0,
        skippedCount: 0,
        painCount: 0
      },
      reports: [],
      teams: [
        {
          id: "team-1",
          name: "Cyclones 12U",
          brand: {
            primaryColor: "#7a1020",
            secondaryColor: "#f4c542",
            accentColor: "#ffffff",
            logoUrl: null
          }
        }
      ],
      alerts: []
    }
  ],
  assignments: [
    {
      id: "assignment-1",
      organizationId: "org-1",
      playerId: "player-1",
      dueDates: [today],
      frequency: "daily",
      routine: {
        name: "Mobility reset",
        durationMin: 12,
        stopRules: {}
      },
      team: {
        name: "Cyclones 12U",
        brand: {
          primaryColor: "#7a1020",
          secondaryColor: "#f4c542",
          accentColor: "#ffffff"
        }
      },
      completions: []
    },
    {
      id: "assignment-2",
      organizationId: "org-1",
      playerId: "player-2",
      dueDates: [today],
      frequency: "daily",
      routine: {
        name: "Shoulder care",
        durationMin: 10,
        stopRules: {}
      },
      team: {
        name: "Cyclones 12U",
        brand: {
          primaryColor: "#7a1020",
          secondaryColor: "#f4c542",
          accentColor: "#ffffff"
        }
      },
      completions: []
    }
  ]
};

const mePayload = {
  user: {
    id: "user-1",
    email: "parent@example.test",
    displayName: "Pat Parent"
  },
  access: {
    roles: ["guardian", "team_coach", "org_admin"],
    userOrganizationIds: ["org-1"],
    assignedTeamIds: ["team-1"],
    linkedPlayerIds: ["player-1", "player-2"],
    consentGranted: true
  },
  organizations: [{ id: "org-1", name: "Cyclones", role: "org_admin", status: "active" }],
  teams: [{ id: "team-1", organizationId: "org-1", name: "Cyclones 12U", role: "team_coach" }],
  linkedPlayers: [
    { id: "player-1", preferredName: "Jordan", relationship: "child" },
    { id: "player-2", preferredName: "Riley", relationship: "child" }
  ],
  personas: [
    { kind: "parent", label: "Parent / Guardian", href: "/guardian/home", primary: true },
    { kind: "coach", label: "Coach", href: "/dashboards/team", primary: false },
    { kind: "administrator", label: "Administrator", href: "/admin", primary: false }
  ],
  nextActions: [
    { persona: "parent", label: "Open parent home", href: "/guardian/home", priority: 1 },
    { persona: "parent", label: "Review latest reports", href: "/reports", priority: 2 },
    { persona: "coach", label: "Open Team Today", href: "/dashboards/team", priority: 1 },
    { persona: "coach", label: "Assign or adjust routines", href: "/routines", priority: 2 },
    { persona: "administrator", label: "Review launch readiness", href: "/admin", priority: 1 }
  ]
};

async function setSignedInCookie(page: Page) {
  await page.context().addCookies([
    {
      name: "trainer_session",
      value: "test-session",
      domain: "localhost",
      path: "/"
    }
  ]);
}

async function mockPersonaApis(page: Page) {
  await page.route("**/api/me", async (route) => {
    await route.fulfill({ json: mePayload });
  });
  await page.route("**/api/guardian/home", async (route) => {
    await route.fulfill({ json: guardianHomePayload });
  });
  await page.route("**/api/players/player-1/dashboard", async (route) => {
    await route.fulfill({
      json: {
        dashboard: {
          status: "modify_or_hold",
          latestReadiness: {
            date: today,
            energyScore: 3,
            sorenessScore: 4,
            painAny: false
          },
          goals: [
            {
              id: "goal-1",
              targetType: "consistency",
              targetValue: "Three routines this week",
              dueDate: "2026-06-07",
              metricDefinition: null
            }
          ],
          message: "Use modified routine today."
        }
      }
    });
  });
  await page.route("**/api/routine-completions", async (route) => {
    await route.fulfill({ json: { id: "completion-1" } });
  });
}

async function expectNoHorizontalOverflow(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

  expect(overflow).toBeLessThanOrEqual(1);
}

async function expectNamedInteractiveControls(page: Page) {
  const unnamed = await page.evaluate(() =>
    Array.from(document.querySelectorAll("a, button, input, select, textarea"))
      .filter((element) => {
        const style = window.getComputedStyle(element);
        const labels = "labels" in element
          ? Array.from((element as HTMLInputElement).labels ?? [])
              .map((label) => label.textContent ?? "")
              .join(" ")
          : "";
        const explicitLabel = element.getAttribute("aria-label") ?? element.getAttribute("title") ?? "";
        const label = explicitLabel || labels || element.textContent || "";

        return style.display !== "none" && style.visibility !== "hidden" && !label.trim();
      })
      .map((element) => element.outerHTML)
  );

  expect(unnamed).toEqual([]);
}

test("signed-out role home renders sign-in entry", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Sign In To Trainer" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
});

for (const check of routeChecks) {
  test(`${check.path} renders the MVP shell`, async ({ page }) => {
    await page.goto(check.path);

    await expect(page.getByText(check.text).first()).toBeVisible();
  });
}

for (const check of signedOutAccessChecks) {
  test(`${check.path} renders a signed-out access card`, async ({ page }) => {
    await page.goto(check.path);

    await expect(page.getByRole("heading", { name: check.heading })).toBeVisible();
    await expect(page.getByRole("link", { name: "Sign in" }).first()).toBeVisible();
  });
}

test("signed-out product home has reachable keyboard actions", async ({ page }) => {
  await page.goto("/");

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Trainer" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Reports" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("link", { name: "Internal" })).toBeFocused();

  await page.keyboard.press("Tab");
  await expect(page.getByRole("navigation").getByRole("link", { name: "Sign in" })).toBeFocused();
});

test("sign-in page exposes configured keyboard path even when providers are missing", async ({ page }) => {
  await page.goto("/signin");

  await page.keyboard.press("Tab");
  const focusedText = await page.evaluate(() => document.activeElement?.textContent ?? "");

  expect(focusedText).toContain("Trainer");
  await expect(page.getByText("Sign-in providers are not configured for this environment yet.")).toBeVisible();
});

test("signed-in role home renders role-specific next actions and persona switching", async ({ page }) => {
  await setSignedInCookie(page);
  await mockPersonaApis(page);

  await page.goto("/");

  await expect(page.getByRole("heading", { name: "Parent Home" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Parent / Guardian" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open parent home" })).toBeVisible();

  await page.getByLabel("Persona").selectOption("coach");

  await expect(page.getByRole("heading", { name: "Coach Team Today" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open Team Today" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Assign or adjust routines" })).toBeVisible();
});

test("parent home shows linked athletes, consent state, routine actions, and report links", async ({ page }) => {
  await mockPersonaApis(page);

  await page.goto("/guardian/home");

  await expect(page.getByRole("heading", { name: "Today's plan for linked athletes" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Riley" })).toBeVisible();
  await expect(page.getByText("Consent active")).toBeVisible();
  await expect(page.getByText("Consent needed")).toBeVisible();
  await expect(page.getByRole("button", { name: "Grant required consent" })).toBeVisible();
  await expect(page.getByRole("button", { name: "Complete" }).first()).toBeEnabled();
  await expect(page.getByRole("link", { name: "Open athlete view" }).first()).toHaveAttribute(
    "href",
    /\/athlete\/home\?mode=child&playerId=player-1/
  );
});

test("athlete co-view uses safe copy and permits consented routine updates", async ({ page }) => {
  await mockPersonaApis(page);

  await page.goto("/athlete/home?mode=child&playerId=player-1");

  await expect(page.getByText("Athlete co-view")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Jordan" })).toBeVisible();
  await expect(page.getByText("Stop if pain shows up")).toBeVisible();
  await expect(page.getByRole("heading", { name: "Today's Routine" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Mobility reset" })).toBeVisible();

  await page.getByRole("button", { name: "Complete" }).click();

  await expect(page.getByText("Saved today's routine update.")).toBeVisible();
});

test("core signed-out pages have named controls and no mobile overflow", async ({ page }) => {
  for (const path of ["/", "/signin", "/workflows", "/guardian/home", "/athlete/home", "/roster", "/reports", "/admin"]) {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(path);

    await expect(page.locator("h1").first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
    await expectNamedInteractiveControls(page);
  }
});
