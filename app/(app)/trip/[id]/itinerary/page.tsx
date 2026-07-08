"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarPlus, CheckCircle2, FileDown, RotateCcw, Share2 } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { TripTabs } from "@/components/ui/TripTabs";
import { Button } from "@/components/ui/Button";
import { Card, SectionTitle } from "@/components/ui/Card";
import { TripProfileForm } from "@/components/itinerary/TripProfileForm";
import { DayView } from "@/components/itinerary/DayView";
import { ItineraryMap } from "@/components/itinerary/ItineraryMap";
import { BudgetTracker } from "@/components/itinerary/BudgetTracker";
import { useStore } from "@/components/store";
import { generateItinerary, regenerateDay } from "@/lib/itinerary-client";
import { itineraryToICS } from "@/lib/ics";
import { asPrice, shortDay } from "@/lib/format";
import type { FlightContext, Itinerary, Period, Slot, TripProfile, WatchedTrip } from "@/lib/types";
import { cn } from "@/lib/cn";

const PERIODS: Period[] = ["morning", "afternoon", "evening"];

/** Timing context from the traveller's selected flights (Flights tab). */
function flightContext(trip: WatchedTrip): FlightContext | undefined {
  const sel = trip.selectedFlights;
  if (!sel?.outbound && !sel?.return) return undefined;
  const outLegs = sel?.outbound?.legs ?? [];
  const backLegs = sel?.return?.legs ?? [];
  return {
    arrivalAt: outLegs[outLegs.length - 1]?.arriveTime || undefined,
    departureAt: backLegs[0]?.departTime || undefined,
    outboundSummary: sel?.outbound
      ? `${sel.outbound.airline} ${sel.outbound.flightNumber} · lands ${sel.outbound.arriveTime}`
      : undefined,
    returnSummary: sel?.return
      ? `${sel.return.airline} ${sel.return.flightNumber} · departs ${sel.return.departTime}`
      : undefined,
  };
}

