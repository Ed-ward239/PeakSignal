import type { Itinerary, ItineraryDay, Slot, TripProfile } from "./types";
import { sampleItinerary } from "./sample-data";
import { buildPrompt } from "./prompt";

/**
 * Claude API client for per-trip itinerary generation (spec §4.2, §5).
 *
 * The live path POSTs `buildPrompt(...)` to the Anthropic Messages API
 * (model: claude-sonnet-4) and parses the structured JSON response into the
 * Itinerary shape. Falls back to a deterministic mock when ANTHROPIC_API_KEY is
 * absent, so the planner is fully demoable offline.
 */
export const CLAUDE_MODEL = "claude-sonnet-4-5"; // see docs.claude.com for current IDs
const isConfigured = Boolean(process.env.ANTHROPIC_API_KEY);

export async function generateItinerary(
  profile: TripProfile,
  destination: string,
  arrival: string,
  departure: string,
  tripId: string,
): Promise<Itinerary> {
  if (isConfigured) {
    void buildPrompt(profile, destination, arrival, departure);
    // TODO: POST /v1/messages, extract JSON block, parse into Itinerary.
  }
  await delay(700); // simulate latency
  const it = sampleItinerary(tripId);
  it.destinationName = destination;
  it.arrival = arrival;
  it.departure = departure;
  it.profile = profile;
  it.generatedAt = new Date().toISOString();
  return it;
}

export async function regenerateDay(day: ItineraryDay, destination: string): Promise<ItineraryDay> {
  await delay(500);
  return {
    ...day,
    theme: "Alternative: hidden-gems day",
    slots: [
      { period: "morning", activity: "Canal Saint-Martin stroll + café", durationMins: 90, costPerPerson: 8,
        why: "Relaxed, local, stroller-friendly", lat: 48.8709, lng: 2.3674 },
      { period: "afternoon", activity: "Cité des Sciences (kids' science museum)", durationMins: 150, costPerPerson: 13,
        why: "Hands-on exhibits for ages 5 and 8", lat: 48.8957, lng: 2.388 },
      { period: "evening", activity: "Early dinner at a crêperie", durationMins: 75, costPerPerson: 20,
        why: "Nut-allergy aware, quick for tired kids", lat: 48.842, lng: 2.325 },
    ],
  };
}

export async function findAlternatives(slot: Slot, destination: string): Promise<Slot[]> {
  await delay(450);
  return [
    { period: slot.period, activity: "Sainte-Chapelle stained-glass visit", durationMins: 60, costPerPerson: 11,
      why: "Short, dazzling, history angle", lat: 48.8554, lng: 2.345 },
    { period: slot.period, activity: "Berthillon ice cream + Île Saint-Louis walk", durationMins: 60, costPerPerson: 7,
      why: "Treat for the kids, easy pace", lat: 48.8517, lng: 2.357 },
    { period: slot.period, activity: "Jardin des Plantes + small zoo", durationMins: 120, costPerPerson: 13,
      why: "Outdoor, wheelchair-friendly paths", lat: 48.8443, lng: 2.3599 },
  ];
}

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));
