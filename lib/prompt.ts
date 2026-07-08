import type { FlightContext, TripProfile } from "./types";

/**
 * Serialises the per-trip profile into the structured JSON context block the
 * planner receives (spec §4.2). Building this from the *per-trip* profile —
 * never an accumulated global profile — is the core design decision (spec §4.1).
 */
export function contextJSON(
  profile: TripProfile,
  destination: string,
  arrival: string,
  departure: string,
  flights?: FlightContext,
) {
  return {
    destination,
    dates: { arrival, departure },
    ...(flights && (flights.arrivalAt || flights.departureAt)
      ? {
          flights: {
            ...(flights.arrivalAt ? { lands_at_destination: flights.arrivalAt } : {}),
            ...(flights.departureAt ? { return_flight_departs: flights.departureAt } : {}),
            ...(flights.outboundSummary ? { outbound: flights.outboundSummary } : {}),
            ...(flights.returnSummary ? { return: flights.returnSummary } : {}),
          },
        }
      : {}),
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

export function buildPrompt(
  profile: TripProfile,
  destination: string,
  arrival: string,
  departure: string,
  flights?: FlightContext,
): string {
  const ctx = JSON.stringify(contextJSON(profile, destination, arrival, departure, flights), null, 2);
  const notes = profile.notes?.trim();
  const hasFlights = Boolean(flights?.arrivalAt || flights?.departureAt);
  return [
    "You are an expert local travel planner. Using ONLY the trip context below,",
    "build a day-by-day itinerary covering every date from arrival to departure",
    "(inclusive). Each day has a morning, afternoon, and evening slot. Respect",
    "budget, pace, dietary needs, mobility, and traveller ages.",
    ...(hasFlights
      ? [
          "The context includes real flight times. Plan around them: on day_1,",
          "schedule nothing before the flight lands + ~90 minutes for immigration",
          "and transfer (if it lands in the afternoon/evening, keep day_1 light —",
          "e.g. check-in, a nearby stroll, dinner). On the final day, schedule",
          "nothing that ends later than 3 hours before the return flight departs.",
        ]
      : []),
    'Return STRICT JSON keyed "day_1", "day_2", … Each day is an object:',
    '{ "theme": <short day label>, "morning": {...}, "afternoon": {...},',
    '"evening": {...} }. Each slot has: activity, duration_mins, cost_pp,',
    "booking_url (optional), why (one sentence on why it fits THIS group),",
    "lat, lng.",
    "",
    'Additionally return a top-level key "pre_trip": an array of 4–8 to-dos the',
    "traveller should complete BEFORE arriving — advance bookings for any",
    "listed activity that sells out (name the specific attraction), airport",
    "transfer, local transit passes or city cards worth it for this plan,",
    "connectivity (eSIM/roaming), and anything this specific group needs",
    '(kids, dietary, mobility). Each item: { "task": <imperative one-liner>,',
    '"note": <one short sentence of practical detail> }.',
    "",
    "Trip context:",
    ctx,
    ...(notes ? ["", "Additional traveller notes (honour these):", notes] : []),
  ].join("\n");
}
