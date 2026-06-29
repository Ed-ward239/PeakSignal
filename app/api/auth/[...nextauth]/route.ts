import { NextResponse } from "next/server";

/**
 * NextAuth.js handler (spec §5 — GitHub OAuth + magic link).
 *
 * Scaffold only: the demo build doesn't bundle next-auth. To activate:
 *   1. npm i next-auth
 *   2. create lib/auth.ts with GitHub + Email (Resend) providers
 *   3. replace this file with: export { GET, POST } from "@/lib/auth"
 */
function notConfigured() {
  return NextResponse.json({ error: "Auth not configured in this demo build" }, { status: 501 });
}

export const GET = notConfigured;
export const POST = notConfigured;
