import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { prisma } from "@/lib/prisma";

/**
 * All of the signed-in user's itineraries, keyed by trip id — loaded by the
 * client store alongside trips. Guests never call this (sessionStorage mode).
 */
export async function GET() {
  const { data: session } = await auth.getSession();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const rows = await prisma.itinerary.findMany({
    where: { trip: { userId: session.user.id } },
    select: { tripId: true, payload: true },
  });
  return NextResponse.json(Object.fromEntries(rows.map((r) => [r.tripId, r.payload])));
}
