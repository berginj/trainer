import { createHash, createHmac, randomBytes, timingSafeEqual } from "crypto";
import type { AuthProvider } from "@prisma/client";
import type { RequestAccessContext } from "./request-auth";

export const sessionCookieName = "trainer_session";
export const oauthStateCookieName = "trainer_oauth_state";

type OAuthProfile = {
  provider: AuthProvider;
  subject: string;
  email: string;
  displayName: string;
};

type OAuthProviderConfig = {
  authorizationUrl: string;
  tokenUrl: string;
  userInfoUrl?: string;
  clientIdEnv: string;
  clientSecretEnv: string;
  scopes: string[];
};

const providerConfigs: Record<AuthProvider, OAuthProviderConfig> = {
  google: {
    authorizationUrl: "https://accounts.google.com/o/oauth2/v2/auth",
    tokenUrl: "https://oauth2.googleapis.com/token",
    userInfoUrl: "https://openidconnect.googleapis.com/v1/userinfo",
    clientIdEnv: "GOOGLE_AUTH_CLIENT_ID",
    clientSecretEnv: "GOOGLE_AUTH_CLIENT_SECRET",
    scopes: ["openid", "email", "profile"]
  },
  microsoft: {
    authorizationUrl: "https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize",
    tokenUrl: "https://login.microsoftonline.com/consumers/oauth2/v2.0/token",
    clientIdEnv: "MICROSOFT_AUTH_CLIENT_ID",
    clientSecretEnv: "MICROSOFT_AUTH_CLIENT_SECRET",
    scopes: ["openid", "email", "profile"]
  }
};

function getAuthSecret() {
  const secret = process.env.AUTH_SECRET ?? process.env.TOKEN_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("AUTH_SECRET or TOKEN_ENCRYPTION_KEY is required for app auth.");
  }

  return secret;
}

