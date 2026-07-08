import { NextResponse } from "next/server";
import { regenerateDay } from "@/lib/gemini";

/** Re-plan a single itinerary day ("Surprise me") via Gemini, server-side. */
export async function POST(req: Request) {
  const { day, destination } = await req.json();
  const fresh = await regenerateDay(day, destination ?? "");
  return NextResponse.json(fresh);
}
