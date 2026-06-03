import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildGoogleCalendarAuthUrl, decodeGoogleCalendarState, hashGoogleCalendarState } from "./google-calendar-oauth";

describe("google calendar OAuth state", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-03T12:00:00.000Z"));
  });

  afterEach(() => {
    delete process.env.GOOGLE_OAUTH_CLIENT_ID;
    delete process.env.GOOGLE_OAUTH_STATE_SECRET;
    delete process.env.TOKEN_ENCRYPTION_KEY;
    vi.useRealTimers();
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
      trainerUserId: "trainer_1",
      expiresAt: new Date("2026-06-03T12:10:00.000Z")
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

  it("rejects expired signed state", () => {
    process.env.GOOGLE_OAUTH_CLIENT_ID = "client_1";
    process.env.GOOGLE_OAUTH_STATE_SECRET = "state_secret";

    const { state } = buildGoogleCalendarAuthUrl({
      organizationId: "org_1",
      trainerUserId: "trainer_1",
      redirectUri: "https://example.test/api/integrations/google-calendar/callback"
    });

    vi.setSystemTime(new Date("2026-06-03T12:11:00.000Z"));

    expect(() => decodeGoogleCalendarState(state)).toThrow("Google OAuth state is expired.");
  });

  it("hashes state without exposing the state value", () => {
    const state = "opaque-state-value";

    expect(hashGoogleCalendarState(state)).toHaveLength(64);
    expect(hashGoogleCalendarState(state)).not.toBe(state);
  });
});
