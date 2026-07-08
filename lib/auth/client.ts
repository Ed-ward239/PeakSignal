"use client";

import { createAuthClient } from "@neondatabase/auth/next";

/**
 * Neon Auth client (Better Auth). No URL/provider needed — it talks to the
 * same-origin /api/auth/* proxy. Exposes `useSession()`, `signIn.social(...)`,
 * `signOut()`, etc. Used by the store, the nav auth button, and the sign-in page.
 */
export const authClient = createAuthClient();
