export type MatchablePlayer = {
  id: string;
  preferredName: string;
  guardianEmails?: string[];
  clientEmails?: string[];
  knownEmails?: string[];
};

export type MatchableAppointment = {
  title: string;
  description?: string | null;
  attendeeEmails?: string[];
};

export type AthleteMatchRecommendation = {
  playerId: string | null;
  status: "matched" | "recommended" | "unmatched";
  confidence: number;
  reason: string;
  signals: Record<string, unknown>;
};

function normalizeText(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9@\s._+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function playerEmails(player: MatchablePlayer) {
  return [...(player.guardianEmails ?? []), ...(player.clientEmails ?? []), ...(player.knownEmails ?? [])]
    .filter(Boolean)
    .map(normalizeEmail);
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

export function recommendAppointmentAthleteMatch(
  appointment: MatchableAppointment,
  players: MatchablePlayer[]
): AthleteMatchRecommendation {
  const attendeeEmails = (appointment.attendeeEmails ?? []).map(normalizeEmail);
  const eventText = normalizeText(`${appointment.title} ${appointment.description ?? ""}`);

  const emailMatches = players.filter((player) =>
    playerEmails(player).some((email) => attendeeEmails.includes(email))
  );

  if (emailMatches.length === 1) {
    return {
      playerId: emailMatches[0].id,
      status: "matched",
      confidence: 100,
      reason: "Exact email match against athlete or guardian contact.",
      signals: { attendeeEmails, matchedEmailScope: "athlete_or_guardian" }
    };
  }

  if (emailMatches.length > 1) {
    return {
      playerId: null,
      status: "unmatched",
      confidence: 0,
      reason: "Multiple athletes share an attendee email; trainer confirmation is required.",
      signals: { attendeeEmails, candidatePlayerIds: emailMatches.map((player) => player.id) }
    };
  }

  const exactNameMatches = players.filter((player) => eventText.includes(normalizeText(player.preferredName)));

  if (exactNameMatches.length === 1) {
    return {
      playerId: exactNameMatches[0].id,
      status: "matched",
      confidence: 95,
      reason: "Exact athlete name appears in the event title or description.",
      signals: { matchedName: exactNameMatches[0].preferredName }
    };
  }

  if (exactNameMatches.length > 1) {
    return {
      playerId: null,
      status: "unmatched",
      confidence: 0,
      reason: "Multiple athlete names appear in the event text; trainer confirmation is required.",
      signals: { candidatePlayerIds: exactNameMatches.map((player) => player.id) }
    };
  }

  const fuzzyCandidates = players
    .map((player) => ({
      player,
      score: Math.max(tokenSimilarity(player.preferredName, appointment.title), tokenSimilarity(player.preferredName, eventText))
    }))
    .filter((candidate) => candidate.score >= 0.33)
    .sort((left, right) => right.score - left.score);

  if (fuzzyCandidates.length > 0) {
    const best = fuzzyCandidates[0];
    return {
      playerId: best.player.id,
      status: "recommended",
      confidence: Math.round(best.score * 80),
      reason: "Fuzzy name similarity suggests a possible athlete match; trainer confirmation is required.",
      signals: {
        matchedName: best.player.preferredName,
        similarity: best.score,
        candidatePlayerIds: fuzzyCandidates.map((candidate) => candidate.player.id)
      }
    };
  }

  return {
    playerId: null,
    status: "unmatched",
    confidence: 0,
    reason: "No deterministic or safe recommended athlete match was found.",
    signals: { attendeeEmails }
  };
}