export default function ItineraryPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const { trips, itineraries, hydrated, signedIn, setItinerary, removeItinerary, updateTrip, createShare } = useStore();
  const trip = trips.find((t) => t.id === id);
  const itinerary = itineraries[id];

  const [generating, setGenerating] = useState(false);
  const [regenerating, setRegenerating] = useState(false);
  const [dayIdx, setDayIdx] = useState(0);
  const [shareLink, setShareLink] = useState<string | null>(null);

  if (!hydrated) return <PageShell mode="planning"><div className="h-80 animate-pulse rounded-2xl bg-[var(--surface-2)]" /></PageShell>;
  if (!trip) return <PageShell mode="planning"><p className="ps-muted py-20 text-center">Trip not found.</p></PageShell>;

  async function onGenerate(profile: TripProfile) {
    setGenerating(true);
    const it = await generateItinerary(
      profile, trip!.destinationName, trip!.departDate, trip!.returnDate, trip!.id,
      flightContext(trip!),
    );
    setItinerary(it);
    setGenerating(false);
  }

  function patchDay(dayId: string, updater: (d: Itinerary["days"][number]) => Itinerary["days"][number]) {
    if (!itinerary) return;
    setItinerary({ ...itinerary, days: itinerary.days.map((d) => (d.id === dayId ? updater(d) : d)) });
  }

  async function onRegenerate(dayId: string) {
    if (!itinerary) return;
    const day = itinerary.days.find((d) => d.id === dayId);
    if (!day) return;
    setRegenerating(true);
    const fresh = await regenerateDay(day, itinerary.destinationName);
    patchDay(dayId, (d) => ({ ...d, theme: fresh.theme, slots: fresh.slots }));
    setRegenerating(false);
  }

  function onReplaceSlot(dayId: string, index: number, slot: Slot) {
    patchDay(dayId, (d) => ({ ...d, slots: d.slots.map((s, i) => (i === index ? slot : s)) }));
  }

  function onReorder(dayId: string, from: number, to: number) {
    patchDay(dayId, (d) => {
      const slots = [...d.slots];
      const [moved] = slots.splice(from, 1);
      slots.splice(to, 0, moved);
      return { ...d, slots: slots.map((s, i) => ({ ...s, period: PERIODS[i] ?? s.period })) };
    });
  }

  function downloadICS() {
    if (!itinerary) return;
    const blob = new Blob([itineraryToICS(itinerary)], { type: "text/calendar" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `peak-signal-${trip!.destination}.ics`;
    a.click();
    URL.revokeObjectURL(url);
  }

  function share() {
    const token = createShare(trip!.id);
    setShareLink(`${location.origin}/share/${token}`);
  }

  /** Start over: drop the plan + flight selection, back to picking flights. */
  function replan() {
    if (!confirm("Start over? This deletes the current plan and your flight selection.")) return;
    removeItinerary(trip!.id);
    updateTrip(trip!.id, { selectedFlights: {}, isBooking: false });
    router.push(`/trip/${trip!.id}/prices`);
  }

  // ---- Profile form (no itinerary yet) ----
  if (!itinerary) {
    return (
      <PageShell mode="planning">
        <div className="animate-fade-up space-y-6">
          <div>
            <TripTabs id={trip.id} />
            <h1 className="mt-4 text-3xl font-semibold tracking-tighter2">Plan {trip.destinationName}</h1>
            <p className="ps-muted mt-1 text-[15px]">A fresh profile for this trip — who&rsquo;s coming changes everything.</p>
            {!flightContext(trip) && (
              <p className="mt-1.5 text-[13px] text-signal-wait">
                No flights selected — this plan won&rsquo;t account for your arrival and departure
                times.{" "}
                <Link href={`/trip/${trip.id}/prices`} className="text-accent hover:underline">
                  Pick flights first
                </Link>
              </p>
            )}
          </div>
          <TripProfileForm defaultTravellers={trip.travellers} generating={generating} onGenerate={onGenerate} />
        </div>
      </PageShell>
    );
  }

  // ---- Planner ----
  const days = [...itinerary.days].sort((a, b) => a.dayIndex - b.dayIndex);
  const current = days[Math.min(dayIdx, days.length - 1)];

  return (
    <PageShell mode="planning" wide>
      {/* Print-only (the PDF button = window.print): every day's cards, no app
          chrome — the interactive planner below is print:hidden. */}
      <section className="hidden print:block">
        <h1 className="text-2xl font-semibold">{itinerary.destinationName} — {days.length}-day itinerary</h1>
        <p className="ps-muted mt-1 text-[13px]">
          {shortDay(itinerary.arrival)} – {shortDay(itinerary.departure)} · Peak Signal
        </p>
        {itinerary.preTrip && itinerary.preTrip.length > 0 && (
          <div className="mt-5">
            <h2 className="border-b ps-hairline pb-1 text-[16px] font-semibold">Before you go</h2>
            {itinerary.preTrip.map((t, i) => (
              <div key={i} className="mt-2 text-[13px]" style={{ breakInside: "avoid" }}>
                <p>☐ <strong>{t.task}</strong></p>
                {t.note && <p className="ps-muted">{t.note}</p>}
              </div>
            ))}
          </div>
        )}
        {days.map((d) => (
          <div key={d.id} className="mt-5">
            <h2 className="border-b ps-hairline pb-1 text-[16px] font-semibold">
              Day {d.dayIndex + 1} · {d.theme} <span className="ps-muted font-normal">({shortDay(d.date)})</span>
            </h2>
            {d.slots.map((s, i) => (
              <div key={i} className="mt-2 text-[13px]" style={{ breakInside: "avoid" }}>
                <p>
                  <strong className="capitalize">{s.period}</strong> — {s.activity}
                  {" · "}{s.durationMins} min · {asPrice(s.costPerPerson)}/person
                </p>
                {s.why && <p className="ps-muted">{s.why}</p>}
              </div>
            ))}
          </div>
        ))}
      </section>

      <div className="animate-fade-up space-y-6 print:hidden">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <TripTabs id={trip.id} />
            <h1 className="mt-4 text-3xl font-semibold tracking-tighter2">{itinerary.destinationName}</h1>
            <p className="ps-muted mt-1 text-[14px]">
              {days.length}-day plan · generated by Gemini
              {!itinerary.flightAware && (
                <span className="text-signal-wait"> · planned without flight times</span>
              )}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            {signedIn && (
              <Button variant="secondary" size="sm" onClick={replan}>
                <RotateCcw size={15} /> Re-plan
              </Button>
            )}
            <Button variant="secondary" size="sm" onClick={downloadICS}><CalendarPlus size={15} /> Calendar (.ics)</Button>
            <Button variant="secondary" size="sm" onClick={() => window.print()}><FileDown size={15} /> PDF</Button>
            <Button size="sm" onClick={share}><Share2 size={15} /> Share</Button>
          </div>
        </div>

        {shareLink && (
          <div className="ps-card flex items-center gap-3 p-3 text-[13px]">
            <span className="ps-muted">Read-only link:</span>
            <code className="ps-data truncate text-accent">{shareLink}</code>
            <button onClick={() => navigator.clipboard?.writeText(shareLink)} className="ml-auto rounded-full bg-accent px-3 py-1 text-white">Copy</button>
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          {days.map((d, i) => (
            <button
              key={d.id}
              onClick={() => setDayIdx(i)}
              className={cn(
                "rounded-full px-4 py-1.5 text-[13px] font-medium transition",
                i === dayIdx ? "bg-accent text-white shadow-sm" : "border ps-hairline bg-[var(--surface-2)] ps-muted hover:text-[var(--text)]",
              )}
            >
              Day {d.dayIndex + 1}
            </button>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_420px]">
          {/* Cards first on mobile; on desktop the map takes the big left column. */}
          <div className="lg:order-2">
            <DayView
              key={current.id}
              day={current}
              destination={itinerary.destinationName}
              regenerating={regenerating}
              onRegenerate={() => onRegenerate(current.id)}
              onReplaceSlot={(index, slot) => onReplaceSlot(current.id, index, slot)}
              onReorder={(from, to) => onReorder(current.id, from, to)}
            />
          </div>
          <div className="space-y-6 lg:order-1">
            <ItineraryMap itinerary={itinerary} tall />
            <BudgetTracker itinerary={itinerary} />
            {itinerary.preTrip && itinerary.preTrip.length > 0 && (
              <Card>
                <SectionTitle>Before you go</SectionTitle>
                <ul className="mt-3 space-y-2.5">
                  {itinerary.preTrip.map((t, i) => (
                    <li key={i} className="flex gap-2.5 text-[13px]">
                      <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-accent" />
                      <div className="min-w-0">
                        <p className="font-medium">{t.task}</p>
                        {t.note && <p className="ps-muted">{t.note}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              </Card>
            )}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
