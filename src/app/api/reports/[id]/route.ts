import { NextResponse, type NextRequest } from "next/server";
import { requirePlayerAccess, requireTeamEntryAccess, requireTenantAccess } from "@/lib/auth-guards";
import { apiErrorResponse } from "@/lib/api-response";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const report = await getPrisma().report.findUnique({
    where: { id }
  });

  if (!report) {
    return apiErrorResponse("NOT_FOUND", "Report was not found.", 404);
  }

  const forbidden = report.playerId
    ? requirePlayerAccess(_request.headers, {
        organizationId: report.organizationId,
        playerId: report.playerId,
        requiresConsent: true
      })
    : report.teamId
      ? requireTeamEntryAccess(_request.headers, {
          organizationId: report.organizationId,
          teamId: report.teamId
        })
      : requireTenantAccess(_request.headers, report.organizationId);

  if (forbidden) {
    return forbidden;
  }

  return NextResponse.json({ report });
}
