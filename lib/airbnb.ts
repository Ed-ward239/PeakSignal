import type { StayQuote } from "./types";

/**
 * RapidAPI Airbnb scraper client (spec §5, §9).
 *
 * Airbnb has no official public API; the scraper is fragile and may be blocked —
 * documented honestly in the README. Falls back to mock data without a key.
 */
const isConfigured = Boolean(process.env.RAPIDAPI_KEY);

export async function getBestAirbnb(destination: string): Promise<StayQuote> {
  if (!isConfigured) {
    return {
      kind: "airbnb", name: "Sunny 1BR near Bastille", pricePerNight: 142,
      cancellation: "Non-refundable", refundable: false, locationScore: 7.4, superhost: true,
    };
  }
  // TODO: GET RapidAPI Airbnb search → pick best value → map to StayQuote.
  return {
    kind: "airbnb", name: "Sunny 1BR near Bastille", pricePerNight: 142,
    cancellation: "Non-refundable", refundable: false, locationScore: 7.4, superhost: true,
  };
}
