import "dotenv/config";
import { vi, beforeAll, afterAll } from "vitest";
import { SignJWT } from "jose";
import type { JWTPayload } from "jose";

// ─── Mock next/headers ───────────────────────────────────────────
let sessionToken: string | null = null;

vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({
    get: (name: string) => {
      if (name === "session" && sessionToken) {
        return { value: sessionToken };
      }
      return undefined;
    },
    set: vi.fn(),
    delete: vi.fn(),
  })),
}));

// ─── Mock firebase-admin ─────────────────────────────────────────
vi.mock("@/lib/firebase-admin", () => ({
  adminAuth: { verifyIdToken: vi.fn() },
  verifyIdToken: vi.fn(),
}));

// ─── Mock Sentry ─────────────────────────────────────────────────
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
  captureMessage: vi.fn(),
}));

// ─── Mock queue (BullMQ) ────────────────────────────────────────
vi.mock("@/lib/queue", () => ({
  enqueueSequencingJob: vi.fn(),
  sequencingQueue: { add: vi.fn() },
  redisConnection: {},
  startSequencingWorker: vi.fn(),
}));

// ─── Mock rate-limit (no Upstash in tests) ──────────────────────
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ success: true }),
  rateLimiter: null,
}));

// ─── Mock email ──────────────────────────────────────────────────
vi.mock("@/lib/email", () => ({
  sendEmail: vi.fn().mockResolvedValue(true),
}));

// ─── Mock notify-flag ────────────────────────────────────────────
vi.mock("@/lib/notify-flag", () => ({
  sendFlagNotifications: vi.fn().mockResolvedValue(undefined),
}));

// ─── Mock Stripe ─────────────────────────────────────────────────
// Must be mocked BEFORE any route that imports Stripe is loaded.
const mockStripeInstance = {
  webhooks: {
    constructEvent: vi.fn(),
  },
  subscriptions: {
    retrieve: vi.fn(),
  },
};

vi.mock("stripe", () => {
  return {
    default: vi.fn(function MockStripe() {
      return mockStripeInstance;
    }),
  };
});

export { mockStripeInstance };

// ─── Session helpers ─────────────────────────────────────────────
const SESSION_SECRET = new TextEncoder().encode(
  process.env.SESSION_SECRET ?? "test-secret-that-is-at-least-32-chars-long!!"
);

export interface SessionPayload {
  firebaseUid: string;
  userId: string;
  tenantId: string;
  role: string;
  email: string;
}

export async function buildSessionToken(payload: SessionPayload): Promise<string> {
  return new SignJWT(payload as unknown as JWTPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(SESSION_SECRET);
}

export async function setSession(payload: SessionPayload) {
  sessionToken = await buildSessionToken(payload);
}

export function clearSession() {
  sessionToken = null;
}

// ─── Prisma (test DB) ───────────────────────────────────────────
import { PrismaClient } from "../../generated/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";

const TEST_DB_URL =
  process.env.TEST_DATABASE_URL ?? process.env.DATABASE_URL;

if (!TEST_DB_URL) {
  throw new Error(
    "Set TEST_DATABASE_URL or DATABASE_URL to a test Postgres connection string"
  );
}

const adapter = new PrismaPg({ connectionString: TEST_DB_URL });
export const testDb = new PrismaClient({ adapter });

// ─── Cleanup & seed ─────────────────────────────────────────────
const ALL_TABLES = [
  "AuditLog",
  "SampleStageHistory",
  "Sample",
  "InviteToken",
  "UsageCounter",
  "User",
  "WorkflowTemplate",
  "Tenant",
  "Plan",
];

export async function resetDatabase() {
  // TRUNCATE CASCADE handles all FK dependencies in one shot
  const tableList = ALL_TABLES.map((t) => `"${t}"`).join(", ");
  await testDb.$executeRawUnsafe(
    `TRUNCATE TABLE ${tableList} CASCADE`
  );
}

const PLANS = [
  {
    id: "plan-starter",
    name: "Starter",
    stripePriceId: "price_starter_test",
    maxSamplesPerMonth: 50,
    maxWorkflowTemplates: 3,
    maxUsers: 5,
    hasInstrumentWebhook: false,
  },
  {
    id: "plan-pro",
    name: "Pro",
    stripePriceId: "price_pro_test",
    maxSamplesPerMonth: 500,
    maxWorkflowTemplates: 10,
    maxUsers: 20,
    hasInstrumentWebhook: true,
  },
  {
    id: "plan-enterprise",
    name: "Enterprise",
    stripePriceId: "price_enterprise_test",
    maxSamplesPerMonth: 999999,
    maxWorkflowTemplates: 999,
    maxUsers: 999,
    hasInstrumentWebhook: true,
  },
];

export async function seedPlans() {
  await testDb.plan.createMany({ data: PLANS, skipDuplicates: true });
}

beforeAll(async () => {
  // TRUNCATE is safe here because integration tests run sequentially
  // (fileParallelism: false, maxWorkers: 1 in vitest.config.integration.ts).
  await resetDatabase();
  await seedPlans();
});

afterAll(async () => {
  // TRUNCATE is safe here because integration tests run sequentially.
  await resetDatabase();
  await testDb.$disconnect();
});
