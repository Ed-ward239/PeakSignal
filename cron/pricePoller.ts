/**
 * Server-side price poller (spec §5, §6.1) — the centralised alternative to
 * per-device background fetch. Scheduled via netlify/functions/price-poller.mts,
 * which POSTs to /api/cron/poll (where this runs with Prisma available).
 *
 * For each watched trip with a future departure it checks the live flight
 * price, appends it to price_history, recomputes and stores the verdict, then
 * emails the owner via Resend when:
 *   - the price crosses below their target (once per crossing), or
 *   - the verdict flips to BUY,
 * honoring the user's Settings toggles. Guests never reach this table, so the
 * poller only ever emails signed-in users.
 */
import { differenceInCalendarDays } from "date-fns";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getFlights } from "@/lib/flights";
import { computeVerdict } from "@/lib/verdict";
import { sendPriceAlert, sendBuySignal } from "@/lib/mailer";
import { DEFAULT_SETTINGS } from "@/lib/types";
import type { PricePoint, WatchedTrip } from "@/lib/types";

export interface PollResult {
  checked: number;
  priced: number;
  alertsSent: number;
  errors: string[];
}

/** watched_trips row → client WatchedTrip (what getFlights and the mailer expect). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function toClient(t: any): WatchedTrip {
  return {
    id: t.id,
    origin: t.origin,
    destination: t.destination,
    destinationName: t.destinationName,
    departDate: t.departDate.toISOString().slice(0, 10),
    returnDate: t.returnDate.toISOString().slice(0, 10),
    roundTrip: true,
    travellers: t.travellers,
    cabinClass: t.cabinClass ?? "ECONOMY",
    targetPrice: t.targetPrice ?? undefined,
    createdAt: t.createdAt.toISOString(),
    isBooking: t.isBooking,
    priceHistory: [],
  };
}

/** price_history rows → daily PricePoints for the verdict algorithm. */
function toPricePoints(rows: { price: number; checkedAt: Date }[]): PricePoint[] {
  const byDate = new Map<string, number[]>();
  for (const r of rows) {
    const date = r.checkedAt.toISOString().slice(0, 10);
    byDate.set(date, [...(byDate.get(date) ?? []), r.price]);
  }
  return [...byDate.entries()].map(([date, prices]) => ({
    date,
    low: Math.min(...prices),
    high: Math.max(...prices),
    average: prices.reduce((a, b) => a + b, 0) / prices.length,
    category: "flight" as const,
  }));
}

/** Owner emails for a set of user ids, from the Neon Auth managed sync table. */
async function emailsByUserId(userIds: string[]): Promise<Map<string, string>> {
  if (userIds.length === 0) return new Map();
  const rows = await prisma.$queryRaw<{ id: string; email: string }[]>(
    Prisma.sql`SELECT id, email FROM neon_auth.users_sync WHERE id IN (${Prisma.join(userIds)})`,
  );
  return new Map(rows.map((r) => [r.id, r.email]));
}

export async function pollWatchedTrips(): Promise<PollResult> {
  const result: PollResult = { checked: 0, priced: 0, alertsSent: 0, errors: [] };

  const trips = await prisma.watchedTrip.findMany({
    where: { departDate: { gte: new Date() } },
  });
  const emails = await emailsByUserId([...new Set(trips.map((t) => t.userId))]);

  for (const row of trips) {
    result.checked++;
    const trip = toClient(row);
    try {
      const search = await getFlights(trip);
      const current = search.flights[0]?.price;
      if (!current) continue; // degraded or no offers — record nothing, alert nothing
      result.priced++;

      const prevRow = await prisma.priceHistory.findFirst({
        where: { tripId: row.id, category: "flight" },
        orderBy: { checkedAt: "desc" },
      });
      await prisma.priceHistory.create({
        data: { tripId: row.id, category: "flight", price: current },
      });

      const history = await prisma.priceHistory.findMany({
        where: { tripId: row.id, category: "flight" },
        orderBy: { checkedAt: "asc" },
      });
      const daysToDeparture = differenceInCalendarDays(row.departDate, new Date());
      const verdict = computeVerdict(toPricePoints(history), daysToDeparture);

      let buyFlip = false;
      if (verdict) {
        const prevVerdict = await prisma.verdict.findFirst({
          where: { tripId: row.id },
          orderBy: { computedAt: "desc" },
        });
        buyFlip = verdict.signal === "buy" && prevVerdict?.signal !== "buy";
        await prisma.verdict.create({
          data: {
            tripId: row.id,
            signal: verdict.signal,
            pctVsAverage: verdict.pct,
            recommendation: verdict.headline,
          },
        });
      }

      const to = emails.get(row.userId);
      if (!to) continue;
      const settings =
        (await prisma.userSettings.findUnique({ where: { userId: row.userId } })) ??
        DEFAULT_SETTINGS;

      // Alert once per crossing: previous price above target, new price at/below.
      const crossed =
        row.targetPrice != null &&
        current <= row.targetPrice &&
        (prevRow == null || prevRow.price > row.targetPrice);
      if (crossed && settings.emailPriceDrop) {
        if (await sendPriceAlert(to, trip, current)) result.alertsSent++;
      } else if (buyFlip && settings.emailBuySignal) {
        if (await sendBuySignal(to, trip, current, verdict?.explanation ?? "")) result.alertsSent++;
      }
    } catch (err) {
      result.errors.push(`${row.origin}→${row.destination}: ${err instanceof Error ? err.message : err}`);
    }
  }
  return result;
}
