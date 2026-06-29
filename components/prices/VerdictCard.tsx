import type { Verdict } from "@/lib/types";
import { signalColor } from "@/components/ui/SignalBadge";

const emoji: Record<Verdict["signal"], string> = { buy: "✅", wait: "⏳", peak: "🔴" };

/** The plain-English buy/wait/peak card from spec §3.2. */
export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const color = signalColor(verdict.signal);
  return (
    <div
      className="rounded-2xl border p-5 sm:p-6"
      style={{ background: `${color}1f`, borderColor: `${color}55` }}
    >
      <div className="flex items-center gap-2.5">
        <span className="text-lg">{emoji[verdict.signal]}</span>
        <span className="text-[17px] font-bold tracking-tightish" style={{ color }}>
          {verdict.headline}
        </span>
      </div>
      <p className="mt-2 text-[15px] leading-relaxed">{verdict.explanation}</p>
    </div>
  );
}
