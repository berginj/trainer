import { NextResponse, type NextRequest } from "next/server";
import { requireOrganizationUserAction } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const trainerUserId = request.nextUrl.searchParams.get("trainerUserId");
  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  if (!organizationId || !trainerUserId) {
    return NextResponse.json(
      { code: "VALIDATION_FAILED", message: "organizationId and trainerUserId are required." },
      { status: 400 }
    );
  }

  const forbidden = requireOrganizationUserAction(request.headers, {
    organizationId,
    targetUserId: trainerUserId
  });

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const appointments = await prisma.trainerAppointment.findMany({
    where: {
      organizationId,
      trainerUserId,
      status: status as never
    },
    include: {
      player: true,
      matches: { orderBy: { createdAt: "desc" }, take: 3 },
      externalEvent: true,
      changeNotices: { orderBy: { createdAt: "desc" }, take: 3 }
    },
    orderBy: { startTime: "asc" },
    take: 100
  });

  return NextResponse.json({ appointments });
}
