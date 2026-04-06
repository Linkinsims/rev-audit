import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const audits = await prisma.auditResult.findMany({
    where: {
      client: { userId },
    },
    select: {
      id: true,
      expectedAmount: true,
      actualAmount: true,
      difference: true,
      issueType: true,
      createdAt: true,
      client: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 10,
  });

  const formatted = audits.map((audit) => ({
    id: audit.id,
    clientName: audit.client.name,
    expectedAmount: audit.expectedAmount,
    actualAmount: audit.actualAmount,
    difference: audit.difference,
    issueType: audit.issueType,
    createdAt: audit.createdAt.toISOString(),
  }));

  return NextResponse.json(formatted);
}