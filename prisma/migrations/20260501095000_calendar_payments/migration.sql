DO $$ BEGIN
  CREATE TYPE "ExternalCalendarProvider" AS ENUM ('google');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "ExternalIntegrationStatus" AS ENUM ('pending', 'connected', 'revoked', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "CalendarEventSyncStatus" AS ENUM ('imported', 'updated', 'cancelled', 'skipped', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TrainerAppointmentSource" AS ENUM ('google_calendar', 'manual');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "TrainerAppointmentStatus" AS ENUM ('imported', 'matched', 'ignored', 'cancelled', 'needs_reschedule', 'completed');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AppointmentMatchStatus" AS ENUM ('matched', 'recommended', 'unmatched', 'ignored');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "AppointmentChangeType" AS ENUM ('cancelled', 'needs_reschedule');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "NotificationDeliveryStatus" AS ENUM ('pending', 'prepared', 'sent', 'failed', 'skipped');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentTransactionDirection" AS ENUM ('payment_received', 'payment_sent', 'expense', 'refund', 'unknown');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE "PaymentReconciliationStatus" AS ENUM ('matched', 'recommended', 'unmatched', 'ignored');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS "ExternalCalendarIntegration" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "trainerUserId" TEXT NOT NULL,
  "provider" "ExternalCalendarProvider" NOT NULL DEFAULT 'google',
  "providerAccountEmail" TEXT,
  "scopes" TEXT[],
  "status" "ExternalIntegrationStatus" NOT NULL DEFAULT 'pending',
  "accessTokenEncrypted" TEXT,
  "refreshTokenEncrypted" TEXT,
  "tokenExpiresAt" TIMESTAMP(3),
  "tokenEncryptionKeyVersion" TEXT,
  "lastSyncStartedAt" TIMESTAMP(3),
  "lastSyncCompletedAt" TIMESTAMP(3),
  "lastSyncError" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalCalendarIntegration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExternalCalendar" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "integrationId" TEXT NOT NULL,
  "providerCalendarId" TEXT NOT NULL,
  "summary" TEXT NOT NULL,
  "description" TEXT,
  "timeZone" TEXT,
  "selectedForSync" BOOLEAN NOT NULL DEFAULT false,
  "syncToken" TEXT,
  "lastSyncedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalCalendar_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "ExternalCalendarEvent" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "integrationId" TEXT NOT NULL,
  "externalCalendarId" TEXT NOT NULL,
  "googleCalendarId" TEXT NOT NULL,
  "googleEventId" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "description" TEXT,
  "attendeeEmails" TEXT[],
  "googleUpdatedAt" TIMESTAMP(3),
  "syncStatus" "CalendarEventSyncStatus" NOT NULL DEFAULT 'imported',
  "rawMetadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "ExternalCalendarEvent_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "TrainerAppointment" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "trainerUserId" TEXT NOT NULL,
  "playerId" TEXT,
  "externalCalendarEventId" TEXT,
  "source" "TrainerAppointmentSource" NOT NULL DEFAULT 'google_calendar',
  "status" "TrainerAppointmentStatus" NOT NULL DEFAULT 'imported',
  "title" TEXT NOT NULL,
  "startTime" TIMESTAMP(3) NOT NULL,
  "endTime" TIMESTAMP(3) NOT NULL,
  "location" TEXT,
  "notes" TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "TrainerAppointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AppointmentAthleteMatch" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "playerId" TEXT,
  "status" "AppointmentMatchStatus" NOT NULL,
  "confidence" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "signals" JSONB NOT NULL DEFAULT '{}',
  "confirmedByUserId" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppointmentAthleteMatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "AppointmentChangeNotice" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "appointmentId" TEXT NOT NULL,
  "actorUserId" TEXT,
  "changeType" "AppointmentChangeType" NOT NULL,
  "reason" TEXT NOT NULL,
  "customMessage" TEXT,
  "oneOffAvailability" JSONB NOT NULL DEFAULT '[]',
  "emailPayload" JSONB NOT NULL DEFAULT '{}',
  "deliveryStatus" "NotificationDeliveryStatus" NOT NULL DEFAULT 'prepared',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "AppointmentChangeNotice_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentImportBatch" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "trainerUserId" TEXT NOT NULL,
  "source" TEXT NOT NULL DEFAULT 'venmo_csv',
  "originalFileName" TEXT,
  "fileSha256" TEXT,
  "rowCount" INTEGER NOT NULL,
  "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "PaymentImportBatch_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentTransaction" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "importBatchId" TEXT NOT NULL,
  "externalTransactionId" TEXT,
  "transactionDate" TIMESTAMP(3) NOT NULL,
  "amount" DECIMAL(65,30) NOT NULL,
  "direction" "PaymentTransactionDirection" NOT NULL,
  "counterpartyName" TEXT,
  "counterpartyHandle" TEXT,
  "counterpartyEmail" TEXT,
  "note" TEXT,
  "reconciliationStatus" "PaymentReconciliationStatus" NOT NULL DEFAULT 'unmatched',
  "rawMetadata" JSONB NOT NULL DEFAULT '{}',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "PaymentAthleteMatch" (
  "id" TEXT NOT NULL,
  "organizationId" TEXT NOT NULL,
  "transactionId" TEXT NOT NULL,
  "playerId" TEXT,
  "status" "PaymentReconciliationStatus" NOT NULL,
  "confidence" INTEGER NOT NULL,
  "reason" TEXT NOT NULL,
  "signals" JSONB NOT NULL DEFAULT '{}',
  "confirmedByUserId" TEXT,
  "confirmedAt" TIMESTAMP(3),
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "PaymentAthleteMatch_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "ExternalCalendar_integrationId_providerCalendarId_key" ON "ExternalCalendar"("integrationId", "providerCalendarId");
CREATE UNIQUE INDEX IF NOT EXISTS "ExternalCalendarEvent_integrationId_googleCalendarId_googleEventId_key" ON "ExternalCalendarEvent"("integrationId", "googleCalendarId", "googleEventId");
CREATE UNIQUE INDEX IF NOT EXISTS "TrainerAppointment_externalCalendarEventId_key" ON "TrainerAppointment"("externalCalendarEventId");
CREATE UNIQUE INDEX IF NOT EXISTS "PaymentTransaction_organizationId_externalTransactionId_key" ON "PaymentTransaction"("organizationId", "externalTransactionId");

CREATE INDEX IF NOT EXISTS "ExternalCalendarIntegration_organizationId_trainerUserId_provider_status_idx" ON "ExternalCalendarIntegration"("organizationId", "trainerUserId", "provider", "status");
CREATE INDEX IF NOT EXISTS "ExternalCalendar_organizationId_selectedForSync_idx" ON "ExternalCalendar"("organizationId", "selectedForSync");
CREATE INDEX IF NOT EXISTS "ExternalCalendarEvent_organizationId_startTime_idx" ON "ExternalCalendarEvent"("organizationId", "startTime");
CREATE INDEX IF NOT EXISTS "TrainerAppointment_organizationId_trainerUserId_startTime_idx" ON "TrainerAppointment"("organizationId", "trainerUserId", "startTime");
CREATE INDEX IF NOT EXISTS "TrainerAppointment_organizationId_status_idx" ON "TrainerAppointment"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "AppointmentAthleteMatch_organizationId_status_idx" ON "AppointmentAthleteMatch"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "AppointmentAthleteMatch_appointmentId_status_idx" ON "AppointmentAthleteMatch"("appointmentId", "status");
CREATE INDEX IF NOT EXISTS "AppointmentChangeNotice_organizationId_createdAt_idx" ON "AppointmentChangeNotice"("organizationId", "createdAt");
CREATE INDEX IF NOT EXISTS "AppointmentChangeNotice_appointmentId_idx" ON "AppointmentChangeNotice"("appointmentId");
CREATE INDEX IF NOT EXISTS "PaymentImportBatch_organizationId_trainerUserId_importedAt_idx" ON "PaymentImportBatch"("organizationId", "trainerUserId", "importedAt");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_organizationId_transactionDate_idx" ON "PaymentTransaction"("organizationId", "transactionDate");
CREATE INDEX IF NOT EXISTS "PaymentTransaction_organizationId_reconciliationStatus_idx" ON "PaymentTransaction"("organizationId", "reconciliationStatus");
CREATE INDEX IF NOT EXISTS "PaymentAthleteMatch_organizationId_status_idx" ON "PaymentAthleteMatch"("organizationId", "status");
CREATE INDEX IF NOT EXISTS "PaymentAthleteMatch_transactionId_status_idx" ON "PaymentAthleteMatch"("transactionId", "status");

ALTER TABLE "ExternalCalendarIntegration" ADD CONSTRAINT "ExternalCalendarIntegration_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalCalendarIntegration" ADD CONSTRAINT "ExternalCalendarIntegration_trainerUserId_fkey" FOREIGN KEY ("trainerUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalCalendar" ADD CONSTRAINT "ExternalCalendar_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalCalendarIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalCalendar" ADD CONSTRAINT "ExternalCalendar_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalCalendarEvent" ADD CONSTRAINT "ExternalCalendarEvent_externalCalendarId_fkey" FOREIGN KEY ("externalCalendarId") REFERENCES "ExternalCalendar"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalCalendarEvent" ADD CONSTRAINT "ExternalCalendarEvent_integrationId_fkey" FOREIGN KEY ("integrationId") REFERENCES "ExternalCalendarIntegration"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ExternalCalendarEvent" ADD CONSTRAINT "ExternalCalendarEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainerAppointment" ADD CONSTRAINT "TrainerAppointment_externalCalendarEventId_fkey" FOREIGN KEY ("externalCalendarEventId") REFERENCES "ExternalCalendarEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainerAppointment" ADD CONSTRAINT "TrainerAppointment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "TrainerAppointment" ADD CONSTRAINT "TrainerAppointment_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "TrainerAppointment" ADD CONSTRAINT "TrainerAppointment_trainerUserId_fkey" FOREIGN KEY ("trainerUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentAthleteMatch" ADD CONSTRAINT "AppointmentAthleteMatch_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "TrainerAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentAthleteMatch" ADD CONSTRAINT "AppointmentAthleteMatch_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppointmentAthleteMatch" ADD CONSTRAINT "AppointmentAthleteMatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentAthleteMatch" ADD CONSTRAINT "AppointmentAthleteMatch_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppointmentChangeNotice" ADD CONSTRAINT "AppointmentChangeNotice_actorUserId_fkey" FOREIGN KEY ("actorUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "AppointmentChangeNotice" ADD CONSTRAINT "AppointmentChangeNotice_appointmentId_fkey" FOREIGN KEY ("appointmentId") REFERENCES "TrainerAppointment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "AppointmentChangeNotice" ADD CONSTRAINT "AppointmentChangeNotice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentImportBatch" ADD CONSTRAINT "PaymentImportBatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentImportBatch" ADD CONSTRAINT "PaymentImportBatch_trainerUserId_fkey" FOREIGN KEY ("trainerUserId") REFERENCES "UserProfile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_importBatchId_fkey" FOREIGN KEY ("importBatchId") REFERENCES "PaymentImportBatch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAthleteMatch" ADD CONSTRAINT "PaymentAthleteMatch_confirmedByUserId_fkey" FOREIGN KEY ("confirmedByUserId") REFERENCES "UserProfile"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentAthleteMatch" ADD CONSTRAINT "PaymentAthleteMatch_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentAthleteMatch" ADD CONSTRAINT "PaymentAthleteMatch_playerId_fkey" FOREIGN KEY ("playerId") REFERENCES "Player"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "PaymentAthleteMatch" ADD CONSTRAINT "PaymentAthleteMatch_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PaymentTransaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
