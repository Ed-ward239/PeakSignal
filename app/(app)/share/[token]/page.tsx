"use client";

import { Lock } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Card, SectionTitle } from "@/components/ui/Card";
import { useStore } from "@/components/store";
import { asPrice, shortDay } from "@/lib/format";

/**
 * Read-only shared trip link (spec §3.4, §4.3). In production the token resolves
 * against the shared_links table; here it resolves from the local store (same
 * browser), demonstrating the read-only view.
 */
export default function SharePage({ params }: { params: { token: string } }) {
  const { shares, itineraries, hydrated } = useStore();
  const tripId = shares[params.token];
  const itinerary = tripId ? itineraries[tripId] : undefined;

  if (!hydrated) return <PageShell mode="planning"><div className="h-80 animate-pulse rounded-2xl bg-[var(--surface-2)]" /></PageShell>;

  if (!itinerary) {
    return (
      <PageShell mode="planning">
        <div className="py-20 text-center">
          <Lock className="ps-muted mx-auto" size={28} />
          <p className="ps-muted mt-3">This shared link has expired or isn&rsquo;t available on this device.</p>
        </div>
      </PageShell>
    );
  }

  const days = [...itinerary.days].sort((a, b) => a.dayIndex - b.dayIndex);

  return (
    <PageShell mode="planning">
      <div className="animate-fade-up space-y-6">
        <div className="flex items-center gap-2">
          <span className="ps-muted inline-flex items-center gap-1.5 rounded-full border ps-hairline bg-[var(--surface-2)] px-2.5 py-1 text-[12px]"><Lock size={12} /> Read-only</span>
        </div>
        <h1 className="text-3xl font-semibold tracking-tighter2">{itinerary.destinationName}</h1>
        {days.map((d) => (
          <Card key={d.id}>
            <SectionTitle>Day {d.dayIndex + 1} · {shortDay(d.date)}</SectionTitle>
            <h2 className="mt-1 text-lg font-semibold">{d.theme}</h2>
            <ul className="mt-3 space-y-3">
              {d.slots.map((s, i) => (
                <li key={i} className="flex items-baseline justify-between gap-4">
                  <div>
                    <span className="ps-muted text-[12px] uppercase tracking-[0.06em]">{s.period}</span>
                    <p className="text-[15px] font-medium">{s.activity}</p>
                    <p className="ps-muted text-[13px]">{s.why}</p>
                  </div>
                  <span className="ps-data shrink-0 text-[14px]">{asPrice(s.costPerPerson)}</span>
                </li>
              ))}
            </ul>
          </Card>
        ))}
      </div>
    </PageShell>
  );
}
