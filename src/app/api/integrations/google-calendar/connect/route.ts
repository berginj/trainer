import { NextResponse, type NextRequest } from "next/server";
import { requireOrganizationUserAction } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/db";
import { buildGoogleCalendarAuthUrl, decodeGoogleCalendarState, hashGoogleCalendarState } from "@/lib/google-calendar-oauth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { googleCalendarConnectSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, googleCalendarConnectSchema);

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

  const { authUrl, state } = buildGoogleCalendarAuthUrl(parsed.data);
  const scopedState = decodeGoogleCalendarState(state);
  const prisma = getPrisma();

  await prisma.oAuthState.create({
    data: {
      provider: "google_calendar",
      stateHash: hashGoogleCalendarState(state),
      organizationId: scopedState.organizationId,
      trainerUserId: scopedState.trainerUserId,
      expiresAt: scopedState.expiresAt
    }
  });

  return NextResponse.json({
    authUrl,
    state,
    scopes: [
      "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly"
    ]
  });
}
