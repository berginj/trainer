import { NextResponse, type NextRequest } from "next/server";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { seasonCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, seasonCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const season = await getPrisma().season.create({
    data: parsed.data
  });

  return NextResponse.json({ season }, { status: 201 });
}
