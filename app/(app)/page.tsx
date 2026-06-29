"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { addDays, formatISO } from "date-fns";
import { ArrowRight, LineChart, Scale, Sparkles } from "lucide-react";
import { PageShell } from "@/components/ui/PageShell";
import { Button, ButtonLink } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { useStore } from "@/components/store";
import { flightHistory } from "@/lib/sample-data";

const isoDay = (d: Date) => formatISO(d, { representation: "date" });

export default function Landing() {
  const router = useRouter();
  const { addTrip } = useStore();

  const [origin, setOrigin] = useState("JFK");
  const [destination, setDestination] = useState("CDG");
  const [name, setName] = useState("Paris, France");
  const [depart, setDepart] = useState(isoDay(addDays(new Date(), 30)));
  const [ret, setRet] = useState(isoDay(addDays(new Date(), 40)));
  const [travellers, setTravellers] = useState(2);

  function track() {
    const id = `trip_${(globalThis.crypto?.randomUUID?.() ?? Date.now().toString(36)).slice(0, 8)}`;
    addTrip({
      id, origin: origin.toUpperCase(), destination: destination.toUpperCase(),
      destinationName: name, departDate: depart, returnDate: ret, travellers,
      createdAt: new Date().toISOString(), isBooking: false,
      priceHistory: flightHistory(880, "dip"),
    });
    router.push(`/trip/${id}/prices`);
  }

  return (
    <PageShell mode="planning" wide>
      <section className="animate-fade-up py-5 sm:py-8">
        <p className="ps-muted text-[13px] font-medium uppercase tracking-[0.12em]">Travel intelligence</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-semibold leading-[1.05] tracking-tighter2 sm:text-6xl">
          Know when to buy.
          <br />
          Know what to do when you get there.
        </h1>
        <p className="ps-muted mt-5 max-w-2xl text-[17px] leading-relaxed sm:text-[19px]">
          Flight, hotel, and Airbnb prices tracked honestly — no commissions, no upsells. When
          you&rsquo;re ready to book, a per-trip AI itinerary built from scratch around who
          you&rsquo;re travelling with.
        </p>
        <div className="mt-7 flex flex-wrap gap-3">
          {/* Live demo temporarily disabled
          <ButtonLink href="/trip/trip_paris/prices" size="lg">
            See the live demo <ArrowRight size={18} />
          </ButtonLink>
          */}
          <ButtonLink href="/watchlist" variant="secondary" size="lg">
            Open watchlist
          </ButtonLink>
        </div>
      </section>

      <Card className="animate-fade-up">
        <div className="grid gap-4 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <div className="grid grid-cols-2 gap-3">
            <Field label="From">
              <input className="ps-field w-full uppercase" value={origin} maxLength={3} onChange={(e) => setOrigin(e.target.value)} />
            </Field>
            <Field label="To">
              <input className="ps-field w-full uppercase" value={destination} maxLength={3} onChange={(e) => setDestination(e.target.value)} />
            </Field>
            <Field label="Destination" className="col-span-2">
              <input className="ps-field w-full" value={name} onChange={(e) => setName(e.target.value)} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Depart">
              <input type="date" className="ps-field w-full" value={depart} onChange={(e) => setDepart(e.target.value)} />
            </Field>
            <Field label="Return">
              <input type="date" className="ps-field w-full" value={ret} onChange={(e) => setRet(e.target.value)} />
            </Field>
            <Field label="Travellers" className="col-span-2">
              <select className="ps-field w-full" value={travellers} onChange={(e) => setTravellers(Number(e.target.value))}>
                {[1, 2, 4, 6].map((n) => <option key={n} value={n}>{n}</option>)}
              </select>
            </Field>
          </div>
          <Button size="lg" onClick={track} className="w-full sm:w-auto">Track prices</Button>
        </div>
      </Card>

      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        <Feature Icon={LineChart} title="Honest price intelligence"
          body="90-day candlestick history and a buy/wait verdict from a rolling-average algorithm — no dark patterns." />
        <Feature Icon={Scale} title="Hotel vs Airbnb"
          body="Side-by-side comparison with a plain-English recommendation weighing price, flexibility, and location." />
        <Feature Icon={Sparkles} title="Per-trip AI planner"
          body="A fresh profile every trip — solo and family holidays get completely different day-by-day plans." />
      </section>
    </PageShell>
  );
}

function Field({ label, children, className }: { label: string; children: React.ReactNode; className?: string }) {
  return (
    <label className={className}>
      <span className="ps-muted mb-1.5 block text-[12px] font-medium">{label}</span>
      {children}
    </label>
  );
}

function Feature({ Icon, title, body }: { Icon: typeof LineChart; title: string; body: string }) {
  return (
    <Card>
      <Icon className="text-accent" size={22} />
      <h3 className="mt-3 text-[16px] font-semibold tracking-tightish">{title}</h3>
      <p className="ps-muted mt-1.5 text-[14px] leading-relaxed">{body}</p>
    </Card>
  );
}
