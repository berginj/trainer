import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type MetricDomain, type Sport } from "@prisma/client";
import { parseSeedMetricDefinitions, seedRoutineCodes } from "../src/lib/seed-data";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to seed the database.");
}

const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString })
});

const captureDifficultyByDomain = {
  readiness: "home_easy",
  workload: "practice_easy",
  physical: "practice_easy",
  skill: "practice_easy",
  movement: "home_easy",
  growth: "home_easy",
  safety: "home_easy"
} as const satisfies Record<MetricDomain, string>;

function titleCaseFromCode(code: string) {
  return code
    .split("_")
    .slice(1)
    .join(" ")
    .replaceAll(/\b\w/g, (letter) => letter.toUpperCase());
}

async function main() {
  for (const metric of parseSeedMetricDefinitions()) {
    const existingMetric = await prisma.metricDefinition.findFirst({
      where: {
        organizationId: null,
        code: metric.code
      }
    });

    const metricData = {
      displayName: metric.displayName,
      sportScope: metric.sportScope,
      domain: metric.domain,
      valueType: metric.valueType,
      unit: metric.unit,
      benchmarkPolicy: metric.benchmarkPolicy,
      confidenceLevel: metric.confidenceLevel,
      rankingAllowed: metric.rankingAllowed
    };

    if (existingMetric) {
      await prisma.metricDefinition.update({
        where: {
          id: existingMetric.id
        },
        data: metricData
      });
    } else {
      await prisma.metricDefinition.create({
        data: {
          ...metricData,
          code: metric.code,
          captureDifficulty: captureDifficultyByDomain[metric.domain],
          protocolVersion: "launch_v1",
          requiresGuardianConsent: true
        }
      });
    }
  }

  for (const routineCode of seedRoutineCodes) {
    const sport = routineCode.split("_")[0] as Sport;
    const existingRoutine = await prisma.routine.findFirst({
      where: {
        organizationId: null,
        code: routineCode
      }
    });

    if (existingRoutine) {
      await prisma.routine.update({
        where: {
          id: existingRoutine.id
        },
        data: {
          name: titleCaseFromCode(routineCode)
        }
      });
    } else {
      await prisma.routine.create({
        data: {
          code: routineCode,
          name: titleCaseFromCode(routineCode),
          sport,
          level: routineCode.includes("beginner") ? "beginner" : "intermediate",
          durationMin: routineCode.endsWith("_12m") ? 12 : routineCode.endsWith("_15m") ? 15 : 18,
          equipment: [],
          stopRules: {
            pain: "Stop if pain appears or worsens."
          },
          progressionRules: {
            default: "Progress only when completion is pain-free and controlled."
          }
        }
      });
    }
  }
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
