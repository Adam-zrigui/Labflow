import { PrismaClient } from "../generated/prisma-client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const plans = [
  {
    id: "starter",
    name: "Starter",
    stripePriceId: process.env.STRIPE_PRICE_STARTER ?? "free",
    maxSamplesPerMonth: 50,
    maxWorkflowTemplates: 1,
    maxUsers: 3,
    hasInstrumentWebhook: false,
  },
  {
    id: "pro",
    name: "Pro",
    stripePriceId: process.env.STRIPE_PRICE_PRO ?? "price_pro_monthly",
    maxSamplesPerMonth: 500,
    maxWorkflowTemplates: 5,
    maxUsers: 15,
    hasInstrumentWebhook: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE ?? "price_enterprise_monthly",
    maxSamplesPerMonth: 999999,
    maxWorkflowTemplates: 999,
    maxUsers: 999,
    hasInstrumentWebhook: true,
  },
];

async function main() {
  for (const plan of plans) {
    await prisma.plan.upsert({
      where: { id: plan.id },
      update: plan,
      create: plan,
    });
    console.log(`Seeded plan: ${plan.name} (${plan.id}) — stripePriceId: ${plan.stripePriceId}`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
