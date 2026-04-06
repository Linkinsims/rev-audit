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

  const [clientCount, auditResults] = await Promise.all([
    prisma.client.count({ where: { userId } }),
    prisma.auditResult.findMany({
      where: { client: { userId } },
      select: { difference: true, issueType: true },
    }),
  ]);

  const totalLeakage = auditResults
    .filter((r) => r.difference > 0)
    .reduce((sum, r) => sum + r.difference, 0);

  const undercharging = auditResults
    .filter((r) => r.issueType === "UNDERCHARGE")
    .reduce((sum, r) => sum + r.difference, 0);

  const overcharging = auditResults
    .filter((r) => r.issueType === "OVERCHARGE")
    .reduce((sum, r) => sum + Math.abs(r.difference), 0);

  const missedBilling = auditResults
    .filter((r) => r.issueType === "MISSED_BILLING")
    .reduce((sum, r) => sum + r.difference, 0);

  return NextResponse.json({
    totalLeakage,
    undercharging,
    overcharging,
    missedBilling,
    activeClients: clientCount,
    totalAudits: auditResults.length,
  });
}