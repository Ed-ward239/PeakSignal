import type { WatchedTrip } from "./types";
import { asPrice } from "./format";

/**
 * Resend email client (spec §5) — plain-text alerts for watched trips.
 * SERVER-ONLY (the API key is secret). Falls back to logging when
 * RESEND_API_KEY is absent so the poller stays runnable in demo mode.
 *
 * RESEND_FROM must be a sender on a domain verified in Resend; the
 * onboarding@resend.dev default only delivers to the account owner's email.
 */
const isConfigured = Boolean(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM ?? "Peak Signal <onboarding@resend.dev>";

async function send(to: string, subject: string, text: string): Promise<boolean> {
  if (!isConfigured) {
    console.info(`[mailer:mock] → ${to}: ${subject}\n${text}`);
    return false;
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: FROM, to: [to], subject, text }),
    });
    if (!res.ok) {
      console.error(`[mailer] Resend ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("[mailer] Resend request failed:", err);
    return false;
  }
}

/** Price fell below the user's target — one alert per crossing. */
export async function sendPriceAlert(to: string, trip: WatchedTrip, price: number): Promise<boolean> {
  const subject = `Price drop: ${trip.destinationName} now ${asPrice(price)}`;
  const body = [
    `${trip.origin} → ${trip.destination} just dropped to ${asPrice(price)},`,
    `below your ${asPrice(trip.targetPrice ?? 0)} target.`,
    `Open Peak Signal to see the verdict and book.`,
  ].join(" ");
  return send(to, subject, body);
}

/** Verdict flipped to BUY — the algorithm now says book this trip. */
export async function sendBuySignal(
  to: string,
  trip: WatchedTrip,
  price: number,
  explanation: string,
): Promise<boolean> {
  const subject = `Buy signal: ${trip.destinationName} at ${asPrice(price)}`;
  const body = [
    `${trip.origin} → ${trip.destination} just flipped to BUY at ${asPrice(price)}.`,
    explanation,
    `Open Peak Signal to review and book.`,
  ]
    .filter(Boolean)
    .join(" ");
  return send(to, subject, body);
}
