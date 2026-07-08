import { NextResponse } from "next/server";
import { findAlternatives } from "@/lib/gemini";

/** Suggest 3 alternatives for one itinerary slot via Gemini, server-side. */
export async function POST(req: Request) {
  const { slot, destination } = await req.json();
  const alts = await findAlternatives(slot, destination ?? "");
  return NextResponse.json(alts);
}
