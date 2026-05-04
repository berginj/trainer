import { NextResponse, type NextRequest } from "next/server";
import { apiErrorResponse } from "@/lib/api-response";
import { requireTeamEntryAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import {
  gameChangerImportDedupeKey,
  parseGameChangerStatsCsv,
  recommendGameChangerPlayerMatch
} from "@/lib/gamechanger-import";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { gameChangerStatsPreviewSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, gameChangerStatsPreviewSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const forbidden = requireTeamEntryAccess(request.headers, {
    organizationId: parsed.data.organizationId,
    teamId: parsed.data.teamId
  });

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const team = await prisma.team.findFirst({
    where: {
      id: parsed.data.teamId,
      organizationId: parsed.data.organizationId
    },
    include: {
      teamPlayers: {
        where: { status: "active" },
        include: { player: true }
      }
    }
  });

  if (!team) {
    return apiErrorResponse("NOT_FOUND", "Team was not found for this organization.", 404);
  }

  if (team.sport !== parsed.data.sport) {
    return apiErrorResponse("VALIDATION_FAILED", "Import sport must match the team sport.", 400);
  }

  const parsedCsv = parseGameChangerStatsCsv(parsed.data.csv, {
    sport: parsed.data.sport,
    importScope: parsed.data.importScope
  });
  const matchablePlayers = team.teamPlayers.map(({ player }) => ({
    id: player.id,
    preferredName: player.preferredName
  }));
  const recommendations = parsedCsv.statLines.map((statLine) => ({
    rowNumber: statLine.rowNumber,
    externalPlayerName: statLine.externalPlayerName,
    jerseyNumber: statLine.jerseyNumber,
    recommendation: recommendGameChangerPlayerMatch(statLine, matchablePlayers)
  }));
  const dedupeKey = gameChangerImportDedupeKey({
    organizationId: parsed.data.organizationId,
    teamId: parsed.data.teamId,
    sport: parsed.data.sport,
    importScope: parsed.data.importScope,
    gameDate: parsed.data.gameDate,
    fileSha256: parsedCsv.fileSha256
  });

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId: getRequestActorId(request.headers),
    action: "gamechanger_stats.previewed",
    entityType: "Team",
    entityId: team.id,
    metadata: {
      sport: parsed.data.sport,
      importScope: parsed.data.importScope,
      originalFileName: parsed.data.originalFileName ?? null,
      fileSha256: parsedCsv.fileSha256,
      statLineCount: parsedCsv.statLines.length,
      rejectedRowCount: parsedCsv.rejectedRows.length,
      dedupeKey
    }
  });

  return NextResponse.json({
    fileSha256: parsedCsv.fileSha256,
    dedupeKey,
    headers: parsedCsv.headers,
    playerNameColumn: parsedCsv.playerNameColumn,
    jerseyNumberColumn: parsedCsv.jerseyNumberColumn,
    metricColumns: parsedCsv.metricColumns,
    statLines: parsedCsv.statLines,
    recommendations,
    rejectedRows: parsedCsv.rejectedRows
  });
}
