import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { writeAuditEvent } from "@/lib/audit";
import { requireOrganizationUserAction } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/db";
import { recommendPaymentAthleteMatch } from "@/lib/payment-matching";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { venmoImportSchema } from "@/lib/validation";
import { parseVenmoCsv } from "@/lib/venmo-import";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, venmoImportSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const forbidden = requireOrganizationUserAction(request.headers, {
    organizationId: parsed.data.organizationId,
    targetUserId: parsed.data.trainerUserId
  });

  if (forbidden) {
    return forbidden;
  }

  const parsedCsv = parseVenmoCsv(parsed.data.csv);
  const prisma = getPrisma();
  const actorUserId = getRequestActorId(request.headers, parsed.data.trainerUserId);
  const players = await prisma.player.findMany({
    where: { organizationId: parsed.data.organizationId, activeStatus: "active" },
    include: { guardianLinks: { include: { guardian: true } } }
  });
  const matchablePlayers = players.map((player) => ({
    id: player.id,
    preferredName: player.preferredName,
    guardianEmails: player.guardianLinks.map((link) => link.guardian.email)
  }));
  const batch = await prisma.paymentImportBatch.create({
    data: {
      organizationId: parsed.data.organizationId,
      trainerUserId: parsed.data.trainerUserId,
      source: "venmo_csv",
      originalFileName: parsed.data.originalFileName,
      fileSha256: parsedCsv.fileSha256,
      rowCount: parsedCsv.transactions.length
    }
  });
  const transactions = [];

  for (const transaction of parsedCsv.transactions) {
    const recommendation = recommendPaymentAthleteMatch(transaction, matchablePlayers);
    const created = await prisma.paymentTransaction.create({
      data: {
        organizationId: parsed.data.organizationId,
        importBatchId: batch.id,
        externalTransactionId: transaction.externalTransactionId,
        transactionDate: transaction.transactionDate,
        amount: transaction.amount,
        direction: transaction.direction,
        counterpartyName: transaction.counterpartyName,
        counterpartyHandle: transaction.counterpartyHandle,
        counterpartyEmail: transaction.counterpartyEmail,
        note: transaction.note,
        reconciliationStatus: recommendation.status,
        rawMetadata: transaction.raw as Prisma.InputJsonValue
      }
    });

    await prisma.paymentAthleteMatch.create({
      data: {
        organizationId: parsed.data.organizationId,
        transactionId: created.id,
        playerId: recommendation.playerId,
        status: recommendation.status,
        confidence: recommendation.confidence,
        reason: recommendation.reason,
        signals: recommendation.signals as Prisma.InputJsonValue
      }
    });
    transactions.push(created);
  }

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "payment_import.created",
    entityType: "PaymentImportBatch",
    entityId: batch.id,
    metadata: { source: "venmo_csv", importedRows: transactions.length, rejectedRows: parsedCsv.rejectedRows.length }
  });

  return NextResponse.json(
    {
      batch,
      transactions,
      rejectedRows: parsedCsv.rejectedRows
    },
    { status: 201 }
  );
}
