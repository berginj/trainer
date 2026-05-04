DO $$ BEGIN
  CREATE TYPE "ExternalSportsProvider" AS ENUM ('gamechanger');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SportStatImportScope" AS ENUM ('game_filtered', 'season_totals');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "SportStatImportStatus" AS ENUM ('needs_review', 'accepted', 'rejected', 'superseded');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExternalGameStatus" AS ENUM ('scheduled', 'completed', 'cancelled', 'postponed', 'unknown');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PlayerStatLineReviewStatus" AS ENUM ('matched', 'recommended', 'unmatched', 'ignored');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ExternalSportsSource" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "provider" "ExternalSportsProvider" NOT NULL DEFAULT 'gamechanger',
  "sourceName" TEXT NOT NULL,
  "sport" "Sport",
  "status" "ExternalIntegrationStatus" NOT NULL DEFAULT 'connected',
  "rawMetadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalSportsSource_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExternalTeamIdentity" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "externalTeamId" TEXT,
  "providerTeamName" TEXT NOT NULL,
  "sport" "Sport" NOT NULL,
  "rawMetadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalTeamIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExternalPlayerIdentity" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sourceId" TEXT NOT NULL,
  "teamId" TEXT,
  "playerId" TEXT,
  "externalPlayerName" TEXT NOT NULL,
  "normalizedExternalName" TEXT NOT NULL,
  "jerseyNumber" TEXT,
  "aliases" TEXT[],
  "rawMetadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalPlayerIdentity_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExternalGame" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sourceId" TEXT,
  "teamId" TEXT NOT NULL,
  "externalCalendarEventId" TEXT,
  "dedupeKey" TEXT,
  "sport" "Sport" NOT NULL,
  "opponentName" TEXT,
  "gameDate" TIMESTAMP(3),
  "startTime" TIMESTAMP(3),
  "status" "ExternalGameStatus" NOT NULL DEFAULT 'unknown',
  "sourceLabel" TEXT,
  "rawMetadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalGame_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "SportStatImportBatch" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "sourceId" TEXT,
  "teamId" TEXT NOT NULL,
  "externalGameId" TEXT,
  "importedByUserId" TEXT,
  "sport" "Sport" NOT NULL,
  "importScope" "SportStatImportScope" NOT NULL,
  "status" "SportStatImportStatus" NOT NULL DEFAULT 'needs_review',
  "originalFileName" TEXT,
  "fileSha256" TEXT NOT NULL,
  "dedupeKey" TEXT NOT NULL,
  "rowCount" INTEGER NOT NULL,
  "rejectedRowCount" INTEGER NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "rawMetadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "SportStatImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlayerGameStatLine" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "importBatchId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "externalGameId" TEXT,
  "playerId" TEXT,
  "rowNumber" INTEGER NOT NULL,
  "externalPlayerName" TEXT NOT NULL,
  "normalizedExternalPlayerName" TEXT NOT NULL,
  "jerseyNumber" TEXT,
  "matchStatus" "PlayerStatLineReviewStatus" NOT NULL DEFAULT 'unmatched',
  "confidence" INTEGER NOT NULL,
  "matchReason" TEXT NOT NULL,
  "stats" JSONB NOT NULL DEFAULT '{}',
  "rawMetadata" JSONB NOT NULL DEFAULT '{}',
  "confirmedByUserId" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlayerGameStatLine_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PlayerSeasonStatSnapshot" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "importBatchId" TEXT NOT NULL,
  "teamId" TEXT NOT NULL,
  "playerId" TEXT,
  "rowNumber" INTEGER NOT NULL,
  "externalPlayerName" TEXT NOT NULL,
  "normalizedExternalPlayerName" TEXT NOT NULL,
  "jerseyNumber" TEXT,
  "stats" JSONB NOT NULL DEFAULT '{}',
  "rawMetadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PlayerSeasonStatSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExternalSportsSource_organizationId_provider_sourceName_key" ON "ExternalSportsSource"("organizationId", "provider", "sourceName");
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalTeamIdentity_sourceId_teamId_key" ON "ExternalTeamIdentity"("sourceId", "teamId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalTeamIdentity_sourceId_externalTeamId_key" ON "ExternalTeamIdentity"("sourceId", "externalTeamId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalGame_dedupeKey_key" ON "ExternalGame"("dedupeKey");
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalGame_organizationId_teamId_externalCalendarEventId_key" ON "ExternalGame"("organizationId", "teamId", "externalCalendarEventId");
CREATE UNIQUE INDEX IF NOT EXISTS "SportStatImportBatch_organizationId_dedupeKey_key" ON "SportStatImportBatch"("organizationId", "dedupeKey");
CREATE UNIQUE INDEX IF NOT EXISTS "PlayerGameStatLine_importBatchId_rowNumber_key" ON "PlayerGameStatLine"("importBatchId", "rowNumber");
CREATE UNIQUE INDEX IF NOT EXISTS "PlayerSeasonStatSnapshot_importBatchId_rowNumber_key" ON "PlayerSeasonStatSnapshot"("importBatchId", "rowNumber");

