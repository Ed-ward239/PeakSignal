import { NextResponse } from "next/server";
import { resolvePlace } from "@/lib/flights";

/**
 * Resolve free-text place input ("PARIS", "tokyo", "CDG") to a canonical
 * airport/city code + display name at trip creation, so trips always store and
 * show codes instead of echoing raw input. Runs server-side (RapidAPI key);
 * lookups are Redis-cached for 30 days, so repeats cost no quota.
 */
export async function POST(req: Request) {
  const { query } = (await req.json()) as { query?: string };
  if (!query?.trim()) return NextResponse.json({ place: null });
  const { place } = await resolvePlace(query);
  return NextResponse.json({ place });
}
