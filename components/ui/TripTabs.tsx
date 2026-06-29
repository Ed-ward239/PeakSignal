"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function TripTabs({ id }: { id: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/trip/${id}/prices`, label: "Prices" },
    { href: `/trip/${id}/compare`, label: "Stay" },
    { href: `/trip/${id}/itinerary`, label: "Itinerary" },
  ];
  return (
    <div className="inline-flex rounded-full border ps-hairline bg-[var(--surface-2)] p-1">
      {tabs.map((t) => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "rounded-full px-4 py-1.5 text-[13px] font-medium transition",
              active ? "bg-accent text-white shadow-sm" : "ps-muted hover:text-[var(--text)]",
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </div>
  );
}
