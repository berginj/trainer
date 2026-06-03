import { afterEach, describe, expect, it } from "vitest";
import { createSignedSessionCookie } from "./auth-session";
import { getRequestAccessContext, getRequestActorId } from "./request-auth";

describe("getRequestAccessContext", () => {
  afterEach(() => {
    delete process.env.AUTH_ENFORCEMENT;
    delete process.env.AUTH_SECRET;
  });

  it("parses request access context from local development headers when auth is disabled", () => {
    process.env.AUTH_ENFORCEMENT = "off";

    const context = getRequestAccessContext(
      new Headers({
        "x-user-id": "user_1",
        "x-roles": "guardian,player",
        "x-org-ids": "org_1,org_2",
        "x-team-ids": "team_1",
        "x-player-ids": "player_1",
        "x-consent-granted": "true",
        "x-consented-player-ids": "player_1"
      })
    );

    expect(context).toEqual({
      userId: "user_1",
      roles: ["guardian", "player"],
      userOrganizationIds: ["org_1", "org_2"],
      assignedTeamIds: ["team_1"],
      linkedPlayerIds: ["player_1"],
      consentGranted: true,
      consentGrantedPlayerIds: ["player_1"]
    });
  });

  it("ignores development identity headers when auth enforcement is on", () => {
    process.env.AUTH_ENFORCEMENT = "on";

    expect(
      getRequestAccessContext(
        new Headers({
          "x-user-id": "user_1",
          "x-roles": "platform_admin",
          "x-org-ids": "org_1"
        })
      )
    ).toBeNull();
  });

  it("uses signed sessions when auth enforcement is on", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";
    const cookie = createSignedSessionCookie({
      userId: "user_1",
      roles: ["org_admin"],
      userOrganizationIds: ["org_1"],
      assignedTeamIds: [],
      linkedPlayerIds: [],
      consentGranted: true
    });

    expect(getRequestAccessContext(new Headers({ cookie }))).toEqual({
      userId: "user_1",
      roles: ["org_admin"],
      userOrganizationIds: ["org_1"],
      assignedTeamIds: [],
      linkedPlayerIds: [],
      consentGranted: true
    });
  });

  it("returns null when no identity is present", () => {
    expect(getRequestAccessContext(new Headers())).toBeNull();
  });

  it("returns null for invalid roles instead of throwing", () => {
    expect(
      getRequestAccessContext(
        new Headers({
          "x-user-id": "user_1",
          "x-roles": "not_a_role",
          "x-org-ids": "org_1"
        })
      )
    ).toBeNull();
  });

  it("uses authenticated actor when auth enforcement is on", () => {
    process.env.AUTH_ENFORCEMENT = "on";
    process.env.AUTH_SECRET = "test-auth-secret";
    const cookie = createSignedSessionCookie({
      userId: "user_1",
      roles: ["org_admin"],
      userOrganizationIds: ["org_1"],
      assignedTeamIds: [],
      linkedPlayerIds: [],
      consentGranted: true
    });

    expect(
      getRequestActorId(
        new Headers({ cookie }),
        "body_user"
      )
    ).toBe("user_1");
  });

  it("allows fallback actor ids while local auth is disabled", () => {
    process.env.AUTH_ENFORCEMENT = "off";

    expect(getRequestActorId(new Headers(), "body_user")).toBe("body_user");
  });
});
