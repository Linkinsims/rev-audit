import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { authOptions } from "@/lib/auth";

export async function GET() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contracts = await prisma.contract.findMany({
    where: { client: { userId: session.user.id } },
    include: { client: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });

  const formatted = contracts.map((c) => ({
    id: c.id,
    clientId: c.clientId,
    name: c.name,
    description: c.description,
    clientName: c.client.name,
  }));

  return NextResponse.json(formatted);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { clientId, name, description } = body;

  if (!clientId || !name) {
    return NextResponse.json({ error: "Client and name are required" }, { status: 400 });
  }

  const client = await prisma.client.findFirst({
    where: { id: clientId, userId: session.user.id },
  });

  if (!client) {
    return NextResponse.json({ error: "Client not found" }, { status: 404 });
  }

  const contract = await prisma.contract.create({
    data: {
      clientId,
      name,
      description: description || null,
    },
  });

  return NextResponse.json(contract);
}