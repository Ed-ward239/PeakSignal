"use client";

import Link from "next/link";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";

/**
 * Sign-in (spec §5). Google OAuth via Neon Auth (Better Auth). The client posts
 * to /api/auth/*, which the server proxies to Neon Auth; on success the user is
 * redirected to the watchlist.
 */
export default function SignInPage() {
  const signInWithGoogle = () =>
    authClient.signIn.social({ provider: "google", callbackURL: "/watchlist" });

  return (
    <PageShell mode="planning">
      <div className="mx-auto max-w-sm py-16">
        <h1 className="text-center text-2xl font-semibold tracking-tighter2">Welcome to Peak Signal</h1>
        <p className="ps-muted mt-1.5 text-center text-[15px]">
          Sign in to save your watchlist and sync it across devices.
        </p>
        <Card className="mt-8">
          <Button className="w-full" onClick={signInWithGoogle}>
            <GoogleMark /> Continue with Google
          </Button>
        </Card>
        <p className="ps-muted mt-4 text-center text-[12px]">
          <Link href="/privacy" className="hover:text-[var(--text)] transition">How we handle your data</Link>
        </p>
      </div>
    </PageShell>
  );
}

function GoogleMark() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.9 2.4 30.3 0 24 0 14.6 0 6.4 5.4 2.5 13.3l7.9 6.1C12.3 13.2 17.6 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.1 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.4c-.5 2.9-2.1 5.3-4.6 7l7.1 5.5c4.1-3.8 6.5-9.4 6.5-16z" />
      <path fill="#FBBC05" d="M10.4 28.6c-.5-1.5-.8-3-.8-4.6s.3-3.1.8-4.6l-7.9-6.1C.9 16.5 0 20.1 0 24s.9 7.5 2.5 10.7l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.1-5.5c-2 1.3-4.5 2.1-8.8 2.1-6.4 0-11.7-3.7-13.6-9.9l-7.9 6.1C6.4 42.6 14.6 48 24 48z" />
    </svg>
  );
}
