import type { Verdict } from "@/lib/types";
import { signalColor } from "@/components/ui/SignalBadge";

const emoji: Record<Verdict["signal"], string> = { buy: "✅", wait: "⏳", peak: "🔴" };

/** The plain-English buy/wait/peak card from spec §3.2. */
export function VerdictCard({ verdict }: { verdict: Verdict }) {
  const color = signalColor(verdict.signal);
  return (
    // Liquid Glass verdict: card material with the signal colour as an inner
    // glow rather than a flat tint.
    <div className="ps-card relative overflow-hidden p-5 sm:p-6">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background: `radial-gradient(520px 240px at 8% -12%, ${color}40, transparent 65%), radial-gradient(380px 220px at 96% 115%, ${color}1a, transparent 60%)`,
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2.5">
          <span className="text-lg">{emoji[verdict.signal]}</span>
          <span className="text-[17px] font-bold tracking-tightish" style={{ color }}>
            {verdict.headline}
          </span>
        </div>
        <p className="mt-2 text-[15px] leading-relaxed">{verdict.explanation}</p>
      </div>
    </div>
  );
}
