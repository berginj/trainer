import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { writeAuditEvent } from "@/lib/audit";
import { recommendAppointmentAthleteMatch } from "@/lib/appointment-matching";
import { requireOrganizationUserAction } from "@/lib/auth-guards";
import { normalizeGoogleCalendarEvent, type GoogleCalendarEventInput } from "@/lib/calendar-sync";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { googleCalendarEventImportSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, googleCalendarEventImportSchema);

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

  const prisma = getPrisma();
  const actorUserId = getRequestActorId(request.headers, parsed.data.trainerUserId);
  const integration = await prisma.externalCalendarIntegration.findFirst({
    where: {
      id: parsed.data.integrationId,
      organizationId: parsed.data.organizationId,
      trainerUserId: parsed.data.trainerUserId
    }
  });

  if (!integration) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Calendar integration was not found." }, { status: 404 });
  }

  const calendar = await prisma.externalCalendar.upsert({
    where: {
      integrationId_providerCalendarId: {
        integrationId: integration.id,
        providerCalendarId: parsed.data.calendarId
      }
    },
    update: { selectedForSync: true },
    create: {
      organizationId: parsed.data.organizationId,
      integrationId: integration.id,
      providerCalendarId: parsed.data.calendarId,
      summary: parsed.data.calendarId,
      selectedForSync: true
    }
  });

  const players = await prisma.player.findMany({
    where: { organizationId: parsed.data.organizationId, activeStatus: "active" },
    include: { guardianLinks: { include: { guardian: true } } }
  });
  const matchablePlayers = players.map((player) => ({
    id: player.id,
    preferredName: player.preferredName,
    guardianEmails: player.guardianLinks.map((link) => link.guardian.email)
  }));

  let imported = 0;
  let cancelled = 0;
  let skipped = 0;

  for (const rawEvent of parsed.data.events) {
    const normalized = normalizeGoogleCalendarEvent(parsed.data.calendarId, rawEvent as GoogleCalendarEventInput);

    if (!normalized) {
      skipped += 1;
      continue;
    }

    const externalEvent = await prisma.externalCalendarEvent.upsert({
      where: {
        integrationId_googleCalendarId_googleEventId: {
          integrationId: integration.id,
          googleCalendarId: normalized.googleCalendarId,
          googleEventId: normalized.googleEventId
        }
      },
      update: {
        title: normalized.title,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        location: normalized.location,
        description: normalized.description,
        attendeeEmails: normalized.attendeeEmails,
        googleUpdatedAt: normalized.googleUpdatedAt,
        syncStatus: normalized.syncStatus,
        rawMetadata: normalized.rawMetadata as Prisma.InputJsonValue
      },
      create: {
        organizationId: parsed.data.organizationId,
        integrationId: integration.id,
        externalCalendarId: calendar.id,
        googleCalendarId: normalized.googleCalendarId,
        googleEventId: normalized.googleEventId,
        title: normalized.title,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        location: normalized.location,
        description: normalized.description,
        attendeeEmails: normalized.attendeeEmails,
        googleUpdatedAt: normalized.googleUpdatedAt,
        syncStatus: normalized.syncStatus,
        rawMetadata: normalized.rawMetadata as Prisma.InputJsonValue
      }
    });

    const appointment = await prisma.trainerAppointment.upsert({
      where: { externalCalendarEventId: externalEvent.id },
      update: {
        title: normalized.title,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        location: normalized.location,
        notes: normalized.description,
        status: normalized.syncStatus === "cancelled" ? "cancelled" : undefined
      },
      create: {
        organizationId: parsed.data.organizationId,
        trainerUserId: parsed.data.trainerUserId,
        externalCalendarEventId: externalEvent.id,
        source: "google_calendar",
        status: normalized.syncStatus === "cancelled" ? "cancelled" : "imported",
        title: normalized.title,
        startTime: normalized.startTime,
        endTime: normalized.endTime,
        location: normalized.location,
        notes: normalized.description
      }
    });

    if (normalized.syncStatus === "cancelled") {
      cancelled += 1;
      continue;
    }

    const recommendation = recommendAppointmentAthleteMatch(
      {
        title: normalized.title,
        description: normalized.description,
        attendeeEmails: normalized.attendeeEmails
      },
      matchablePlayers
    );

    await prisma.appointmentAthleteMatch.create({
      data: {
        organizationId: parsed.data.organizationId,
        appointmentId: appointment.id,
        playerId: recommendation.playerId,
        status: recommendation.status,
        confidence: recommendation.confidence,
        reason: recommendation.reason,
        signals: recommendation.signals as Prisma.InputJsonValue
      }
    });

    if (recommendation.status === "matched" && recommendation.playerId) {
      await prisma.trainerAppointment.update({
        where: { id: appointment.id },
        data: {
          playerId: recommendation.playerId,
          status: "matched"
        }
      });
    }

    imported += 1;
  }

  await prisma.externalCalendar.update({
    where: { id: calendar.id },
    data: { lastSyncedAt: new Date() }
  });
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "external_calendar.events_imported",
    entityType: "ExternalCalendar",
    entityId: calendar.id,
    metadata: { imported, cancelled, skipped }
  });

  return NextResponse.json({ imported, cancelled, skipped });
}
