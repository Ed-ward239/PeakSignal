import { NextResponse } from "next/server";
import { sendPriceAlert } from "@/lib/mailer";
import type { WatchedTrip } from "@/lib/types";

/**
 * Email alert trigger (spec §6.2). Called by the cron poller when a price drops
 * below the user's target. Uses Resend in production.
 */
export async function POST(req: Request) {
  const { to, trip, price } = (await req.json()) as { to: string; trip: WatchedTrip; price: number };
  const sent = await sendPriceAlert(to, trip, price);
  return NextResponse.json({ sent });
}
