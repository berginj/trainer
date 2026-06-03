import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import { apiErrorResponse } from "@/lib/api-response";
import { buildAccessContext } from "@/lib/app-auth";
import { createSignedSessionCookie } from "@/lib/auth-session";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { getRequestAccessContext } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";

export const runtime = "nodejs";

const guardianConsentSchema = z.object({
  organizationId: z.string().min(1),
  playerId: z.string().min(1),
  version: z.string().min(1).default("cyclones_mvp_v1")
});

export async function POST(request: NextRequest) {
  const context = getRequestAccessContext(request.headers);

  if (!context) {
    return apiErrorResponse("FORBIDDEN", "Authentication is required.", 403);
  }

  const parsed = await parseJsonWithSchema(request, guardianConsentSchema);

  if (parsed.response) {
    return parsed.response;
  }

  if (!context.roles.includes("guardian") || !context.linkedPlayerIds.includes(parsed.data.playerId)) {
    return apiErrorResponse("FORBIDDEN", "You can only grant consent for linked players.", 403);
  }

  if (!context.userOrganizationIds.includes(parsed.data.organizationId)) {
    return apiErrorResponse("FORBIDDEN", "You can only grant consent inside your linked organization.", 403);
  }

  const prisma = getPrisma();
  const player = await prisma.player.findUnique({
    where: { id: parsed.data.playerId },
    select: { organizationId: true }
  });

  if (!player || player.organizationId !== parsed.data.organizationId) {
    return apiErrorResponse("FORBIDDEN", "Consent must match the player's organization.", 403);
  }

  const consentTypes = ["readiness", "workload", "reports"] as const;
  const records = await prisma.$transaction(
    consentTypes.map((consentType) =>
      prisma.consentRecord.create({
        data: {
          organizationId: parsed.data.organizationId,
          playerId: parsed.data.playerId,
          guardianUserId: context.userId,
          consentType,
          status: "granted",
          version: parsed.data.version,
          grantedAt: new Date()
        }
      })
    )
  );

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: context.userId,
    action: "guardian_consent.granted",
    entityType: "Player",
    entityId: parsed.data.playerId,
    metadata: {
      consentTypes,
      version: parsed.data.version
    }
  });

  const refreshedContext = await buildAccessContext(prisma, context.userId);
  const response = NextResponse.json({ consentRecords: records }, { status: 201 });

  response.headers.append("set-cookie", createSignedSessionCookie(refreshedContext));

  return response;
}
