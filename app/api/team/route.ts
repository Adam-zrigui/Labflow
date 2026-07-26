import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireApiAuth } from "@/lib/auth";

export async function GET() {
  const auth = await requireApiAuth();
  if (auth.error) return auth.error;
  const session = auth.session;

  const members = await prisma.user.findMany({
    where: { tenantId: session.tenantId, deletedAt: null },
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(members);
}
