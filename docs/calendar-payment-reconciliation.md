# Trainer Calendar and Payment Reconciliation

## Google Calendar Setup

Create a Google OAuth client with redirect URI:

`https://<app-host>/api/integrations/google-calendar/callback`

Required environment variables:

- `GOOGLE_OAUTH_CLIENT_ID`
- `GOOGLE_OAUTH_CLIENT_SECRET`
- `GOOGLE_OAUTH_STATE_SECRET`: HMAC secret used to sign OAuth state. If omitted, `TOKEN_ENCRYPTION_KEY` is used.
- `TOKEN_ENCRYPTION_KEY`: base64-encoded 32-byte AES key used server-side only.
- `TOKEN_ENCRYPTION_KEY_VERSION`: optional label for rotation tracking.

The OAuth flow requests only:

- `https://www.googleapis.com/auth/calendar.calendarlist.readonly`
- `https://www.googleapis.com/auth/calendar.events.readonly`

These scopes are based on Google Calendar API documentation for calendar-list reads and event-list reads.

## Calendar Sync Behavior

The current implementation supports a polling/import path:

1. Trainer starts OAuth with `POST /api/integrations/google-calendar/connect`.
2. Google redirects to `GET /api/integrations/google-calendar/callback`.
3. Trainer-selected calendars are stored through `POST /api/integrations/google-calendar/calendars`.
4. Google event-shaped payloads are imported through `POST /api/integrations/google-calendar/events/import`.

Imported events preserve Google calendar ID, event ID, title, start/end time, location, description, attendee emails, Google updated timestamp, sync status, and raw metadata. Deduplication uses integration ID, Google calendar ID, and Google event ID.

Cancelled Google events update the appointment status to `cancelled`.

Future webhook extension point: add Google Calendar watch channels against selected calendars and route notifications into the same event import service. The polling/import path remains the source of normalization and dedupe behavior.

## Athlete Matching Behavior

Matching is scoped to the trainer organization.

Automatic matches are allowed only for deterministic high-confidence cases:

- Exact attendee email match against athlete/client/guardian contacts.
- Exact athlete name match in title or description when exactly one athlete matches.

Fuzzy name matching creates `recommended` matches only. Ambiguous email or name matches remain `unmatched` until trainer review.

Trainer review actions:

- Confirm match.
- Choose a different existing athlete.
- Create a new athlete from the appointment.
- Ignore appointment.

## Weather and Reschedule Workflow

`POST /api/trainer-appointments/{id}/change-notices` records cancellation or needs-reschedule history and prepares an email-first notification payload.

The payload includes:

- Appointment title.
- Original appointment date/time.
- Trainer-provided reason.
- Optional custom message.
- Optional one-off make-up availability.

There is no production email provider wired yet. Delivery status is stored as `prepared`; provider delivery should be implemented behind this notice contract.

## Venmo Import Limitations

Venmo support is CSV/log import only. The app does not scrape Venmo and does not use unofficial Venmo APIs.

Supported columns are flexible, but the parser looks for common headers:

- Date: `Date`, `Datetime`, `Transaction Date`, `Completed Date`
- Amount: `Amount`, `Total`, `Net Amount`
- Counterparty: `Name`, `Counterparty`, `From`, `To`
- Handle: `Username`, `Handle`, `Counterparty Username`
- Email: `Email`, `Counterparty Email`
- Note: `Note`, `Description`, `Memo`
- External ID: `ID`, `Transaction ID`, `External ID`

Malformed rows are rejected with row-level reasons. Raw files are not logged; the import batch stores a SHA-256 hash, filename, row count, and normalized transactions.

## Future Scheduling Extension Points

The appointment model intentionally does not implement full self-scheduling yet. Future additive models should extend the current trainer appointment boundary:

- `TrainerAvailability`
- `TrainerAvailabilityException`
- athlete scheduling requests
- trainer approval/confirmation
- available slot calculation
- conflict detection against synced Google appointments

Conflict detection should treat synced Google appointments and existing trainer appointments as busy intervals for the scoped trainer.
