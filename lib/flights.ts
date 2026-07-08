import { addDays, differenceInCalendarDays, formatISO, parseISO } from "date-fns";
import type { Flight, FlightLeg, WatchedTrip } from "./types";
import { rapidGet, isDegraded, BOOKING_BASE, TTL_LOOKUP, TTL_SEARCH } from "./rapidapi";

/**
 * Flight options for a route (spec §3.1). Live from Booking.com (RapidAPI)
 * `flights/searchFlights`. No mock data — returns no flights when unavailable,
 * with `degraded: true` when that emptiness is the provider refusing us (rate
 * limit / quota) rather than a genuine no-results, so the UI can say which.
 * MUST be called server-side (the RapidAPI key is secret) — via /api/flights.
 */

export interface FlightSearch {
  /** Outbound options, cheapest first. `price` is the round-trip total. */
  flights: Flight[];
  /** Return-leg options for round trips (same offers, second segment). */
  returnFlights: Flight[];
  /** True when the upstream API refused the request (e.g. 429 quota). */
  degraded: boolean;
}

/** Deep link to book the route+dates (Kayak handles this URL format well). */
export function bookingUrl(trip: WatchedTrip): string {
  const base = `https://www.kayak.com/flights/${trip.origin}-${trip.destination}/${trip.departDate}`;
  return trip.roundTrip ? `${base}/${trip.returnDate}` : base;
}

const hhmm = (iso?: string): string => (iso ? iso.slice(11, 16) : "");

/** A user input ("PARIS", "CDG", "tokyo") resolved to a canonical place. */
export interface ResolvedPlace {
  /** IATA-style code — airport (CDG) or metro/city (PAR, TYO). */
  code: string;
  /** Display name, e.g. "Paris, France". */
  name: string;
  /** Booking.com flight location id, e.g. "PAR.CITY" / "CDG.AIRPORT". */
  locationId: string;
}

/**
 * Resolve free-text input via searchDestination (Redis-cached for 30 days).
 * Preference: exact code match (typed "CDG" means that airport) → CITY (covers
 * all its airports) → first result. The display name prefers the city entry so
 * a typed airport code still titles as "Paris, France".
 */
export async function resolvePlace(input: string): Promise<{ place: ResolvedPlace | null; degraded: boolean }> {
  const q = input.trim();
  if (!q) return { place: null, degraded: false };
  const d = await rapidGet(BOOKING_BASE, "/flights/searchDestination", { query: q }, TTL_LOOKUP);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const items: any[] = d.data?.data ?? [];
  const upper = q.toUpperCase();
  const exact = items.find((i) => i.code === upper);
  const airport = items.find((i) => i.type === "AIRPORT");
  const city = items.find((i) => i.type === "CITY");
  // Prefer the primary AIRPORT so trips display a real airport code (JFK → CDG,
  // not JFK → PARIS); exact code matches always win (typed "CDG" means CDG).
  const it = exact ?? airport ?? city ?? items[0];
  if (!it?.code || !it?.id) return { place: null, degraded: isDegraded(d.status) };

  const named = city ?? it; // prefer the city's clean name for the title
  const name = named.countryName ? `${named.name}, ${named.countryName}` : named.name ?? it.code;
  return { place: { code: it.code, name, locationId: it.id }, degraded: false };
}

/**
 * Resolve input to a Booking.com flight location id for search. Uses the same
 * cached lookup as resolvePlace, so metro codes stored on trips ("PAR") map to
 * "PAR.CITY" instead of a bogus "PAR.AIRPORT". Falls back to `{CODE}.AIRPORT`
 * for 3-letter codes when the lookup returns nothing.
 */
async function resolveLocationId(input: string): Promise<{ id: string | null; degraded: boolean }> {
  const { place, degraded } = await resolvePlace(input);
  if (place) return { id: place.locationId, degraded: false };
  const code = input.trim().toUpperCase();
  if (/^[A-Z]{3}$/.test(code)) return { id: `${code}.AIRPORT`, degraded };
  return { id: null, degraded };
}

