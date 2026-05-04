import { createHash } from "crypto";
import { csvRowsToObjects } from "./csv";

export type GameChangerSport = "baseball" | "softball" | "basketball";
export type GameChangerImportScope = "game_filtered" | "season_totals";

export type GameChangerMetricValue = {
  raw: string;
  numberValue: number | null;
  textValue: string | null;
};

export type ParsedGameChangerStatLine = {
  rowNumber: number;
  externalPlayerName: string;
  jerseyNumber: string | null;
  metrics: Record<string, GameChangerMetricValue>;
  raw: Record<string, string>;
};

export type GameChangerParseResult = {
  fileSha256: string;
  sport: GameChangerSport;
  importScope: GameChangerImportScope;
  headers: string[];
  playerNameColumn: string | null;
  jerseyNumberColumn: string | null;
  metricColumns: string[];
  statLines: ParsedGameChangerStatLine[];
  rejectedRows: Array<{
    rowNumber: number;
    reason: string;
  }>;
};

export type MatchableGameChangerPlayer = {
  id: string;
  preferredName: string;
  jerseyNumber?: string | null;
  externalAliases?: string[];
};

export type GameChangerPlayerMatchRecommendation = {
  playerId: string | null;
  status: "matched" | "recommended" | "unmatched";
  confidence: number;
  reason: string;
  signals: Record<string, unknown>;
};

const playerNameColumns = [
  "player",
  "player_name",
  "name",
  "athlete",
  "athlete_name",
  "full_name",
  "first_last"
];

const jerseyNumberColumns = ["number", "jersey", "jersey_number", "no", "uniform", "uniform_number"];

const sharedBaseballSoftballMetrics: Record<string, string> = {
  ab: "at_bats",
  pa: "plate_appearances",
  r: "runs",
  h: "hits",
  "1b": "singles",
  "2b": "doubles",
  "3b": "triples",
  hr: "home_runs",
  rbi: "runs_batted_in",
  bb: "walks",
  so: "strikeouts",
  k: "strikeouts",
  sb: "stolen_bases",
  cs: "caught_stealing",
  avg: "batting_average",
  obp: "on_base_percentage",
  slg: "slugging_percentage",
  ops: "on_base_plus_slugging",
  ip: "innings_pitched",
  inn: "innings_pitched",
  pitches: "pitches",
  pitch_count: "pitches",
  pc: "pitches",
  bf: "batters_faced",
  er: "earned_runs",
  era: "earned_run_average",
  whip: "walks_hits_per_inning_pitched",
  w: "wins",
  l: "losses",
  sv: "saves"
};

const basketballMetrics: Record<string, string> = {
  gp: "games_played",
  min: "minutes",
  minutes: "minutes",
  fgm: "field_goals_made",
  fga: "field_goals_attempted",
  fg: "field_goal_percentage",
  fg_pct: "field_goal_percentage",
  "3pm": "three_pointers_made",
  "3pa": "three_pointers_attempted",
  "3p": "three_point_percentage",
  "3p_pct": "three_point_percentage",
  ftm: "free_throws_made",
  fta: "free_throws_attempted",
  ft: "free_throw_percentage",
  ft_pct: "free_throw_percentage",
  pts: "points",
  points: "points",
  oreb: "offensive_rebounds",
  dreb: "defensive_rebounds",
  reb: "rebounds",
  rebounds: "rebounds",
  ast: "assists",
  assists: "assists",
  stl: "steals",
  steals: "steals",
  blk: "blocks",
  blocks: "blocks",
  to: "turnovers",
  tov: "turnovers",
  pf: "personal_fouls",
  fouls: "personal_fouls",
  plus_minus: "plus_minus"
};

