import type { StayQuote, WatchedTrip } from "./types";
import { rapidGet, isDegraded, BOOKING_BASE, AIRBNB_BASE, TTL_LOOKUP, TTL_SEARCH } from "./rapidapi";
import { nightsBetween } from "./format";

/**
 * Accommodation search for the "Where to stay" compare (spec §3.3).
 *
 * Hotels come from Booking.com (RapidAPI, `/hotels/*`) and are location-accurate.
 * Airbnb comes from the airbnb19 scraper (`/api/v2/searchPropertyByLocation`),
 * which is fragile — it sometimes ignores the location filter — so we GUARD the
 * result: only listings whose city matches the destination are accepted, else we
 * return null and the UI shows a labelled estimate instead of wrong-city data.
 *
 * MUST run server-side (the RapidAPI key is secret) — the UI calls /api/stays.
 * Each getter returns null when unavailable so the caller can fall back honestly.
 */

// airbnb19 has both /api/v1 and /api/v2 endpoints; AIRBNB_BASE points at /api/v1,
// so derive the host root to reach the v2 search endpoint.
const AIRBNB_ROOT = AIRBNB_BASE.replace(/\/api\/v\d+\/?$/, "");

/** "Paris, France" / "Paris (CDG)" → "paris" for a loose city-match check. */
function cityKey(name: string): string {
  return name.split(/[,(]/)[0].trim().toLowerCase();
}

/** Parse a money string like "$1,084 USD" → 1084. */
function parseMoney(s?: string): number {
  if (!s) return 0;
  const n = Number(s.replace(/[^0-9.]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

/** Best-value hotel from Booking.com for the trip dates (highest-rated with a price). */
async function getBestHotel(
  trip: WatchedTrip,
  nights: number,
): Promise<{ quote: StayQuote | null; degraded: boolean }> {
  const dest = await rapidGet(BOOKING_BASE, "/hotels/searchDestination", { query: trip.destinationName }, TTL_LOOKUP);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const loc = (dest.data?.data ?? []).find((d: any) => d?.dest_id) ?? dest.data?.data?.[0];
  if (!loc?.dest_id) return { quote: null, degraded: isDegraded(dest.status) };

  const { status, data } = await rapidGet(BOOKING_BASE, "/hotels/searchHotels", {
    dest_id: loc.dest_id,
    search_type: loc.search_type || "city",
    arrival_date: trip.departDate,
    departure_date: trip.returnDate,
    adults: trip.travellers || 1,
    room_qty: 1,
    page_number: 1,
    currency_code: "USD",
    sort_by: "class_and_price",
  }, TTL_SEARCH);

  const degraded = isDegraded(status);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hotels: any[] = data?.data?.hotels ?? [];
  const priced = hotels
    .map((h) => ({ h, p: h?.property }))
    .filter(({ p }) => p?.priceBreakdown?.grossPrice?.value > 0);
  if (priced.length === 0) return { quote: null, degraded };

  // "Best" = highest review score, tie-broken by lower price.
  priced.sort((a, b) => {
    const rs = (b.p.reviewScore ?? 0) - (a.p.reviewScore ?? 0);
    if (rs !== 0) return rs;
    return a.p.priceBreakdown.grossPrice.value - b.p.priceBreakdown.grossPrice.value;
  });

  const { h, p } = priced[0];
  const total = p.priceBreakdown.grossPrice.value as number;
  const label: string = h.accessibilityLabel ?? "";
  const refundable = /free cancellation/i.test(label);
  return {
    quote: {
      kind: "hotel",
      name: p.name ?? "Hotel",
      pricePerNight: Math.round(total / Math.max(1, nights)),
      cancellation: refundable ? "Free cancellation" : "See rate options",
      refundable,
      locationScore: typeof p.reviewScore === "number" ? p.reviewScore : 8,
    },
    degraded,
  };
}

/** Best-value Airbnb for the destination, guarded so it only returns a city match. */
async function getBestAirbnb(
  trip: WatchedTrip,
  nights: number,
): Promise<{ quote: StayQuote | null; degraded: boolean }> {
  const { status, data } = await rapidGet(AIRBNB_ROOT, "/api/v2/searchPropertyByLocation", {
    query: trip.destinationName,
    checkin: trip.departDate,
    checkout: trip.returnDate,
    adults: trip.travellers || 1,
    currency: "USD",
    totalRecords: 20,
  }, TTL_SEARCH);

  const degraded = isDegraded(status);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const list: any[] = data?.data?.list ?? [];
  const want = cityKey(trip.destinationName);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const matches = list.filter((it: any) => {
    const city: string = (it?.listing?.city ?? "").toLowerCase();
    return city && (city.includes(want) || want.includes(city));
  });
  // The airbnb19 endpoint sometimes ignores the location filter and returns
  // global listings. If nothing matches the destination, bail to a fallback
  // rather than show wrong-city results.
  if (matches.length === 0) return { quote: null, degraded };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const quotes = matches.map((it: any) => {
    const price = it?.structuredDisplayPrice?.primaryLine;
    const total = parseMoney(price?.discountedPrice ?? price?.originalPrice);
    const perNightDesc: string =
      it?.structuredDisplayPrice?.explanationData?.priceDetails?.[0]?.items?.[0]?.description ?? "";
    const perNightMatch = perNightDesc.match(/x\s*\$([0-9,.]+)/);
    const perNight = perNightMatch ? parseMoney(perNightMatch[1]) : total / Math.max(1, nights);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const superhost = (it?.badges ?? []).some((b: any) => b?.loggingContext?.badgeType === "SUPERHOST");
    return {
      kind: "airbnb" as const,
      name: it?.listing?.name ?? it?.listing?.title ?? "Airbnb stay",
      pricePerNight: Math.round(perNight),
      cancellation: "See listing policy",
      refundable: false,
      // Airbnb search gives no comparable location score; approximate so the
      // hotel-vs-airbnb location comparison stays meaningful.
      locationScore: superhost ? 8.5 : 8,
      superhost,
      _total: total,
    };
  }).filter((q) => q.pricePerNight > 0);
  if (quotes.length === 0) return { quote: null, degraded };

  // "Best" = superhost first, then cheapest per night.
  quotes.sort((a, b) => Number(b.superhost) - Number(a.superhost) || a.pricePerNight - b.pricePerNight);
  const { _total, ...best } = quotes[0];
  void _total;
  return { quote: best, degraded };
}

export interface StaysResult {
  hotel: StayQuote | null;
  airbnb: StayQuote | null;
  /** True when an upstream API refused us (rate limit / quota) — the UI shows
   *  "provider limit reached" instead of implying nothing is available. */
  degraded: boolean;
}

/** Both sides for the trip, run in series to stay under the RapidAPI rate limit. */
export async function getStays(trip: WatchedTrip): Promise<StaysResult> {
  const nights = nightsBetween(trip.departDate, trip.returnDate);
  const hotel = await getBestHotel(trip, nights).catch(() => ({ quote: null, degraded: false }));
  const airbnb = await getBestAirbnb(trip, nights).catch(() => ({ quote: null, degraded: false }));
  return { hotel: hotel.quote, airbnb: airbnb.quote, degraded: hotel.degraded || airbnb.degraded };
}
