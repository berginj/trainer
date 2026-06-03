import { NextResponse, type NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(request: NextRequest) {
  const sportParam = request.nextUrl.searchParams.get("sport") ?? undefined;
  const sport =
    sportParam === "basketball" || sportParam === "baseball" || sportParam === "softball" ? sportParam : undefined;
  const organizationId = request.nextUrl.searchParams.get("organizationId") ?? undefined;
  const routines = await getPrisma().routine.findMany({
    where: {
      activeStatus: "active",
      ...(sport ? { sport: sport as "basketball" | "baseball" | "softball" } : {}),
      OR: [{ organizationId: null }, ...(organizationId ? [{ organizationId }] : [])]
    },
    orderBy: [{ sport: "asc" }, { level: "asc" }, { durationMin: "asc" }, { name: "asc" }]
  });

  return NextResponse.json({
    routines: routines.map((routine) => ({
      id: routine.id,
      code: routine.code,
      name: routine.name,
      sport: routine.sport,
      level: routine.level,
      durationMin: routine.durationMin,
      equipment: routine.equipment,
      stopRules: routine.stopRules,
      progressionRules: routine.progressionRules
    }))
  });
}
