import { Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

/**
 * Loading indicator for API-backed sections. RapidAPI's free tier is throttled
 * (~1 req/sec), so live fetches (flights, hotels, Airbnb) can take a moment —
 * this gives the user clear feedback instead of a blank/frozen panel.
 */
export function Loading({ label = "Loading…", className }: { label?: string; className?: string }) {
  return (
    <div className={cn("ps-card flex items-center justify-center gap-3 py-12", className)}>
      <Loader2 className="animate-spin text-accent" size={20} strokeWidth={2.5} />
      <span className="ps-muted text-[14px]">{label}</span>
    </div>
  );
}
