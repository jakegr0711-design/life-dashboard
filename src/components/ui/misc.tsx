import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { useData } from "@/lib/data";

/** A titled block of the dashboard. */
export function Panel({
  title, action, children, className, tone = "card", id,
}: {
  title?: ReactNode; action?: ReactNode; children: ReactNode; className?: string; tone?: "card" | "plain" | "tint"; id?: string;
}) {
  return (
    <section
      id={id}
      aria-label={typeof title === "string" ? title : undefined}
      className={cn(
        "min-w-0 rounded-2xl",
        tone === "card" && "border border-line bg-card p-4 md:p-5",
        tone === "tint" && "bg-primary-soft/60 p-4 md:p-5",
        tone === "plain" && "p-0",
        className
      )}
    >
      {(title || action) && (
        <div className="mb-3 flex min-h-9 items-center justify-between gap-3">
          {title && <h2 className="text-base font-bold text-fg">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Badge({ children, className, color }: { children: ReactNode; className?: string; color?: string }) {
  return (
    <span
      className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-fg", className)}
    >
      {color && <span aria-hidden className="size-2 rounded-full" style={{ background: color }} />}
      {children}
    </span>
  );
}

export function CatDot({ cat, className }: { cat: string; className?: string }) {
  const { life } = useData();
  const c = life?.categories[cat]?.color || "#64748B";
  return <span aria-hidden className={cn("inline-block size-2.5 shrink-0 rounded-full", className)} style={{ background: c }} />;
}

export function catColor(life: { categories: Record<string, { color: string }> } | null, cat: string) {
  return life?.categories[cat]?.color || "#64748B";
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="rounded-xl bg-muted/60 px-4 py-5 text-sm leading-relaxed text-muted-fg">{children}</p>;
}

export function Meter({ value, max, label, color = "var(--color-primary)" }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  return (
    <div role="meter" aria-label={label} aria-valuemin={0} aria-valuemax={max} aria-valuenow={value} className="h-2 w-full overflow-hidden rounded-full bg-muted">
      <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${pct}%`, background: color }} />
    </div>
  );
}