function parseMetricNumber(value: string) {
  const trimmed = value.trim();

  if (!trimmed || trimmed === "-" || trimmed.toLowerCase() === "n/a") {
    return null;
  }

  const normalized = trimmed.replace(/[%,$\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function canonicalMetricKey(header: string, sport: GameChangerSport) {
  const metricMap = sport === "basketball" ? basketballMetrics : sharedBaseballSoftballMetrics;
  return metricMap[header] ?? header;
}

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeGameChangerIdentity(value: string | null | undefined) {
  return normalizeText(value);
}

function tokenSimilarity(left: string, right: string) {
  const leftTokens = new Set(normalizeText(left).split(" ").filter(Boolean));
  const rightTokens = new Set(normalizeText(right).split(" ").filter(Boolean));

  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }

  const overlap = [...leftTokens].filter((token) => rightTokens.has(token)).length;
  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

export function parseGameChangerStatsCsv(
  csv: string,
  options: {
    sport: GameChangerSport;
    importScope: GameChangerImportScope;
  }
): GameChangerParseResult {
  const fileSha256 = createHash("sha256").update(csv).digest("hex");
  const parsedRows = csvRowsToObjects(csv);
  const statLines: ParsedGameChangerStatLine[] = [];
  const rejectedRows: GameChangerParseResult["rejectedRows"] = [];

  if (parsedRows.headers.length === 0) {
    return {
      fileSha256,
      sport: options.sport,
      importScope: options.importScope,
      headers: [],
      playerNameColumn: null,
      jerseyNumberColumn: null,
      metricColumns: [],
      statLines,
      rejectedRows: [{ rowNumber: 1, reason: "CSV is empty." }]
    };
  }

  const playerNameColumn = playerNameColumns.find((column) => parsedRows.headers.includes(column)) ?? null;
  const jerseyNumberColumn = jerseyNumberColumns.find((column) => parsedRows.headers.includes(column)) ?? null;

  if (!playerNameColumn) {
    return {
      fileSha256,
      sport: options.sport,
      importScope: options.importScope,
      headers: parsedRows.headers,
      playerNameColumn,
      jerseyNumberColumn,
      metricColumns: [],
      statLines,
      rejectedRows: [{ rowNumber: 1, reason: "CSV is missing a player name column." }]
    };
  }

  const identityColumns = new Set([playerNameColumn, jerseyNumberColumn].filter((column): column is string => Boolean(column)));
  const metricColumns = parsedRows.headers.filter(
    (header) => !identityColumns.has(header) && parsedRows.rows.some((row) => row[header]?.trim())
  );

  parsedRows.rows.forEach((row, index) => {
    const externalPlayerName = row[playerNameColumn]?.trim();

    if (!externalPlayerName) {
      rejectedRows.push({ rowNumber: index + 2, reason: "Missing player name." });
      return;
    }

    const metrics: ParsedGameChangerStatLine["metrics"] = {};

    for (const column of metricColumns) {
      const raw = row[column]?.trim() ?? "";

      if (!raw) {
        continue;
      }

      const numberValue = parseMetricNumber(raw);
      metrics[canonicalMetricKey(column, options.sport)] = {
        raw,
        numberValue,
        textValue: numberValue === null ? raw : null
      };
    }

    statLines.push({
      rowNumber: index + 2,
      externalPlayerName,
      jerseyNumber: jerseyNumberColumn ? row[jerseyNumberColumn]?.trim() || null : null,
      metrics,
      raw: row
    });
  });

  return {
    fileSha256,
    sport: options.sport,
    importScope: options.importScope,
    headers: parsedRows.headers,
    playerNameColumn,
    jerseyNumberColumn,
    metricColumns,
    statLines,
    rejectedRows
  };
}

export function recommendGameChangerPlayerMatch(
  statLine: Pick<ParsedGameChangerStatLine, "externalPlayerName" | "jerseyNumber">,
  players: MatchableGameChangerPlayer[]
): GameChangerPlayerMatchRecommendation {
  const externalName = normalizeText(statLine.externalPlayerName);
  const jerseyNumber = statLine.jerseyNumber?.trim();

  const nameMatches = players.filter((player) => {
    const names = [player.preferredName, ...(player.externalAliases ?? [])].map(normalizeText);
    return names.includes(externalName);
  });

  if (nameMatches.length === 1) {
    return {
      playerId: nameMatches[0].id,
      status: "matched",
      confidence: 98,
      reason: "Exact GameChanger player name matches one athlete.",
      signals: {
        externalPlayerName: statLine.externalPlayerName,
        matchedName: nameMatches[0].preferredName,
        jerseyNumber
      }
    };
  }

  if (nameMatches.length > 1) {
    return {
      playerId: null,
      status: "unmatched",
      confidence: 0,
      reason: "Multiple athletes match the GameChanger player name; staff confirmation is required.",
      signals: {
        externalPlayerName: statLine.externalPlayerName,
        candidatePlayerIds: nameMatches.map((player) => player.id),
        jerseyNumber
      }
    };
  }

  if (jerseyNumber) {
    const jerseyMatches = players.filter((player) => player.jerseyNumber?.trim() === jerseyNumber);

    if (jerseyMatches.length === 1) {
      return {
        playerId: jerseyMatches[0].id,
        status: "recommended",
        confidence: 80,
        reason: "Jersey number matches one athlete; staff confirmation is required.",
        signals: {
          externalPlayerName: statLine.externalPlayerName,
          jerseyNumber,
          matchedName: jerseyMatches[0].preferredName
        }
      };
    }
  }

  const fuzzyCandidates = players
    .map((player) => ({
      player,
      score: Math.max(
        tokenSimilarity(player.preferredName, statLine.externalPlayerName),
        ...(player.externalAliases ?? []).map((alias) => tokenSimilarity(alias, statLine.externalPlayerName))
      )
    }))
    .filter((candidate) => candidate.score >= 0.5)
    .sort((left, right) => right.score - left.score);

  if (fuzzyCandidates.length > 0) {
    const best = fuzzyCandidates[0];
    return {
      playerId: best.player.id,
      status: "recommended",
      confidence: Math.round(best.score * 75),
      reason: "Name similarity suggests a possible GameChanger athlete match; staff confirmation is required.",
      signals: {
        externalPlayerName: statLine.externalPlayerName,
        matchedName: best.player.preferredName,
        similarity: best.score,
        candidatePlayerIds: fuzzyCandidates.map((candidate) => candidate.player.id),
        jerseyNumber
      }
    };
  }

  return {
    playerId: null,
    status: "unmatched",
    confidence: 0,
    reason: "No safe GameChanger athlete match was found.",
    signals: { externalPlayerName: statLine.externalPlayerName, jerseyNumber }
  };
}

export function gameChangerImportDedupeKey(input: {
  organizationId: string;
  teamId: string;
  sport: GameChangerSport;
  importScope: GameChangerImportScope;
  fileSha256: string;
  gameDate?: Date | null;
}) {
  return [
    input.organizationId,
    input.teamId,
    input.sport,
    input.importScope,
    input.gameDate?.toISOString().slice(0, 10) ?? "no_game_date",
    input.fileSha256
  ].join(":");
}
