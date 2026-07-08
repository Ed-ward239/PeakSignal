"use client";

import { useState } from "react";
import { ArrowUpRight, ChevronDown, ChevronUp, GripVertical, Moon, RefreshCw, Sun, Sunrise, Wand2 } from "lucide-react";
import type { ItineraryDay, Period, Slot } from "@/lib/types";
import { findAlternatives } from "@/lib/itinerary-client";
import { asPrice } from "@/lib/format";
import { Button } from "@/components/ui/Button";
import { SlotImage } from "@/components/itinerary/SlotImage";

const periodIcon: Record<Period, typeof Sun> = { morning: Sunrise, afternoon: Sun, evening: Moon };

export function DayView({
  day, destination, regenerating, onRegenerate, onReplaceSlot, onReorder,
}: {
  day: ItineraryDay;
  destination: string;
  regenerating: boolean;
  onRegenerate: () => void;
  onReplaceSlot: (index: number, slot: Slot) => void;
  onReorder: (from: number, to: number) => void;
}) {
  const [altIndex, setAltIndex] = useState<number | null>(null);
  const [alts, setAlts] = useState<Slot[]>([]);
  const [loading, setLoading] = useState(false);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  async function openAlternatives(i: number, slot: Slot) {
    setAltIndex(i); setLoading(true);
    setAlts(await findAlternatives(slot, destination));
    setLoading(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="ps-muted text-[12px] font-semibold uppercase tracking-[0.08em]">Day {day.dayIndex + 1}</p>
          <h2 className="text-xl font-semibold tracking-tightish">{day.theme}</h2>
        </div>
        <Button variant="secondary" size="sm" onClick={onRegenerate} disabled={regenerating}>
          <RefreshCw size={15} className={regenerating ? "animate-spin" : ""} /> Surprise me
        </Button>
      </div>

      {day.slots.map((slot, i) => {
        const Icon = periodIcon[slot.period];
        return (
          <div
            key={i}
            draggable
            onDragStart={() => setDragIndex(i)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={() => { if (dragIndex !== null && dragIndex !== i) onReorder(dragIndex, i); setDragIndex(null); }}
            className="ps-card p-4"
          >
            <div className="flex items-start gap-3">
              <GripVertical size={16} className="ps-muted mt-1 cursor-grab" />
              <SlotImage
                activity={slot.activity}
                destination={destination}
                imageUrl={slot.imageUrl}
                className="h-20 w-20 shrink-0 rounded-xl"
              />
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="ps-muted inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.06em]">
                    <Icon size={14} className="text-accent" /> {slot.period}
                  </span>
                  <span className="ps-data ps-muted text-[12px]">{slot.durationMins} min · {asPrice(slot.costPerPerson)}</span>
                </div>
                <h3 className="mt-1 text-[16px] font-semibold">{slot.activity}</h3>
                <p className="ps-muted mt-1 text-[14px] leading-relaxed">{slot.why}</p>
                <div className="mt-2 flex items-center gap-3">
                  {slot.bookingUrl && (
                    <a href={slot.bookingUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 text-[13px] font-medium text-accent hover:underline">
                      Book <ArrowUpRight size={13} />
                    </a>
                  )}
                  <button onClick={() => openAlternatives(i, slot)} className="ps-muted inline-flex items-center gap-1 text-[13px] font-medium hover:text-[var(--text)]">
                    <Wand2 size={13} /> Find alternative
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <button disabled={i === 0} onClick={() => onReorder(i, i - 1)} className="ps-muted rounded-md p-1 hover:bg-black/5 disabled:opacity-30" aria-label="Move up"><ChevronUp size={16} /></button>
                <button disabled={i === day.slots.length - 1} onClick={() => onReorder(i, i + 1)} className="ps-muted rounded-md p-1 hover:bg-black/5 disabled:opacity-30" aria-label="Move down"><ChevronDown size={16} /></button>
              </div>
            </div>

            {altIndex === i && (
              <div className="mt-3 border-t ps-hairline pt-3">
                {loading ? (
                  <p className="ps-muted text-[13px]">Asking Claude for alternatives…</p>
                ) : (
                  <div className="grid gap-2">
                    {alts.map((alt, k) => (
                      <button
                        key={k}
                        onClick={() => { onReplaceSlot(i, { ...alt, period: slot.period }); setAltIndex(null); }}
                        className="rounded-xl border ps-hairline bg-[var(--surface-2)] p-3 text-left transition hover:border-accent"
                      >
                        <div className="flex justify-between">
                          <span className="text-[14px] font-semibold">{alt.activity}</span>
                          <span className="ps-data text-[13px]">{asPrice(alt.costPerPerson)}</span>
                        </div>
                        <p className="ps-muted mt-0.5 text-[13px]">{alt.why}</p>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
