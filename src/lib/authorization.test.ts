import { describe, expect, it } from "vitest";
import { canEnterTeamData, canManageOrganization, canReadPlayer } from "./authorization";

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
});
