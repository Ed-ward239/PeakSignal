import type { Flight, WatchedTrip } from "./types";
import { rapidGet, BOOKING_BASE } from "./rapidapi";

/**
 * Flight options for a route (spec §3.1). Live from Booking.com (RapidAPI)
 * `flights/searchFlights`. No mock data — returns [] when unavailable so the UI
 * shows an honest empty state. MUST be called server-side (the RapidAPI key is
 * secret) — the UI calls it via /api/flights.
 */

/** Deep link to book the route+dates (Kayak handles this URL format well). */
export function bookingUrl(trip: WatchedTrip): string {
  const base = `https://www.kayak.com/flights/${trip.origin}-${trip.destination}/${trip.departDate}`;
  return trip.roundTrip ? `${base}/${trip.returnDate}` : base;
}

const hhmm = (iso?: string): string => (iso ? iso.slice(11, 16) : "");

/**
 * Resolve a user input into a Booking.com flight location id. A 3-letter code
 * maps directly to `{CODE}.AIRPORT`; anything else (a city/name) is looked up
 * via searchDestination, preferring the CITY id (covers all its airports).
 */
async function resolveLocationId(input: string): Promise<string | null> {
  const code = input.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(code)) return `${code}.AIRPORT`;

  const d = await rapidGet(BOOKING_BASE, "/flights/searchDestination", { query: input.trim() });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = d?.data ?? [];
  const city = items.find((i) => i.type === "CITY");
  const airport = items.find((i) => i.type === "AIRPORT");
  return city?.id ?? airport?.id ?? items[0]?.id ?? null;
}

export async function getFlights(trip: WatchedTrip): Promise<Flight[]> {
  const [fromId, toId] = await Promise.all([
    resolveLocationId(trip.origin),
    resolveLocationId(trip.destination),
  ]);
  if (!fromId || !toId) return [];

  const data = await rapidGet(BOOKING_BASE, "/flights/searchFlights", {
    fromId,
    toId,
    departDate: trip.departDate,
    returnDate: trip.roundTrip ? trip.returnDate : undefined,
    adults: trip.travellers || 1,
    sort: "CHEAPEST",
    cabinClass: "ECONOMY",
    currency_code: "USD",
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offers: any[] = data?.data?.flightOffers ?? [];
  if (!Array.isArray(offers) || offers.length === 0) return [];

  const url = bookingUrl(trip);
  const flights: Flight[] = [];
  for (let i = 0; i < offers.length; i++) {
    const o = offers[i];
    const seg = o?.segments?.[0];
    if (!seg) continue;
    const leg = seg.legs?.[0] ?? {};
    const carrier = leg.carriersData?.[0] ?? {};
    const total = o?.priceBreakdown?.total;
    const price = total ? (total.units ?? 0) + (total.nanos ?? 0) / 1e9 : 0;
    flights.push({
      id: String(o.token ?? `${trip.id}-fl-${i}`),
      airline: carrier.name ?? "Airline",
      flightNumber: [carrier.code, leg.flightInfo?.flightNumber].filter(Boolean).join(" "),
      departTime: hhmm(seg.departureTime),
      arriveTime: hhmm(seg.arrivalTime),
      durationMins: Math.round((seg.totalTime ?? 0) / 60),
      stops: Math.max(0, (seg.legs?.length ?? 1) - 1),
      price: Math.round(price),
      bookingUrl: url,
    });
  }
  flights.sort((a, b) => a.price - b.price);
  return flights;
}
