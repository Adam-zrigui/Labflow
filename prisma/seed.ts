import { PrismaClient } from "../generated/prisma-client";

const prisma = new PrismaClient();

const plans = [
  {
    id: "pro",
    name: "Pro",
    stripePriceId: "price_pro_monthly",
    maxSamplesPerMonth: 1000,
    maxWorkflowTemplates: 20,
    maxUsers: 10,
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
    console.log(`Seeded plan: ${plan.name} (${plan.id})`);
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
