import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const auditResults = await prisma.auditResult.findMany({
    where: { client: { userId: session.user.id } },
    select: { issueType: true, difference: true },
  });

  const breakdown: { type: string; count: number; total: number }[] = [];
  const typeMap = new Map<string, { count: number; total: number }>();

  for (const result of auditResults) {
    if (result.difference === 0) continue;

    const existing = typeMap.get(result.issueType) || { count: 0, total: 0 };
    typeMap.set(result.issueType, {
      count: existing.count + 1,
      total: existing.total + Math.abs(result.difference),
    });
  }

  const mapEntries = Array.from(typeMap.entries());
  for (const [type, data] of mapEntries) {
    breakdown.push({ type, count: data.count, total: data.total });
  }

  breakdown.sort((a, b) => b.total - a.total);

  return NextResponse.json(breakdown);
}