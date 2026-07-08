import { NextResponse } from "next/server";
import { getFlights } from "@/lib/flights";
import type { WatchedTrip } from "@/lib/types";

/**
 * Flight options for a trip (spec §3.1). Runs server-side so the RapidAPI key
 * stays secret; the client posts the trip and gets back `{ flights, degraded }`
 * — `degraded` is true when the provider refused us (rate limit / quota), so
 * the UI can say that instead of implying no flights exist.
 */
export async function POST(req: Request) {
  const trip = (await req.json()) as WatchedTrip;
  const result = await getFlights(trip);
  return NextResponse.json(result);
}
