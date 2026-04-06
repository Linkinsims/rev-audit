import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const result = await prisma.auditResult.findFirst({
    where: {
      id,
      client: { userId: session.user.id },
    },
    include: { client: { select: { name: true } } },
  });

  if (!result) {
    return NextResponse.json({ error: "Audit result not found" }, { status: 404 });
  }

  const formatted = {
    id: result.id,
    clientId: result.clientId,
    clientName: result.client.name,
    expectedAmount: result.expectedAmount,
    actualAmount: result.actualAmount,
    difference: result.difference,
    issueType: result.issueType,
    details: result.details,
    billingRecordId: result.billingRecordId,
    createdAt: result.createdAt.toISOString(),
  };

  return NextResponse.json(formatted);
}