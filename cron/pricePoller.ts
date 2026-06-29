/**
 * Server-side price poller (spec §5, §6.1) — the centralised alternative to
 * per-device background fetch. In production this is scheduled with node-cron:
 *
 *   import cron from "node-cron";
 *   cron.schedule("0 *\/5 * * *", pollWatchedTrips); // every 5 hours
 *
 * For each watched trip it refreshes prices, recomputes the verdict, and fires
 * a Resend email when the price drops below the user's target.
 */
import { differenceInCalendarDays, parseISO } from "date-fns";
import { getFlightHistory } from "@/lib/amadeus";
import { computeVerdict } from "@/lib/verdict";
import { sendPriceAlert } from "@/lib/mailer";
import { sampleTrips } from "@/lib/sample-data";
import type { WatchedTrip } from "@/lib/types";

export async function pollWatchedTrips(
  trips: WatchedTrip[] = sampleTrips(),
  notify: (trip: WatchedTrip, price: number) => Promise<unknown> = (t, p) =>
    sendPriceAlert("demo@peaksignal.app", t, p),
): Promise<void> {
  for (const trip of trips) {
    const history = await getFlightHistory(trip.origin, trip.destination);
    const current = history.at(-1)?.average ?? Infinity;
    const daysToDeparture = differenceInCalendarDays(parseISO(trip.departDate), new Date());
    const verdict = computeVerdict(history, daysToDeparture);

    // Persist `history` to price_history and `verdict` to verdicts here.
    if (trip.targetPrice && current <= trip.targetPrice) {
      await notify(trip, current);
    }
    void verdict;
  }
}
