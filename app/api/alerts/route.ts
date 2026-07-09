import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/server";
import { sendPriceAlert } from "@/lib/mailer";
import type { WatchedTrip } from "@/lib/types";

/**
 * Manual alert trigger (spec §6.2) — sends a price-drop email for one of the
 * signed-in user's trips to their own address (e.g. "send me a test alert"
 * from Settings). Scheduled alerts come from cron/pricePoller.ts, which calls
 * the mailer directly. Session-scoped so the mailer can't be used to spam
 * arbitrary addresses.
 */
export async function POST(req: Request) {
  const { data: session } = await auth.getSession();
  const to = session?.user?.email;
  if (!to) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { trip, price } = (await req.json()) as { trip: WatchedTrip; price: number };
  const sent = await sendPriceAlert(to, trip, price);
  return NextResponse.json({ sent });
}
