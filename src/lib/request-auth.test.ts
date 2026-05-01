import { describe, expect, it } from "vitest";
import { getRequestAccessContext } from "./request-auth";

describe("getRequestAccessContext", () => {
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
});
