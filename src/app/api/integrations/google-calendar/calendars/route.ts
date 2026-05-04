import { NextResponse, type NextRequest } from "next/server";
import { writeAuditEvent } from "@/lib/audit";
import { requireOrganizationUserAction } from "@/lib/auth-guards";
import { getPrisma } from "@/lib/db";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { googleCalendarSelectionSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, googleCalendarSelectionSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const integration = await prisma.externalCalendarIntegration.findUnique({
    where: { id: parsed.data.integrationId }
  });

  if (!integration) {
    return NextResponse.json({ code: "NOT_FOUND", message: "Calendar integration was not found." }, { status: 404 });
  }

  const forbidden = requireOrganizationUserAction(request.headers, {
    organizationId: integration.organizationId,
    targetUserId: integration.trainerUserId
  });

  if (forbidden) {
    return forbidden;
  }

  const calendars = await Promise.all(
    parsed.data.calendars.map((calendar) =>
      prisma.externalCalendar.upsert({
        where: {
          integrationId_providerCalendarId: {
            integrationId: integration.id,
            providerCalendarId: calendar.providerCalendarId
          }
        },
        update: {
          summary: calendar.summary,
          description: calendar.description,
          timeZone: calendar.timeZone,
          selectedForSync: calendar.selectedForSync
        },
        create: {
          organizationId: integration.organizationId,
          integrationId: integration.id,
          providerCalendarId: calendar.providerCalendarId,
          summary: calendar.summary,
          description: calendar.description,
          timeZone: calendar.timeZone,
          selectedForSync: calendar.selectedForSync
        }
      })
    )
  );

  await writeAuditEvent(prisma, {
    organizationId: integration.organizationId,
    actorUserId: getRequestActorId(request.headers, integration.trainerUserId),
    action: "external_calendar.selection_updated",
    entityType: "ExternalCalendarIntegration",
    entityId: integration.id,
    metadata: { selectedCalendarCount: calendars.filter((calendar) => calendar.selectedForSync).length }
  });

  return NextResponse.json({ calendars });
}
