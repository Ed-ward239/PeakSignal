"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, Plane } from "lucide-react";
import type { Flight, FlightLeg } from "@/lib/types";
import { asPrice } from "@/lib/format";
import { Loading } from "@/components/ui/Loading";
import { cn } from "@/lib/cn";

function fmtDuration(mins: number): string {
  return `${Math.floor(mins / 60)}h ${mins % 60}m`;
}
/** "2026-11-21T19:25:00" → "Fri, Nov 21" (the searched departure day). */
function fmtDate(iso?: string): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return d.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "numeric" });
}
function isOvernight(dep: string, arr: string): boolean {
  return arr < dep;
}
const hhmm = (iso: string): string => iso.slice(11, 16);

/** Whole days between two ISO datetimes' date parts — for the "+1" marker. */
function dayOffset(baseIso: string, iso: string): number {
  const a = new Date(baseIso.slice(0, 10));
  const b = new Date(iso.slice(0, 10));
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}
function minutesBetween(aIso: string, bIso: string): number {
  return Math.max(0, Math.round((new Date(bIso).getTime() - new Date(aIso).getTime()) / 60000));
}

function TimeWithDay({ iso, baseIso }: { iso: string; baseIso: string }) {
  const off = dayOffset(baseIso, iso);
  return (
    <span className="ps-data font-semibold">
      {hhmm(iso)}
      {off > 0 && <sup className="ps-muted ml-0.5 text-[10px]">+{off}</sup>}
    </span>
  );
}

/** Google Flights–style expanded detail: leg timeline + layover dividers. */
function LegDetail({ legs }: { legs: FlightLeg[] }) {
  const base = legs[0]?.departTime ?? "";
  return (
    <div className="mt-3 border-t ps-hairline pt-3">
      {legs.map((leg, i) => (
        <div key={`${leg.flightNumber}-${i}`}>
          {i > 0 && (
            <div className="my-3 flex items-center gap-2">
              <div className="h-px flex-1 ps-hairline border-t" />
              <span className="ps-muted text-[12px]">
                {fmtDuration(minutesBetween(legs[i - 1].arriveTime, leg.departTime))} layover ·{" "}
                {leg.fromName} ({leg.fromCode})
              </span>
              <div className="h-px flex-1 ps-hairline border-t" />
            </div>
          )}
          <div className="flex gap-3">
            {/* timeline spine */}
            <div className="mt-1.5 flex flex-col items-center">
              <span className="h-2 w-2 rounded-full border-2 border-[var(--muted)]" />
              <span className="w-px flex-1 border-l border-dotted ps-hairline" />
              <span className="h-2 w-2 rounded-full border-2 border-[var(--muted)]" />
            </div>
            <div className="min-w-0 flex-1 pb-1 text-[13px]">
              <p>
                <TimeWithDay iso={leg.departTime} baseIso={base} />
                <span className="ps-muted"> · {leg.fromName} ({leg.fromCode})</span>
              </p>
              <p className="ps-muted my-1 text-[12px]">Travel time: {fmtDuration(leg.durationMins)}</p>
              <p>
                <TimeWithDay iso={leg.arriveTime} baseIso={base} />
                <span className="ps-muted"> · {leg.toName} ({leg.toCode})</span>
              </p>
              <p className="ps-muted ps-data mt-1 text-[12px]">{leg.airline} · {leg.flightNumber}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/**
 * Flight options, one expandable card each: the summary row toggles a Google
 * Flights–style per-leg breakdown (times, airports, layovers). The parent
 * fetches once and passes `flights` in; `null` = still loading. When
 * `onSelect` is given, cards are selectable — the picked flight's times feed
 * the itinerary planner.
 */
export function FlightsList({
  flights,
  degraded,
  selectedId,
  onSelect,
}: {
  flights: Flight[] | null;
  degraded?: boolean;
  selectedId?: string | null;
  onSelect?: (f: Flight) => void;
}) {
  const [openId, setOpenId] = useState<string | null>(null);

  if (!flights) return <Loading label="Searching live flights…" />;
  if (flights.length === 0)
    return (
      <div className="ps-card ps-muted py-8 text-center text-[14px]">
        {degraded
          ? "Live flight data is temporarily unavailable — the data provider's request limit was reached."
          : "No flights found for these dates."}
      </div>
    );

  return (
    <div className="grid gap-3">
      {flights.map((f) => {
        const open = openId === f.id;
        const expandable = (f.legs?.length ?? 0) > 0;
        const selected = selectedId === f.id;
        return (
          <div key={f.id} className={cn("ps-card p-4", selected && "ring-2 ring-accent/70")}>
            <div
              role={expandable ? "button" : undefined}
              tabIndex={expandable ? 0 : undefined}
              aria-expanded={expandable ? open : undefined}
              onClick={() => expandable && setOpenId(open ? null : f.id)}
              onKeyDown={(e) => {
                if (expandable && (e.key === "Enter" || e.key === " ")) {
                  e.preventDefault();
                  setOpenId(open ? null : f.id);
                }
              }}
              className={cn("flex w-full items-center gap-4 text-left", expandable && "cursor-pointer")}
            >
              {/* Plane badge doubles as the select/unselect toggle. */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect?.(f);
                }}
                disabled={!onSelect}
                aria-pressed={onSelect ? selected : undefined}
                title={onSelect ? (selected ? "Unselect this flight" : "Select this flight") : undefined}
                className={cn(
                  "grid h-10 w-10 shrink-0 place-items-center rounded-full transition",
                  selected ? "bg-accent text-white shadow-sm" : "bg-[var(--surface-2)] text-accent",
                  onSelect && "cursor-pointer hover:ring-2 hover:ring-accent/50 active:scale-95",
                )}
              >
                <Plane size={18} />
              </button>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-[15px] font-semibold">{f.airline}</span>
                  <span className="ps-muted ps-data text-[12px]">{f.flightNumber}</span>
                </div>
                <p className="ps-muted ps-data mt-0.5 text-[13px]">
                  {fmtDate(f.legs?.[0]?.departTime) && <>{fmtDate(f.legs?.[0]?.departTime)}{" · "}</>}
                  {f.departTime} → {f.arriveTime}{isOvernight(f.departTime, f.arriveTime) ? " +1" : ""}
                  {" · "}{fmtDuration(f.durationMins)}
                  {" · "}{f.stops === 0 ? "Nonstop" : `${f.stops} stop${f.stops > 1 ? "s" : ""}`}
                </p>
              </div>
              <div className="text-right" onClick={(e) => e.stopPropagation()}>
                <div className="ps-data text-[18px] font-semibold">{asPrice(f.price)}</div>
                <div className="flex items-center justify-end gap-3">
                  {onSelect && selected && <span className="text-[13px] font-medium text-accent">Selected</span>}
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
              {expandable && (
                <ChevronDown
                  size={16}
                  className={cn("ps-muted shrink-0 transition-transform duration-200", open && "rotate-180")}
                />
              )}
            </div>
            {open && f.legs && <LegDetail legs={f.legs} />}
          </div>
        );
      })}
    </div>
  );
}
