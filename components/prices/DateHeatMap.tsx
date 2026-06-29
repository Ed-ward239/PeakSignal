"use client";

import { useMemo, useState } from "react";
import { addDays, format, parseISO } from "date-fns";
import { cn } from "@/lib/cn";
import { asPrice } from "@/lib/format";

interface Cell {
  date: string;
  price: number;
  isAnchor: boolean;
}

/** Flexible-date heat map (spec §3.4): ±7 days around departure, colour-coded. */
export function DateHeatMap({ departDate, basePrice }: { departDate: string; basePrice: number }) {
  const [selected, setSelected] = useState<Cell | null>(null);

  const cells = useMemo<Cell[]>(() => {
    const anchor = parseISO(departDate);
    return Array.from({ length: 15 }, (_, i) => {
      const offset = i - 7;
      const date = addDays(anchor, offset);
      const weekend = [0, 6].includes(date.getDay()) ? 0.12 : 0;
      const wave = 0.08 * Math.sin(offset / 2.2);
      return {
        date: format(date, "yyyy-MM-dd"),
        price: Math.round(basePrice * (1 + weekend + wave - 0.05)),
        isAnchor: offset === 0,
      };
    });
  }, [departDate, basePrice]);

  const prices = cells.map((c) => c.price);
  const min = Math.min(...prices);
  const max = Math.max(...prices);

  return (
    <div>
      <p className="ps-muted mb-3 text-[13px]">Prices ±7 days around departure. Green is cheapest.</p>
      <div className="grid grid-cols-5 gap-2 sm:grid-cols-[repeat(15,minmax(0,1fr))]">
        {cells.map((cell) => {
          const t = max > min ? (cell.price - min) / (max - min) : 0;
          const color = t < 0.34 ? "#10B981" : t < 0.67 ? "#F59E0B" : "#EF4444";
          return (
            <button
              key={cell.date}
              onClick={() => setSelected(cell)}
              className={cn(
                "rounded-xl border px-1 py-2 text-center transition hover:brightness-110",
                cell.isAnchor && "ring-2 ring-white",
              )}
              style={{ background: `${color}33`, borderColor: `${color}66` }}
            >
              <div className="ps-muted text-[10px]">{format(parseISO(cell.date), "EEE")}</div>
              <div className="text-[13px] font-semibold">{format(parseISO(cell.date), "d")}</div>
              <div className="ps-data ps-muted text-[10px]">{cell.price}</div>
            </button>
          );
        })}
      </div>
      {selected && (
        <div className="ps-card mt-4 p-4">
          <p className="text-[14px] font-semibold">{format(parseISO(selected.date), "EEEE, MMMM d")}</p>
          <p className="ps-data mt-0.5 text-[20px] font-bold">{asPrice(selected.price)} <span className="ps-muted text-[13px] font-normal">per person</span></p>
        </div>
      )}
    </div>
  );
}
