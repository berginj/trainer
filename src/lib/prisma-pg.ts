import { PrismaPg } from "@prisma/adapter-pg";
import type { PoolConfig } from "pg";

function shouldUseSsl(connectionString: string) {
  try {
    const url = new URL(connectionString);

    return (
      url.searchParams.get("sslmode") === "require" ||
      url.hostname.endsWith(".postgres.database.azure.com")
    );
  } catch {
    return false;
  }
}

export function createPrismaPgAdapter(connectionString: string) {
  const config: PoolConfig = { connectionString };

  if (shouldUseSsl(connectionString)) {
    config.ssl = { rejectUnauthorized: false };
  }

  return new PrismaPg(config);
}
