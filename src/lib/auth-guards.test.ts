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

describe("auth guards", () => {
  afterEach(() => {
    delete process.env.AUTH_ENFORCEMENT;
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

  it("blocks missing consent for sensitive player reads", () => {
    process.env.AUTH_ENFORCEMENT = "on";

    const response = requirePlayerAccess(
      new Headers({
        "x-user-id": "guardian_1",
        "x-roles": "guardian",
        "x-org-ids": "org_1",
        "x-player-ids": "player_1",
        "x-consent-granted": "false"
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

    expect(
      requirePlayerAccess(
        new Headers({
          "x-user-id": "guardian_1",
          "x-roles": "guardian",
          "x-org-ids": "org_1",
          "x-player-ids": "player_1",
          "x-consent-granted": "true"
        }),
        {
          organizationId: "org_1",
          playerId: "player_1",
          requiresConsent: true
        }
      )
    ).toBeNull();
  });

  it("requires platform admin for platform-only actions", () => {
    process.env.AUTH_ENFORCEMENT = "on";

    const response = requirePlatformAdmin(
      new Headers({
        "x-user-id": "org_admin_1",
        "x-roles": "org_admin",
        "x-org-ids": "org_1"
      })
    );

    expect(response?.status).toBe(403);
  });

  it("allows org admins to manage their organization", () => {
    process.env.AUTH_ENFORCEMENT = "on";

    expect(
      requireOrganizationManagementAccess(
        new Headers({
          "x-user-id": "org_admin_1",
          "x-roles": "org_admin",
          "x-org-ids": "org_1"
        }),
        "org_1"
      )
    ).toBeNull();
  });

  it("allows linked guardians to manage their own consent records", () => {
    process.env.AUTH_ENFORCEMENT = "on";

    expect(
      requireConsentRecordAccess(
        new Headers({
          "x-user-id": "guardian_1",
          "x-roles": "guardian",
          "x-org-ids": "org_1",
          "x-player-ids": "player_1"
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

    const response = requirePlayerDataEntryAccess(
      new Headers({
        "x-user-id": "guardian_1",
        "x-roles": "guardian",
        "x-org-ids": "org_1",
        "x-player-ids": "player_1",
        "x-consent-granted": "true"
      }),
      {
        organizationId: "org_1",
        playerId: "player_1",
        requiresConsent: true
      }
    );

    expect(response?.status).toBe(403);
  });

  it("blocks trainer impersonation for organization-scoped actions", () => {
    process.env.AUTH_ENFORCEMENT = "on";

    const response = requireOrganizationUserAction(
      new Headers({
        "x-user-id": "trainer_1",
        "x-roles": "evaluator",
        "x-org-ids": "org_1"
      }),
      {
        organizationId: "org_1",
        targetUserId: "trainer_2"
      }
    );

    expect(response?.status).toBe(403);
  });
});
