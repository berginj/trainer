import { NextResponse, type NextRequest } from "next/server";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { teamPlayerCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, teamPlayerCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const team = await prisma.team.findUnique({
    where: { id: parsed.data.teamId }
  });
  const teamPlayer = await prisma.teamPlayer.upsert({
    where: {
      teamId_playerId: parsed.data
    },
    create: parsed.data,
    update: {
      status: "active"
    }
  });

  await writeAuditEvent(prisma, {
    organizationId: team?.organizationId ?? null,
    action: "team_player.assigned",
    entityType: "TeamPlayer",
    entityId: teamPlayer.id,
    metadata: parsed.data
  });

  return NextResponse.json({ teamPlayer }, { status: 201 });
}
