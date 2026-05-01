import { afterEach, describe, expect, it } from "vitest";
import { requirePlayerAccess, requireTenantAccess } from "./auth-guards";

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
});
