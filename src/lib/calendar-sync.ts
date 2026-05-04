export type GoogleCalendarEventInput = {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  updated?: string;
  start?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  end?: {
    dateTime?: string;
    date?: string;
    timeZone?: string;
  };
  attendees?: Array<{
    email?: string;
  }>;
};

export type NormalizedCalendarEvent = {
  googleCalendarId: string;
  googleEventId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  location: string | null;
  description: string | null;
  attendeeEmails: string[];
  googleUpdatedAt: Date | null;
  syncStatus: "imported" | "cancelled" | "skipped";
  rawMetadata: GoogleCalendarEventInput;
};

function parseGoogleDate(value: string | undefined) {
  if (!value) {
    return null;
  }

  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

export function normalizeGoogleCalendarEvent(
  calendarId: string,
  event: GoogleCalendarEventInput
): NormalizedCalendarEvent | null {
  if (!event.id) {
    return null;
  }

  const startTime = parseGoogleDate(event.start?.dateTime ?? event.start?.date);
  const endTime = parseGoogleDate(event.end?.dateTime ?? event.end?.date);

  if (!startTime || !endTime) {
    return null;
  }

  const attendeeEmails = (event.attendees ?? [])
    .map((attendee) => attendee.email?.trim().toLowerCase())
    .filter((email): email is string => Boolean(email));

  return {
    googleCalendarId: calendarId,
    googleEventId: event.id,
    title: event.summary?.trim() || "Untitled calendar event",
    startTime,
    endTime,
    location: event.location?.trim() || null,
    description: event.description?.trim() || null,
    attendeeEmails: [...new Set(attendeeEmails)],
    googleUpdatedAt: parseGoogleDate(event.updated),
    syncStatus: event.status === "cancelled" ? "cancelled" : "imported",
    rawMetadata: event
  };
}

export function googleEventDedupeKey(integrationId: string, calendarId: string, eventId: string) {
  return `${integrationId}:${calendarId}:${eventId}`;
}

