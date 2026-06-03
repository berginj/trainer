import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  createOAuthStateCookie,
  normalizeOAuthReturnTo,
  oauthStateCookieName,
  parseOAuthState
} from "./auth-session";

describe("OAuth session helpers", () => {
  beforeEach(() => {
    process.env.AUTH_SECRET = "test-auth-secret";
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-06-02T12:00:00.000Z"));
  });

  afterEach(() => {
    delete process.env.AUTH_SECRET;
    vi.useRealTimers();
  });

  it("parses a valid state only when the state cookie matches", () => {
    const { state, cookie } = createOAuthStateCookie({
      provider: "microsoft",
      returnTo: "/guardian/home",
      inviteToken: "invite-token"
    });

    expect(parseOAuthState(cookie, state)).toMatchObject({
      provider: "microsoft",
      returnTo: "/guardian/home",
      inviteToken: "invite-token"
    });
  });

  it("rejects missing and mismatched state cookies", () => {
    const first = createOAuthStateCookie({ provider: "google", returnTo: "/reports" });
    const second = createOAuthStateCookie({ provider: "google", returnTo: "/reports" });

    expect(parseOAuthState(null, first.state)).toBeNull();
    expect(parseOAuthState(second.cookie, first.state)).toBeNull();
  });

  it("rejects expired state", () => {
    const { state, cookie } = createOAuthStateCookie({ provider: "microsoft", returnTo: "/routines" });

    vi.setSystemTime(new Date("2026-06-02T12:11:00.000Z"));

    expect(parseOAuthState(cookie, state)).toBeNull();
  });

  it("rejects tampered state signatures", () => {
    const { state, cookie } = createOAuthStateCookie({ provider: "google", returnTo: "/admin" });
    const [payload] = state.split(".");
    const tamperedState = `${payload}.not-a-valid-signature`;

    expect(parseOAuthState(cookie.replace(state, tamperedState), tamperedState)).toBeNull();
  });

  it("keeps return targets relative to the app origin", () => {
    expect(normalizeOAuthReturnTo(null)).toBe("/");
    expect(normalizeOAuthReturnTo("/guardian/home?playerId=p1#today")).toBe("/guardian/home?playerId=p1#today");
    expect(normalizeOAuthReturnTo("reports")).toBe("/reports");
    expect(normalizeOAuthReturnTo("https://example.com/steal")).toBe("/");
    expect(normalizeOAuthReturnTo("//example.com/steal")).toBe("/");
  });

  it("uses the expected state cookie name", () => {
    expect(createOAuthStateCookie({ provider: "google" }).cookie).toContain(`${oauthStateCookieName}=`);
  });
});