CREATE INDEX IF NOT EXISTS "ExternalSportsSource_organizationId_provider_status_idx" ON "ExternalSportsSource"("organizationId", "provider", "status");
CREATE INDEX IF NOT EXISTS "ExternalTeamIdentity_organizationId_sport_idx" ON "ExternalTeamIdentity"("organizationId", "sport");
CREATE INDEX IF NOT EXISTS "ExternalPlayerIdentity_organizationId_playerId_idx" ON "ExternalPlayerIdentity"("organizationId", "playerId");
CREATE INDEX IF NOT EXISTS "ExternalPlayerIdentity_sourceId_teamId_normalizedExternalName_idx" ON "ExternalPlayerIdentity"("sourceId", "teamId", "normalizedExternalName");
CREATE INDEX IF NOT EXISTS "ExternalGame_organizationId_teamId_gameDate_idx" ON "ExternalGame"("organizationId", "teamId", "gameDate");
CREATE INDEX IF NOT EXISTS "ExternalGame_organizationId_status_idx" ON "ExternalGame"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "SportStatImportBatch_organizationId_teamId_status_idx" ON "SportStatImportBatch"("organizationId", "teamId", "status");
CREATE INDEX IF NOT EXISTS "SportStatImportBatch_organizationId_importedAt_idx" ON "SportStatImportBatch"("organizationId", "importedAt");
CREATE INDEX IF NOT EXISTS "PlayerGameStatLine_organizationId_teamId_matchStatus_idx" ON "PlayerGameStatLine"("organizationId", "teamId", "matchStatus");
CREATE INDEX IF NOT EXISTS "PlayerGameStatLine_organizationId_playerId_idx" ON "PlayerGameStatLine"("organizationId", "playerId");
CREATE INDEX IF NOT EXISTS "PlayerSeasonStatSnapshot_organizationId_teamId_createdAt_idx" ON "PlayerSeasonStatSnapshot"("organizationId", "teamId", "createdAt");
CREATE INDEX IF NOT EXISTS "PlayerSeasonStatSnapshot_organizationId_playerId_idx" ON "PlayerSeasonStatSnapshot"("organizationId", "playerId");

ALTER TABLE "ExternalSportsSource" ADD CONSTRAINT "ExternalSportsSource_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalTeamIdentity" ADD CONSTRAINT "ExternalTeamIdentity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalTeamIdentity" ADD CONSTRAINT "ExternalTeamIdentity_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ExternalSportsSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalTeamIdentity" ADD CONSTRAINT "ExternalTeamIdentity_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalPlayerIdentity" ADD CONSTRAINT "ExternalPlayerIdentity_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalPlayerIdentity" ADD CONSTRAINT "ExternalPlayerIdentity_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalPlayerIdentity" ADD CONSTRAINT "ExternalPlayerIdentity_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ExternalSportsSource"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalPlayerIdentity" ADD CONSTRAINT "ExternalPlayerIdentity_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalGame" ADD CONSTRAINT "ExternalGame_externalCalendarEventId_fkey" FOREIGN KEY ("externalCalendarEventId") REFERENCES "ExternalCalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalGame" ADD CONSTRAINT "ExternalGame_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalGame" ADD CONSTRAINT "ExternalGame_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ExternalSportsSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ExternalGame" ADD CONSTRAINT "ExternalGame_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SportStatImportBatch" ADD CONSTRAINT "SportStatImportBatch_externalGameId_fkey" FOREIGN KEY ("externalGameId") REFERENCES "ExternalGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SportStatImportBatch" ADD CONSTRAINT "SportStatImportBatch_importedByUserId_fkey" FOREIGN KEY ("importedByUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SportStatImportBatch" ADD CONSTRAINT "SportStatImportBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SportStatImportBatch" ADD CONSTRAINT "SportStatImportBatch_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "ExternalSportsSource"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "SportStatImportBatch" ADD CONSTRAINT "SportStatImportBatch_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerGameStatLine" ADD CONSTRAINT "PlayerGameStatLine_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlayerGameStatLine" ADD CONSTRAINT "PlayerGameStatLine_externalGameId_fkey" FOREIGN KEY ("externalGameId") REFERENCES "ExternalGame"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlayerGameStatLine" ADD CONSTRAINT "PlayerGameStatLine_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "SportStatImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerGameStatLine" ADD CONSTRAINT "PlayerGameStatLine_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerGameStatLine" ADD CONSTRAINT "PlayerGameStatLine_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlayerGameStatLine" ADD CONSTRAINT "PlayerGameStatLine_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerSeasonStatSnapshot" ADD CONSTRAINT "PlayerSeasonStatSnapshot_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "SportStatImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerSeasonStatSnapshot" ADD CONSTRAINT "PlayerSeasonStatSnapshot_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PlayerSeasonStatSnapshot" ADD CONSTRAINT "PlayerSeasonStatSnapshot_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PlayerSeasonStatSnapshot" ADD CONSTRAINT "PlayerSeasonStatSnapshot_teamId_fkey" FOREIGN KEY ("teamId") REFERENCES "Team"("id") ON DELETE CASCADE ON UPDATE CASCADE;