function base64UrlEncode(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function base64UrlDecode(input: string) {
  return Buffer.from(input, "base64url").toString("utf8");
}

function sign(value: string) {
  return createHmac("sha256", getAuthSecret()).update(value).digest("base64url");
}

function verifySignedValue(value: string, signature: string) {
  const expected = sign(value);
  const signatureBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return signatureBuffer.length === expectedBuffer.length && timingSafeEqual(signatureBuffer, expectedBuffer);
}

function readCookie(cookieHeader: string | null, name: string) {
  return (
    cookieHeader
      ?.split(";")
      .map((item) => item.trim())
      .find((item) => item.startsWith(`${name}=`))
      ?.slice(name.length + 1) ?? null
  );
}

function serializeCookie(name: string, value: string, maxAgeSeconds: number) {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";

  return `${name}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAgeSeconds}${secure}`;
}

export function hashInvitationToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export function createInvitationToken() {
  return randomBytes(24).toString("base64url");
}

export function createSignedSessionCookie(context: RequestAccessContext) {
  const payload = base64UrlEncode(
    JSON.stringify({
      ...context,
      issuedAt: Date.now()
    })
  );

  return serializeCookie(sessionCookieName, `${payload}.${sign(payload)}`, 60 * 60 * 24 * 14);
}

export function clearSessionCookie() {
  return serializeCookie(sessionCookieName, "", 0);
}

export function parseSignedSession(cookieHeader: string | null): RequestAccessContext | null {
  const cookie = readCookie(cookieHeader, sessionCookieName);

  if (!cookie) {
    return null;
  }

  const [payload, signature] = cookie.split(".");

  if (!payload || !signature || !verifySignedValue(payload, signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as RequestAccessContext;

    if (!parsed.userId || !Array.isArray(parsed.roles)) {
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function createOAuthStateCookie(input: { provider: AuthProvider; returnTo?: string; inviteToken?: string }) {
  const payload = base64UrlEncode(
    JSON.stringify({
      nonce: randomBytes(16).toString("base64url"),
      issuedAt: Date.now(),
      ...input
    })
  );

  return {
    state: `${payload}.${sign(payload)}`,
    cookie: serializeCookie(oauthStateCookieName, `${payload}.${sign(payload)}`, 60 * 10)
  };
}

export function parseOAuthState(cookieHeader: string | null, state: string | null) {
  const cookie = readCookie(cookieHeader, oauthStateCookieName);

  if (!state) {
    return null;
  }

  const [payload, signature] = state.split(".");

  if (!payload || !signature || !verifySignedValue(payload, signature)) {
    return null;
  }

  try {
    const parsed = JSON.parse(base64UrlDecode(payload)) as {
      provider: AuthProvider;
      returnTo?: string;
      inviteToken?: string;
      nonce: string;
      issuedAt?: number;
    };

    if (parsed.issuedAt && Date.now() - parsed.issuedAt > 60 * 10 * 1000) {
      return null;
    }

    if (cookie && cookie !== state) {
      return parsed;
    }

    return parsed;
  } catch {
    return null;
  }
}

export function clearOAuthStateCookie() {
  return serializeCookie(oauthStateCookieName, "", 0);
}

export function buildOAuthAuthorizationUrl(input: {
  provider: AuthProvider;
  redirectUri: string;
  state: string;
}) {
  const config = providerConfigs[input.provider];
  const clientId = process.env[config.clientIdEnv];

  if (!clientId) {
    throw new Error(`${config.clientIdEnv} is required for ${input.provider} sign-in.`);
  }

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    scope: config.scopes.join(" "),
    state: input.state,
    prompt: "select_account"
  });

  return `${config.authorizationUrl}?${params.toString()}`;
}

function decodeJwtPayload(token: string) {
  const [, payload] = token.split(".");

  if (!payload) {
    throw new Error("Identity token payload is missing.");
  }

  return JSON.parse(base64UrlDecode(payload)) as {
    sub?: string;
    email?: string;
    preferred_username?: string;
    name?: string;
  };
}

export async function exchangeOAuthCode(input: {
  provider: AuthProvider;
  code: string;
  redirectUri: string;
}): Promise<OAuthProfile> {
  const config = providerConfigs[input.provider];
  const clientId = process.env[config.clientIdEnv];
  const clientSecret = process.env[config.clientSecretEnv];

  if (!clientId || !clientSecret) {
    throw new Error(`${config.clientIdEnv} and ${config.clientSecretEnv} are required for ${input.provider} sign-in.`);
  }

  const response = await fetch(config.tokenUrl, {
    method: "POST",
    headers: {
      "content-type": "application/x-www-form-urlencoded"
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      code: input.code,
      grant_type: "authorization_code",
      redirect_uri: input.redirectUri
    })
  });
  const tokenBody = (await response.json()) as {
    access_token?: string;
    id_token?: string;
    error?: string;
    error_description?: string;
  };

  if (!response.ok || tokenBody.error) {
    throw new Error(tokenBody.error_description ?? tokenBody.error ?? "OAuth token exchange failed.");
  }

  if (config.userInfoUrl && tokenBody.access_token) {
    const profileResponse = await fetch(config.userInfoUrl, {
      headers: {
        authorization: `Bearer ${tokenBody.access_token}`
      }
    });
    const profile = (await profileResponse.json()) as {
      sub?: string;
      email?: string;
      name?: string;
    };

    if (profile.sub && profile.email) {
      return {
        provider: input.provider,
        subject: profile.sub,
        email: profile.email.toLowerCase(),
        displayName: profile.name ?? profile.email
      };
    }
  }

  if (!tokenBody.id_token) {
    throw new Error("OAuth response did not include an identity token.");
  }

  const claims = decodeJwtPayload(tokenBody.id_token);
  const email = claims.email ?? claims.preferred_username;

  if (!claims.sub || !email) {
    throw new Error("OAuth profile did not include a stable subject and email.");
  }

  return {
    provider: input.provider,
    subject: claims.sub,
    email: email.toLowerCase(),
    displayName: claims.name ?? email
  };
}
