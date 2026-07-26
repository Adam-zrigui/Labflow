import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

const checkoutSchema = z.object({
  planId: z.string().min(1, "planId is required"),
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = checkoutSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { planId } = parsed.data;

  // Confirm the plan exists
  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Get or create Stripe customer for this tenant
  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
  });

  if (!tenant) {
    return NextResponse.json({ error: "Tenant not found" }, { status: 404 });
  }

  let stripeCustomerId = tenant.stripeCustomerId;

  if (!stripeCustomerId) {
    const customer = await stripe.customers.create({
      metadata: { tenantId: tenant.id },
    });
    stripeCustomerId = customer.id;

    await prisma.tenant.update({
      where: { id: tenant.id },
      data: { stripeCustomerId },
    });
  }

  // Create checkout session
  const checkoutSession = await stripe.checkout.sessions.create({
    customer: stripeCustomerId,
    client_reference_id: tenant.id,
    mode: "subscription",
    line_items: [
      {
        price: plan.stripePriceId,
        quantity: 1,
      },
    ],
    success_url: `${request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing?success=true`,
    cancel_url: `${request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/billing?canceled=true`,
  });

  return NextResponse.json({ url: checkoutSession.url });
}
