import type { WatchedTrip } from "./types";
import { asPrice } from "./format";

/**
 * Resend email client (spec §5) — one plain-text alert per watched item when
 * the price drops below the user's target. Scaffolded; no-ops without a key.
 */
const isConfigured = Boolean(process.env.RESEND_API_KEY);

export async function sendPriceAlert(to: string, trip: WatchedTrip, price: number): Promise<boolean> {
  const subject = `Price drop: ${trip.destinationName} now ${asPrice(price)}`;
  const body = [
    `${trip.origin} → ${trip.destination} just dropped to ${asPrice(price)},`,
    `below your ${asPrice(trip.targetPrice ?? 0)} target.`,
    `Open Peak Signal to see the verdict and book.`,
  ].join(" ");

  if (!isConfigured) {
    console.info(`[mailer:mock] → ${to}: ${subject}\n${body}`);
    return false;
  }
  // TODO: POST https://api.resend.com/emails with { to, subject, text: body }.
  return true;
}
