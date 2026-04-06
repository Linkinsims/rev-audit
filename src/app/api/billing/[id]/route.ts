import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await request.json();
  const { clientId, amountCharged, units, description, billingDate } = body;

  const existing = await prisma.billingRecord.findFirst({
    where: { id, client: { userId: session.user.id } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  const record = await prisma.billingRecord.update({
    where: { id },
    data: {
      clientId: clientId || existing.clientId,
      amountCharged:
        amountCharged !== undefined
          ? parseFloat(amountCharged)
          : existing.amountCharged,
      units: units !== undefined ? (units ? parseFloat(units) : null) : existing.units,
      description:
        description !== undefined ? description : existing.description,
      billingDate: billingDate
        ? new Date(billingDate)
        : existing.billingDate,
    },
  });

  return NextResponse.json(record);
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const existing = await prisma.billingRecord.findFirst({
    where: { id, client: { userId: session.user.id } },
  });

  if (!existing) {
    return NextResponse.json({ error: "Record not found" }, { status: 404 });
  }

  await prisma.billingRecord.delete({ where: { id } });

  return NextResponse.json({ success: true });
}