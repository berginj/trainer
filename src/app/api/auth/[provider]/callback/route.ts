import { NextResponse, type NextRequest } from "next/server";
import type { AuthProvider } from "@prisma/client";
import { apiErrorResponse } from "@/lib/api-response";
import { buildAccessContext, upsertOAuthUser } from "@/lib/app-auth";
import {
  clearOAuthStateCookie,
  createSignedSessionCookie,
  exchangeOAuthCode,
  normalizeOAuthReturnTo,
  parseOAuthState
} from "@/lib/auth-session";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

function parseProvider(provider: string): AuthProvider | null {
  return provider === "google" || provider === "microsoft" ? provider : null;
}

function getPublicOrigin(request: NextRequest) {
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") ?? "https";

  if (forwardedHost) {
    return `${forwardedProto.split(",")[0]}://${forwardedHost.split(",")[0]}`;
  }

  return request.nextUrl.origin;
}

export async function GET(request: NextRequest, context: { params: Promise<{ provider: string }> }) {
  const { provider: rawProvider } = await context.params;
  const provider = parseProvider(rawProvider);
  const code = request.nextUrl.searchParams.get("code");
  const state = parseOAuthState(request.headers.get("cookie"), request.nextUrl.searchParams.get("state"));

  if (!provider || !code || !state || state.provider !== provider) {
    return apiErrorResponse("VALIDATION_FAILED", "Auth callback state is invalid.", 400);
  }

  const redirectUri = new URL(`/api/auth/${provider}/callback`, getPublicOrigin(request)).toString();
  let contextForSession;

  try {
    const profile = await exchangeOAuthCode({
      provider,
      code,
      redirectUri
    });
    const prisma = getPrisma();
    const user = await upsertOAuthUser({
      prisma,
      profile,
      inviteToken: state.inviteToken
    });

    contextForSession = await buildAccessContext(prisma, user.id);
  } catch (error) {
    return apiErrorResponse(
      "VALIDATION_FAILED",
      error instanceof Error ? error.message : "OAuth sign-in failed.",
      400
    );
  }

  const response = NextResponse.redirect(new URL(normalizeOAuthReturnTo(state.returnTo), getPublicOrigin(request)));

  response.headers.append("set-cookie", createSignedSessionCookie(contextForSession));
  response.headers.append("set-cookie", clearOAuthStateCookie());

  return response;
}
