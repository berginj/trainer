import { createHash } from "crypto";
import { csvRowsToObjects } from "./csv";

export type ParsedCsvTransaction = {
  transactionDate: Date;
  amount: number;
  direction: "payment_received" | "payment_sent" | "expense" | "refund" | "unknown";
  counterpartyName?: string;
  counterpartyHandle?: string;
  counterpartyEmail?: string;
  note?: string;
  externalTransactionId?: string;
  raw: Record<string, string>;
};

export type VenmoParseResult = {
  fileSha256: string;
  transactions: ParsedCsvTransaction[];
  rejectedRows: Array<{
    rowNumber: number;
    reason: string;
  }>;
};

function firstValue(row: Record<string, string>, keys: string[]) {
  for (const key of keys) {
    const value = row[key];
    if (value?.trim()) {
      return value.trim();
    }
  }

  return undefined;
}

function parseAmount(value: string | undefined) {
  if (!value) {
    return null;
  }

  const normalized = value.replace(/[$,\s]/g, "");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function inferDirection(row: Record<string, string>, amount: number): ParsedCsvTransaction["direction"] {
  const typeText = `${firstValue(row, ["type", "transaction_type", "direction"]) ?? ""} ${
    firstValue(row, ["status", "note", "description"]) ?? ""
  }`.toLowerCase();

  if (typeText.includes("refund")) {
    return "refund";
  }

  if (typeText.includes("expense") || typeText.includes("purchase")) {
    return "expense";
  }

  if (typeText.includes("paid") || typeText.includes("sent") || amount < 0) {
    return "payment_sent";
  }

  if (typeText.includes("charged") || typeText.includes("received") || amount > 0) {
    return "payment_received";
  }

  return "unknown";
}

export function parseVenmoCsv(csv: string): VenmoParseResult {
  const fileSha256 = createHash("sha256").update(csv).digest("hex");
  const parsedRows = csvRowsToObjects(csv);
  const transactions: ParsedCsvTransaction[] = [];
  const rejectedRows: VenmoParseResult["rejectedRows"] = [];

  if (parsedRows.headers.length === 0) {
    return {
      fileSha256,
      transactions,
      rejectedRows: [{ rowNumber: 1, reason: "CSV is empty." }]
    };
  }

  parsedRows.rows.forEach((raw, index) => {
    const dateValue = firstValue(raw, ["datetime", "date", "transaction_date", "completed_date"]);
    const amountValue = firstValue(raw, ["amount", "total", "net_amount"]);
    const transactionDate = dateValue ? new Date(dateValue) : null;
    const amount = parseAmount(amountValue);

    if (!transactionDate || Number.isNaN(transactionDate.getTime())) {
      rejectedRows.push({ rowNumber: index + 2, reason: "Missing or invalid transaction date." });
      return;
    }

    if (amount === null) {
      rejectedRows.push({ rowNumber: index + 2, reason: "Missing or invalid amount." });
      return;
    }

    transactions.push({
      transactionDate,
      amount,
      direction: inferDirection(raw, amount),
      counterpartyName: firstValue(raw, ["name", "counterparty", "from", "to"]),
      counterpartyHandle: firstValue(raw, ["username", "handle", "counterparty_username"]),
      counterpartyEmail: firstValue(raw, ["email", "counterparty_email"]),
      note: firstValue(raw, ["note", "description", "memo"]),
      externalTransactionId: firstValue(raw, ["id", "transaction_id", "external_id"]),
      raw
    });
  });

  return { fileSha256, transactions, rejectedRows };
}
