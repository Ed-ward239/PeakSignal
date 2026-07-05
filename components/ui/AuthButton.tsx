"use client";

import Link from "next/link";

/**
 * Nav auth control. NextAuth removed; Neon Auth (with signed-in avatar + sign-out)
 * is wired in Phase 1. For now the app runs in guest mode, so this is just the
 * sign-in link.
 */
export function AuthButton() {
  return (
    <Link href="/sign-in" className="rounded-full px-3 py-1.5 ps-muted hover:text-[var(--text)] transition">
      Sign in
    </Link>
  );
}
