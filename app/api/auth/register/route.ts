import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import type { PrismaTransactionClient } from "@/lib/prisma";
import { verifyIdToken } from "@/lib/firebase-admin";
import { createSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { idToken, labName } = await request.json();

    if (!idToken || !labName) {
      return NextResponse.json(
        { error: "Missing required fields: idToken, labName" },
        { status: 400 }
      );
    }

    // Verify the Firebase ID token server-side to get trusted uid + email
    const decoded = await verifyIdToken(idToken);
    const firebaseUid = decoded.uid;
    const email = decoded.email ?? "";

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
    await createSessionCookie({
      firebaseUid,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Registration failed" },
      { status: 500 }
    );
  }
}
