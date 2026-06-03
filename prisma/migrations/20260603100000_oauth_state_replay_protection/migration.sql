CREATE TABLE IF NOT EXISTS "OAuthState" (
  "id" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "stateHash" TEXT NOT NULL,
  "organizationId" TEXT,
  "trainerUserId" TEXT,
  "expiresAt" TIMESTAMP(3) NOT NULL,
  "consumedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "OAuthState_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "OAuthState_stateHash_key" ON "OAuthState"("stateHash");
CREATE INDEX IF NOT EXISTS "OAuthState_provider_organizationId_trainerUserId_consumedAt_idx" ON "OAuthState"("provider", "organizationId", "trainerUserId", "consumedAt");
CREATE INDEX IF NOT EXISTS "OAuthState_expiresAt_idx" ON "OAuthState"("expiresAt");
