"use client";

import { useMemo } from "react";
import type { Itinerary } from "@/lib/types";

const DAY_COLORS = ["#0369A1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

/**
 * Itinerary map (spec §4.3). Production renders Mapbox GL JS with per-day route
 * lines; this dependency-free fallback plots geocoded stops on a normalised
 * canvas so the map works offline and with no Mapbox token. Set
 * NEXT_PUBLIC_MAPBOX_TOKEN and swap in mapbox-gl to upgrade.
 */
export function ItineraryMap({ itinerary }: { itinerary: Itinerary }) {
  const { points, paths } = useMemo(() => {
    const all = itinerary.days.flatMap((d) =>
      d.slots
        .filter((s) => s.lat != null && s.lng != null)
        .map((s) => ({ x: s.lng!, y: s.lat!, day: d.dayIndex, label: s.activity })),
    );
    if (all.length === 0) return { points: [], paths: [] as string[] };
    const xs = all.map((p) => p.x), ys = all.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const nx = (x: number) => (maxX === minX ? 50 : 8 + ((x - minX) / (maxX - minX)) * 84);
    const ny = (y: number) => (maxY === minY ? 50 : 92 - ((y - minY) / (maxY - minY)) * 84);
    const pts = all.map((p) => ({ ...p, px: nx(p.x), py: ny(p.y) }));

    const byDay = new Map<number, typeof pts>();
    pts.forEach((p) => byDay.set(p.day, [...(byDay.get(p.day) ?? []), p]));
    const paths = [...byDay.entries()].map(([, ps]) => ps.map((p, i) => `${i === 0 ? "M" : "L"}${p.px},${p.py}`).join(" "));
    return { points: pts, paths };
  }, [itinerary]);

  return (
    <div className="ps-card overflow-hidden p-0">
      <div className="relative aspect-[16/10] w-full bg-[var(--surface-2)]">
        {/* subtle grid */}
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <pattern id="grid" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M8 0H0V8" fill="none" stroke="var(--hairline)" strokeWidth="0.3" />
            </pattern>
          </defs>
          <rect width="100" height="100" fill="url(#grid)" />
          {paths.map((d, i) => (
            <path key={i} d={d} fill="none" stroke={DAY_COLORS[i % DAY_COLORS.length]} strokeWidth="0.8" strokeDasharray="2 1.5" opacity="0.7" />
          ))}
        </svg>
        {points.map((p, i) => (
          <div
            key={i}
            className="group absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${p.px}%`, top: `${p.py}%` }}
          >
            <span
              className="block h-3.5 w-3.5 rounded-full border-2 border-white shadow"
              style={{ background: DAY_COLORS[p.day % DAY_COLORS.length] }}
            />
            <span className="pointer-events-none absolute left-1/2 top-5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[11px] text-white group-hover:block">
              {p.label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
