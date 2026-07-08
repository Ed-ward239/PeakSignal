import Link from "next/link";
import { cn } from "@/lib/cn";
import { AuthButton } from "@/components/ui/AuthButton";

type Mode = "intelligence" | "planning";

/** Brand mark — the actual app icon (public/icon.svg), so nav and PWA match. */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tightish">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src="/icon.svg" alt="" className="h-7 w-7 rounded-lg" />
      <span className="text-[15px]">Peak Signal</span>
    </Link>
  );
}

function Nav() {
  return (
    <header
      className="sticky top-0 z-40 border-b ps-hairline backdrop-blur-2xl backdrop-saturate-150 print:hidden"
      style={{ background: "color-mix(in srgb, var(--canvas) 55%, transparent)" }}
    >
      <div className="mx-auto flex h-14 max-w-content items-center justify-between px-5 sm:px-8">
        <Logo />
        <nav className="flex items-center gap-1 text-[14px]">
          <Link href="/watchlist" className="rounded-full px-3 py-1.5 ps-muted hover:text-[var(--text)] transition">
            Watchlist
          </Link>
          <AuthButton />
        </nav>
      </div>
    </header>
  );
}

export function PageShell({
  // `mode` is retained for call-site compatibility; the theme (dark/light) is a
  // user setting applied as a `dark` class on <html> (see lib/theme.ts and the
  // pre-paint script in app/layout.tsx). Dark remains the default.
  mode: _mode,
  children,
  wide,
}: {
  mode: Mode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="min-h-screen bg-[var(--canvas)]" style={{ color: "var(--text)" }}>
      <Nav />
      <main className={cn("mx-auto px-5 py-8 sm:px-8 sm:py-10", wide ? "max-w-content" : "max-w-5xl")}>
        {children}
      </main>
    </div>
  );
}
