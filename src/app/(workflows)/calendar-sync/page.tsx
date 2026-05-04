import { ApiForm } from "../_components/api-form";
import { WorkflowPage } from "../_components/workflow-page";

export default function CalendarSyncPage() {
  return (
    <WorkflowPage
      apiRoutes={[
        "POST /api/integrations/google-calendar/connect",
        "GET /api/integrations/google-calendar/callback",
        "POST /api/integrations/google-calendar/calendars",
        "POST /api/integrations/google-calendar/events/import"
      ]}
      doneItems={[
        "OAuth uses read-only Google Calendar scopes and never exposes tokens to the browser.",
        "Selected calendars are tenant-scoped to the trainer and organization.",
        "Imported Google events are deduplicated by integration, calendar ID, and event ID."
      ]}
      eyebrow="Trainer onboarding"
      primaryItems={[
        "Connect Google Calendar with least-privilege read-only scopes.",
        "Select calendars that should be included in appointment ingestion.",
        "Import event metadata, attendee emails, timestamps, and cancellation status.",
        "Run deterministic athlete matching and queue ambiguous events for trainer review."
      ]}
      summary="Calendar sync turns existing trainer Google Calendar appointments into reviewable trainer appointments without replacing the trainer's current scheduling workflow."
      title="Google Calendar Sync"
    >
      <div className="grid gap-6 lg:grid-cols-2">
        <ApiForm
          description="Returns a Google OAuth URL. Configure GOOGLE_OAUTH_CLIENT_ID and TOKEN_ENCRYPTION_KEY before completing callback token storage."
          endpoint="/api/integrations/google-calendar/connect"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "trainerUserId", label: "Trainer user ID", required: true },
            { name: "redirectUri", label: "OAuth redirect URI", required: true }
          ]}
          title="Start Google connection"
        />
        <ApiForm
          description="Stores the trainer's selected calendars after Google calendar-list discovery."
          endpoint="/api/integrations/google-calendar/calendars"
          fields={[
            { name: "integrationId", label: "Integration ID", required: true },
            {
              name: "calendars",
              label: "Calendars JSON",
              type: "textarea",
              json: true,
              required: true,
              defaultValue:
                '[{"providerCalendarId":"primary","summary":"Primary calendar","selectedForSync":true}]'
            }
          ]}
          title="Select calendars"
        />
        <ApiForm
          description="Imports Google event-shaped JSON for polling-based sync while webhook support remains a documented extension point."
          endpoint="/api/integrations/google-calendar/events/import"
          fields={[
            { name: "organizationId", label: "Organization ID", required: true },
            { name: "trainerUserId", label: "Trainer user ID", required: true },
            { name: "integrationId", label: "Integration ID", required: true },
            { name: "calendarId", label: "Google calendar ID", required: true },
            {
              name: "events",
              label: "Events JSON",
              type: "textarea",
              json: true,
              required: true,
              defaultValue:
                '[{"id":"evt_1","summary":"Training with Alex","start":{"dateTime":"2026-05-04T15:00:00Z"},"end":{"dateTime":"2026-05-04T16:00:00Z"},"attendees":[{"email":"guardian@example.com"}]}]'
            }
          ]}
          title="Import events"
        />
      </div>
    </WorkflowPage>
  );
}
