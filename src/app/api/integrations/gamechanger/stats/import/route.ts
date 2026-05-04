import { NextResponse, type NextRequest } from "next/server";
import type { Prisma } from "@prisma/client";
import { apiErrorResponse } from "@/lib/api-response";
import { requireTeamEntryAccess, requireTenantAccess } from "@/lib/auth-guards";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import {
  gameChangerImportDedupeKey,
  normalizeGameChangerIdentity,
  parseGameChangerStatsCsv,
  recommendGameChangerPlayerMatch
} from "@/lib/gamechanger-import";
import { getRequestActorId } from "@/lib/request-auth";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { gameChangerStatsImportSchema } from "@/lib/validation";

export const runtime = "nodejs";

function defaultSourceName(teamName: string, teamId: string) {
  return `GameChanger: ${teamName} (${teamId})`;
}

function gameDedupeKey(organizationId: string, teamId: string, gameDate: Date | undefined) {
  if (!gameDate) {
    return null;
  }

  return `${organizationId}:${teamId}:gamechanger:${gameDate.toISOString().slice(0, 10)}`;
}

export async function GET(request: NextRequest) {
  const organizationId = request.nextUrl.searchParams.get("organizationId");
  const teamId = request.nextUrl.searchParams.get("teamId") ?? undefined;
  const status = request.nextUrl.searchParams.get("status") ?? undefined;

  if (!organizationId) {
    return apiErrorResponse("VALIDATION_FAILED", "organizationId is required.", 400);
  }

  const forbidden = requireTenantAccess(request.headers, organizationId);

  if (forbidden) {
    return forbidden;
  }

  const prisma = getPrisma();
  const imports = await prisma.sportStatImportBatch.findMany({
    where: {
      organizationId,
      teamId,
      status: status as never
    },
    include: {
      externalGame: true,
      source: true,
      statLines: {
        orderBy: { rowNumber: "asc" },
        take: 100,
        include: { player: true }
      },
      team: true
    },
    orderBy: { importedAt: "desc" },
    take: 50
  });

  return NextResponse.json({ imports });
}

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, gameChangerStatsImportSchema);

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

  if (parsedCsv.statLines.length === 0) {
    return apiErrorResponse("VALIDATION_FAILED", "CSV did not contain any importable stat lines.", 400);
  }

  const matchablePlayers = team.teamPlayers.map(({ player }) => ({
    id: player.id,
    preferredName: player.preferredName
  }));
  const lineDrafts = parsedCsv.statLines.map((statLine) => ({
    statLine,
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
  const existingBatch = await prisma.sportStatImportBatch.findUnique({
    where: {
      organizationId_dedupeKey: {
        organizationId: parsed.data.organizationId,
        dedupeKey
      }
    },
    include: {
      externalGame: true,
      source: true,
      statLines: {
        orderBy: { rowNumber: "asc" },
        include: { player: true }
      },
      team: true
    }
  });

  if (existingBatch) {
    return NextResponse.json({ duplicate: true, importBatch: existingBatch, rejectedRows: parsedCsv.rejectedRows });
  }

  const actorUserId = getRequestActorId(request.headers, parsed.data.importedByUserId);
  const sourceName = parsed.data.sourceName ?? defaultSourceName(team.name, team.id);
  const sourceGameDedupeKey = gameDedupeKey(parsed.data.organizationId, team.id, parsed.data.gameDate);
  const requiresReview =
    parsedCsv.rejectedRows.length > 0 || lineDrafts.some((draft) => draft.recommendation.status !== "matched");

  const importBatch = await prisma.$transaction(async (tx) => {
    const source = await tx.externalSportsSource.upsert({
      where: {
        organizationId_provider_sourceName: {
          organizationId: parsed.data.organizationId,
          provider: "gamechanger",
          sourceName
        }
      },
      update: {
        sport: parsed.data.sport,
        status: "connected"
      },
      create: {
        organizationId: parsed.data.organizationId,
        provider: "gamechanger",
        sourceName,
        sport: parsed.data.sport,
        status: "connected",
        rawMetadata: {
          source: "official_gamechanger_export"
        }
      }
    });

    await tx.externalTeamIdentity.upsert({
      where: {
        sourceId_teamId: {
          sourceId: source.id,
          teamId: team.id
        }
      },
      update: {
        providerTeamName: team.name,
        sport: team.sport
      },
      create: {
        organizationId: parsed.data.organizationId,
        sourceId: source.id,
        teamId: team.id,
        providerTeamName: team.name,
        sport: team.sport
      }
    });

    const externalGame =
      sourceGameDedupeKey && parsed.data.importScope === "game_filtered"
        ? await tx.externalGame.upsert({
            where: { dedupeKey: sourceGameDedupeKey },
            update: {
              sourceId: source.id,
              sport: parsed.data.sport,
              gameDate: parsed.data.gameDate,
              startTime: parsed.data.gameDate,
              status: "completed"
            },
            create: {
              organizationId: parsed.data.organizationId,
              sourceId: source.id,
              teamId: team.id,
              dedupeKey: sourceGameDedupeKey,
              sport: parsed.data.sport,
              gameDate: parsed.data.gameDate,
              startTime: parsed.data.gameDate,
              status: "completed",
              sourceLabel: sourceName,
              rawMetadata: {
                importScope: parsed.data.importScope
              }
            }
          })
        : null;

    const createdBatch = await tx.sportStatImportBatch.create({
      data: {
        organizationId: parsed.data.organizationId,
        sourceId: source.id,
        teamId: team.id,
        externalGameId: externalGame?.id,
        importedByUserId: actorUserId,
        sport: parsed.data.sport,
        importScope: parsed.data.importScope,
        status: requiresReview ? "needs_review" : "accepted",
        originalFileName: parsed.data.originalFileName,
        fileSha256: parsedCsv.fileSha256,
        dedupeKey,
        rowCount: parsedCsv.statLines.length,
        rejectedRowCount: parsedCsv.rejectedRows.length,
        rawMetadata: {
          headers: parsedCsv.headers,
          playerNameColumn: parsedCsv.playerNameColumn,
          jerseyNumberColumn: parsedCsv.jerseyNumberColumn,
          metricColumns: parsedCsv.metricColumns,
          rejectedRows: parsedCsv.rejectedRows
        } as Prisma.InputJsonValue
      }
    });

    await tx.playerGameStatLine.createMany({
      data: lineDrafts.map(({ statLine, recommendation }) => ({
        organizationId: parsed.data.organizationId,
        importBatchId: createdBatch.id,
        teamId: team.id,
        externalGameId: externalGame?.id,
        playerId: recommendation.playerId,
        rowNumber: statLine.rowNumber,
        externalPlayerName: statLine.externalPlayerName,
        normalizedExternalPlayerName: normalizeGameChangerIdentity(statLine.externalPlayerName),
        jerseyNumber: statLine.jerseyNumber,
        matchStatus: recommendation.status,
        confidence: recommendation.confidence,
        matchReason: recommendation.reason,
        stats: statLine.metrics as Prisma.InputJsonValue,
        rawMetadata: {
          row: statLine.raw,
          signals: recommendation.signals
        } as Prisma.InputJsonValue
      }))
    });

    if (parsed.data.importScope === "season_totals") {
      await tx.playerSeasonStatSnapshot.createMany({
        data: lineDrafts.map(({ statLine, recommendation }) => ({
          organizationId: parsed.data.organizationId,
          importBatchId: createdBatch.id,
          teamId: team.id,
          playerId: recommendation.status === "matched" ? recommendation.playerId : null,
          rowNumber: statLine.rowNumber,
          externalPlayerName: statLine.externalPlayerName,
          normalizedExternalPlayerName: normalizeGameChangerIdentity(statLine.externalPlayerName),
          jerseyNumber: statLine.jerseyNumber,
          stats: statLine.metrics as Prisma.InputJsonValue,
          rawMetadata: {
            row: statLine.raw,
            signals: recommendation.signals
          } as Prisma.InputJsonValue
        }))
      });
    }

    return tx.sportStatImportBatch.findUniqueOrThrow({
      where: { id: createdBatch.id },
      include: {
        externalGame: true,
        source: true,
        statLines: {
          orderBy: { rowNumber: "asc" },
          include: { player: true }
        },
        team: true
      }
    });
  });

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId,
    actorUserId,
    action: "gamechanger_stats.imported",
    entityType: "SportStatImportBatch",
    entityId: importBatch.id,
    metadata: {
      sport: parsed.data.sport,
      importScope: parsed.data.importScope,
      teamId: team.id,
      fileSha256: parsedCsv.fileSha256,
      statLineCount: parsedCsv.statLines.length,
      rejectedRowCount: parsedCsv.rejectedRows.length,
      dedupeKey
    }
  });

  return NextResponse.json(
    {
      duplicate: false,
      importBatch,
      rejectedRows: parsedCsv.rejectedRows
    },
    { status: 201 }
  );
}
