import { createNeonAuth } from "@neondatabase/auth/next/server";

/**
 * Neon Auth server instance (Better Auth under the hood). Single entry point for
 * server-side auth: session reads, the /api/auth handler, and (optional)
 * middleware. Google OAuth is configured in the Neon Console; the client talks
 * to /api/auth/* which this proxies to Neon Auth using NEON_AUTH_BASE_URL.
 */
export const auth = createNeonAuth({
  baseUrl: process.env.NEON_AUTH_BASE_URL!,
  cookies: {
    secret: process.env.NEON_AUTH_COOKIE_SECRET!,
  },
});
