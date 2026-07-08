import { auth } from "@/lib/auth/server";

/**
 * Neon Auth catch-all handler. Proxies the client's /api/auth/* requests
 * (sign-in, OAuth callback, session, sign-out) to Neon Auth, server-side.
 */
export const { GET, POST } = auth.handler();
