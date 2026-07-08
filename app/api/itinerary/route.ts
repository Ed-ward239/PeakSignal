import { NextResponse } from "next/server";
import { generateItinerary } from "@/lib/gemini";

/**
 * Gemini itinerary generation (spec §4.2, §6.2). Production also persists to
 * itineraries + itinerary_days; the client store keeps them locally today.
 */
export async function POST(req: Request) {
  const { profile, destination, arrival, departure, tripId, flights } = await req.json();
  const itinerary = await generateItinerary(profile, destination, arrival, departure, tripId ?? "trip", flights);
  return NextResponse.json(itinerary);
}
