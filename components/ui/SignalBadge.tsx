import { CheckCircle2, Hourglass, OctagonAlert } from "lucide-react";
import type { Signal } from "@/lib/types";
import { cn } from "@/lib/cn";

const config: Record<Signal, { label: string; color: string; bg: string; Icon: typeof CheckCircle2 }> = {
  buy: { label: "BUY NOW", color: "text-signal-buy", bg: "bg-signal-buy/15", Icon: CheckCircle2 },
  wait: { label: "WAIT", color: "text-signal-wait", bg: "bg-signal-wait/15", Icon: Hourglass },
  peak: { label: "PEAK PRICE", color: "text-signal-peak", bg: "bg-signal-peak/15", Icon: OctagonAlert },
};

export function SignalBadge({ signal, className }: { signal: Signal; className?: string }) {
  const { label, color, bg, Icon } = config[signal];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[12px] font-semibold",
        color, bg, className,
      )}
    >
      <Icon size={13} strokeWidth={2.5} />
      {label}
    </span>
  );
}

export function signalColor(signal: Signal): string {
  return signal === "buy" ? "#10B981" : signal === "wait" ? "#F59E0B" : "#EF4444";
}
