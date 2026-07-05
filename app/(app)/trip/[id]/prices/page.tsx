"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Info, Sparkles } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { TripTabs } from "@/components/ui/TripTabs";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { VerdictCard } from "@/components/prices/VerdictCard";
import { PriceChart } from "@/components/prices/PriceChart";
import { DateHeatMap } from "@/components/prices/DateHeatMap";
import { FlightsList } from "@/components/prices/FlightsList";
import { useStore } from "@/components/store";
import { verdictForTrip } from "@/lib/verdict";
import { asPrice, shortDay } from "@/lib/format";
import type { Flight } from "@/lib/types";

export default function PricesPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { trips, hydrated, updateTrip } = useStore();
  const trip = trips.find((t) => t.id === id);

  const [flights, setFlights] = useState<Flight[] | null>(null);

  // Fetch live flights once (server route → Booking.com). One request keeps us
  // within the RapidAPI rate limit; the cheapest offer is the current price.
  useEffect(() => {
    if (!trip) return;
    let active = true;
    setFlights(null);
    fetch("/api/flights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip),
    })
      .then((r) => (r.ok ? r.json() : []))
      .then((f: Flight[]) => active && setFlights(f))
      .catch(() => active && setFlights([]));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, trip?.roundTrip, trip?.travellers, trip?.departDate, trip?.returnDate]);

  if (!hydrated) return <PageShell mode="intelligence"><div className="h-80 animate-pulse rounded-2xl bg-[var(--surface-2)]" /></PageShell>;
  if (!trip) return <PageShell mode="intelligence"><p className="ps-muted py-20 text-center">Trip not found.</p></PageShell>;

  const pax = trip.travellers || 1;
  const cheapest = flights && flights.length ? flights[0] : null;
  const partyTotal = cheapest?.price ?? null;           // round-trip total for the party
  const perPerson = partyTotal != null ? Math.round(partyTotal / pax) : null;

  const history = trip.priceHistory.filter((p) => p.category === "flight");
  const verdict = history.length ? verdictForTrip(trip) : null;

  function book() {
    updateTrip(trip!.id, { isBooking: true });
    router.push(`/trip/${trip!.id}/itinerary`);
  }

  return (
    <PageShell mode="intelligence">
      <div className="animate-fade-up space-y-8">
        <div>
          <TripTabs id={trip.id} />
          <h1 className="mt-4 text-3xl font-semibold tracking-tighter2">{trip.destinationName}</h1>
          <p className="ps-muted ps-data mt-1 text-[14px]">
            {trip.origin} → {trip.destination} ·{" "}
            {trip.roundTrip
              ? `${shortDay(trip.departDate)}–${shortDay(trip.returnDate)}`
              : shortDay(trip.departDate)}
            {" · "}{trip.roundTrip ? "Round trip" : "One way"}
          </p>
          <div className="mt-3 flex items-baseline gap-3">
            {flights === null ? (
              <span className="ps-muted text-[15px]">Checking live prices…</span>
            ) : partyTotal != null ? (
              <>
                <span className="ps-data text-4xl font-bold">{asPrice(partyTotal)}</span>
                <span className="ps-muted text-[14px]">
                  {pax > 1 ? `${asPrice(perPerson!)}/person · ${pax} travellers` : "cheapest, per person"}
                </span>
              </>
            ) : (
              <span className="ps-muted text-[15px]">No live price found for these dates.</span>
            )}
          </div>
        </div>

        {verdict ? (
          <VerdictCard verdict={verdict} />
        ) : (
          <div className="flex items-start gap-3 rounded-2xl border ps-hairline bg-[var(--surface-2)] p-4">
            <Info size={18} className="mt-0.5 shrink-0 text-accent" />
            <p className="text-[14px] leading-relaxed">
              Tracking started for this route. A <strong>buy / wait verdict</strong> and the 90-day
              price history appear once Peak Signal has collected price checks (every few hours).
            </p>
          </div>
        )}

        {history.length > 0 && (
          <Card>
            <SectionTitle>90-day price history</SectionTitle>
            <div className="mt-3"><PriceChart history={history} /></div>
          </Card>
        )}

        {perPerson != null && (
          <Card>
            <SectionTitle>Flexible dates</SectionTitle>
            <div className="mt-3"><DateHeatMap departDate={trip.departDate} basePrice={perPerson} /></div>
          </Card>
        )}

        <div>
          <SectionTitle>Flights</SectionTitle>
          <div className="mt-3"><FlightsList flights={flights} /></div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border ps-hairline bg-[var(--surface-2)] p-5">
          <div>
            <p className="text-[16px] font-semibold">Ready to go?</p>
            <p className="ps-muted text-[14px]">Build a per-trip AI itinerary from scratch.</p>
          </div>
          <Button size="lg" onClick={book}><Sparkles size={18} /> {trip.isBooking ? "Plan this trip" : "I'm booking this"}</Button>
        </div>
      </div>
    </PageShell>
  );
}
