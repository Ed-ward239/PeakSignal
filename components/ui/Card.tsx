import { cn } from "@/lib/cn";

export function Card({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("ps-card p-5 sm:p-6", className)}>{children}</div>;
}

export function SectionTitle({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <h2 className={cn("ps-muted text-[11px] font-semibold uppercase tracking-[0.08em]", className)}>
      {children}
    </h2>
  );
}
