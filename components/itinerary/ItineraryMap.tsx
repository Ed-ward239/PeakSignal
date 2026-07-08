"use client";

import { useEffect, useMemo, useRef } from "react";
import "mapbox-gl/dist/mapbox-gl.css";
import type { Itinerary } from "@/lib/types";
import { cn } from "@/lib/cn";

const DAY_COLORS = ["#0369A1", "#10B981", "#F59E0B", "#EF4444", "#8B5CF6"];

// Mapbox GL JS needs a PUBLIC token (pk.…) — secret sk. tokens are rejected in
// browsers. Without one we render the dependency-free SVG fallback below.
const TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN ?? "";
const HAS_MAPBOX = TOKEN.startsWith("pk.");

interface Point { x: number; y: number; day: number; label: string }

function usePoints(itinerary: Itinerary): Point[] {
  return useMemo(
    () =>
      itinerary.days.flatMap((d) =>
        d.slots
          .filter((s) => s.lat != null && s.lng != null)
          .map((s) => ({ x: s.lng!, y: s.lat!, day: d.dayIndex, label: s.activity })),
      ),
    [itinerary],
  );
}

/** Real Mapbox GL map: per-day coloured markers + route lines, auto-fitted. */
function MapboxMap({ points }: { points: Point[] }) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (points.length === 0 || !container.current) return;
    let cancelled = false;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let map: any;

    (async () => {
      const mapboxgl = (await import("mapbox-gl")).default;
      if (cancelled || !container.current) return;
      mapboxgl.accessToken = TOKEN;

      map = new mapboxgl.Map({
        container: container.current,
        style: "mapbox://styles/mapbox/streets-v12",
        center: [points[0].x, points[0].y],
        zoom: 11,
        attributionControl: false,
      });
      map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "top-right");

      for (const p of points) {
        const el = document.createElement("span");
        el.style.cssText = `display:block;width:14px;height:14px;border-radius:9999px;border:2px solid #fff;box-shadow:0 1px 4px rgba(0,0,0,.4);background:${DAY_COLORS[p.day % DAY_COLORS.length]}`;
        new mapboxgl.Marker(el)
          .setLngLat([p.x, p.y])
          .setPopup(new mapboxgl.Popup({ offset: 12, closeButton: false }).setText(p.label))
          .addTo(map);
      }

      const bounds = new mapboxgl.LngLatBounds();
      points.forEach((p) => bounds.extend([p.x, p.y]));
      map.fitBounds(bounds, { padding: 48, maxZoom: 14, duration: 0 });

      map.on("load", () => {
        const byDay = new Map<number, Point[]>();
        points.forEach((p) => byDay.set(p.day, [...(byDay.get(p.day) ?? []), p]));
        for (const [day, ps] of byDay) {
          if (ps.length < 2) continue;
          map.addSource(`day-${day}`, {
            type: "geojson",
            data: { type: "Feature", properties: {}, geometry: { type: "LineString", coordinates: ps.map((p) => [p.x, p.y]) } },
          });
          map.addLayer({
            id: `day-${day}`,
            type: "line",
            source: `day-${day}`,
            paint: { "line-color": DAY_COLORS[day % DAY_COLORS.length], "line-width": 2.5, "line-dasharray": [2, 1.5], "line-opacity": 0.8 },
          });
        }
      });
    })();

    return () => {
      cancelled = true;
      map?.remove();
    };
  }, [points]);

  return <div ref={container} className="absolute inset-0 h-full w-full" />;
}

/** Dependency-free SVG fallback: geocoded stops on a normalised canvas. */
function FallbackMap({ points }: { points: Point[] }) {
  const { pts, paths } = useMemo(() => {
    if (points.length === 0) return { pts: [], paths: [] as string[] };
    const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const nx = (x: number) => (maxX === minX ? 50 : 8 + ((x - minX) / (maxX - minX)) * 84);
    const ny = (y: number) => (maxY === minY ? 50 : 92 - ((y - minY) / (maxY - minY)) * 84);
    const pts = points.map((p) => ({ ...p, px: nx(p.x), py: ny(p.y) }));

    const byDay = new Map<number, typeof pts>();
    pts.forEach((p) => byDay.set(p.day, [...(byDay.get(p.day) ?? []), p]));
    const paths = [...byDay.entries()].map(([, ps]) => ps.map((p, i) => `${i === 0 ? "M" : "L"}${p.px},${p.py}`).join(" "));
    return { pts, paths };
  }, [points]);

  return (
    <>
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
      {pts.map((p, i) => (
        <div key={i} className="group absolute -translate-x-1/2 -translate-y-1/2" style={{ left: `${p.px}%`, top: `${p.py}%` }}>
          <span
            className="block h-3.5 w-3.5 rounded-full border-2 border-white shadow"
            style={{ background: DAY_COLORS[p.day % DAY_COLORS.length] }}
          />
          <span className="pointer-events-none absolute left-1/2 top-5 hidden -translate-x-1/2 whitespace-nowrap rounded-md bg-black/80 px-2 py-1 text-[11px] text-white group-hover:block">
            {p.label}
          </span>
        </div>
      ))}
    </>
  );
}

/**
 * Itinerary map (spec §4.3): Mapbox GL with per-day markers + route lines when
 * NEXT_PUBLIC_MAPBOX_TOKEN (a pk. public token) is set; otherwise the SVG
 * fallback keeps the map working offline and token-free. `tall` gives it real
 * height when it anchors the wide column of the planner layout.
 */
export function ItineraryMap({ itinerary, tall }: { itinerary: Itinerary; tall?: boolean }) {
  const points = usePoints(itinerary);

  return (
    <div className="ps-card overflow-hidden p-0">
      <div
        className={cn(
          "relative w-full bg-[var(--surface-2)]",
          tall ? "aspect-[16/10] lg:aspect-auto lg:h-[600px]" : "aspect-[16/10]",
        )}
      >
        {HAS_MAPBOX && points.length > 0 ? <MapboxMap points={points} /> : <FallbackMap points={points} />}
      </div>
    </div>
  );
}
