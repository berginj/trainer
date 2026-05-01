import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: "ok" | "not_configured" | "error"; detail?: string }> = {
    database: { status: "not_configured", detail: "DATABASE_URL is not set." },
    storage: { status: "not_configured", detail: "Azure Blob Storage is not configured yet." },
    queue: { status: "not_configured", detail: "Azure Service Bus is not configured yet." }
  };

  if (process.env.DATABASE_URL) {
    try {
      await getPrisma().$queryRaw`SELECT 1`;
      checks.database = { status: "ok" };
    } catch (error) {
      checks.database = {
        status: "error",
        detail: error instanceof Error ? error.message : "Database check failed."
      };
    }
  }

  return NextResponse.json({
    service: "trainer",
    status: Object.values(checks).some((check) => check.status === "error") ? "degraded" : "ok",
    checks,
    timestamp: new Date().toISOString()
  });
}
