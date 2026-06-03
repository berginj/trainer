import { NextResponse, type NextRequest } from "next/server";
import type { AuthProvider } from "@prisma/client";
import { apiErrorResponse } from "@/lib/api-response";
import { buildOAuthAuthorizationUrl, createOAuthStateCookie, normalizeOAuthReturnTo } from "@/lib/auth-session";

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

  if (!provider) {
    return apiErrorResponse("VALIDATION_FAILED", "Unsupported auth provider.", 400);
  }

  const redirectUri = new URL(`/api/auth/${provider}/callback`, getPublicOrigin(request)).toString();
  const returnTo = normalizeOAuthReturnTo(request.nextUrl.searchParams.get("returnTo"));
  const inviteToken = request.nextUrl.searchParams.get("invite") ?? undefined;
  const { state, cookie } = createOAuthStateCookie({
    provider,
    returnTo,
    inviteToken
  });
  let authUrl: string;

  try {
    authUrl = buildOAuthAuthorizationUrl({
      provider,
      redirectUri,
      state
    });
  } catch (error) {
    return apiErrorResponse(
      "VALIDATION_FAILED",
      error instanceof Error ? error.message : "Auth provider is not configured.",
      400
    );
  }
  const response = NextResponse.redirect(authUrl);

  response.headers.append("set-cookie", cookie);

  return response;
}
