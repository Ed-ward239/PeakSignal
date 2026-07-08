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
import { flightHistory } from "@/lib/sample-data";
import { computeVerdict } from "@/lib/verdict";
import { sendPriceAlert } from "@/lib/mailer";
import type { WatchedTrip } from "@/lib/types";

export async function pollWatchedTrips(
  trips: WatchedTrip[] = [], // production: pass the watched_trips rows from Postgres
  notify: (trip: WatchedTrip, price: number) => Promise<unknown> = (t, p) =>
    sendPriceAlert("demo@peaksignal.app", t, p),
): Promise<void> {
  for (const trip of trips) {
    // Production: check the live price via lib/flights getFlights(trip) and
    // append it to price_history — real history accrues per poll. The sample
    // curve stands in until this poller is scheduled.
    const history = flightHistory(900, "dip");
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
