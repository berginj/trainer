import type { MatchablePlayer } from "./appointment-matching";

export type MatchablePaymentTransaction = {
  counterpartyName?: string | null;
  counterpartyHandle?: string | null;
  counterpartyEmail?: string | null;
  note?: string | null;
};

export type PaymentMatchRecommendation = {
  playerId: string | null;
  status: "matched" | "recommended" | "unmatched";
  confidence: number;
  reason: string;
  signals: Record<string, unknown>;
};

function normalize(value: string | null | undefined) {
  return (value ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9@\s._+-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function playerEmails(player: MatchablePlayer) {
  return [...(player.guardianEmails ?? []), ...(player.clientEmails ?? []), ...(player.knownEmails ?? [])].map((email) =>
    normalize(email)
  );
}

export function recommendPaymentAthleteMatch(
  transaction: MatchablePaymentTransaction,
  players: MatchablePlayer[]
): PaymentMatchRecommendation {
  const email = normalize(transaction.counterpartyEmail);
  const text = normalize(
    `${transaction.counterpartyName ?? ""} ${transaction.counterpartyHandle ?? ""} ${transaction.note ?? ""}`
  );

  if (email) {
    const emailMatches = players.filter((player) => playerEmails(player).includes(email));

    if (emailMatches.length === 1) {
      return {
        playerId: emailMatches[0].id,
        status: "matched",
        confidence: 100,
        reason: "Exact payment counterparty email matches athlete or guardian contact.",
        signals: { counterpartyEmail: email }
      };
    }

    if (emailMatches.length > 1) {
      return {
        playerId: null,
        status: "unmatched",
        confidence: 0,
        reason: "Multiple athletes share the payment counterparty email; trainer confirmation is required.",
        signals: { counterpartyEmail: email, candidatePlayerIds: emailMatches.map((player) => player.id) }
      };
    }
  }

  const nameMatches = players.filter((player) => text.includes(normalize(player.preferredName)));

  if (nameMatches.length === 1) {
    return {
      playerId: nameMatches[0].id,
      status: "recommended",
      confidence: 85,
      reason: "Athlete name appears in the payment counterparty or note; trainer confirmation is required.",
      signals: { matchedName: nameMatches[0].preferredName }
    };
  }

  if (nameMatches.length > 1) {
    return {
      playerId: null,
      status: "unmatched",
      confidence: 0,
      reason: "Multiple athlete names appear in the payment transaction text; trainer confirmation is required.",
      signals: { candidatePlayerIds: nameMatches.map((player) => player.id) }
    };
  }

  return {
    playerId: null,
    status: "unmatched",
    confidence: 0,
    reason: "No safe payment-to-athlete match was found.",
    signals: {}
  };
}

