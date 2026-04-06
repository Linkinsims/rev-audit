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

  const [clients, auditResults] = await Promise.all([
    prisma.client.findMany({
      where: { userId },
      select: {
        id: true,
        name: true,
        audits: {
          select: { difference: true },
        },
      },
    }),
    prisma.auditResult.findMany({
      where: { client: { userId } },
      select: { difference: true, issueType: true },
    }),
  ]);

  const insights: { type: string; message: string; value?: number }[] = [];

  const expiredDiscountLoss = auditResults
    .filter((r) => r.issueType === "EXPIRED_DISCOUNT")
    .reduce((sum, r) => sum + r.difference, 0);

  if (expiredDiscountLoss > 0) {
    insights.push({
      type: "expired_discount",
      message: "Lost revenue due to expired discounts",
      value: expiredDiscountLoss,
    });
  }

  const clientsWithLeakage = clients
    .map((client) => ({
      id: client.id,
      name: client.name,
      leakage: client.audits
        .filter((a) => a.difference > 0)
        .reduce((sum, a) => sum + a.difference, 0),
    }))
    .filter((c) => c.leakage > 0)
    .sort((a, b) => b.leakage - a.leakage);

  if (clientsWithLeakage.length >= 3) {
    const top3Leakage = clientsWithLeakage
      .slice(0, 3)
      .reduce((sum, c) => sum + c.leakage, 0);
    const totalLeakage = clientsWithLeakage.reduce((sum, c) => sum + c.leakage, 0);
    const percentage = totalLeakage > 0 ? (top3Leakage / totalLeakage) * 100 : 0;

    if (percentage >= 50) {
      insights.push({
        type: "concentration",
        message: `Top 3 clients account for ${percentage.toFixed(0)}% of leakage`,
      });
    }
  }

  const underchargeCount = auditResults.filter(
    (r) => r.issueType === "UNDERCHARGE"
  ).length;
  const overchargeCount = auditResults.filter(
    (r) => r.issueType === "OVERCHARGE"
  ).length;

  if (underchargeCount > overchargeCount) {
    insights.push({
      type: "billing_pattern",
      message: `More undercharging issues detected (${underchargeCount} records)`,
    });
  }

  return NextResponse.json(insights);
}