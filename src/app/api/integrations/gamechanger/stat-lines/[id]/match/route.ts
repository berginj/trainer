import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiErrorResponse } from "@/lib/api-response";
import { requireTeamEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { normalizeGameChangerIdentity } from "@/lib/gamechanger-import";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { gameChangerStatLineMatchUpdateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const parsed = await parseJsonWithSchema(request, gameChangerStatLineMatchUpdateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  if (parsed.data.status === "matched" && !parsed.data.playerId) {
    return apiErrorResponse("VALIDATION_FAILED", "playerId is required to confirm a stat-line match.", 400);
  }

  const prisma = getPrisma();
  const statLine = await prisma.playerGameStatLine.findUnique({
    where: { id },
    include: {
      importBatch: true
    }
  });

  if (!statLine) {
    return apiErrorResponse("NOT_FOUND", "GameChanger stat line was not found.", 404);
  }

  const forbidden = requireTeamEntryAccess(request.headers, {
    organizationId: statLine.organizationId,
    teamId: statLine.teamId
  });

  if (forbidden) {
    return forbidden;
  }

  if (parsed.data.status === "matched") {
    const player = await prisma.player.findFirst({
      where: {
        id: parsed.data.playerId,
        organizationId: statLine.organizationId,
        teamPlayers: {
          some: {
            teamId: statLine.teamId,
            status: "active"
          }
        }
      }
    });

    if (!player) {
      return apiErrorResponse("NOT_FOUND", "Player was not found on this active team roster.", 404);
    }
  }

  const actorUserId = getRequestActorId(request.headers, parsed.data.actorUserId);
  const updatedLine = await prisma.playerGameStatLine.update({
    where: { id: statLine.id },
    data: {
      playerId: parsed.data.status === "matched" ? parsed.data.playerId : null,
      matchStatus: parsed.data.status,
      confidence: parsed.data.status === "matched" ? 100 : 0,
      matchReason:
        parsed.data.status === "matched"
          ? "Staff confirmed the GameChanger player match."
          : "Staff ignored this GameChanger stat line.",
      confirmedByUserId: actorUserId,
      confirmedAt: new Date(),
      rawMetadata: {
        ...(statLine.rawMetadata as Record<string, unknown>),
        review: {
          source: "staff_review",
          status: parsed.data.status
        }
      } as Prisma.InputJsonValue
    },
    include: { player: true, importBatch: true }
  });

  if (parsed.data.status === "matched" && parsed.data.playerId && statLine.importBatch.sourceId) {
    const normalizedExternalName = normalizeGameChangerIdentity(statLine.externalPlayerName);
    const existingIdentity = await prisma.externalPlayerIdentity.findFirst({
      where: {
        sourceId: statLine.importBatch.sourceId,
        teamId: statLine.teamId,
        normalizedExternalName,
        jerseyNumber: statLine.jerseyNumber
      }
    });

    if (existingIdentity) {
      await prisma.externalPlayerIdentity.update({
        where: { id: existingIdentity.id },
        data: {
          playerId: parsed.data.playerId,
          externalPlayerName: statLine.externalPlayerName,
          aliases: [...new Set([...existingIdentity.aliases, statLine.externalPlayerName])]
        }
      });
    } else {
      await prisma.externalPlayerIdentity.create({
        data: {
          organizationId: statLine.organizationId,
          sourceId: statLine.importBatch.sourceId,
          teamId: statLine.teamId,
          playerId: parsed.data.playerId,
          externalPlayerName: statLine.externalPlayerName,
          normalizedExternalName,
          jerseyNumber: statLine.jerseyNumber,
          aliases: [statLine.externalPlayerName],
          rawMetadata: {
            source: "staff_review"
          }
        }
      });
    }
  }

  const unresolvedLineCount = await prisma.playerGameStatLine.count({
    where: {
      importBatchId: statLine.importBatchId,
      matchStatus: { in: ["recommended", "unmatched"] }
    }
  });

  if (unresolvedLineCount === 0 && statLine.importBatch.rejectedRowCount === 0) {
    await prisma.sportStatImportBatch.update({
      where: { id: statLine.importBatchId },
      data: { status: "accepted" }
    });
  }

  await writeAuditEvent(prisma, {
    organizationId: statLine.organizationId,
    actorUserId,
    action: parsed.data.status === "matched" ? "gamechanger_stat_line.match_confirmed" : "gamechanger_stat_line.ignored",
    entityType: "PlayerGameStatLine",
    entityId: statLine.id,
    metadata: {
      importBatchId: statLine.importBatchId,
      playerId: parsed.data.playerId ?? null
    }
  });

  return NextResponse.json({ statLine: updatedLine });
}
