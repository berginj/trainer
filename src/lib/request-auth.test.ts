import { afterEach, describe, expect, it } from "vitest";
import { getRequestAccessContext, getRequestActorId } from "./request-auth";

describe("getRequestAccessContext", () => {
  afterEach(() => {
    delete process.env.AUTH_ENFORCEMENT;
  });

  it("parses request access context from development headers", () => {
    const context = getRequestAccessContext(
      new Headers({
        "x-user-id": "user_1",
        "x-roles": "guardian,player",
        "x-org-ids": "org_1,org_2",
        "x-team-ids": "team_1",
        "x-player-ids": "player_1",
        "x-consent-granted": "true"
      })
    );

    expect(context).toEqual({
      userId: "user_1",
      roles: ["guardian", "player"],
      userOrganizationIds: ["org_1", "org_2"],
      assignedTeamIds: ["team_1"],
      linkedPlayerIds: ["player_1"],
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

    expect(
      getRequestActorId(
        new Headers({
          "x-user-id": "user_1",
          "x-roles": "org_admin",
          "x-org-ids": "org_1"
        }),
        "body_user"
      )
    ).toBe("user_1");
  });

  it("allows fallback actor ids while local auth is disabled", () => {
    process.env.AUTH_ENFORCEMENT = "off";

    expect(getRequestActorId(new Headers(), "body_user")).toBe("body_user");
  });
});
