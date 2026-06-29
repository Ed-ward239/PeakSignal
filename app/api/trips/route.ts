import { NextResponse } from "next/server";
import { sampleTrips } from "@/lib/sample-data";

/**
 * CRUD for watched trips (spec §6.2). Demo returns sample data; production
 * reads/writes the watched_trips table via Prisma.
 */
export async function GET() {
  return NextResponse.json(sampleTrips());
}

export async function POST(req: Request) {
  const body = await req.json();
  return NextResponse.json(
    { ...body, id: `trip_${Date.now().toString(36)}`, createdAt: new Date().toISOString() },
    { status: 201 },
  );
}
