import type { PricePoint, Verdict, WatchedTrip } from "./types";
import { asPercent, asPrice, daysFromNow } from "./format";

/**
 * The buy/wait verdict algorithm (spec §3.2, §6.1, interview talking point §10).
 *
 * Weighs the current price against the 90-day rolling average, then applies a
 * days-to-departure decay: prices typically rise in the ~3 weeks before
 * departure, so as the trip nears we bias toward BUY to avoid waiting for a
 * drop history says is unlikely.
 */

const BUY_THRESHOLD = 3; // percent below average that counts as a clear buy

export function computeVerdict(history: PricePoint[], daysToDeparture: number): Verdict | null {
  const series = [...history].sort((a, b) => a.date.localeCompare(b.date));
  if (series.length === 0) return null;

  const current = series[series.length - 1].average;
  const averages = series.map((p) => p.average);
  const rollingAverage = averages.reduce((a, b) => a + b, 0) / averages.length;
  if (rollingAverage <= 0) return null;

  const maxSeen = Math.max(...averages);
  if (current >= maxSeen) {
    return {
      signal: "peak",
      pct: ((current - rollingAverage) / rollingAverage) * 100,
      headline: "PEAK PRICE",
      explanation:
        "Highest price recorded for this route in 90 days. Do not buy today unless your dates are fixed.",
    };
  }

  const pctFromAverage = ((current - rollingAverage) / rollingAverage) * 100;
  const adjusted = pctFromAverage - decay(daysToDeparture);

  if (adjusted <= -BUY_THRESHOLD || (Math.abs(adjusted) < BUY_THRESHOLD && daysToDeparture <= 21)) {
    const pct = Math.max(Math.abs(adjusted), BUY_THRESHOLD);
    return { signal: "buy", pct, headline: "BUY NOW", explanation: "" };
  }

  const pct = Math.max(adjusted, BUY_THRESHOLD);
  return { signal: "wait", pct, headline: "WAIT", explanation: "" };
}

/** Up to ~6 points of downward pressure as departure nears (0 beyond 21 days). */
function decay(daysToDeparture: number): number {
  if (daysToDeparture > 21 || daysToDeparture < 0) return 0;
  return ((21 - daysToDeparture) / 21) * 6;
}

/** Verdict with a destination-aware explanation sentence (spec §3.2 copy). */
export function verdictForTrip(trip: WatchedTrip): Verdict | null {
  const flights = trip.priceHistory.filter((p) => p.category === "flight");
  const v = computeVerdict(flights, daysFromNow(trip.departDate));
  if (!v) return null;
  const price = asPrice(flights[flights.length - 1]?.average ?? 0);
  if (v.signal === "buy") {
    v.explanation = `${trip.destinationName} is ${price} — ${asPercent(v.pct)} below the 90-day average for this route. Prices typically rise 3 weeks before departure. Book today.`;
  } else if (v.signal === "wait") {
    v.explanation = `${trip.destinationName} is ${price} — ${asPercent(v.pct)} above average. This route historically drops at this time of year. Check back in 2 weeks.`;
  }
  return v;
}
