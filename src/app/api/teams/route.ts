import { NextResponse, type NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { teamCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, teamCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const team = await getPrisma().team.create({
    data: parsed.data
  });

  return NextResponse.json({ team }, { status: 201 });
}
