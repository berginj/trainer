import { NextResponse, type NextRequest } from "next/server";
import { requireTenantAccess } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  if (!organizationId) {
    return NextResponse.json({ code: "VALIDATION_FAILED", message: "organizationId is required." }, { status: 400 });
  }

  const forbidden = requireTenantAccess(request.headers, organizationId);

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const transactions = await prisma.paymentTransaction.findMany({
    where: {
      organizationId,
      reconciliationStatus: status as never
    },
    include: {
      importBatch: true,
      matches: { orderBy: { createdAt: "desc" }, take: 3, include: { player: true } }
    },
    orderBy: { transactionDate: "desc" },
    take: 100
  });

  return NextResponse.json({ transactions });
}

