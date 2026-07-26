import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

const checkoutSchema = z.object({
  planId: z.string().min(1, "planId is required"),
});

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

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

  const plan = await prisma.plan.findUnique({
    where: { id: planId },
  });

  if (!plan) {
    return NextResponse.json({ error: "Plan not found" }, { status: 404 });
  }

  // Free tier — activate directly without Stripe
  if (plan.stripePriceId === "free") {
    await prisma.tenant.update({
      where: { id: session.tenantId },
      data: {
        planId: plan.id,
        subscriptionStatus: "active",
      },
    });

    return NextResponse.json({ url: "/billing?success=true" });
  }

  // Validate the price ID is in the correct format (price_*, not prod_*)
  if (!plan.stripePriceId.startsWith("price_")) {
    console.error(
      `Invalid Stripe price ID for plan "${plan.name}": "${plan.stripePriceId}". ` +
      `Expected a price_* ID from your Stripe Dashboard, not a prod_* product ID. ` +
      `Create prices at https://dashboard.stripe.com/test/prices`
    );
    return NextResponse.json(
      {
        error:
          "Stripe is not configured for this plan. " +
          "Please ensure the plan has a valid price ID (price_*) in your Stripe Dashboard.",
      },
      { status: 500 }
    );
  }

  // Paid tier — create Stripe checkout session
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

  // Paid tier — set planId immediately so the billing page reflects the selection
  await prisma.tenant.update({
    where: { id: session.tenantId },
    data: { planId: plan.id },
  });

  let checkoutSession: Stripe.Checkout.Session;
  try {
    checkoutSession = await stripe.checkout.sessions.create({
      customer: stripeCustomerId,
      client_reference_id: tenant.id,
      mode: "subscription",
      line_items: [
        {
          price: plan.stripePriceId,
          quantity: 1,
        },
      ],
      success_url: `${request.headers.get("origin") ?? APP_URL}/billing?success=true`,
      cancel_url: `${request.headers.get("origin") ?? APP_URL}/billing?canceled=true`,
    });
  } catch (err) {
    console.error("Stripe checkout session creation failed:", err);
    return NextResponse.json(
      { error: "Failed to create checkout session. Please try again." },
      { status: 500 }
    );
  }

  if (!checkoutSession.url) {
    return NextResponse.json(
      { error: "Checkout session created but no URL returned" },
      { status: 500 }
    );
  }

  return NextResponse.json({ url: checkoutSession.url });
}
