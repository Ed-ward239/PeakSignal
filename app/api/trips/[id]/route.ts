import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import type { WatchedTrip } from "@/lib/types";

/** Update / delete a single watched trip, scoped to the signed-in Neon Auth user. */
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const b = (await req.json()) as Partial<WatchedTrip>;
  await prisma.watchedTrip.updateMany({
    where: { id, userId: session.user.id },
    data: {
      ...(b.travellers != null ? { travellers: b.travellers } : {}),
      ...(b.targetPrice != null ? { targetPrice: b.targetPrice } : {}),
      ...(b.isBooking != null ? { isBooking: b.isBooking } : {}),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ...(b.selectedFlights !== undefined ? { selectedFlights: b.selectedFlights as any } : {}),
    },
  });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  await prisma.watchedTrip.deleteMany({ where: { id, userId: session.user.id } });
  return NextResponse.json({ ok: true });
}
