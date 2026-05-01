import type { Prisma, PrismaClient } from "@prisma/client";

export type AuditInput = {
  organizationId?: string | null;
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
};

export async function writeAuditEvent(prisma: PrismaClient, input: AuditInput) {
  return prisma.auditEvent.create({
    data: {
      organizationId: input.organizationId ?? null,
      actorUserId: input.actorUserId ?? null,
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId ?? null,
      metadata: (input.metadata ?? {}) as Prisma.InputJsonValue
    }
  });
}
