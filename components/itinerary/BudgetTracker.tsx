import type { Itinerary } from "@/lib/types";
import { SectionTitle } from "@/components/ui/Card";
import { asPrice } from "@/lib/format";

/** Running estimated cost across the itinerary, per person (spec §4.3). */
export function BudgetTracker({ itinerary }: { itinerary: Itinerary }) {
  const total = itinerary.days.reduce((s, d) => s + d.slots.reduce((a, b) => a + b.costPerPerson, 0), 0);
  return (
    <div className="ps-card p-5">
      <SectionTitle>Budget · per person</SectionTitle>
      <ul className="mt-3 space-y-2">
        {[...itinerary.days].sort((a, b) => a.dayIndex - b.dayIndex).map((d) => {
          const dayTotal = d.slots.reduce((a, b) => a + b.costPerPerson, 0);
          return (
            <li key={d.id} className="flex items-center justify-between text-[14px]">
              <span className="ps-muted truncate pr-3">Day {d.dayIndex + 1} · {d.theme}</span>
              <span className="ps-data font-medium">{asPrice(dayTotal)}</span>
            </li>
          );
        })}
      </ul>
      <div className="mt-3 flex items-center justify-between border-t ps-hairline pt-3">
        <span className="text-[15px] font-semibold">Total per person</span>
        <span className="ps-data text-[20px] font-bold text-accent">{asPrice(total)}</span>
      </div>
    </div>
  );
}
