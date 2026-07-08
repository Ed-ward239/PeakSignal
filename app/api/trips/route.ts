import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";
import type { WatchedTrip } from "@/lib/types";

/**
 * Per-user watched trips (spec §6.2). Requires a Neon Auth session; the client
 * store only calls these when signed in, otherwise it uses localStorage.
 *
 * Price history lives in the price_history table (filled by the cron poller);
 * it starts empty here, and the Prices view shows the current price from live
 * flight search until history accrues.
 */
type DbTrip = {
  id: string; origin: string; destination: string; destinationName: string;
  departDate: Date; returnDate: Date; travellers: number;
  targetPrice: number | null; isBooking: boolean; createdAt: Date;
  selectedFlights: unknown;
};

function toClient(t: DbTrip): WatchedTrip {
  return {
    id: t.id,
    origin: t.origin,
    destination: t.destination,
    destinationName: t.destinationName,
    departDate: t.departDate.toISOString().slice(0, 10),
    returnDate: t.returnDate.toISOString().slice(0, 10),
    roundTrip: true,
    travellers: t.travellers,
    targetPrice: t.targetPrice ?? undefined,
    createdAt: t.createdAt.toISOString(),
    isBooking: t.isBooking,
    priceHistory: [],
    selectedFlights: (t.selectedFlights as WatchedTrip["selectedFlights"]) ?? undefined,
  };
}

export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const trips = await prisma.watchedTrip.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(trips.map(toClient));
}

export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const b = (await req.json()) as Partial<WatchedTrip>;
  const created = await prisma.watchedTrip.create({
    data: {
      ...(b.id ? { id: b.id } : {}),
      userId: session.user.id,
      origin: b.origin ?? "",
      destination: b.destination ?? "",
      destinationName: b.destinationName ?? "",
      departDate: new Date(b.departDate ?? Date.now()),
      returnDate: new Date(b.returnDate ?? Date.now()),
      travellers: b.travellers ?? 1,
      targetPrice: b.targetPrice ?? null,
      isBooking: b.isBooking ?? false,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      selectedFlights: (b.selectedFlights as any) ?? undefined,
    },
  });
  return NextResponse.json(toClient(created), { status: 201 });
}
