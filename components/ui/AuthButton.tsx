"use client";

import Link from "next/link";
import { authClient } from "@/lib/auth/client";

/**
 * Nav auth control: sign-in link when signed out; when signed in, the avatar
 * (Google account photo by default) links to the profile page, which owns
 * sign-out.
 */
export function AuthButton() {
  const { data, isPending } = authClient.useSession();
  const user = data?.user;

  if (isPending || !user) {
    return (
      <Link href="/sign-in" className="rounded-full px-3 py-1.5 ps-muted hover:text-[var(--text)] transition">
        Sign in
      </Link>
    );
  }

  return (
    <Link
      href="/profile"
      aria-label="Profile"
      className="ml-1 rounded-full ring-accent/60 ring-offset-2 ring-offset-[var(--canvas)] transition hover:ring-2"
    >
      {user.image ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={user.image} alt={user.name ?? "You"} className="h-7 w-7 rounded-full" referrerPolicy="no-referrer" />
      ) : (
        <span className="grid h-7 w-7 place-items-center rounded-full bg-accent text-[12px] font-semibold text-white">
          {(user.name ?? user.email ?? "?").slice(0, 1).toUpperCase()}
        </span>
      )}
    </Link>
  );
}
