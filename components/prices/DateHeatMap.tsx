"use client";

import { useMemo } from "react";
import { addDays, format, parseISO } from "date-fns";
import { cn } from "@/lib/cn";

/**
 * Flexible-date heat map (spec §3.4): ±7 days around departure, colour-coded
 * from LIVE per-date searches (/api/price-calendar). Controlled: `value` is the
 * departure date shown in the flight list; clicking a day calls `onSelect`.
 *
 * `prices` (per person, keyed by ISO date): undefined = still loading (pulsing
 * cells), null entry = no fare found for that date (dimmed dash).
 */
export function DateHeatMap({
  departDate,
  prices,
  value,
  onSelect,
}: {
  departDate: string;
  prices?: Record<string, number | null>;
  value?: string;
  onSelect?: (date: string) => void;
}) {
  const active = value ?? departDate;
  const loading = prices === undefined;

  const dates = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) =>
        format(addDays(parseISO(departDate), i - 7), "yyyy-MM-dd"),
      ),
    [departDate],
  );

  const known = dates
    .map((d) => prices?.[d])
    .filter((v): v is number => typeof v === "number");
  const min = known.length ? Math.min(...known) : 0;
  const max = known.length ? Math.max(...known) : 0;

  return (
    <div>
      <p className="ps-muted mb-3 text-[13px]">
        {loading
          ? "Checking live fares for each departure date (±7 days)…"
          : "Cheapest live fare per person by departure date (±7 days). Green is cheapest — pick a day to see its flights."}
      </p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
        {dates.map((date) => {
          const price = prices?.[date];
          const isActive = date === active;
          const isAnchor = date === departDate;

          // Liquid Glass chip: frosted with the price colour as a soft gradient
          // tint + top specular edge, not a flat fill.
          let style: React.CSSProperties = {
            boxShadow: "inset 0 1px 0 var(--glass-inner-top)",
          };
          if (typeof price === "number" && known.length > 1) {
            const t = max > min ? (price - min) / (max - min) : 0;
            const color = t < 0.34 ? "#10B981" : t < 0.67 ? "#F59E0B" : "#EF4444";
            style = {
              background: `linear-gradient(165deg, ${color}3d, ${color}12 70%)`,
              borderColor: `${color}55`,
              boxShadow: `inset 0 1px 0 var(--glass-inner-top), inset 0 0 24px -12px ${color}66`,
            };
          }

          return (
            <button
              key={date}
              onClick={() => onSelect?.(date)}
              aria-pressed={isActive}
              disabled={price === null}
              className={cn(
                "rounded-xl border ps-hairline bg-[var(--surface)] px-1 py-2 text-center",
                "backdrop-blur-md backdrop-saturate-150 transition hover:brightness-110",
                loading && "animate-pulse",
                price === null && "opacity-40",
                isActive && "ring-2 ring-white",
                !isActive && isAnchor && "ring-1 ring-white/35",
              )}
              style={style}
            >
              <div className="ps-muted text-[10px]">{format(parseISO(date), "EEE")}</div>
              <div className="text-[13px] font-semibold">{format(parseISO(date), "d")}</div>
              <div className="ps-data ps-muted text-[10px]">
                {loading ? "…" : typeof price === "number" ? price : "—"}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
