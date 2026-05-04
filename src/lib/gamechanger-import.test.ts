import { describe, expect, it } from "vitest";
import {
  gameChangerImportDedupeKey,
  parseGameChangerStatsCsv,
  recommendGameChangerPlayerMatch
} from "./gamechanger-import";

describe("parseGameChangerStatsCsv", () => {
  it("normalizes basketball stat exports with shot attempts", () => {
    const result = parseGameChangerStatsCsv("Player,#,FGM,FGA,3PM,3PA,PTS\nAlex Rivera,12,4,9,2,5,12", {
      sport: "basketball",
      importScope: "game_filtered"
    });

    expect(result.rejectedRows).toEqual([]);
    expect(result.playerNameColumn).toBe("player");
    expect(result.jerseyNumberColumn).toBe("number");
    expect(result.statLines[0]).toMatchObject({
      externalPlayerName: "Alex Rivera",
      jerseyNumber: "12"
    });
    expect(result.statLines[0].metrics).toMatchObject({
      field_goals_made: { raw: "4", numberValue: 4, textValue: null },
      field_goals_attempted: { raw: "9", numberValue: 9, textValue: null },
      three_pointers_made: { raw: "2", numberValue: 2, textValue: null },
      three_pointers_attempted: { raw: "5", numberValue: 5, textValue: null },
      points: { raw: "12", numberValue: 12, textValue: null }
    });
  });

  it("normalizes baseball and softball batting and pitching stat columns", () => {
    const result = parseGameChangerStatsCsv("Name,Jersey,AB,H,2B,HR,RBI,IP,Pitches\nJordan Lee,7,3,2,1,0,3,5.1,82", {
      sport: "baseball",
      importScope: "season_totals"
    });

    expect(result.rejectedRows).toEqual([]);
    expect(result.statLines[0].metrics).toMatchObject({
      at_bats: { raw: "3", numberValue: 3, textValue: null },
      hits: { raw: "2", numberValue: 2, textValue: null },
      doubles: { raw: "1", numberValue: 1, textValue: null },
      home_runs: { raw: "0", numberValue: 0, textValue: null },
      runs_batted_in: { raw: "3", numberValue: 3, textValue: null },
      innings_pitched: { raw: "5.1", numberValue: 5.1, textValue: null },
      pitches: { raw: "82", numberValue: 82, textValue: null }
    });
  });

  it("rejects empty player rows without throwing", () => {
    const result = parseGameChangerStatsCsv("Player,PTS\n,10", {
      sport: "basketball",
      importScope: "game_filtered"
    });

    expect(result.statLines).toEqual([]);
    expect(result.rejectedRows).toEqual([{ rowNumber: 2, reason: "Missing player name." }]);
  });

  it("requires a player identity column", () => {
    const result = parseGameChangerStatsCsv("PTS,REB\n10,4", {
      sport: "basketball",
      importScope: "game_filtered"
    });

    expect(result.statLines).toEqual([]);
    expect(result.rejectedRows).toEqual([{ rowNumber: 1, reason: "CSV is missing a player name column." }]);
  });
});

describe("recommendGameChangerPlayerMatch", () => {
  const players = [
    { id: "player_1", preferredName: "Alex Rivera", jerseyNumber: "12" },
    { id: "player_2", preferredName: "Jordan Lee", jerseyNumber: "7" }
  ];

  it("matches exact GameChanger names deterministically", () => {
    const recommendation = recommendGameChangerPlayerMatch(
      { externalPlayerName: "Alex Rivera", jerseyNumber: "12" },
      players
    );

    expect(recommendation).toMatchObject({
      playerId: "player_1",
      status: "matched",
      confidence: 98
    });
  });

  it("uses jersey number as a confirmation-required recommendation", () => {
    const recommendation = recommendGameChangerPlayerMatch(
      { externalPlayerName: "A. Rivera", jerseyNumber: "12" },
      players
    );

    expect(recommendation).toMatchObject({
      playerId: "player_1",
      status: "recommended",
      confidence: 80
    });
  });
});

describe("gameChangerImportDedupeKey", () => {
  it("includes team, sport, scope, game date, and content hash", () => {
    expect(
      gameChangerImportDedupeKey({
        organizationId: "org_1",
        teamId: "team_1",
        sport: "softball",
        importScope: "game_filtered",
        gameDate: new Date("2026-05-01T12:00:00.000Z"),
        fileSha256: "abc"
      })
    ).toBe("org_1:team_1:softball:game_filtered:2026-05-01:abc");
  });
});
