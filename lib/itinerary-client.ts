import type { FlightContext, Itinerary, ItineraryDay, Slot, TripProfile } from "./types";

/**
 * Client-side wrappers for the itinerary API routes. Generation runs on the
 * server (lib/gemini.ts — the GEMINI_API_KEY must never reach the browser);
 * these keep the old lib call signatures so components stay unchanged.
 */
async function post<T>(url: string, body: unknown): Promise<T> {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!r.ok) throw new Error(`${url} → ${r.status}`);
  return r.json() as Promise<T>;
}

export function generateItinerary(
  profile: TripProfile,
  destination: string,
  arrival: string,
  departure: string,
  tripId: string,
  flights?: FlightContext,
): Promise<Itinerary> {
  return post<Itinerary>("/api/itinerary", { profile, destination, arrival, departure, tripId, flights });
}

export function regenerateDay(day: ItineraryDay, destination: string): Promise<ItineraryDay> {
  return post<ItineraryDay>("/api/itinerary/regenerate", { day, destination });
}

export function findAlternatives(slot: Slot, destination: string): Promise<Slot[]> {
  return post<Slot[]>("/api/itinerary/alternatives", { slot, destination });
}
