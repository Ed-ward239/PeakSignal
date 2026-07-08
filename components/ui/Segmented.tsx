"use client";

import { cn } from "@/lib/cn";

interface Option<T> {
  value: T;
  label: string;
}

/**
 * Segmented control: equal-width options on a translucent track with a frosted
 * glass thumb (Liquid Glass, not accent-coloured) sliding to the selection.
 */
export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  className,
}: {
  options: Option<T>[];
  value: T;
  onChange: (v: T) => void;
  className?: string;
}) {
  const idx = Math.max(0, options.findIndex((o) => o.value === value));

  return (
    <div
      className={cn(
        "relative inline-grid auto-cols-fr grid-flow-col rounded-full p-1",
        "bg-[var(--surface-2)] ps-hairline border",
        className,
      )}
      role="tablist"
    >
      <span
        aria-hidden
        className="ps-glass-thumb absolute bottom-1 top-1 rounded-full transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]"
        style={{ left: 4, width: `calc((100% - 8px) / ${options.length})`, transform: `translateX(${idx * 100}%)` }}
      />
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "relative z-[1] rounded-full px-3.5 py-1.5 text-center text-[13px] transition-colors",
              active ? "font-semibold text-[var(--text)]" : "ps-muted font-medium hover:text-[var(--text)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
