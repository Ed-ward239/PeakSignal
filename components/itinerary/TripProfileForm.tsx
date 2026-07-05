"use client";

import { useState } from "react";
import { Minus, Plus, Sparkles } from "lucide-react";
import { Card, SectionTitle } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Segmented } from "@/components/ui/Segmented";
import { Chip } from "@/components/ui/Chip";
import type { Interest, Mobility, Pace, TravelGroup, TripProfile, Traveller } from "@/lib/types";
import { asPrice } from "@/lib/format";

const GROUPS: TravelGroup[] = ["solo", "couple", "family", "friends"];
const PACES: Pace[] = ["relaxed", "balanced", "packed"];
const INTERESTS: Interest[] = ["food", "art", "nightlife", "nature", "history", "shopping", "adventure"];
const DIETARY = ["nut_allergy", "vegan", "vegetarian", "gluten_free", "halal"];
const cap = (s: string) => s.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

/** Per-trip profile builder (spec §4.1) — fresh context for every trip. */
export function TripProfileForm({
  defaultTravellers,
  generating,
  onGenerate,
}: {
  defaultTravellers: number;
  generating: boolean;
  onGenerate: (profile: TripProfile) => void;
}) {
  const [group, setGroup] = useState<TravelGroup>(defaultTravellers >= 4 ? "family" : defaultTravellers === 2 ? "couple" : "solo");
  const [travellers, setTravellers] = useState<Traveller[]>(
    Array.from({ length: Math.max(1, defaultTravellers) }, () => ({ age: 30, role: "adult" as const })),
  );
  const [budget, setBudget] = useState(120);
  const [pace, setPace] = useState<Pace>("relaxed");
  const [interests, setInterests] = useState<Interest[]>(["food"]);
  const [dietary, setDietary] = useState<string[]>([]);
  const [mobility, setMobility] = useState<Mobility>("standard");
  const [notes, setNotes] = useState("");

  const toggle = <T,>(arr: T[], v: T): T[] => (arr.includes(v) ? arr.filter((x) => x !== v) : [...arr, v]);

  function submit() {
    onGenerate({ group, travellers, budgetPerPersonPerDay: budget, pace, interests, dietary, mobility, notes: notes.trim() || undefined });
  }

  return (
    <Card className="space-y-7">
      <div>
        <SectionTitle>Who&rsquo;s coming</SectionTitle>
        <div className="mt-2.5">
          <Segmented options={GROUPS.map((g) => ({ value: g, label: cap(g) }))} value={group} onChange={setGroup} />
        </div>
        <div className="mt-4 space-y-2">
          {travellers.map((t, i) => (
            <div key={i} className="flex items-center gap-3">
              <span className="ps-muted w-20 text-[13px]">Traveller {i + 1}</span>
              <input
                type="number" className="ps-field w-20" value={t.age} min={0} max={99}
                onChange={(e) => setTravellers((ts) => ts.map((x, j) => (j === i ? { ...x, age: Number(e.target.value) } : x)))}
              />
              <select
                className="ps-field flex-1" value={t.role}
                onChange={(e) => setTravellers((ts) => ts.map((x, j) => (j === i ? { ...x, role: e.target.value as Traveller["role"] } : x)))}
              >
                <option value="adult">Adult</option>
                <option value="child">Child</option>
                <option value="senior">Senior</option>
              </select>
              <button
                className="ps-muted rounded-full p-2 hover:bg-black/5"
                onClick={() => setTravellers((ts) => ts.filter((_, j) => j !== i))}
                aria-label="Remove traveller"
              ><Minus size={15} /></button>
            </div>
          ))}
          <button
            onClick={() => setTravellers((ts) => [...ts, { age: 30, role: "adult" }])}
            className="ps-muted inline-flex items-center gap-1.5 text-[13px] font-medium hover:text-[var(--text)]"
          ><Plus size={14} /> Add traveller</button>
        </div>
      </div>

      <div>
        <SectionTitle>Budget per person / day — {asPrice(budget)}</SectionTitle>
        <input type="range" min={30} max={500} step={10} value={budget}
          onChange={(e) => setBudget(Number(e.target.value))} className="mt-3 w-full accent-accent" />
      </div>

      <div>
        <SectionTitle>Pace</SectionTitle>
        <div className="mt-2.5"><Segmented options={PACES.map((p) => ({ value: p, label: cap(p) }))} value={pace} onChange={setPace} /></div>
      </div>

      <div>
        <SectionTitle>Interests this trip</SectionTitle>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {INTERESTS.map((i) => <Chip key={i} label={cap(i)} selected={interests.includes(i)} onClick={() => setInterests((a) => toggle(a, i))} />)}
        </div>
      </div>

      <div>
        <SectionTitle>Dietary needs</SectionTitle>
        <div className="mt-2.5 flex flex-wrap gap-2">
          {DIETARY.map((d) => <Chip key={d} label={cap(d)} selected={dietary.includes(d)} onClick={() => setDietary((a) => toggle(a, d))} />)}
        </div>
      </div>

      <div>
        <SectionTitle>Mobility</SectionTitle>
        <select className="ps-field mt-2.5 w-full max-w-xs" value={mobility} onChange={(e) => setMobility(e.target.value as Mobility)}>
          <option value="standard">Standard</option>
          <option value="wheelchair_accessible">Wheelchair accessible</option>
        </select>
      </div>

      <div>
        <SectionTitle>Anything else</SectionTitle>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={4}
          placeholder="Other information you'd like to add for this plan…"
          className="ps-field mt-2.5 w-full resize-y"
        />
      </div>

      <Button size="lg" onClick={submit} disabled={generating} className="w-full sm:w-auto">
        <Sparkles size={18} /> {generating ? "Building your itinerary…" : "Generate itinerary"}
      </Button>
    </Card>
  );
}
