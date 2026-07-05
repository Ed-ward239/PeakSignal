import { NextResponse } from "next/server";

/**
 * Per-user watched trips (spec §6.2).
 *
 * Auth is mid-migration: NextAuth has been removed and Neon Auth lands in
 * Phase 1, which will restore the session check and the Prisma-backed reads
 * and writes. Until then these endpoints return 401 and the client store runs
 * in guest mode (localStorage), so nothing calls them.
 */
export async function GET() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function POST() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
