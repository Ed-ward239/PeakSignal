"use client";

import { cn } from "@/lib/cn";

interface Option<T> {
  value: T;
  label: string;
}

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
  return (
    <div
      className={cn(
        "inline-flex rounded-full p-1",
        "bg-[var(--surface-2)] ps-hairline border",
        className,
      )}
      role="tablist"
    >
      {options.map((opt) => {
        const active = opt.value === value;
        return (
          <button
            key={String(opt.value)}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition",
              active
                ? "bg-accent text-white shadow-sm"
                : "ps-muted hover:text-[var(--text)]",
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
