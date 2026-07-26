import { prisma } from "./prisma";

export async function writeAuditLog(
  entityType: string,
  entityId: string,
  actorId: string,
  action: string,
  before?: unknown,
  after?: unknown
) {
  return prisma.auditLog.create({
    data: {
      entityType,
      entityId,
      actorId,
      action,
      before: before as never,
      after: after as never,
    },
  });
}
