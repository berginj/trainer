import { NextResponse } from "next/server";
import { parseSeedMetricDefinitions } from "@/lib/seed-data";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    metricDefinitions: parseSeedMetricDefinitions()
  });
}
