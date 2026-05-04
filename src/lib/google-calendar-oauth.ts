import { createCipheriv, createDecipheriv, createHmac, randomBytes, randomUUID, timingSafeEqual } from "crypto";

export const GOOGLE_CALENDAR_SCOPES = [
  "https://www.googleapis.com/auth/calendar.calendarlist.readonly",
  "https://www.googleapis.com/auth/calendar.events.readonly"
] as const;

type GoogleTokenResponse = {
  access_token?: string;
  refresh_token?: string;
  expires_in?: number;
  scope?: string;
  token_type?: string;
  error?: string;
  error_description?: string;
};

function base64UrlEncode(value: string) {
  return Buffer.from(value).toString("base64url");
}

function stateSigningSecret() {
  const secret = process.env.GOOGLE_OAUTH_STATE_SECRET ?? process.env.TOKEN_ENCRYPTION_KEY;

  if (!secret) {
    throw new Error("GOOGLE_OAUTH_STATE_SECRET or TOKEN_ENCRYPTION_KEY is required before Google OAuth can start.");
  }

  return secret;
}

function signStatePayload(payload: string) {
  return createHmac("sha256", stateSigningSecret()).update(payload).digest("base64url");
}

function encodeSignedState(payload: Record<string, unknown>) {
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  return `${encodedPayload}.${signStatePayload(encodedPayload)}`;
}

function verifySignedState(state: string) {
  const [encodedPayload, signature] = state.split(".");

  if (!encodedPayload || !signature) {
    throw new Error("Google OAuth state is malformed.");
  }

  const expectedSignature = signStatePayload(encodedPayload);
  const signatureBuffer = Buffer.from(signature, "base64url");
  const expectedBuffer = Buffer.from(expectedSignature, "base64url");

  if (signatureBuffer.length !== expectedBuffer.length || !timingSafeEqual(signatureBuffer, expectedBuffer)) {
    throw new Error("Google OAuth state signature is invalid.");
  }

  return JSON.parse(Buffer.from(encodedPayload, "base64url").toString("utf8")) as Record<string, unknown>;
}

function encryptionKey() {
  const raw = process.env.TOKEN_ENCRYPTION_KEY;

  if (!raw) {
    throw new Error("TOKEN_ENCRYPTION_KEY is required before Google OAuth tokens can be stored.");
  }

  const decoded = Buffer.from(raw, "base64");

  if (decoded.length !== 32) {
    throw new Error("TOKEN_ENCRYPTION_KEY must be a base64-encoded 32-byte key.");
  }

  return decoded;
}

export function encryptSecret(value: string) {
  const iv = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), iv);
  const ciphertext = Buffer.concat([cipher.update(value, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return `${iv.toString("base64")}.${tag.toString("base64")}.${ciphertext.toString("base64")}`;
}

export function decryptSecret(value: string) {
  const [ivRaw, tagRaw, ciphertextRaw] = value.split(".");

  if (!ivRaw || !tagRaw || !ciphertextRaw) {
    throw new Error("Encrypted secret payload is malformed.");
  }

  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), Buffer.from(ivRaw, "base64"));
  decipher.setAuthTag(Buffer.from(tagRaw, "base64"));
  return Buffer.concat([decipher.update(Buffer.from(ciphertextRaw, "base64")), decipher.final()]).toString("utf8");
}

export function buildGoogleCalendarAuthUrl(input: {
  organizationId: string;
  trainerUserId: string;
  redirectUri: string;
}) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;

  if (!clientId) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID is required.");
  }

  const state = encodeSignedState({
    organizationId: input.organizationId,
    trainerUserId: input.trainerUserId,
    nonce: randomUUID()
  });
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: input.redirectUri,
    response_type: "code",
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    scope: GOOGLE_CALENDAR_SCOPES.join(" "),
    state
  });

  return {
    authUrl: `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`,
    state
  };
}

export function decodeGoogleCalendarState(state: string) {
  const parsed = verifySignedState(state) as {
    organizationId?: string;
    trainerUserId?: string;
  };

  if (!parsed.organizationId || !parsed.trainerUserId) {
    throw new Error("Google OAuth state is missing organization or trainer scope.");
  }

  return {
    organizationId: parsed.organizationId,
    trainerUserId: parsed.trainerUserId
  };
}

export async function exchangeGoogleCalendarCode(input: { code: string; redirectUri: string }) {
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("GOOGLE_OAUTH_CLIENT_ID and GOOGLE_OAUTH_CLIENT_SECRET are required.");
  }

  const response = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri,
      grant_type: "authorization_code"
    })
  });
  const body = (await response.json()) as GoogleTokenResponse;

  if (!response.ok || body.error) {
    throw new Error(body.error_description ?? body.error ?? "Google OAuth token exchange failed.");
  }

  if (!body.access_token) {
    throw new Error("Google OAuth token response did not include an access token.");
  }

  return {
    accessToken: body.access_token,
    refreshToken: body.refresh_token,
    scopes: body.scope?.split(" ").filter(Boolean) ?? [...GOOGLE_CALENDAR_SCOPES],
    tokenExpiresAt: body.expires_in ? new Date(Date.now() + body.expires_in * 1000) : null
  };
}
