import { NextResponse, type NextRequest } from "next/server";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import {
  decodeGoogleCalendarState,
  encryptSecret,
  exchangeGoogleCalendarCode,
  GOOGLE_CALENDAR_SCOPES
} from "@/lib/google-calendar-oauth";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const code = request.nextUrl.searchParams.get("code");
  const state = request.nextUrl.searchParams.get("state");

  if (!code || !state) {
    return NextResponse.json({ code: "VALIDATION_FAILED", message: "Google callback requires code and state." }, { status: 400 });
  }

  const scopedState = decodeGoogleCalendarState(state);
  const redirectUri = new URL("/api/integrations/google-calendar/callback", request.nextUrl.origin).toString();
  const token = await exchangeGoogleCalendarCode({ code, redirectUri });
  const prisma = getPrisma();
  const integration = await prisma.externalCalendarIntegration.create({
    data: {
      organizationId: scopedState.organizationId,
      trainerUserId: scopedState.trainerUserId,
      provider: "google",
      scopes: token.scopes.length > 0 ? token.scopes : [...GOOGLE_CALENDAR_SCOPES],
      status: "connected",
      accessTokenEncrypted: encryptSecret(token.accessToken),
      refreshTokenEncrypted: token.refreshToken ? encryptSecret(token.refreshToken) : null,
      tokenExpiresAt: token.tokenExpiresAt,
      tokenEncryptionKeyVersion: process.env.TOKEN_ENCRYPTION_KEY_VERSION ?? "v1"
    }
  });

  await writeAuditEvent(prisma, {
    organizationId: scopedState.organizationId,
    actorUserId: scopedState.trainerUserId,
    action: "external_calendar.connected",
    entityType: "ExternalCalendarIntegration",
    entityId: integration.id,
    metadata: { provider: "google", scopes: token.scopes }
  });

  return NextResponse.json({ integrationId: integration.id, status: integration.status });
}

