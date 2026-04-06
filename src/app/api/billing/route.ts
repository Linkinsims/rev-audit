import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const records = await prisma.billingRecord.findMany({
    where: { client: { userId: session.user.id } },
    include: { client: { select: { name: true } } },
    orderBy: { billingDate: "desc" },
  });

  const formatted = records.map((r) => ({
    id: r.id,
    clientId: r.clientId,
    clientName: r.client.name,
    amountCharged: r.amountCharged,
    units: r.units,
    description: r.description,
    billingDate: r.billingDate.toISOString(),
  }));

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clientId, amountCharged, units, description, billingDate } = body;

  if (!clientId || amountCharged === undefined || !billingDate) {
    return NextResponse.json(
      { error: "Client, amount, and date are required" },
      { status: 400 }
    );
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: session.user.id },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const record = await prisma.billingRecord.create({
    data: {
      clientId,
      amountCharged: parseFloat(amountCharged),
      units: units ? parseFloat(units) : null,
      description: description || null,
      billingDate: new Date(billingDate),
    },
  });

  return NextResponse.json(record);
}