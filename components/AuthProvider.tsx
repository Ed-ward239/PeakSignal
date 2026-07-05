"use client";

/**
 * Auth provider. NextAuth has been removed; Neon Auth is wired in Phase 1.
 * For now this is a passthrough so the app runs in guest mode.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
