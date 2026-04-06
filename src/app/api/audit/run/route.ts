import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { calculateExpectedAmount, determineIssueType } from "@/lib/rule-engine";
import { IssueType } from "@prisma/client";

export async function POST() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = session.user.id;

  const clients = await prisma.client.findMany({
    where: { userId },
    select: { id: true },
  });

  let totalAudits = 0;

  for (const client of clients) {
    const billingRecords = await prisma.billingRecord.findMany({
      where: { clientId: client.id },
      orderBy: { billingDate: "desc" },
    });

    const contracts = await prisma.contract.findMany({
      where: { clientId: client.id },
      select: { id: true },
    });

    for (const billingRecord of billingRecords) {
      const contractRules: Parameters<typeof calculateExpectedAmount>[0] = [];

      for (const contract of contracts) {
        const rules = await prisma.contractRule.findMany({
          where: { contractId: contract.id, isActive: true },
          orderBy: { priority: "desc" },
        });
        contractRules.push(...rules);
      }

      const { expectedAmount, calculations } = calculateExpectedAmount(
        contractRules,
        billingRecord.units,
        billingRecord.billingDate,
        billingRecord.amountCharged
      );

      const actualAmount = billingRecord.amountCharged;
      const issueTypeResult = determineIssueType(expectedAmount, actualAmount);
      const issueType: IssueType = issueTypeResult ?? "UNDERCHARGE";

      const detailsJson = {
        calculations: calculations.map(c => ({
          ruleId: c.ruleId,
          ruleName: c.ruleName,
          ruleType: c.ruleType,
          applied: c.applied,
          expectedAmount: c.expectedAmount,
          details: c.details,
        })),
        billingDate: billingRecord.billingDate.toISOString(),
        units: billingRecord.units,
      };

      await prisma.auditResult.create({
        data: {
          clientId: client.id,
          billingRecordId: billingRecord.id,
          expectedAmount,
          actualAmount,
          difference: expectedAmount - actualAmount,
          issueType,
          details: detailsJson as unknown as Record<string, unknown>,
        },
      });

      totalAudits++;
    }
  }

  return NextResponse.json({ success: true, auditsRun: totalAudits });
}