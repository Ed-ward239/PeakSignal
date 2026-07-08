import { NextResponse } from "next/server";
import { getStays } from "@/lib/stays";
import type { WatchedTrip } from "@/lib/types";

/**
 * Accommodation options for a trip (spec §3.3). Runs server-side so the RapidAPI
 * key stays secret; the client posts the trip and gets back the best hotel
 * (Booking.com) and best Airbnb (airbnb19), each null when live data is
 * unavailable so the UI can fall back to a labelled estimate.
 */
export async function POST(req: Request) {
  const trip = (await req.json()) as WatchedTrip;
  const stays = await getStays(trip);
  return NextResponse.json(stays);
}
