import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import type { Itinerary } from "@/lib/types";

/**
 * Persist / remove the itinerary for one trip (signed-in users only; guests
 * keep itineraries in sessionStorage). Ownership is enforced via the trip.
 */
async function ownedTrip(id: string): Promise<boolean> {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return false;
  const trip = await prisma.watchedTrip.findFirst({
    where: { id, userId: session.user.id },
    select: { id: true },
  });
  return Boolean(trip);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await ownedTrip(id))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = (await req.json()) as Itinerary;
  await prisma.itinerary.upsert({
    where: { tripId: id },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    create: { tripId: id, payload: payload as any, shareToken: payload.shareToken ?? null },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    update: { payload: payload as any, generatedAt: new Date(), shareToken: payload.shareToken ?? null },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!(await ownedTrip(id))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  await prisma.itinerary.deleteMany({ where: { tripId: id } });
  return NextResponse.json({ ok: true });
}
