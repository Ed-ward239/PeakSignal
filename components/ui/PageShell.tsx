import Link from "next/link";
import { Activity } from "lucide-react";
import { cn } from "@/lib/cn";
import { AuthButton } from "@/components/ui/AuthButton";

type Mode = "intelligence" | "planning";

/** Brand mark — a small "signal" pulse. */
function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-semibold tracking-tightish">
      <span className="grid h-7 w-7 place-items-center rounded-lg bg-accent text-white">
        <Activity size={16} strokeWidth={2.5} />
      </span>
      <span className="text-[15px]">Peak Signal</span>
    </Link>
  );
}

function Nav() {
  return (
    <header
      className="sticky top-0 z-40 border-b ps-hairline backdrop-blur-xl"
      style={{ background: "color-mix(in srgb, var(--canvas) 72%, transparent)" }}
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
  // `mode` is retained for call-site compatibility, but the app now renders a
  // single standard dark theme across all pages (both phases).
  mode: _mode,
  children,
  wide,
}: {
  mode: Mode;
  children: React.ReactNode;
  wide?: boolean;
}) {
  return (
    <div className="dark min-h-screen bg-[var(--canvas)]" style={{ color: "var(--text)" }}>
      <Nav />
      <main className={cn("mx-auto px-5 py-8 sm:px-8 sm:py-10", wide ? "max-w-content" : "max-w-5xl")}>
        {children}
      </main>
    </div>
  );
}
