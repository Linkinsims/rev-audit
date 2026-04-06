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

  const topClients = await prisma.client.findMany({
    where: { userId },
    select: {
      id: true,
      name: true,
      audits: {
        select: { difference: true },
      },
    },
    orderBy: { name: "asc" },
  });

  const clientsWithLeakage = topClients
    .map((client) => ({
      id: client.id,
      name: client.name,
      leakage: client.audits
        .filter((a) => a.difference > 0)
        .reduce((sum, a) => sum + a.difference, 0),
    }))
    .filter((c) => c.leakage > 0)
    .sort((a, b) => b.leakage - a.leakage)
    .slice(0, 5);

  return NextResponse.json(clientsWithLeakage);
}