import { addDays, formatISO, startOfDay } from "date-fns";
import type { Itinerary, PricePoint, TripProfile, WatchedTrip } from "./types";

/**
 * Deterministic sample data so the app is fully demoable with zero API keys,
 * DB, or auth (spec §9 — works against mock data out of the box). The landing
 * page and watchlist seed from this; production swaps in PostgreSQL.
 */

type Curve = "dip" | "rising" | "peak";

const iso = (d: Date) => formatISO(startOfDay(d), { representation: "date" });
const today = startOfDay(new Date());

/** 90 days of deterministic daily flight prices ending today. */
export function flightHistory(base: number, curve: Curve): PricePoint[] {
  const days = 90;
  const start = addDays(today, -(days - 1));
  const points: PricePoint[] = [];
  for (let i = 0; i < days; i++) {
    let avg = base + base * 0.1 * Math.sin(i / 13) + base * 0.04 * Math.sin(i / 5 + 1.3);
    const tailStart = days - 12;
    if (i >= tailStart) {
      const k = (i - tailStart) / 12;
      if (curve === "dip") avg -= base * 0.18 * k;
      if (curve === "rising") avg += base * 0.22 * k;
      if (curve === "peak") avg += base * 0.3 * k;
    }
    points.push({
      date: iso(addDays(start, i)),
      low: Math.round(avg * 0.96),
      high: Math.round(avg * 1.05),
      average: Math.round(avg),
      category: "flight",
    });
  }
  return points;
}

let counter = 0;
const id = (prefix: string) => `${prefix}_${(counter++).toString(36)}${base36(today.getTime())}`;
const base36 = (n: number) => n.toString(36);

export function sampleTrips(): WatchedTrip[] {
  return [
    {
      id: "trip_paris",
      origin: "JFK",
      destination: "CDG",
      destinationName: "Paris, France",
      departDate: iso(addDays(today, 18)),
      returnDate: iso(addDays(today, 28)),
      travellers: 4,
      targetPrice: 800,
      createdAt: iso(today),
      isBooking: true,
      priceHistory: flightHistory(940, "dip"),
    },
    {
      id: "trip_tokyo",
      origin: "SFO",
      destination: "HND",
      destinationName: "Tokyo, Japan",
      departDate: iso(addDays(today, 64)),
      returnDate: iso(addDays(today, 78)),
      travellers: 2,
      targetPrice: 1100,
      createdAt: iso(addDays(today, -1)),
      isBooking: false,
      priceHistory: flightHistory(1180, "rising"),
    },
    {
      id: "trip_lisbon",
      origin: "BOS",
      destination: "LIS",
      destinationName: "Lisbon, Portugal",
      departDate: iso(addDays(today, 41)),
      returnDate: iso(addDays(today, 50)),
      travellers: 1,
      createdAt: iso(addDays(today, -2)),
      isBooking: false,
      priceHistory: flightHistory(690, "peak"),
    },
  ];
}

export const sampleProfile: TripProfile = {
  group: "family",
  travellers: [
    { age: 38, role: "adult" },
    { age: 36, role: "adult" },
    { age: 8, role: "child" },
    { age: 5, role: "child" },
  ],
  budgetPerPersonPerDay: 120,
  pace: "relaxed",
  interests: ["food", "art", "history"],
  dietary: ["nut_allergy"],
  mobility: "standard",
};

/** The spec §4.2 Paris family itinerary. */
export function sampleItinerary(tripId = "trip_paris"): Itinerary {
  const arrival = addDays(today, 18);
  return {
    id: "itin_paris",
    tripId,
    destinationName: "Paris, France",
    arrival: iso(arrival),
    departure: iso(addDays(today, 28)),
    generatedAt: new Date().toISOString(),
    profile: sampleProfile,
    days: [
      {
        id: "day_0",
        date: iso(arrival),
        theme: "Arrival + Left Bank orientation",
        dayIndex: 0,
        slots: [
          { period: "morning", activity: "Walk Rue Cler market", durationMins: 90, costPerPerson: 0,
            why: "Easy, child-friendly, no booking needed — perfect first morning", lat: 48.8566, lng: 2.3066 },
          { period: "afternoon", activity: "Eiffel Tower (timed entry)", durationMins: 150, costPerPerson: 26,
            bookingUrl: "https://tickets.toureiffel.paris",
            why: "Children this age remember it forever — do it Day 1", lat: 48.8584, lng: 2.2945 },
          { period: "evening", activity: "Dinner at Café Procope", durationMins: 90, costPerPerson: 45,
            why: "Historic, nut-allergy friendly, child menu available", lat: 48.853, lng: 2.3387 },
        ],
      },
      {
        id: "day_1",
        date: iso(addDays(arrival, 1)),
        theme: "Art morning, garden afternoon",
        dayIndex: 1,
        slots: [
          { period: "morning", activity: "Musée d'Orsay (Impressionist highlights)", durationMins: 120, costPerPerson: 16,
            bookingUrl: "https://www.musee-orsay.fr",
            why: "Art interest, kept short for the kids — Orsay over the Louvre queue", lat: 48.86, lng: 2.3266 },
          { period: "afternoon", activity: "Jardin du Luxembourg + toy sailboats", durationMins: 120, costPerPerson: 4,
            why: "Relaxed pace, playground and pond — kids run, adults rest", lat: 48.8462, lng: 2.3372 },
          { period: "evening", activity: "Crêperie dinner in Montparnasse", durationMins: 75, costPerPerson: 22,
            why: "Budget-friendly, nut-allergy aware, classic family choice", lat: 48.8421, lng: 2.322 },
        ],
      },
    ],
  };
}
