"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Bell, ChevronRight, LogOut, ShieldCheck } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card } from "@/components/ui/Card";
import { Button, ButtonLink } from "@/components/ui/Button";
import { authClient } from "@/lib/auth/client";

/**
 * Profile (account home). Shows the signed-in identity — the avatar defaults to
 * the Google account photo carried on the Neon Auth session — and owns the
 * sign-out action (moved here from the nav). Links out to Settings and Privacy.
 */
export default function ProfilePage() {
  const router = useRouter();
  const { data, isPending } = authClient.useSession();
  const user = data?.user;
  const [signingOut, setSigningOut] = useState(false);

  const signOut = async () => {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/");
    } finally {
      setSigningOut(false);
    }
  };

  if (isPending) {
    return (
      <PageShell mode="planning">
        <div className="mx-auto max-w-lg py-10"><div className="h-64 animate-pulse rounded-2xl bg-[var(--surface-2)]" /></div>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell mode="planning">
        <div className="mx-auto max-w-sm py-16 text-center">
          <h1 className="text-2xl font-semibold tracking-tighter2">Your profile</h1>
          <p className="ps-muted mt-1.5 text-[15px]">Sign in to see your account and manage your settings.</p>
          <ButtonLink href="/sign-in" className="mt-6">Sign in</ButtonLink>
        </div>
      </PageShell>
    );
  }

  const memberSince = new Date(user.createdAt).toLocaleDateString(undefined, {
    month: "long", year: "numeric",
  });

  return (
    <PageShell mode="planning">
      <div className="mx-auto max-w-lg animate-fade-up space-y-4 py-6">
        <h1 className="text-2xl font-semibold tracking-tighter2">Profile</h1>

        <Card>
          <div className="flex items-center gap-4">
            {user.image ? (
              // Google account photo (default avatar — set by Google OAuth).
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.image} alt={user.name ?? "You"} className="h-16 w-16 rounded-full" referrerPolicy="no-referrer" />
            ) : (
              <span className="grid h-16 w-16 place-items-center rounded-full bg-accent text-[24px] font-semibold text-white">
                {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
              </span>
            )}
            <div className="min-w-0">
              <p className="truncate text-[17px] font-semibold">{user.name}</p>
              <p className="ps-muted truncate text-[14px]">{user.email}</p>
              <p className="ps-muted mt-0.5 text-[12px]">Member since {memberSince}</p>
            </div>
          </div>
        </Card>

        <div className="ps-card overflow-hidden p-0">
          <Link href="/settings" className="flex items-center gap-3 px-5 py-4 transition hover:bg-[var(--surface-2)]">
            <Bell size={16} className="text-accent" />
            <span className="flex-1 text-[14px] font-medium">Notification settings</span>
            <ChevronRight size={16} className="ps-muted" />
          </Link>
          <div className="border-t ps-hairline" />
          <Link href="/privacy" className="flex items-center gap-3 px-5 py-4 transition hover:bg-[var(--surface-2)]">
            <ShieldCheck size={16} className="text-accent" />
            <span className="flex-1 text-[14px] font-medium">Privacy</span>
            <ChevronRight size={16} className="ps-muted" />
          </Link>
        </div>

        <Button variant="danger" className="w-full" onClick={signOut} disabled={signingOut}>
          <LogOut size={15} /> {signingOut ? "Signing out…" : "Sign out"}
        </Button>
      </div>
    </PageShell>
  );
}
