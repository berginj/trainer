import { NextResponse } from "next/server";
import { getPrisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const checks: Record<string, { status: "ok" | "not_configured" | "error"; detail?: string }> = {
    database: { status: "not_configured", detail: "DATABASE_URL is not set." },
    storage: { status: "not_configured", detail: "Azure Blob Storage is not configured yet." },
    queue: { status: "not_configured", detail: "Azure Service Bus is not configured yet." },
    appConfig: { status: "not_configured", detail: "Azure App Configuration is not configured yet." },
    monitoring: { status: "not_configured", detail: "Application Insights is not configured yet." }
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

  if (process.env.AZURE_STORAGE_ACCOUNT_NAME && process.env.AZURE_BLOB_CONTAINER_NAME) {
    checks.storage = { status: "ok" };
  }

  if (process.env.SERVICE_BUS_NAMESPACE && process.env.SERVICE_BUS_QUEUE_NAME) {
    checks.queue = { status: "ok" };
  }

  if (process.env.AZURE_APP_CONFIG_ENDPOINT) {
    checks.appConfig = { status: "ok" };
  }

  if (process.env.APPLICATIONINSIGHTS_CONNECTION_STRING) {
    checks.monitoring = { status: "ok" };
  }

  return NextResponse.json({
    service: "trainer",
    status: Object.values(checks).some((check) => check.status === "error") ? "degraded" : "ok",
    checks,
    timestamp: new Date().toISOString()
  });
}
