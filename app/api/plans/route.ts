import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const plans = await prisma.plan.findMany({
    orderBy: { maxSamplesPerMonth: "asc" },
    select: {
      id: true,
      name: true,
      stripePriceId: true,
      maxSamplesPerMonth: true,
      maxWorkflowTemplates: true,
      maxUsers: true,
      hasInstrumentWebhook: true,
    },
  });

  return NextResponse.json(plans);
}
