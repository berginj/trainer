import { describe, expect, it } from "vitest";
import { parseVenmoCsv } from "./venmo-import";

describe("parseVenmoCsv", () => {
  it("parses quoted CSV transactions into normalized rows", () => {
    const result = parseVenmoCsv(
      'Date,Amount,Name,Username,Note,ID\n2026-05-01,"75.00",Alex Parent,@alex,"training, May",txn_1'
    );

    expect(result.rejectedRows).toEqual([]);
    expect(result.transactions[0]).toMatchObject({
      amount: 75,
      direction: "payment_received",
      counterpartyName: "Alex Parent",
      counterpartyHandle: "@alex",
      note: "training, May",
      externalTransactionId: "txn_1"
    });
    expect(result.fileSha256).toHaveLength(64);
  });

  it("rejects malformed rows without throwing", () => {
    const result = parseVenmoCsv("Date,Amount,Name\nnot-a-date,abc,Alex Parent");

    expect(result.transactions).toEqual([]);
    expect(result.rejectedRows).toEqual([{ rowNumber: 2, reason: "Missing or invalid transaction date." }]);
  });
});

