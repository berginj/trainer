import { describe, expect, it } from "vitest";
import { recommendAppointmentAthleteMatch } from "./appointment-matching";

const players = [
  {
    id: "player_1",
    preferredName: "Alex Rivera",
    guardianEmails: ["parent@example.com"]
  },
  {
    id: "player_2",
    preferredName: "Jordan Smith",
    guardianEmails: ["guardian@example.com"]
  }
];

describe("recommendAppointmentAthleteMatch", () => {
  it("automatically matches a single exact attendee email", () => {
    const match = recommendAppointmentAthleteMatch(
      { title: "Training", attendeeEmails: ["PARENT@example.com"] },
      players
    );

    expect(match).toMatchObject({
      playerId: "player_1",
      status: "matched",
      confidence: 100
    });
  });

  it("does not automatically match ambiguous shared emails", () => {
    const match = recommendAppointmentAthleteMatch(
      { title: "Training", attendeeEmails: ["shared@example.com"] },
      [
        { id: "player_1", preferredName: "Alex Rivera", guardianEmails: ["shared@example.com"] },
        { id: "player_2", preferredName: "Jordan Smith", guardianEmails: ["shared@example.com"] }
      ]
    );

    expect(match.status).toBe("unmatched");
    expect(match.playerId).toBeNull();
  });

  it("uses fuzzy name matching only as a recommendation", () => {
    const match = recommendAppointmentAthleteMatch({ title: "Alex throwing session" }, players);

    expect(match.status).toBe("recommended");
    expect(match.playerId).toBe("player_1");
  });
});

