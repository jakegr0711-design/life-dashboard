import { useState } from "react";
import { CalendarPlus, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import type { Ev } from "@/lib/types";
import { AddEventDialog, DeleteEventDialog } from "@/components/events";
import type { ViewProps } from "@/App";
import { useData } from "@/lib/data";
import { addDays, dayKey, fmtShort, fmtWeekday, isoWeekday, weekStart } from "@/lib/time";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge, catColor } from "@/components/ui/misc";
import { EventRow } from "@/components/shared";

export default function Week({ openSettings }: ViewProps) {
  const { life, events, live, due, google } = useData();
  const [addOn, setAddOn] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<Ev | null>(null);
  const today = dayKey();
  // On weekends, open on the coming week
  const current = isoWeekday(today) >= 6 ? addDays(weekStart(today), 7) : weekStart(today);
  const [start, setStart] = useState(current);
  if (!life) return null;
  const days = Array.from({ length: 7 }, (_, i) => addDays(start, i));
  const now = new Date();
  const usedCats = [...new Set(events.filter((e) => days.includes(e.date)).map((e) => e.cat))];

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-1">
          <Button variant="outline" size="icon" aria-label="Previous week" onClick={() => setStart(addDays(start, -7))}><ChevronLeft /></Button>
          <Button variant="outline" size="icon" aria-label="Next week" onClick={() => setStart(addDays(start, 7))}><ChevronRight /></Button>
          <h2 className="ml-2 text-lg font-bold">
            {fmtShort(days[0])} – {fmtShort(days[6])}
          </h2>
          {start !== current && (
            <Button variant="ghost" size="sm" onClick={() => setStart(current)}>{isoWeekday(today) >= 6 ? "Next week" : "This week"}</Button>
          )}
        </div>
        {google.connected ? (
          <Button onClick={() => setAddOn(today)}><CalendarPlus /> Add event</Button>
        ) : live ? <Badge>Live from Google Calendar</Badge> : (
          <p className="text-sm text-muted-fg">
            Typical week.{" "}
            <button type="button" onClick={openSettings} className="font-semibold text-primary-strong underline underline-offset-2">Link your calendar</button>
          </p>
        )}
      </div>

      <div className="mb-4 flex flex-wrap gap-2" aria-label="Color key">
        {usedCats.map((c) => <Badge key={c} color={catColor(life, c)} className="bg-card border border-line">{life.categories[c]?.label || c}</Badge>)}
      </div>

      <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-7 lg:gap-2">
        {days.map((d) => {
          const evs = events.filter((e) => e.date === d).sort((a, b) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0));
          const dues = due.filter((x) => x.date === d && !x.ta);
          const isToday = d === today;
          return (
            <li key={d} className={cn("min-w-0 rounded-2xl border bg-card p-3", isToday ? "border-primary border-2" : "border-line")}>
              <p className={cn("mb-2 flex items-baseline gap-1.5 text-sm font-bold", isToday && "text-primary-strong")}>
                {fmtWeekday(d)} <span className="font-semibold text-muted-fg">{fmtShort(d).replace(/^\w+ /, "")}</span>
                {isToday && <span className="ml-auto text-xs">Today</span>}
                {google.connected && (
                  <button type="button" onClick={() => setAddOn(d)} aria-label={`Add event on ${fmtShort(d)}`}
                    className={cn("grid size-8 place-items-center rounded-lg text-muted-fg hover:bg-muted hover:text-fg", !isToday && "ml-auto")}>
                    <Plus className="size-4" />
                  </button>
                )}
              </p>
              {evs.length === 0 && dues.length === 0 && <p className="text-xs text-muted-fg">Free</p>}
              <ul className="space-y-1.5">{evs.map((e) => <EventRow key={e.id} ev={e} now={now} compact onDelete={setDeleting} />)}</ul>
              {dues.length > 0 && (
                <ul className="mt-2 space-y-1 border-t border-line pt-2">
                  {dues.map((x) => (
                    <li key={x.id} className="text-xs leading-snug">
                      <span className="font-bold text-accent">Due</span> <span className="font-semibold">{x.course}</span> {x.title}
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ol>

      {addOn && <AddEventDialog key={addOn} open date={addOn} onOpenChange={(o) => !o && setAddOn(null)} />}
      <DeleteEventDialog ev={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}
