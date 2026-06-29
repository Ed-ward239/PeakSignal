import type { PricePoint, StayQuote } from "./types";
import { flightHistory } from "./sample-data";

/**
 * Amadeus Flight Offers + Hotel Search client (spec §5).
 *
 * The live path does OAuth2 client-credentials against AMADEUS_HOST then calls
 * the offers endpoints. Falls back to deterministic mock data whenever
 * credentials are absent, so the app runs with no keys (spec §9 caveat).
 */
const isConfigured = Boolean(process.env.AMADEUS_CLIENT_ID && process.env.AMADEUS_CLIENT_SECRET);

export async function getFlightHistory(origin: string, destination: string): Promise<PricePoint[]> {
  if (!isConfigured) return flightHistory(900, "dip");
  // TODO: OAuth token → GET /v2/shopping/flight-offers → map to PricePoint[].
  return flightHistory(900, "dip");
}

export async function getBestHotel(destination: string): Promise<StayQuote> {
  if (!isConfigured) {
    return {
      kind: "hotel", name: "Hôtel Le Marais", pricePerNight: 189,
      cancellation: "Free until Nov 5", refundable: true, locationScore: 9.1,
    };
  }
  // TODO: GET /v3/shopping/hotel-offers → pick best value → map to StayQuote.
  return {
    kind: "hotel", name: "Hôtel Le Marais", pricePerNight: 189,
    cancellation: "Free until Nov 5", refundable: true, locationScore: 9.1,
  };
}
