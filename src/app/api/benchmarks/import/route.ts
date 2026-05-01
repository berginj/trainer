import { NextResponse, type NextRequest } from "next/server";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { benchmarkImportSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, benchmarkImportSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const benchmark = await prisma.benchmark.create({
    data: parsed.data
  });

  await writeAuditEvent(prisma, {
    organizationId: parsed.data.organizationId ?? null,
    action: "benchmark.imported",
    entityType: "Benchmark",
    entityId: benchmark.id,
    metadata: {
      metricDefinitionId: parsed.data.metricDefinitionId,
      confidence: parsed.data.confidence
    }
  });

  return NextResponse.json({ benchmark }, { status: 201 });
}
