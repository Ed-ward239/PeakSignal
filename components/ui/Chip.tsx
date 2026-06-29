"use client";

import { cn } from "@/lib/cn";

export function Chip({
  label,
  selected,
  onClick,
}: {
  label: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition active:scale-[0.97]",
        selected
          ? "bg-accent text-white shadow-sm"
          : "bg-[var(--surface-2)] ps-hairline border ps-muted hover:text-[var(--text)]",
      )}
    >
      {label}
    </button>
  );
}
