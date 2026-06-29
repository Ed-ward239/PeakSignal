import { NextResponse } from "next/server";
import { differenceInCalendarDays, parseISO } from "date-fns";
import { getFlightHistory } from "@/lib/amadeus";
import { computeVerdict } from "@/lib/verdict";

/**
 * Price fetch + verdict endpoint (spec §6.2). Returns 90-day history and the
 * buy/wait verdict. Production caches Amadeus responses in Redis.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const origin = searchParams.get("origin") ?? "JFK";
  const destination = searchParams.get("destination") ?? "CDG";
  const depart = searchParams.get("depart");

  const history = await getFlightHistory(origin, destination);
  const daysToDeparture = depart ? differenceInCalendarDays(parseISO(depart), new Date()) : 30;
  const verdict = computeVerdict(history, daysToDeparture);

  return NextResponse.json({ history, verdict });
}
