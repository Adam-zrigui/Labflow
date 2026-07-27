import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getAdminAuth } from "@/lib/firebase-admin";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .max(128, "Password must be at most 128 characters"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = resetPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { token, password } = parsed.data;

  // Look up the token
  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    select: {
      id: true,
      userId: true,
      expiresAt: true,
      usedAt: true,
      user: {
        select: { id: true, firebaseUid: true },
      },
    },
  });

  // Validate token exists, is not expired, and not already used
  if (!resetToken) {
    return NextResponse.json(
      { error: "Invalid or expired reset link" },
      { status: 400 }
    );
  }

  if (resetToken.usedAt) {
    return NextResponse.json(
      { error: "This reset link has already been used. Please request a new one." },
      { status: 400 }
    );
  }

  if (new Date() > resetToken.expiresAt) {
    return NextResponse.json(
      { error: "This reset link has expired. Please request a new one." },
      { status: 400 }
    );
  }

  try {
    // Update password in Firebase
    await getAdminAuth().updateUser(resetToken.user.firebaseUid, {
      password,
    });

    // Mark token as used
    await prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { usedAt: new Date() },
    });

    return NextResponse.json({
      message: "Password updated successfully. You can now sign in with your new password.",
    });
  } catch (err) {
    console.error("[reset-password] Failed to update password:", err);
    return NextResponse.json(
      { error: "Failed to update password. Please try again." },
      { status: 500 }
    );
  }
}
