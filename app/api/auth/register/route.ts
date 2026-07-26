import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PrismaTransactionClient } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/firebase-admin";
import { createSessionCookie } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import * as Sentry from "@sentry/nextjs";

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0] ?? "127.0.0.1";
  const { success } = await checkRateLimit(`register:${ip}`);

  if (!success) {
    return NextResponse.json(
      { error: "Too many attempts, please try again in a minute" },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const { labName } = body;

    if (!labName) {
      return NextResponse.json(
        { error: "Missing required field: labName" },
        { status: 400 }
      );
    }

    let firebaseUid: string;
    let email: string;

    if (body.idToken) {
      const decoded = await verifyIdToken(body.idToken);
      firebaseUid = decoded.uid;
      email = decoded.email ?? "";
    } else if (body.firebaseUid && body.email) {
      firebaseUid = body.firebaseUid;
      email = body.email;
    } else {
      return NextResponse.json(
        {
          error:
            "Provide either { idToken, labName } or { firebaseUid, email, labName }",
        },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true, tenantId: true, role: true, email: true },
    });

    if (existingUser) {
      const response = await createSessionCookie({
        firebaseUid,
        userId: existingUser.id,
        tenantId: existingUser.tenantId,
        role: existingUser.role,
        email: existingUser.email,
      });
      return response;
    }

    const { user } = await prisma.$transaction(async (tx: PrismaTransactionClient) => {
      const tenant = await tx.tenant.create({
        data: { name: labName },
      });

      const user = await tx.user.create({
        data: {
          tenantId: tenant.id,
          email,
          firebaseUid,
          role: "Admin",
        },
      });

      return { user };
    });

    const response = await createSessionCookie({
      firebaseUid,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
      email: user.email,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    Sentry.captureException(error);
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
