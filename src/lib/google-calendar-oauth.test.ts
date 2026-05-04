import { afterEach, describe, expect, it } from "vitest";
import { buildGoogleCalendarAuthUrl, decodeGoogleCalendarState } from "./google-calendar-oauth";

describe("google calendar OAuth state", () => {
  afterEach(() => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_STATE_SECRET;
    delete process.env.TOKEN_ENCRYPTION_KEY;
  });

  it("round-trips signed organization and trainer scope", () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "client_1";
    process.env.GOOGLE_OAUTH_STATE_SECRET = "state_secret";

    const { state } = buildGoogleCalendarAuthUrl({
      organizationId: "org_1",
      trainerUserId: "trainer_1",
      redirectUri: "https://example.test/api/integrations/google-calendar/callback"
    });

    expect(decodeGoogleCalendarState(state)).toEqual({
      organizationId: "org_1",
      trainerUserId: "trainer_1"
    });
  });

  it("rejects tampered signed state", () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "client_1";
    process.env.GOOGLE_OAUTH_STATE_SECRET = "state_secret";

    const { state } = buildGoogleCalendarAuthUrl({
      organizationId: "org_1",
      trainerUserId: "trainer_1",
      redirectUri: "https://example.test/api/integrations/google-calendar/callback"
    });
    const [payload, signature] = state.split(".");
    const tamperedPayload = Buffer.from(
      JSON.stringify({
        organizationId: "org_2",
        trainerUserId: "trainer_1",
        nonce: "tampered"
      })
    ).toString("base64url");

    expect(() => decodeGoogleCalendarState(`${tamperedPayload}.${signature}`)).toThrow(
      "Google OAuth state signature is invalid."
    );
    expect(payload).not.toBe(tamperedPayload);
  });
});
