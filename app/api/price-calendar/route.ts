import { NextResponse } from "next/server";
import { getPriceCalendar } from "@/lib/flights";
import type { WatchedTrip } from "@/lib/types";

/**
 * Live min-price calendar (±7 days around departure) for the flexible-dates
 * heat map. Server-side (RapidAPI key); every per-date search is Redis-cached
 * and shared with the flight list, so the calendar also pre-warms date clicks.
 */
export async function POST(req: Request) {
  const trip = (await req.json()) as WatchedTrip;
  const calendar = await getPriceCalendar(trip);
  return NextResponse.json(calendar);
}
