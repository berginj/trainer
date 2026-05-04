import { describe, expect, it } from "vitest";
import { buildAppointmentChangeEmail } from "./appointment-notifications";

describe("buildAppointmentChangeEmail", () => {
  it("includes original time, reason, custom message, and makeup options", () => {
    const email = buildAppointmentChangeEmail({
      athleteName: "Alex",
      trainerName: "Coach Lee",
      appointmentTitle: "Pitching session",
      originalStartTime: new Date("2026-05-02T15:00:00Z"),
      originalEndTime: new Date("2026-05-02T16:00:00Z"),
      reason: "Rain",
      customMessage: "Field is closed.",
      oneOffAvailability: [{ startTime: "2026-05-03T15:00:00Z", endTime: "2026-05-03T16:00:00Z" }]
    });

    expect(email.subject).toBe("Schedule change: Pitching session");
    expect(email.text).toContain("Rain");
    expect(email.text).toContain("Field is closed.");
    expect(email.text).toContain("Possible make-up times");
  });
});

