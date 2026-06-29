import { NextResponse } from "next/server";
import { generateItinerary } from "@/lib/claude";

/**
 * Claude itinerary generation (spec §4.2, §6.2). Production parses the Claude
 * JSON response and persists to itineraries + itinerary_days.
 */
export async function POST(req: Request) {
  const { profile, destination, arrival, departure, tripId } = await req.json();
  const itinerary = await generateItinerary(profile, destination, arrival, departure, tripId ?? "trip");
  return NextResponse.json(itinerary);
}
