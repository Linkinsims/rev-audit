import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = await prisma.auditResult.findMany({
    where: { client: { userId: session.user.id } },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  const formatted = results.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    clientName: r.client.name,
    expectedAmount: r.expectedAmount,
    actualAmount: r.actualAmount,
    difference: r.difference,
    issueType: r.issueType,
    details: r.details,
    billingRecordId: r.billingRecordId,
    createdAt: r.createdAt.toISOString(),
  }));

  return NextResponse.json(formatted);
}