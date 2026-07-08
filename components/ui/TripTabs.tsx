"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

/**
 * Trip section tabs. Equal-width pills on a translucent track with a frosted
 * glass thumb (Liquid Glass, not accent-coloured) that slides to the active tab.
 *
 * Each tab is a separate route, so this component REMOUNTS on navigation — a
 * plain CSS transition would never run. `lastThumbIdx` survives client-side
 * navigations (module scope), letting the fresh mount render the thumb at the
 * previous tab and then glide it to the active one after first paint. Client
 * only — on the server (first load) the thumb starts at the active tab.
 */
let lastThumbIdx = -1;

export function TripTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/trip/${id}/prices`, label: "Flights" },
    { href: `/trip/${id}/compare`, label: "Stay" },
    { href: `/trip/${id}/itinerary`, label: "Itinerary" },
  ];
  const idx = Math.max(0, tabs.findIndex((t) => pathname === t.href));

  const [thumbIdx, setThumbIdx] = useState(() =>
    typeof window !== "undefined" && lastThumbIdx >= 0 ? lastThumbIdx : idx,
  );
  useEffect(() => {
    lastThumbIdx = idx;
    if (thumbIdx === idx) return;
    const raf = requestAnimationFrame(() => setThumbIdx(idx));
    return () => cancelAnimationFrame(raf);
  }, [idx, thumbIdx]);

  return (
    <div className="relative inline-grid auto-cols-fr grid-flow-col rounded-full border ps-hairline bg-[var(--surface-2)] p-1">
      <span
        aria-hidden
        className="ps-glass-thumb absolute bottom-1 top-1 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ left: 4, width: `calc((100% - 8px) / ${tabs.length})`, transform: `translateX(${thumbIdx * 100}%)` }}
      />
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "relative z-[1] rounded-full px-4 py-1.5 text-center text-[13px] transition-colors",
              active ? "font-semibold text-[var(--text)]" : "ps-muted font-medium hover:text-[var(--text)]",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
