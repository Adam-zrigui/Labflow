import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "");

export async function POST(request: NextRequest) {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  const tenant = await prisma.tenant.findUnique({
    where: { id: session.tenantId },
    select: { stripeCustomerId: true },
  });

  if (!tenant?.stripeCustomerId) {
    return NextResponse.json(
      { error: "No active subscription to manage" },
      { status: 400 }
    );
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: tenant.stripeCustomerId,
    return_url: `${request.headers.get("origin") ?? process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/dashboard/billing`,
  });

  return NextResponse.json({ url: portalSession.url });
}
