"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { TripTabs } from "@/components/ui/TripTabs";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { VerdictCard } from "@/components/prices/VerdictCard";
import { PriceChart } from "@/components/prices/PriceChart";
import { DateHeatMap } from "@/components/prices/DateHeatMap";
import { ExperiencesList } from "@/components/prices/ExperiencesList";
import { useStore } from "@/components/store";
import { verdictForTrip } from "@/lib/verdict";
import { asPrice } from "@/lib/format";

export default function PricesPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { trips, hydrated, updateTrip } = useStore();
  const trip = trips.find((t) => t.id === params.id);
  const [travellers, setTravellers] = useState<number | null>(null);

  if (!hydrated) return <PageShell mode="intelligence"><div className="h-80 animate-pulse rounded-2xl bg-[var(--surface-2)]" /></PageShell>;
  if (!trip) return <PageShell mode="intelligence"><p className="ps-muted py-20 text-center">Trip not found.</p></PageShell>;

  const pax = travellers ?? trip.travellers;
  const flights = trip.priceHistory.filter((p) => p.category === "flight");
  const perPerson = flights.at(-1)?.average ?? 0;
  const verdict = verdictForTrip(trip);

  function book() {
    updateTrip(trip!.id, { isBooking: true });
    router.push(`/trip/${trip!.id}/itinerary`);
  }

  return (
    <PageShell mode="intelligence">
      <div className="animate-fade-up space-y-8">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <TripTabs id={trip.id} />
            <h1 className="mt-4 text-3xl font-semibold tracking-tighter2">{trip.destinationName}</h1>
            <p className="ps-muted ps-data mt-1 text-[14px]">{trip.origin} → {trip.destination}</p>
            <div className="mt-3 flex items-baseline gap-3">
              <span className="ps-data text-4xl font-bold">{asPrice(perPerson * pax)}</span>
              {pax > 1 && <span className="ps-muted text-[14px]">{asPrice(perPerson)}/person</span>}
            </div>
          </div>
          <div>
            <SectionTitle className="mb-1.5">Travellers</SectionTitle>
            <Segmented
              options={[1, 2, 4, 6].map((n) => ({ value: n, label: String(n) }))}
              value={pax}
              onChange={setTravellers}
            />
          </div>
        </div>

        {verdict && <VerdictCard verdict={verdict} />}

        <Card>
          <SectionTitle>90-day price history</SectionTitle>
          <div className="mt-3"><PriceChart history={flights} /></div>
        </Card>

        <Card>
          <SectionTitle>Flexible dates</SectionTitle>
          <div className="mt-3"><DateHeatMap departDate={trip.departDate} basePrice={perPerson} /></div>
        </Card>

        <div>
          <SectionTitle>Top experiences</SectionTitle>
          <div className="mt-3"><ExperiencesList destination={trip.destinationName} /></div>
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
