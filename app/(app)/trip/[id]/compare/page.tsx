"use client";

import { use } from "react";
import { PageShell } from "@/components/ui/PageShell";
import { TripTabs } from "@/components/ui/TripTabs";
import { SectionTitle } from "@/components/ui/Card";
import { AccommodationCompare } from "@/components/prices/AccommodationCompare";
import { useStore } from "@/components/store";
import { nightsBetween } from "@/lib/format";

export default function ComparePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { trips, hydrated } = useStore();
  const trip = trips.find((t) => t.id === id);

  if (!hydrated) return <PageShell mode="intelligence"><div className="h-80 animate-pulse rounded-2xl bg-[var(--surface-2)]" /></PageShell>;
  if (!trip) return <PageShell mode="intelligence"><p className="ps-muted py-20 text-center">Trip not found.</p></PageShell>;

  const nights = nightsBetween(trip.departDate, trip.returnDate);

  return (
    <PageShell mode="intelligence">
      <div className="animate-fade-up space-y-6">
        <div>
          <TripTabs id={trip.id} />
          <h1 className="mt-4 text-3xl font-semibold tracking-tighter2">Where to stay</h1>
          <p className="ps-muted mt-1 text-[15px]">Best hotel vs best Airbnb for {trip.destinationName}, {nights} nights.</p>
        </div>
        <AccommodationCompare trip={trip} />
      </div>
    </PageShell>
  );
}
