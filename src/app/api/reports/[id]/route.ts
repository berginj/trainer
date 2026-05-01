import { NextResponse, type NextRequest } from "next/server";
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

  return NextResponse.json({ report });
}
