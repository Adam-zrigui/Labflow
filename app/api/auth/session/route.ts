import { NextRequest, NextResponse } from "next/server";
import { verifyIdToken } from "@/lib/firebase-admin";
import { prisma } from "@/lib/prisma";
import { createSessionCookie, clearSessionCookie } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { idToken } = await request.json();

    if (!idToken || typeof idToken !== "string") {
      return NextResponse.json({ error: "Missing ID token" }, { status: 400 });
    }

    // Verify the Firebase ID token server-side
    const decoded = await verifyIdToken(idToken);
    const firebaseUid = decoded.uid;

    // Look up the user in our Postgres database
    const user = await prisma.user.findUnique({
      where: { firebaseUid },
      select: { id: true, tenantId: true, role: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 401 });
    }

    // Create the session cookie via shared helper
    const response = await createSessionCookie({
      firebaseUid,
      userId: user.id,
      tenantId: user.tenantId,
      role: user.role,
    });

    return response;
  } catch (error) {
    console.error("Session creation error:", error);
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }
}

export async function DELETE() {
  return clearSessionCookie();
}
