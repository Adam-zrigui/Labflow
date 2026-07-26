import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";
import { startOfMonth } from "date-fns";

export async function GET(_request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    include: {
      plan: true,
      usage: true,
    },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  const periodStart = startOfMonth(new Date());
  const currentUsage = tenant.usage.find(
    (u) => u.periodStart.getTime() === periodStart.getTime()
  );

  return NextResponse.json({
    planId: tenant.planId ?? null,
    planName: tenant.plan?.name ?? null,
    stripePriceId: tenant.plan?.stripePriceId ?? null,
    subscriptionStatus: tenant.subscriptionStatus,
    sampleCount: currentUsage?.sampleCount ?? 0,
    maxSamples: tenant.plan?.maxSamplesPerMonth ?? 0,
    maxWorkflowTemplates: tenant.plan?.maxWorkflowTemplates ?? 0,
    hasInstrumentWebhook: tenant.plan?.hasInstrumentWebhook ?? false,
  });
}
