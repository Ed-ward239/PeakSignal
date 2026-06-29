"use client";

import { useEffect, useState } from "react";
import { Building2, House } from "lucide-react";
import { getBestHotel } from "@/lib/amadeus";
import { getBestAirbnb } from "@/lib/airbnb";
import { buildComparison, type ComparisonResult } from "@/lib/compare";
import { asPrice } from "@/lib/format";

/** Hotel vs Airbnb side-by-side with a plain-English recommendation (spec §3.3). */
export function AccommodationCompare({ destination, nights }: { destination: string; nights: number }) {
  const [result, setResult] = useState<ComparisonResult | null>(null);

  useEffect(() => {
    let active = true;
    Promise.all([getBestHotel(destination), getBestAirbnb(destination)]).then(([h, a]) => {
      if (active) setResult(buildComparison(h, a, nights));
    });
    return () => { active = false; };
  }, [destination, nights]);

  if (!result) return <div className="ps-card h-48 animate-pulse opacity-60" />;
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
      <div className="ps-card overflow-hidden p-0">
        <div className="grid grid-cols-[1.2fr_1fr_1fr] border-b ps-hairline px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.06em]">
          <span />
          <span className="ps-muted">Best hotel</span>
          <span className="ps-muted">Best Airbnb</span>
        </div>
        {rows.map(([label, h, a], i) => (
          <div key={label} className={`grid grid-cols-[1.2fr_1fr_1fr] px-5 py-3 ${i % 2 ? "" : "bg-[var(--surface-2)]"}`}>
            <span className="ps-muted text-[13px]">{label}</span>
            <span className="ps-data text-[14px] font-medium">{h}</span>
            <span className="ps-data text-[14px] font-medium">{a}</span>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-accent/40 bg-accent/10 p-5">
        <p className="ps-muted text-[11px] font-semibold uppercase tracking-[0.08em]">Peak Signal recommendation</p>
        <div className="mt-2 flex items-center gap-2">
          {winner.kind === "hotel" ? <Building2 size={18} className="text-accent" /> : <House size={18} className="text-accent" />}
          <span className="text-[16px] font-semibold">{winner.name}</span>
        </div>
        <p className="mt-1.5 text-[15px] leading-relaxed">{rationale}</p>
      </div>
    </div>
  );
}
