"use client";

import { useEffect, useState } from "react";
import { ArrowUpRight, Star } from "lucide-react";
import type { Experience } from "@/lib/types";
import { getExperiences } from "@/lib/viator";
import { asPrice } from "@/lib/format";

export function ExperiencesList({ destination }: { destination: string }) {
  const [items, setItems] = useState<Experience[] | null>(null);

  useEffect(() => {
    let active = true;
    getExperiences(destination).then((x) => active && setItems(x));
    return () => { active = false; };
  }, [destination]);

  if (!items) return <div className="ps-card h-32 animate-pulse opacity-60" />;

  return (
    <div className="grid gap-3 sm:grid-cols-2">
      {items.map((e) => (
        <div key={e.id} className="ps-card p-4">
          <div className="flex items-start justify-between gap-3">
            <h4 className="text-[15px] font-semibold leading-snug">{e.title}</h4>
            <span className="ps-data shrink-0 text-[15px] font-semibold">{asPrice(e.pricePerPerson)}</span>
          </div>
          <div className="mt-1.5 flex items-center gap-1.5 text-[13px]">
            <Star size={13} className="fill-signal-wait text-signal-wait" />
            <span className="font-medium">{e.rating.toFixed(1)}</span>
            <span className="ps-muted">({e.reviewCount.toLocaleString()})</span>
          </div>
          <p className="ps-muted mt-1.5 text-[13px]">{e.bookingWindowAdvice}</p>
          {e.bookingUrl && (
            <a
              href={e.bookingUrl} target="_blank" rel="noreferrer"
              className="mt-2 inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline"
            >
              Book <ArrowUpRight size={13} />
            </a>
          )}
        </div>
      ))}
    </div>
  );
}
