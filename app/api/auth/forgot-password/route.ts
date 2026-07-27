import { NextRequest, NextResponse } from "next/server";
import { randomBytes } from "crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { sendEmail } from "@/lib/email";

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
});

export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  const { email } = parsed.data;

  // Always return success to prevent email enumeration
  const successResponse = NextResponse.json({
    message: "If an account exists with that email, you will receive a password reset link.",
  });

  // Look up user by email
  const user = await prisma.user.findUnique({
    where: { email },
    select: { id: true, email: true },
  });

  if (!user) {
    // Return same response as if user exists (prevents enumeration)
    return successResponse;
  }

  // Rate limit: check for existing unused token in last 15 minutes
  const recentToken = await prisma.passwordResetToken.findFirst({
    where: {
      userId: user.id,
      usedAt: null,
      createdAt: { gte: new Date(Date.now() - 15 * 60 * 1000) },
    },
    select: { id: true },
  });

  if (recentToken) {
    // Return same response — don't reveal rate limiting
    return successResponse;
  }

  // Invalidate any previous unused tokens for this user
  await prisma.passwordResetToken.updateMany({
    where: {
      userId: user.id,
      usedAt: null,
    },
    data: {
      usedAt: new Date(),
    },
  });

  // Generate cryptographically secure token
  const token = randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  // Store token in database
  await prisma.passwordResetToken.create({
    data: {
      userId: user.id,
      token,
      expiresAt,
    },
  });

  // Send password reset email
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const resetUrl = `${appUrl}/reset-password?token=${token}`;

  await sendEmail({
    to: [user.email],
    subject: "Reset your LabFlow password",
    html: `
      <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px;">
        <h2 style="font-size: 20px; font-weight: 600; margin-bottom: 16px;">Reset your password</h2>
        <p style="color: #4b5563; line-height: 1.6; margin-bottom: 24px;">
          You requested a password reset for your LabFlow account. Click the button below to set a new password. This link expires in 1 hour.
        </p>
        <a href="${resetUrl}" style="display: inline-block; background-color: #111827; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500; margin-bottom: 24px;">
          Reset password
        </a>
        <p style="color: #9ca3af; font-size: 13px; line-height: 1.5;">
          If you didn't request this, you can safely ignore this email. Your password will remain unchanged.
        </p>
      </div>
    `,
  });

  return successResponse;
}
