import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PrismaTransactionClient } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/firebase-admin";
import { createSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
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

    // Support two body formats for backward compatibility:
    // 1) { idToken, labName } — preferred (verifies server-side)
    // 2) { firebaseUid, email, labName } — legacy compat (trusts client)
    if (body.idToken) {
      // Format 1: verify the Firebase ID token server-side
      const decoded = await verifyIdToken(body.idToken);
      firebaseUid = decoded.uid;
      email = decoded.email ?? "";
    } else if (body.firebaseUid && body.email) {
      // Format 2: trust client-provided uid + email (legacy)
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

    // Create Tenant and User in a transaction
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

    // Log them in immediately via the shared session helper
    const response = await createSessionCookie({
      firebaseUid,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    return response;
  } catch (error) {
    console.error("Registration error:", error);
    const message =
      error instanceof Error ? error.message : "Registration failed";
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
