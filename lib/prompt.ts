import type { TripProfile } from "./types";

/**
 * Serialises the per-trip profile into the structured JSON context block Claude
 * receives (spec §4.2). Building this from the *per-trip* profile — never an
 * accumulated global profile — is the core design decision (spec §4.1).
 */
export function contextJSON(profile: TripProfile, destination: string, arrival: string, departure: string) {
  return {
    destination,
    dates: { arrival, departure },
    profile: {
      group: profile.group,
      travellers: profile.travellers,
      budget_per_person_per_day: profile.budgetPerPersonPerDay,
      pace: profile.pace,
      interests: profile.interests,
      dietary: profile.dietary,
      mobility: profile.mobility,
    },
  };
}

export function buildPrompt(profile: TripProfile, destination: string, arrival: string, departure: string): string {
  const ctx = JSON.stringify(contextJSON(profile, destination, arrival, departure), null, 2);
  return [
    "You are an expert local travel planner. Using ONLY the trip context below,",
    "build a day-by-day itinerary. Each day has a morning, afternoon, and evening",
    "slot. Respect budget, pace, dietary needs, mobility, and traveller ages.",
    'Return STRICT JSON keyed "day_1", "day_2", … Each slot has: activity,',
    "duration_mins, cost_pp, booking_url (optional), why (one sentence on why it",
    "fits THIS group), lat, lng.",
    "",
    "Trip context:",
    ctx,
  ].join("\n");
}
