import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";
import { RuleType } from "@prisma/client";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const contract = await prisma.contract.findFirst({
    where: { id, client: { userId: session.user.id } },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const rules = await prisma.contractRule.findMany({
    where: { contractId: id },
    orderBy: { priority: "desc" },
  });

  return NextResponse.json(rules);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { name, type, priority, condition, value, startDate, endDate } = body;

  const contract = await prisma.contract.findFirst({
    where: { id, client: { userId: session.user.id } },
  });

  if (!contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  let parsedCondition = {};
  let parsedValue = {};

  try {
    if (condition) parsedCondition = typeof condition === "string" ? JSON.parse(condition) : condition;
  } catch {
    return NextResponse.json({ error: "Invalid condition JSON" }, { status: 400 });
  }

  try {
    if (value) parsedValue = typeof value === "string" ? JSON.parse(value) : value;
  } catch {
    return NextResponse.json({ error: "Invalid value JSON" }, { status: 400 });
  }

  const rule = await prisma.contractRule.create({
    data: {
      contractId: id,
      name,
      type: type as RuleType,
      priority: priority || 0,
      condition: parsedCondition,
      value: parsedValue,
      startDate: startDate ? new Date(startDate) : null,
      endDate: endDate ? new Date(endDate) : null,
    },
  });

  return NextResponse.json(rule);
}