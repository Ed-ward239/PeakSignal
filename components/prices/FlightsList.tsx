"use client";

import { ArrowUpRight, Plane } from "lucide-react";
import type { Flight } from "@/lib/types";
import { asPrice } from "@/lib/format";
import { Loading } from "@/components/ui/Loading";

function fmtDuration(mins: number): string {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
function isOvernight(dep: string, arr: string): boolean {
  return arr < dep;
}

/**
 * Presentational list of flight options (each with a Book link). The parent
 * fetches once and passes `flights` in — a single request keeps us within the
 * RapidAPI free-tier rate limit. `null` = still loading.
 */
export function FlightsList({ flights }: { flights: Flight[] | null }) {
  if (!flights) return <Loading label="Searching live flights…" />;
  if (flights.length === 0)
    return <div className="ps-card ps-muted py-8 text-center text-[14px]">No flights found for these dates.</div>;

  return (
    <div className="grid gap-3">
      {flights.map((f) => (
        <div key={f.id} className="ps-card flex items-center gap-4 p-4">
          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[var(--surface-2)]">
            <Plane size={18} className="text-accent" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="text-[15px] font-semibold">{f.airline}</span>
              <span className="ps-muted ps-data text-[12px]">{f.flightNumber}</span>
            </div>
            <p className="ps-muted ps-data mt-0.5 text-[13px]">
              {f.departTime} → {f.arriveTime}{isOvernight(f.departTime, f.arriveTime) ? " +1" : ""}
              {" · "}{fmtDuration(f.durationMins)}
              {" · "}{f.stops === 0 ? "Nonstop" : `${f.stops} stop`}
            </p>
          </div>
          <div className="text-right">
            <div className="ps-data text-[18px] font-semibold">{asPrice(f.price)}</div>
            <a
              href={f.bookingUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
            >
              Book <ArrowUpRight size={13} />
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}