/** One searchFlights call (Redis-cached); returns the raw offers. */
async function searchOnce(
  trip: WatchedTrip,
  fromId: string,
  toId: string,
  sort: "CHEAPEST" | "BEST" | "FASTEST",
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<{ offers: any[]; degraded: boolean }> {
  const res = await rapidGet(BOOKING_BASE, "/flights/searchFlights", {
    fromId,
    toId,
    departDate: trip.departDate,
    returnDate: trip.roundTrip ? trip.returnDate : undefined,
    adults: trip.travellers || 1,
    sort,
    cabinClass: "ECONOMY",
    currency_code: "USD",
  }, TTL_SEARCH);
  const offers = res.data?.data?.flightOffers;
  return { offers: Array.isArray(offers) ? offers : [], degraded: isDegraded(res.status) };
}

const MAX_RESULTS = 50;

export async function getFlights(trip: WatchedTrip): Promise<FlightSearch> {
  const [from, to] = await Promise.all([
    resolveLocationId(trip.origin),
    resolveLocationId(trip.destination),
  ]);
  if (!from.id || !to.id) return { flights: [], returnFlights: [], degraded: from.degraded || to.degraded };

  // The API caps each search at ~15 offers and ignores pageNo, so one sort
  // yields a shallow, samey pool (often zero nonstops). Merging three sort
  // orders triples the pool (~45 unique bundles) — client-side price sort
  // still puts the cheapest first, capped at MAX_RESULTS.
  const results = await Promise.all(
    (["CHEAPEST", "BEST", "FASTEST"] as const).map((s) => searchOnce(trip, from.id!, to.id!, s)),
  );
  const seenTokens = new Set<string>();
  const offers = results
    .flatMap((r) => r.offers)
    .filter((o) => {
      const t = String(o?.token ?? "");
      if (!t || seenTokens.has(t)) return false;
      seenTokens.add(t);
      return true;
    });
  const degraded = offers.length === 0 && results.some((r) => r.degraded);
  if (offers.length === 0) return { flights: [], returnFlights: [], degraded };

  // Each round-trip offer carries two segments: [0] outbound, [1] return. The
  // offer price is the round-trip total, shown on both directions' entries.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const segmentToFlight = (o: any, segIdx: number, i: number, url: string): Flight | null => {
    const seg = o?.segments?.[segIdx];
    if (!seg) return null;
    const leg = seg.legs?.[0] ?? {};
    const carrier = leg.carriersData?.[0] ?? {};
    const total = o?.priceBreakdown?.total;
    const price = total ? (total.units ?? 0) + (total.nanos ?? 0) / 1e9 : 0;
    // Per-leg detail for the expanded view (layover airports & durations).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const legs: FlightLeg[] = (seg.legs ?? []).map((l: any) => {
      const c = l.carriersData?.[0] ?? {};
      return {
        departTime: String(l.departureTime ?? ""),
        arriveTime: String(l.arrivalTime ?? ""),
        fromCode: l.departureAirport?.code ?? "",
        fromName: l.departureAirport?.name ?? "",
        toCode: l.arrivalAirport?.code ?? "",
        toName: l.arrivalAirport?.name ?? "",
        airline: c.name ?? "Airline",
        flightNumber: [c.code, l.flightInfo?.flightNumber].filter(Boolean).join(" "),
        durationMins: Math.round((l.totalTime ?? 0) / 60),
      };
    });
    return {
      id: `${String(o.token ?? `${trip.id}-fl-${i}`)}-s${segIdx}`,
      airline: carrier.name ?? "Airline",
      flightNumber: [carrier.code, leg.flightInfo?.flightNumber].filter(Boolean).join(" "),
      departTime: hhmm(seg.departureTime),
      arriveTime: hhmm(seg.arrivalTime),
      durationMins: Math.round((seg.totalTime ?? 0) / 60),
      stops: Math.max(0, (seg.legs?.length ?? 1) - 1),
      price: Math.round(price),
      bookingUrl: url,
      legs,
    };
  };

  const url = bookingUrl(trip);
  const flights: Flight[] = [];
  const returnFlights: Flight[] = [];
  for (let i = 0; i < offers.length; i++) {
    const out = segmentToFlight(offers[i], 0, i, url);
    if (!out) continue;
    flights.push(out);
    const back = segmentToFlight(offers[i], 1, i, url);
    if (back) returnFlights.push(back);
  }
  const byPrice = (a: Flight, b: Flight) => a.price - b.price;
  flights.sort(byPrice);
  returnFlights.sort(byPrice);
  // Booking returns one offer per outbound×return bundle, so the same physical
  // flight shows up once per pairable opposite leg. Dedupe by leg signature,
  // keeping the cheapest bundle (lists are price-sorted above).
  const dedupe = (list: Flight[]): Flight[] => {
    const seen = new Set<string>();
    return list.filter((f) => {
      const sig = (f.legs ?? []).map((l) => `${l.flightNumber}@${l.departTime}`).join("|") || f.id;
      if (seen.has(sig)) return false;
      seen.add(sig);
      return true;
    });
  };
  return {
    flights: dedupe(flights).slice(0, MAX_RESULTS),
    returnFlights: dedupe(returnFlights).slice(0, MAX_RESULTS),
    degraded,
  };
}

/**
 * Real min-price calendar for the flexible-dates heat map: ONE CHEAPEST-sorted
 * search per departure date in ±`spread` days (return shifted to keep trip
 * length) — accurate minimums at a third of the cost of the 3-sort list search.
 * Each search is Redis-cached; runs in small batches for the per-second rate
 * limit. Value = cheapest offer's party total; null = no price for that date.
 */
export async function getPriceCalendar(trip: WatchedTrip, spread = 7): Promise<Record<string, number | null>> {
  const [from, to] = await Promise.all([
    resolveLocationId(trip.origin),
    resolveLocationId(trip.destination),
  ]);
  if (!from.id || !to.id) return {};

  const anchor = parseISO(trip.departDate);
  const dates = Array.from({ length: spread * 2 + 1 }, (_, i) =>
    formatISO(addDays(anchor, i - spread), { representation: "date" }),
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const offerTotal = (o: any): number => {
    const t = o?.priceBreakdown?.total;
    return t ? (t.units ?? 0) + (t.nanos ?? 0) / 1e9 : Infinity;
  };

  const out: Record<string, number | null> = {};
  // All dates fire in parallel — the paid RapidAPI plan's per-second allowance
  // (50/s) comfortably covers 15 concurrent searches. If ever back on the free
  // tier, restore batching here (chunks of ~5) to avoid per-second 429s.
  await Promise.all(
    dates.map(async (d) => {
      const delta = differenceInCalendarDays(parseISO(d), anchor);
      const returnDate = trip.roundTrip
        ? formatISO(addDays(parseISO(trip.returnDate), delta), { representation: "date" })
        : trip.returnDate;
      const { offers } = await searchOnce(
        { ...trip, departDate: d, returnDate }, from.id!, to.id!, "CHEAPEST",
      ).catch(() => ({ offers: [], degraded: true }));
      const min = offers.reduce((m, o) => Math.min(m, offerTotal(o)), Infinity);
      out[d] = Number.isFinite(min) ? Math.round(min) : null;
    }),
  );
  return out;
}
