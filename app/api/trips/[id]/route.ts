import { NextResponse } from "next/server";

/**
 * Update / delete a single watched trip, scoped to the signed-in user.
 *
 * Auth is mid-migration (NextAuth removed; Neon Auth restores these in Phase 1).
 * Until then they return 401 and the client store runs in guest mode. `params`
 * is typed as a Promise per the Next 16 async-params contract, ready for Phase 1.
 */
export async function PATCH(_req: Request, _ctx: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

export async function DELETE(_req: Request, _ctx: { params: Promise<{ id: string }> }) {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
