import { useState } from "react";
import { MapPin, Trash2 } from "lucide-react";
import type { DueItem, Ev } from "@/lib/types";
import { useData } from "@/lib/data";
import { dayKey, fmtTime, relDay, zoned } from "@/lib/time";
import { cn } from "@/lib/utils";
import { catColor, Empty } from "@/components/ui/misc";

export function EventRow({ ev, now = new Date(), compact, onDelete }: { ev: Ev; now?: Date; compact?: boolean; onDelete?: (ev: Ev) => void }) {
  const { life } = useData();
  const color = catColor(life, ev.cat);
  const past = ev.end ? ev.end < now : false;
  const live = ev.start && ev.end ? ev.start <= now && ev.end > now : false;
  return (
    <li className={cn("group flex gap-3", past && "opacity-55")}>
      <span aria-hidden className="w-1 shrink-0 rounded-full" style={{ background: color }} />
      <div className={cn("min-w-0 flex-1", compact ? "py-1" : "py-1.5")}>
        <p className="text-xs font-semibold text-muted-fg">
          {ev.allDay ? "All day" : `${fmtTime(ev.start!)} – ${fmtTime(ev.end!)}`}
          {live && <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-bold text-black">Now</span>}
        </p>
        <p className={cn("font-semibold leading-snug text-fg", compact ? "text-sm" : "text-[15px]")}>{ev.title}</p>
        {ev.location && !compact && (
          <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-fg">
            <MapPin className="size-3.5 shrink-0" aria-hidden />
            <span className="truncate">{ev.location}</span>
          </p>
        )}
      </div>
      {onDelete && ev.gid && (
        <button
          type="button" onClick={() => onDelete(ev)} aria-label={`Delete ${ev.title}`} title="Delete from Google Calendar"
          className={cn("grid shrink-0 place-items-center rounded-lg text-muted-fg hover:bg-danger-soft hover:text-danger md:opacity-0 md:group-hover:opacity-100 md:focus:opacity-100", compact ? "size-8" : "size-11")}
        >
          <Trash2 className="size-4" />
        </button>
      )}
    </li>
  );
}

/** Deadlines grouped by day. */
export function DueList({ items, days, showTaToggle = true, emptyText }: { items: DueItem[]; days?: number; showTaToggle?: boolean; emptyText?: string }) {
  const [showTa, setShowTa] = useState(false);
  const today = dayKey();
  const limit = days ? zoned(today, "00:00").getTime() + days * 864e5 : Infinity;
  const inRange = items
    .filter((d) => d.date >= today && zoned(d.date, "00:00").getTime() < limit)
    .sort((a, b) => (a.date + (a.time || "23:59")).localeCompare(b.date + (b.time || "23:59")));
  const taCount = inRange.filter((d) => d.ta).length;
  const shown = inRange.filter((d) => showTa || !d.ta);
  const groups = new Map<string, DueItem[]>();
  for (const d of shown) groups.set(d.date, [...(groups.get(d.date) || []), d]);

  return (
    <div>
      {showTaToggle && taCount > 0 && (
        <button
          type="button"
          onClick={() => setShowTa((v) => !v)}
          aria-pressed={showTa}
          className="mb-3 inline-flex min-h-9 items-center rounded-full border border-line px-3 text-xs font-semibold text-muted-fg hover:bg-muted aria-pressed:border-[#4F46E5] aria-pressed:bg-[#eef2ff] aria-pressed:text-[#3730a3]"
        >
          {showTa ? "Hide" : "Show"} {taCount} CGS2531 TA item{taCount === 1 ? "" : "s"}
        </button>
      )}
      {groups.size === 0 ? (
        <Empty>{emptyText || "Nothing due. Nice."}</Empty>
      ) : (
        <ol className="space-y-4">
          {[...groups].map(([date, list]) => (
            <li key={date}>
              <p className={cn("mb-1.5 text-xs font-bold", date === today ? "text-accent" : "text-muted-fg")}>{relDay(date, today)}</p>
              <ul className="space-y-1.5">
                {list.map((d) => (
                  <li key={d.id} className="flex items-baseline gap-2.5 text-sm">
                    <span className={cn("w-[4.5rem] shrink-0 text-xs font-bold", d.ta ? "text-[#4F46E5]" : "text-primary-strong")}>{d.course}</span>
                    <span className="min-w-0 flex-1 leading-snug text-fg">
                      {d.title}
                      {d.time && <span className="ml-1.5 text-xs text-muted-fg">{to12(d.time)}</span>}
                    </span>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

export const to12 = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  return `${((h + 11) % 12) + 1}${m ? `:${String(m).padStart(2, "0")}` : ""} ${h < 12 ? "am" : "pm"}`;
};
