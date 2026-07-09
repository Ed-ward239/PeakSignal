"use client";

import Link from "next/link";
import { ArrowUpRight, Plus, Trash2 } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { ButtonLink } from "@/components/ui/Button";
import { SignalBadge } from "@/components/ui/SignalBadge";
import { useStore } from "@/components/store";
import { verdictForTrip } from "@/lib/verdict";
import { asPrice, cabinLabel, shortDay } from "@/lib/format";

export default function WatchlistPage() {
  const { trips, removeTrip, hydrated } = useStore();

  return (
    <PageShell mode="intelligence" wide>
      <div className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tighter2">Watchlist</h1>
          <p className="ps-muted mt-1 text-[15px]">Trips you&rsquo;re tracking. Prices refresh every 4–6 hours.</p>
        </div>
        <ButtonLink href="/" variant="secondary" size="sm"><Plus size={16} /> Add a trip</ButtonLink>
      </div>

      {!hydrated ? (
        <SkeletonList />
      ) : trips.length === 0 ? (
        <div className="ps-card grid place-items-center py-20 text-center">
          <p className="ps-muted">No trips watched yet.</p>
          <ButtonLink href="/" className="mt-4">Add your first trip</ButtonLink>
        </div>
      ) : (
        <ul className="grid gap-3">
          {trips.map((trip) => {
            const verdict = verdictForTrip(trip);
            const current = trip.priceHistory.filter((p) => p.category === "flight").at(-1)?.average;
            return (
              <li key={trip.id} className="group">
                <div className="ps-card flex items-center gap-4 p-4 transition hover:shadow-float sm:p-5">
                  <Link href={`/trip/${trip.id}/prices`} className="flex flex-1 items-center gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="truncate text-[16px] font-semibold tracking-tightish">{trip.destinationName}</span>
                        <ArrowUpRight size={15} className="ps-muted opacity-0 transition group-hover:opacity-100" />
                      </div>
                      <p className="ps-muted ps-data mt-0.5 text-[13px]">
                        {trip.origin} → {trip.destination} · {shortDay(trip.departDate)}–{shortDay(trip.returnDate)} · {trip.travellers} pax · {cabinLabel(trip.cabinClass)}
                      </p>
                    </div>
                    <div className="text-right">
                      {current != null && <p className="ps-data text-[18px] font-semibold">{asPrice(current)}</p>}
                      {trip.targetPrice && <p className="ps-muted text-[12px]">target {asPrice(trip.targetPrice)}</p>}
                    </div>
                    {verdict && <SignalBadge signal={verdict.signal} />}
                  </Link>
                  <button
                    onClick={() => removeTrip(trip.id)}
                    aria-label="Remove trip"
                    className="ps-muted rounded-full p-2 transition hover:bg-white/10 hover:text-signal-peak"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </PageShell>
  );
}

function SkeletonList() {
  return (
    <ul className="grid gap-3">
      {[0, 1, 2].map((i) => (
        <li key={i} className="ps-card h-[76px] animate-pulse opacity-60" />
      ))}
    </ul>
  );
}
