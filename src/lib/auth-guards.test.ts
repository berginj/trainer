import { afterEach, describe, expect, it } from "vitest";
import {
  requireConsentRecordAccess,
  requireOrganizationManagementAccess,
  requireOrganizationUserAction,
  requirePlatformAdmin,
  requirePlayerAccess,
  requirePlayerDataEntryAccess,
  requireTenantAccess
} from "./auth-guards";
import { createSignedSessionCookie } from "./auth-session";

function sessionHeaders(input: {
  userId: string;
  roles: Array<"platform_admin" | "org_admin" | "league_admin" | "team_coach" | "assistant_coach" | "guardian" | "player" | "evaluator">;
  organizationIds: string[];
  teamIds?: string[];
  playerIds?: string[];
  consentGranted?: boolean;
  consentedPlayerIds?: string[];
}) {
  return new Headers({
    cookie: createSignedSessionCookie({
      userId: input.userId,
      roles: input.roles,
      userOrganizationIds: input.organizationIds,
      assignedTeamIds: input.teamIds ?? [],
      linkedPlayerIds: input.playerIds ?? [],
      consentGranted: input.consentGranted ?? false,
      consentGrantedPlayerIds: input.consentedPlayerIds
    })
  });
}

describe("auth guards", () => {
  afterEach(() => {
    delete process.env.AUTH_ENFORCEMENT;
    delete process.env.AUTH_SECRET;
  });

  it("does not enforce auth when disabled", () => {
    process.env.AUTH_ENFORCEMENT = "off";

    expect(
      requirePlayerAccess(new Headers(), {
        organizationId: "org_1",
        playerId: "player_1",
        requiresConsent: true
      })
    ).toBeNull();
  });

  it("blocks missing auth when enforcement is on", () => {
    process.env.AUTH_ENFORCEMENT = "on";

    const response = requireTenantAccess(new Headers(), "org_1");

    expect(response?.status).toBe(403);
  });

  it("does not authorize spoofed development headers when enforcement is on", () => {
    process.env.AUTH_ENFORCEMENT = "on";

    const response = requireOrganizationManagementAccess(
      new Headers({
        "x-user-id": "org_admin_1",
        "x-roles": "org_admin",
        "x-org-ids": "org_1"
      }),
      "org_1"
    );

    expect(response?.status).toBe(403);
  });

  it("blocks missing consent for sensitive player reads", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";

    const response = requirePlayerAccess(
      sessionHeaders({
        userId: "guardian_1",
        roles: ["guardian"],
        organizationIds: ["org_1"],
        playerIds: ["player_1"],
        consentGranted: false
      }),
      {
        organizationId: "org_1",
        playerId: "player_1",
        requiresConsent: true
      }
    );

    expect(response?.status).toBe(403);
  });

  it("allows consented linked guardian access", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";

    expect(
      requirePlayerAccess(
        sessionHeaders({
          userId: "guardian_1",
          roles: ["guardian"],
          organizationIds: ["org_1"],
          playerIds: ["player_1"],
          consentGranted: true
        }),
        {
          organizationId: "org_1",
          playerId: "player_1",
          requiresConsent: true
        }
      )
    ).toBeNull();
  });

  it("blocks access to a linked player without that player's consent", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";

    const response = requirePlayerAccess(
      sessionHeaders({
        userId: "guardian_1",
        roles: ["guardian"],
        organizationIds: ["org_1"],
        playerIds: ["player_1", "player_2"],
        consentGranted: true,
        consentedPlayerIds: ["player_1"]
      }),
      {
        organizationId: "org_1",
        playerId: "player_2",
        requiresConsent: true
      }
    );

    expect(response?.status).toBe(403);
  });

  it("requires platform admin for platform-only actions", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";

    const response = requirePlatformAdmin(
      sessionHeaders({
        userId: "org_admin_1",
        roles: ["org_admin"],
        organizationIds: ["org_1"]
      })
    );

    expect(response?.status).toBe(403);
  });

  it("allows org admins to manage their organization", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";

    expect(
      requireOrganizationManagementAccess(
        sessionHeaders({
          userId: "org_admin_1",
          roles: ["org_admin"],
          organizationIds: ["org_1"]
        }),
        "org_1"
      )
    ).toBeNull();
  });

  it("allows linked guardians to manage their own consent records", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";

    expect(
      requireConsentRecordAccess(
        sessionHeaders({
          userId: "guardian_1",
          roles: ["guardian"],
          organizationIds: ["org_1"],
          playerIds: ["player_1"]
        }),
        {
          organizationId: "org_1",
          playerId: "player_1",
          guardianUserId: "guardian_1"
        }
      )
    ).toBeNull();
  });

  it("blocks linked guardians from staff-only player data entry", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";

    const response = requirePlayerDataEntryAccess(
      sessionHeaders({
        userId: "guardian_1",
        roles: ["guardian"],
        organizationIds: ["org_1"],
        playerIds: ["player_1"],
        consentGranted: true
      }),
      {
        organizationId: "org_1",
        playerId: "player_1",
        requiresConsent: true
      }
    );

    expect(response?.status).toBe(403);
  });

  it("blocks team-scoped player data entry when consent is missing", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";

    const response = requirePlayerDataEntryAccess(
      sessionHeaders({
        userId: "coach_1",
        roles: ["team_coach"],
        organizationIds: ["org_1"],
        teamIds: ["team_1"],
        consentGranted: false
      }),
      {
        organizationId: "org_1",
        teamId: "team_1",
        playerId: "player_1",
        requiresConsent: true
      }
    );

    expect(response?.status).toBe(403);
  });

  it("blocks trainer impersonation for organization-scoped actions", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";

    const response = requireOrganizationUserAction(
      sessionHeaders({
        userId: "trainer_1",
        roles: ["evaluator"],
        organizationIds: ["org_1"]
      }),
      {
        organizationId: "org_1",
        targetUserId: "trainer_2"
      }
    );

    expect(response?.status).toBe(403);
  });
});
