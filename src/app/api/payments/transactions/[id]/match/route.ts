import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { writeAuditEvent } from "@/lib/audit";
import { requireTenantAccess } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { paymentMatchUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = await parseJsonWithSchema(request, paymentMatchUpdateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const transaction = await prisma.paymentTransaction.findUnique({ where: { id } });

  if (!transaction) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Payment transaction was not found." }, { status: 404 });
  }

  const forbidden = requireTenantAccess(request.headers, transaction.organizationId);

  if (forbidden) {
    return forbidden;
  }

  if (parsed.data.status === "matched" && !parsed.data.playerId) {
    return NextResponse.json({ code: "VALIDATION_FAILED", message: "playerId is required to confirm a match." }, { status: 400 });
  }

  const actorUserId = getRequestActorId(request.headers, parsed.data.actorUserId);
  const match = await prisma.paymentAthleteMatch.create({
    data: {
      organizationId: transaction.organizationId,
      transactionId: transaction.id,
      playerId: parsed.data.playerId,
      status: parsed.data.status,
      confidence: parsed.data.status === "matched" ? 100 : 0,
      reason: parsed.data.status === "matched" ? "Trainer confirmed payment match." : "Trainer ignored transaction.",
      signals: { source: "trainer_review" } as Prisma.InputJsonValue,
      confirmedByUserId: actorUserId,
      confirmedAt: new Date()
    }
  });
  const updatedTransaction = await prisma.paymentTransaction.update({
    where: { id: transaction.id },
    data: {
      reconciliationStatus: parsed.data.status
    }
  });

  await writeAuditEvent(prisma, {
    organizationId: transaction.organizationId,
    actorUserId,
    action: parsed.data.status === "matched" ? "payment_transaction.match_confirmed" : "payment_transaction.ignored",
    entityType: "PaymentTransaction",
    entityId: transaction.id
  });

  return NextResponse.json({ transaction: updatedTransaction, match });
}
