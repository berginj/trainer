import { NextResponse, type NextRequest } from "next/server";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { guardianCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, guardianCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const guardian = await prisma.userProfile.upsert({
    where: {
      externalIdentityId: parsed.data.externalIdentityId
    },
    create: {
      externalIdentityId: parsed.data.externalIdentityId,
      email: parsed.data.email,
      displayName: parsed.data.displayName,
      memberships: {
        create: {
          organizationId: parsed.data.organizationId,
          role: "guardian"
        }
      }
    },
    update: {
      email: parsed.data.email,
      displayName: parsed.data.displayName
    }
  });

  await prisma.organizationMembership.upsert({
    where: {
      organizationId_userId_role: {
        organizationId: parsed.data.organizationId,
        userId: guardian.id,
        role: "guardian"
      }
    },
    create: {
      organizationId: parsed.data.organizationId,
      userId: guardian.id,
      role: "guardian"
    },
    update: {
      status: "active"
    }
  });

  if (parsed.data.playerId) {
    await prisma.guardianPlayerLink.upsert({
      where: {
        guardianUserId_playerId: {
          guardianUserId: guardian.id,
          playerId: parsed.data.playerId
        }
      },
      create: {
        guardianUserId: guardian.id,
        playerId: parsed.data.playerId,
        relationship: parsed.data.relationship
      },
      update: {
        relationship: parsed.data.relationship,
        status: "active"
      }
    });
  }
  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    action: "guardian.upserted",
    entityType: "UserProfile",
    entityId: guardian.id,
    metadata: {
      linkedPlayerId: parsed.data.playerId ?? null
    }
  });

  return NextResponse.json({ guardian }, { status: 201 });
}
