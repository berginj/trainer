import { describe, expect, it } from "vitest";
import { recommendPaymentAthleteMatch } from "./payment-matching";

describe("recommendPaymentAthleteMatch", () => {
  it("automatically matches exact payment email", () => {
    const match = recommendPaymentAthleteMatch(
      { counterpartyEmail: "guardian@example.com", note: "lesson" },
      [{ id: "player_1", preferredName: "Alex Rivera", guardianEmails: ["guardian@example.com"] }]
    );

    expect(match).toMatchObject({
      playerId: "player_1",
      status: "matched",
      confidence: 100
    });
  });

  it("recommends name matches instead of auto-confirming them", () => {
    const match = recommendPaymentAthleteMatch(
      { counterpartyName: "Alex Parent", note: "Alex Rivera training" },
      [{ id: "player_1", preferredName: "Alex Rivera" }]
    );

    expect(match).toMatchObject({
      playerId: "player_1",
      status: "recommended"
    });
  });
});

