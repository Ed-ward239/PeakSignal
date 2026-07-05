import { NextResponse } from "next/server";
import { getFlights } from "@/lib/flights";
import type { WatchedTrip } from "@/lib/types";

/**
 * Flight options for a trip (spec §3.1). Runs server-side so the RapidAPI key
 * stays secret; the client posts the trip and gets back mapped Flight[] (live
 * Booking.com data, or mock when the API is unavailable).
 */
export async function POST(req: Request) {
  const trip = (await req.json()) as WatchedTrip;
  const flights = await getFlights(trip);
  return NextResponse.json(flights);
}
