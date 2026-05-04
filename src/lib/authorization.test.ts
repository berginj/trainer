import { describe, expect, it } from "vitest";
import {
  canActForOrganizationUser,
  canEnterPlayerData,
  canEnterTeamData,
  canManageConsent,
  canManageOrganization,
  canManagePlatform,
  canReadPlayer
} from "./authorization";

describe("authorization contracts", () => {
  it("blocks cross-tenant player access", () => {
    expect(
      canReadPlayer(
        {
          userId: "user_1",
          roles: ["org_admin"],
          userOrganizationIds: ["org_a"],
          consentGranted: true
        },
        {
          organizationId: "org_b",
          playerId: "player_1"
        }
      )
    ).toBe(false);
  });

  it("requires consent for consent-gated player data", () => {
    expect(
      canReadPlayer(
        {
          userId: "guardian_1",
          roles: ["guardian"],
          userOrganizationIds: ["org_a"],
          linkedPlayerIds: ["player_1"],
          consentGranted: false
        },
        {
          organizationId: "org_a",
          playerId: "player_1",
          requiresConsent: true
        }
      )
    ).toBe(false);
  });

  it("allows linked guardians to read consented player data", () => {
    expect(
      canReadPlayer(
        {
          userId: "guardian_1",
          roles: ["guardian"],
          userOrganizationIds: ["org_a"],
          linkedPlayerIds: ["player_1"],
          consentGranted: true
        },
        {
          organizationId: "org_a",
          playerId: "player_1",
          requiresConsent: true
        }
      )
    ).toBe(true);
  });

  it("blocks league admins from player-level sensitive reads by default", () => {
    expect(
      canReadPlayer(
        {
          userId: "league_1",
          roles: ["league_admin"],
          userOrganizationIds: ["org_a"],
          consentGranted: true
        },
        {
          organizationId: "org_a",
          playerId: "player_1",
          requiresConsent: true
        }
      )
    ).toBe(false);
  });

  it("allows assigned coaches to enter team data", () => {
    expect(
      canEnterTeamData(
        {
          userId: "coach_1",
          roles: ["team_coach"],
          userOrganizationIds: ["org_a"],
          assignedTeamIds: ["team_1"]
        },
        {
          organizationId: "org_a",
          teamId: "team_1"
        }
      )
    ).toBe(true);
  });

  it("blocks assistant coaches from managing organizations", () => {
    expect(
      canManageOrganization(
        {
          userId: "assistant_1",
          roles: ["assistant_coach"],
          userOrganizationIds: ["org_a"]
        },
        "org_a"
      )
    ).toBe(false);
  });

  it("allows platform admins to manage the platform", () => {
    expect(
      canManagePlatform({
        userId: "platform_1",
        roles: ["platform_admin"],
        userOrganizationIds: []
      })
    ).toBe(true);
  });

  it("allows linked guardians to manage their own consent records", () => {
    expect(
      canManageConsent(
        {
          userId: "guardian_1",
          roles: ["guardian"],
          userOrganizationIds: ["org_a"],
          linkedPlayerIds: ["player_1"]
        },
        {
          organizationId: "org_a",
          playerId: "player_1",
          guardianUserId: "guardian_1"
        }
      )
    ).toBe(true);
  });

  it("blocks guardians from managing another guardian's consent record", () => {
    expect(
      canManageConsent(
        {
          userId: "guardian_1",
          roles: ["guardian"],
          userOrganizationIds: ["org_a"],
          linkedPlayerIds: ["player_1"]
        },
        {
          organizationId: "org_a",
          playerId: "player_1",
          guardianUserId: "guardian_2"
        }
      )
    ).toBe(false);
  });

  it("allows evaluators to enter consented player data inside their organization", () => {
    expect(
      canEnterPlayerData(
        {
          userId: "evaluator_1",
          roles: ["evaluator"],
          userOrganizationIds: ["org_a"],
          consentGranted: true
        },
        {
          organizationId: "org_a",
          playerId: "player_1",
          requiresConsent: true
        }
      )
    ).toBe(true);
  });

  it("blocks linked guardians from coach-only player data entry", () => {
    expect(
      canEnterPlayerData(
        {
          userId: "guardian_1",
          roles: ["guardian"],
          userOrganizationIds: ["org_a"],
          linkedPlayerIds: ["player_1"],
          consentGranted: true
        },
        {
          organizationId: "org_a",
          playerId: "player_1",
          requiresConsent: true
        }
      )
    ).toBe(false);
  });

  it("allows users to act for themselves within an organization", () => {
    expect(
      canActForOrganizationUser(
        {
          userId: "trainer_1",
          roles: ["evaluator"],
          userOrganizationIds: ["org_a"]
        },
        {
          organizationId: "org_a",
          targetUserId: "trainer_1"
        }
      )
    ).toBe(true);
  });

  it("blocks users from acting as another organization user", () => {
    expect(
      canActForOrganizationUser(
        {
          userId: "trainer_1",
          roles: ["evaluator"],
          userOrganizationIds: ["org_a"]
        },
        {
          organizationId: "org_a",
          targetUserId: "trainer_2"
        }
      )
    ).toBe(false);
  });
});
