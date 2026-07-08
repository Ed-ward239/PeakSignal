"use client";

import { use, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, differenceInCalendarDays, formatISO, parseISO } from "date-fns";
import { Info, Sparkles } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { TripTabs } from "@/components/ui/TripTabs";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
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
  const [returnFlights, setReturnFlights] = useState<Flight[]>([]);
  const [direction, setDirection] = useState<"out" | "back">("out");
  // Connection filter: everything / nonstops only / connections only.
  const [stopsFilter, setStopsFilter] = useState<"any" | "nonstop" | "stops">("any");
  // Soft gate on "Plan this trip": warn once when flights aren't selected;
  // a second click proceeds without them.
  const [flightWarning, setFlightWarning] = useState(false);
  const [degraded, setDegraded] = useState(false); // provider refused (quota/rate limit)
  // Flexible-date exploration: heat-map picks override the searched departure
  // (return shifts by the same delta so trip length is preserved).
  const [altDepart, setAltDepart] = useState<string | null>(null);
  // Live min-price calendar (party totals by departure date) for the heat map.
  const [calendar, setCalendar] = useState<Record<string, number | null> | null>(null);

  const shiftDays = altDepart && trip ? differenceInCalendarDays(parseISO(altDepart), parseISO(trip.departDate)) : 0;
  const searchDepart = altDepart ?? trip?.departDate;
  const searchReturn = trip && shiftDays !== 0
    ? formatISO(addDays(parseISO(trip.returnDate), shiftDays), { representation: "date" })
    : trip?.returnDate;

  // Fetch live flights for the searched dates (server route → Booking.com;
  // Redis-cached upstream). Re-runs when a flexible date is picked.
  useEffect(() => {
    if (!trip) return;
    let active = true;
    setFlights(null);
    setDegraded(false);
    fetch("/api/flights", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...trip, departDate: searchDepart, returnDate: searchReturn }),
    })
      .then((r) => (r.ok ? r.json() : { flights: [], returnFlights: [], degraded: false }))
      .then((res: { flights: Flight[]; returnFlights?: Flight[]; degraded: boolean }) => {
        if (!active) return;
        setFlights(res.flights ?? []);
        setReturnFlights(res.returnFlights ?? []);
        setDirection("out");
        setDegraded(Boolean(res.degraded));
      })
      .catch(() => active && setFlights([]));
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, trip?.roundTrip, trip?.travellers, searchDepart, searchReturn]);

  // Live fare calendar for the heat map (each date shares the Redis cache with
  // the flight-list search, so date clicks after this load are instant).
  useEffect(() => {
    if (!trip) return;
    let active = true;
    setCalendar(null);
    fetch("/api/price-calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip),
    })
      .then((r) => (r.ok ? r.json() : {}))
      .then((c: Record<string, number | null>) => { if (active) setCalendar(c ?? {}); })
      .catch(() => { if (active) setCalendar({}); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trip?.id, trip?.roundTrip, trip?.travellers, trip?.departDate, trip?.returnDate]);

  if (!hydrated) return <PageShell mode="intelligence"><div className="h-80 animate-pulse rounded-2xl bg-[var(--surface-2)]" /></PageShell>;
  if (!trip) return <PageShell mode="intelligence"><p className="ps-muted py-20 text-center">Trip not found.</p></PageShell>;

  const pax = trip.travellers || 1;
  const cheapest = flights && flights.length ? flights[0] : null;
  const partyTotal = cheapest?.price ?? null;           // round-trip total for the party
  const perPerson = partyTotal != null ? Math.round(partyTotal / pax) : null;
  // Calendar party totals → per-person for the heat map cells.
  const calendarPerPerson = calendar
    ? Object.fromEntries(
        Object.entries(calendar).map(([d, v]) => [d, v == null ? null : Math.round(v / pax)]),
      )
    : undefined;

  const history = trip.priceHistory.filter((p) => p.category === "flight");
  const verdict = history.length ? verdictForTrip(trip) : null;

  // Connection filter — applied to whichever direction is displayed. The
  // header's "cheapest" stays unfiltered (it's the tracked price).
  const shown = direction === "back" ? returnFlights : flights;
  const matchesFilter = (f: Flight) =>
    stopsFilter === "any" || (stopsFilter === "nonstop" ? f.stops === 0 : f.stops >= 1);
  const filtered = shown?.filter(matchesFilter) ?? null;
  const nonstopCount = (shown ?? []).filter((f) => f.stops === 0).length;
  const stopsCount = (shown ?? []).length - nonstopCount;

  // Flight selection (persisted on the trip) — the planner uses its times.
  const selected = trip.selectedFlights ?? {};
  const selectedIdFor = direction === "back" ? selected.return?.id : selected.outbound?.id;
  function selectFlight(f: Flight) {
    const key = direction === "back" ? "return" : "outbound";
    const cur = trip!.selectedFlights ?? {};
    const already = (key === "return" ? cur.return : cur.outbound)?.id === f.id;
    updateTrip(trip!.id, { selectedFlights: { ...cur, [key]: already ? undefined : f } });
  }

  const selectionIncomplete = !selected.outbound || (trip.roundTrip && !selected.return);

  function book() {
    if (selectionIncomplete && !flightWarning) {
      setFlightWarning(true);
      return;
    }
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
            ) : degraded ? (
              <span className="text-[15px] text-signal-wait">
                Live prices unavailable — flight data provider limit reached. Try again later.
              </span>
            ) : (
              <span className="ps-muted text-[15px]">No live price found for these dates.</span>
            )}
          </div>
        </div>

        {verdict ? (
          <VerdictCard verdict={verdict} />
        ) : (
          <div className="ps-card flex items-start gap-3 p-4">
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

        <Card>
          <SectionTitle>Flexible dates</SectionTitle>
          <div className="mt-3">
            <DateHeatMap
              departDate={trip.departDate}
              prices={calendarPerPerson}
              value={searchDepart}
              onSelect={(d) => setAltDepart(d === trip.departDate ? null : d)}
            />
          </div>
        </Card>

        <div>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <SectionTitle>Flights</SectionTitle>
              {altDepart && (
                <p className="ps-muted mt-1 text-[12px]">
                  Flexible date: departing <strong className="text-[var(--text)]">{shortDay(altDepart)}</strong>
                  {trip.roundTrip && searchReturn ? <> · returning {shortDay(searchReturn)}</> : null}{" "}
                  <button onClick={() => setAltDepart(null)} className="text-accent hover:underline">
                    Back to {shortDay(trip.departDate)}
                  </button>
                </p>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {(shown?.length ?? 0) > 0 && (
                <Segmented<"any" | "nonstop" | "stops">
                  options={[
                    { value: "any", label: "Any" },
                    { value: "nonstop", label: `Nonstop (${nonstopCount})` },
                    { value: "stops", label: `1+ stops (${stopsCount})` },
                  ]}
                  value={stopsFilter}
                  onChange={setStopsFilter}
                />
              )}
              {trip.roundTrip && returnFlights.length > 0 && (
                <Segmented<"out" | "back">
                  options={[{ value: "out", label: "Departure" }, { value: "back", label: "Return" }]}
                  value={direction}
                  onChange={setDirection}
                />
              )}
            </div>
          </div>
          <div className="mt-3">
            {shown && shown.length > 0 && filtered && filtered.length === 0 ? (
              <div className="ps-card ps-muted py-8 text-center text-[14px]">
                No {stopsFilter === "nonstop" ? "nonstop flights" : "flights with stops"} in these results.{" "}
                <button onClick={() => setStopsFilter("any")} className="text-accent hover:underline">
                  Show all {shown.length}
                </button>
              </div>
            ) : (
              <FlightsList
                flights={filtered}
                degraded={degraded}
                selectedId={selectedIdFor ?? null}
                onSelect={selectFlight}
              />
            )}
          </div>
          {trip.roundTrip && returnFlights.length > 0 && (
            <p className="ps-muted mt-2 text-[12px]">
              Prices are the round-trip total per person for the paired itinerary.
            </p>
          )}
        </div>

        <div className="ps-card flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="text-[16px] font-semibold">Ready to go?</p>
            <p className="ps-muted text-[14px]">
              Build a per-trip AI itinerary from scratch
              {selected.outbound || selected.return ? " — planned around your flights:" : "."}
            </p>
            {selected.outbound && (
              <p className="ps-muted ps-data mt-1 text-[12px]">
                ✓ Out: {selected.outbound.airline} {selected.outbound.flightNumber} · lands {selected.outbound.arriveTime}
              </p>
            )}
            {selected.return && (
              <p className="ps-muted ps-data text-[12px]">
                ✓ Back: {selected.return.airline} {selected.return.flightNumber} · departs {selected.return.departTime}
              </p>
            )}
            {flightWarning && selectionIncomplete && (
              <p className="mt-1.5 text-[13px] font-medium text-signal-peak">
                Please select the flights for more accurate planning — or press the button again to
                continue without them.
              </p>
            )}
          </div>
          <Button size="lg" onClick={book}><Sparkles size={18} /> {trip.isBooking ? "Plan this trip" : "I'm booking this"}</Button>
        </div>
      </div>
    </PageShell>
  );
}
