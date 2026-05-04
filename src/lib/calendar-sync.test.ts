import { describe, expect, it } from "vitest";
import { googleEventDedupeKey, normalizeGoogleCalendarEvent } from "./calendar-sync";

describe("calendar-sync", () => {
  it("normalizes Google event metadata and attendee emails", () => {
    const event = normalizeGoogleCalendarEvent("primary", {
      id: "evt_1",
      summary: "Training with Alex",
      description: "Bring glove",
      location: "Field 1",
      updated: "2026-05-01T12:00:00Z",
      start: { dateTime: "2026-05-02T15:00:00Z" },
      end: { dateTime: "2026-05-02T16:00:00Z" },
      attendees: [{ email: "Parent@Example.com" }, { email: "parent@example.com" }]
    });

    expect(event).toMatchObject({
      googleCalendarId: "primary",
      googleEventId: "evt_1",
      title: "Training with Alex",
      attendeeEmails: ["parent@example.com"],
      syncStatus: "imported"
    });
  });

  it("marks cancelled Google events for graceful appointment cancellation", () => {
    const event = normalizeGoogleCalendarEvent("primary", {
      id: "evt_1",
      status: "cancelled",
      start: { dateTime: "2026-05-02T15:00:00Z" },
      end: { dateTime: "2026-05-02T16:00:00Z" }
    });

    expect(event?.syncStatus).toBe("cancelled");
  });

  it("builds a stable dedupe key", () => {
    expect(googleEventDedupeKey("int_1", "primary", "evt_1")).toBe("int_1:primary:evt_1");
  });
});

