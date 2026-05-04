import { NextResponse, type NextRequest } from "next/server";
import { requireOrganizationUserAction } from "@/lib/auth-guards";
import { buildGoogleCalendarAuthUrl } from "@/lib/google-calendar-oauth";
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

  return NextResponse.json({
    authUrl,
    state,
    scopes: [
      "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
      "https://www.googleapis.com/auth/calendar.events.readonly"
    ]
  });
}
