import { NextResponse } from "next/server";
import { pollWatchedTrips } from "@/cron/pricePoller";

/**
 * Cron entry point — POSTed by the Netlify scheduled function
 * (netlify/functions/price-poller.mts) every 6 hours. Secured with a shared
 * secret so it can't be triggered (and burn RapidAPI quota) by strangers.
 */
export const maxDuration = 120; // many trips × live searches can exceed the default

export async function POST(req: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const result = await pollWatchedTrips();
  console.info("[cron/poll]", JSON.stringify(result));
  return NextResponse.json(result);
}
