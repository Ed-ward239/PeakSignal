"use client";

import { useEffect, useState } from "react";
import { Building2, House } from "lucide-react";
import { buildComparison, type ComparisonResult } from "@/lib/compare";
import { asPrice, nightsBetween } from "@/lib/format";
import type { StayQuote, WatchedTrip } from "@/lib/types";

type StaysResponse = { hotel: StayQuote | null; airbnb: StayQuote | null; degraded?: boolean };

/** Destination-aware fallbacks (labelled "Estimate") so the compare still renders
 *  when live RapidAPI data is unavailable — Airbnb especially can be blocked. */
function estimateHotel(city: string): StayQuote {
  return { kind: "hotel", name: `Central hotel, ${city}`, pricePerNight: 190, cancellation: "Free cancellation", refundable: true, locationScore: 9 };
}
function estimateAirbnb(city: string): StayQuote {
  return { kind: "airbnb", name: `Apartment in ${city}`, pricePerNight: 145, cancellation: "Non-refundable", refundable: false, locationScore: 7.5, superhost: true };
}

function SourceTag({ live, source }: { live: boolean; source: string }) {
  return (
    <span className={`ml-2 rounded-full px-1.5 py-0.5 text-[9px] font-semibold tracking-normal ${live ? "bg-emerald-500/15 text-emerald-400" : "bg-[var(--surface-2)] ps-muted"}`}>
      {live ? `Live · ${source}` : "Estimate"}
    </span>
  );
}

/** Hotel vs Airbnb side-by-side with a plain-English recommendation (spec §3.3).
 *  Live data comes from /api/stays (Booking.com + airbnb19 via RapidAPI). */
export function AccommodationCompare({ trip }: { trip: WatchedTrip }) {
  const nights = nightsBetween(trip.departDate, trip.returnDate);
  const city = trip.destinationName.split(/[,(]/)[0].trim();

  const [state, setState] = useState<{
    result: ComparisonResult; hotelLive: boolean; airbnbLive: boolean; degraded: boolean;
  } | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    setState(null);
    setFailed(false);
    fetch("/api/stays", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(trip),
    })
      .then((r) => (r.ok ? (r.json() as Promise<StaysResponse>) : Promise.reject()))
      .then((data) => {
        if (!active) return;
        const hotel = data.hotel ?? estimateHotel(city);
        const airbnb = data.airbnb ?? estimateAirbnb(city);
        setState({
          result: buildComparison(hotel, airbnb, nights),
          hotelLive: Boolean(data.hotel),
          airbnbLive: Boolean(data.airbnb),
          degraded: Boolean(data.degraded),
        });
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; };
  }, [trip, city, nights]);

  if (failed) {
    return <div className="ps-card p-6 text-center ps-muted text-[14px]">Couldn&rsquo;t load stays right now. Try again shortly.</div>;
  }
  if (!state) return <div className="ps-card h-48 animate-pulse opacity-60" />;

  const { result, hotelLive, airbnbLive, degraded } = state;
  const { hotel, airbnb, winner, rationale } = result;

  const rows: [string, string, string][] = [
    ["Price / night", asPrice(hotel.pricePerNight), asPrice(airbnb.pricePerNight)],
    ["Total / " + nights + " nights", asPrice(hotel.pricePerNight * nights), asPrice(airbnb.pricePerNight * nights)],
    ["Cancellation", hotel.cancellation, airbnb.cancellation],
    ["Location score", `${hotel.locationScore.toFixed(1)} / 10`, `${airbnb.locationScore.toFixed(1)} / 10`],
    ["Superhost", "—", airbnb.superhost ? "Yes" : "No"],
  ];

  return (
    <div className="grid gap-4">
      {degraded && (
        <p className="text-[13px] text-signal-wait">
          Live accommodation data is temporarily unavailable — the data provider&rsquo;s request
          limit was reached. Showing estimates below.
        </p>
      )}
      <div className="ps-card overflow-hidden p-0">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b ps-hairline px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]">
          <span />
          <span className="ps-muted flex items-center">Best hotel<SourceTag live={hotelLive} source="Booking.com" /></span>
          <span className="ps-muted flex items-center">Best Airbnb<SourceTag live={airbnbLive} source="Airbnb" /></span>
        </div>
        {rows.map(([label, h, a], i) => (
          <div key={label} className={`grid grid-cols-[1.2fr_1fr_1fr] px-5 py-3 ${i % 2 ? "" : "bg-[var(--surface-2)]"}`}>
            <span className="ps-muted text-[13px]">{label}</span>
            <span className="ps-data text-[14px] font-medium">{h}</span>
            <span className="ps-data text-[14px] font-medium">{a}</span>
          </div>
        ))}
      </div>

      {/* Liquid Glass callout: the card material with a soft accent glow inside,
          not a flat tint fill. */}
      <div className="ps-card relative overflow-hidden p-5">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0"
          style={{
            background:
              "radial-gradient(480px 220px at 10% -10%, rgba(16,185,129,0.28), transparent 65%), radial-gradient(360px 200px at 95% 110%, rgba(16,185,129,0.12), transparent 60%)",
          }}
        />
        <div className="relative">
          <p className="ps-muted text-[11px] font-semibold uppercase tracking-[0.08em]">Peak Signal recommendation</p>
          <div className="mt-2 flex items-center gap-2">
            {winner.kind === "hotel" ? <Building2 size={18} className="text-accent" /> : <House size={18} className="text-accent" />}
            <span className="text-[16px] font-semibold">{winner.name}</span>
          </div>
          <p className="mt-1.5 text-[15px] leading-relaxed">{rationale}</p>
        </div>
      </div>
    </div>
  );
}
