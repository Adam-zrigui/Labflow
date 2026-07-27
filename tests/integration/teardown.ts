import { PrismaClient } from "../../generated/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

function createDb() {
  const adapter = new PrismaPg({ connectionString: TEST_DB_URL! });
  return new PrismaClient({ adapter });
}

export async function setup() {
  if (!TEST_DB_URL) return;
  const db = createDb();
  try {
    await db.$executeRawUnsafe(
      `TRUNCATE TABLE "AuditLog", "SampleStageHistory", "Sample", "InviteToken", "UsageCounter", "User", "WorkflowTemplate", "Tenant", "Plan" CASCADE`
    );
  } finally {
    await db.$disconnect();
  }
}

export async function teardown() {
  if (!TEST_DB_URL) return;
  const db = createDb();
  try {
    await db.$executeRawUnsafe(
      `TRUNCATE TABLE "AuditLog", "SampleStageHistory", "Sample", "InviteToken", "UsageCounter", "User", "WorkflowTemplate", "Tenant", "Plan" CASCADE`
    );
  } finally {
    await db.$disconnect();
  }
}
