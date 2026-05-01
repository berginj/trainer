import { NextResponse, type NextRequest } from "next/server";
import { writeAuditEvent } from "@/lib/audit";
import { getPrisma } from "@/lib/db";
import { parseJsonWithSchema } from "@/lib/route-utils";
import { organizationCreateSchema } from "@/lib/validation";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const parsed = await parseJsonWithSchema(request, organizationCreateSchema);

  if (parsed.response) {
    return parsed.response;
  }

  const prisma = getPrisma();
  const organization = await prisma.organization.create({
    data: parsed.data
  });
  await writeAuditEvent(prisma, {
    organizationId: organization.id,
    action: "organization.created",
    entityType: "Organization",
    entityId: organization.id
  });

  return NextResponse.json({ organization }, { status: 201 });
}
