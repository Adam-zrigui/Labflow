import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");


async function lookupPlanByPriceId(priceId: string) {
  return prisma.plan.findUnique({
    where: { stripePriceId: priceId },
  });
}

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature") ?? "";
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET?.trim() ?? "";

  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not configured");
    return NextResponse.json({ error: "Webhook not configured" }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    console.error("Stripe webhook signature verification failed:", err);
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  // Idempotency: check if this event has already been processed
  const alreadyProcessed = await prisma.auditLog.findFirst({
    where: {
      entityType: "StripeEvent",
      entityId: event.id,
    },
  });

  if (alreadyProcessed) {
    return NextResponse.json({ received: true });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session;
        const tenantId = session.client_reference_id;

        if (!tenantId || !session.customer) break;

        let planId: string | null = null;
        if (session.subscription) {
          const subscription = await stripe.subscriptions.retrieve(
            session.subscription as string
          );
          const priceId = subscription.items.data[0]?.price?.id;
          if (priceId) {
            const plan = await lookupPlanByPriceId(priceId);
            planId = plan?.id ?? null;
          }
        }

        await prisma.tenant.update({
          where: { id: tenantId },
          data: {
            stripeCustomerId: session.customer as string,
            subscriptionStatus: "active",
            ...(planId ? { planId } : {}),
          },
        });
        break;
      }

      case "customer.subscription.updated": {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const status = subscription.status;

        const priceId = subscription.items.data[0]?.price?.id;
        let planId: string | null = null;
        if (priceId) {
          const plan = await lookupPlanByPriceId(priceId);
          planId = plan?.id ?? null;
        }

        await prisma.tenant.updateMany({
          where: { stripeCustomerId: customerId },
          data: {
            subscriptionStatus: status,
            ...(planId ? { planId } : {}),
          },
        });
        break;
      }

      case "customer.subscription.deleted": {
        const deletedSub = event.data.object as Stripe.Subscription;
        const deletedCustomerId = deletedSub.customer as string;

        await prisma.tenant.updateMany({
          where: { stripeCustomerId: deletedCustomerId },
          data: { subscriptionStatus: "canceled", planId: null },
        });
        break;
      }
    }

    await writeAuditLog(
      "StripeEvent",
      event.id,
      "stripe-webhook",
      `stripe.${event.type}`,
      null,
      { type: event.type }
    );
  } catch (error) {
    console.error("Stripe webhook processing error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
