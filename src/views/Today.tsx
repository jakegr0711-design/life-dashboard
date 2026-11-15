import { useEffect, useMemo, useState } from "react";
import { ArrowUpRight, CalendarClock, CalendarPlus, MapPin } from "lucide-react";
import type { ViewProps } from "@/App";
import { useData } from "@/lib/data";
import { addDays, countdown, dayKey, daysBetween, fmtShort, fmtTime, inDays, relDay } from "@/lib/time";
import type { Ev } from "@/lib/types";
import { Badge, catColor, Empty, Meter, Panel } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { AddTodo, sortOpen, TodoItem } from "@/components/todos";
import { AddEventDialog, DeleteEventDialog } from "@/components/events";
import { DueList, EventRow } from "@/components/shared";

function useNow(ms = 30000) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), ms); return () => clearInterval(id); }, [ms]);
  return now;
}

export default function Today({ go, openSettings }: ViewProps) {
  const { life, events, live, due, dueLive, state, google } = useData();
  const now = useNow();
  const [adding, setAdding] = useState(false);
  const [deleting, setDeleting] = useState<Ev | null>(null);
  const today = dayKey(now);
  if (!life) return null;

  const byTime = (a: { start?: Date }, b: { start?: Date }) => (a.start?.getTime() || 0) - (b.start?.getTime() || 0);
  const todays = events.filter((e) => e.date === today).sort(byTime);
  const tomorrow = events.filter((e) => e.date === addDays(today, 1)).sort(byTime);
  const upcoming = events
    .filter((e) => !e.allDay && e.end && e.end > now && e.cat !== "oh")
    .sort((a, b) => a.start!.getTime() - b.start!.getTime());
  const next = upcoming[0];
  const after = upcoming.slice(1, 3);

  return (
    <div className="grid gap-4 md:grid-cols-12 md:gap-5">
      {/* Up next */}
      <section aria-label="Up next" className="rounded-2xl bg-fg p-5 text-white md:col-span-8 md:p-7">
        {next ? (
          <>
            <p className="flex items-center gap-2 text-sm font-semibold text-primary-soft">
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: catColor(life, next.cat) }} />
              {next.start! <= now ? `Happening now · ends ${fmtTime(next.end!)}` : `Up next · ${countdown(next.start!, now)}`}
            </p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight tracking-tight md:text-[2.6rem]">{next.title}</h2>
            <p className="mt-2 text-base text-white/80">
              {relDay(next.date, today)}, {fmtTime(next.start!)} – {fmtTime(next.end!)}
              {next.location && (
                <span className="ml-2 inline-flex items-center gap-1"><MapPin className="size-4" aria-hidden />{next.location}</span>
              )}
            </p>
            {after.length > 0 && (
              <ul className="mt-5 grid gap-2 border-t border-white/15 pt-4 sm:grid-cols-2">
                {after.map((e) => (
                  <li key={e.id} className="text-sm">
                    <span className="text-white/65">{relDay(e.date, today)} {fmtTime(e.start!)}</span>
                    <span className="block font-semibold">{e.title}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-primary-soft">Up next</p>
            <h2 className="mt-2 text-3xl font-extrabold tracking-tight">Nothing else on the calendar</h2>
            <p className="mt-2 text-white/80">Good time for deep work or a coffee chat.</p>
          </>
        )}
        {!live && (
          <p className="mt-5 text-xs text-white/70">
            Showing your typical week.{" "}
            <button type="button" onClick={openSettings} className="font-semibold text-white underline underline-offset-2">Link Google Calendar</button>{" "}
            to see everything live.
          </p>
        )}
      </section>

      <SemesterPanel today={today} />

      <Panel
        title="Today" className="md:col-span-4"
        action={
          <div className="flex items-center">
            {google.connected && <Button variant="ghost" size="sm" onClick={() => setAdding(true)}><CalendarPlus /> Add event</Button>}
            <Button variant="ghost" size="sm" onClick={() => go("week")}>Week</Button>
          </div>
        }
      >
        {todays.length === 0 ? (
          <Empty>Nothing scheduled today.</Empty>
        ) : (
          <ul className="space-y-2">{todays.map((e) => <EventRow key={e.id} ev={e} now={now} onDelete={setDeleting} />)}</ul>
        )}
        {!todays.some((e) => !e.end || e.end > now) && tomorrow.length > 0 && (
          <div className="mt-5 border-t border-line pt-4">
            <h3 className="mb-2 text-sm font-bold text-muted-fg">Tomorrow</h3>
            <ul className="space-y-2">{tomorrow.map((e) => <EventRow key={e.id} ev={e} now={now} onDelete={setDeleting} />)}</ul>
          </div>
        )}
      </Panel>

      <Panel
        title="Due soon"
        className="md:col-span-4"
        action={<Badge>{dueLive ? "Live from Canvas" : `Snapshot · ${fmtShort(life.dueSnapshot.asOf)}`}</Badge>}
      >
        <DueList items={due} days={8} emptyText="Nothing due in the next week." />
        <Button variant="ghost" size="sm" className="mt-3 -ml-3" onClick={() => go("school")}>All deadlines</Button>
      </Panel>

      <div className="grid content-start gap-4 md:col-span-4 md:gap-5">
        {state && <TodoWidget go={go} />}
        <FollowUps go={go} />
      </div>

      {adding && <AddEventDialog open onOpenChange={setAdding} />}
      <DeleteEventDialog ev={deleting} onClose={() => setDeleting(null)} />
    </div>
  );
}

function SemesterPanel({ today }: { today: string }) {
  const { life } = useData();
  const t = life!.term;
  const total = daysBetween(t.classesBegin, t.finals[1]);
  const done = Math.max(0, Math.min(total, daysBetween(t.classesBegin, today)));
  const classDays = daysBetween(today, t.classesEnd);
  const rows = [
    { label: "Thanksgiving break", date: t.thanksgiving[0], end: t.thanksgiving[1] },
    { label: "Last day of classes", date: t.classesEnd },
    { label: "Finals", date: t.finals[0], end: t.finals[1] },
    { label: `${t.next.name} starts`, date: t.next.start },
  ].filter((r) => (r.end || r.date) >= today);

  return (
    <Panel title={t.name} className="md:col-span-4">
      <p className="text-4xl font-extrabold tracking-tight text-fg">
        {classDays > 0 ? classDays : 0}
        <span className="ml-2 text-base font-semibold text-muted-fg">{classDays === 1 ? "day" : "days"} of classes left</span>
      </p>
      <div className="mt-3"><Meter value={done} max={total} label="Semester progress" /></div>
      <p className="mt-1.5 text-xs text-muted-fg">{Math.round((done / total) * 100)}% through the semester</p>
      <ul className="mt-4 space-y-2 text-sm">
        {rows.map((r) => (
          <li key={r.label} className="flex items-baseline justify-between gap-3">
            <span className="font-semibold">{r.label}</span>
            <span className="text-right text-muted-fg">
              {r.date <= today && r.end ? "Now" : `${fmtShort(r.date)}${r.end ? `–${fmtShort(r.end).replace(/^\w+ /, "")}` : ""}`}
              {r.date > today && <span className="ml-1.5 text-xs">({inDays(r.date, today)})</span>}
            </span>
          </li>
        ))}
      </ul>
    </Panel>
  );
}

function FollowUps({ go }: { go: (t: string) => void }) {
  const { state } = useData();
  const today = dayKey();
  const soon = addDays(today, 3);
  const list = useMemo(
    () => (state?.contacts || []).filter((c) => c.nextFollowUp && c.nextFollowUp <= soon).sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp)),
    [state, soon]
  );
  if (!state) return null;
  return (
    <Panel title="Follow-ups" action={<Button variant="ghost" size="icon" aria-label="Open networking" onClick={() => go("network")}><ArrowUpRight /></Button>}>
      {list.length === 0 ? (
        <p className="text-sm text-muted-fg">No follow-ups due in the next 3 days.</p>
      ) : (
        <ul className="space-y-2">
          {list.slice(0, 5).map((c) => (
            <li key={c.id} className="flex items-start gap-2 text-sm">
              <CalendarClock className={c.nextFollowUp < today ? "mt-0.5 size-4 shrink-0 text-danger" : "mt-0.5 size-4 shrink-0 text-accent"} aria-hidden />
              <span className="min-w-0">
                <span className="font-semibold">{c.name}</span>
                <span className="block text-xs text-muted-fg">{c.nextFollowUp < today ? `Overdue since ${fmtShort(c.nextFollowUp)}` : relDay(c.nextFollowUp, today)}</span>
              </span>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function TodoWidget({ go }: { go: (t: string) => void }) {
  const { state } = useData();
  if (!state) return null;
  const open = sortOpen(state.todos.filter((t) => !t.done));
  return (
    <Panel title="To-do" action={<Button variant="ghost" size="sm" onClick={() => go("todos")}>All lists</Button>}>
      <AddTodo compact chooseList />
      {open.length === 0 ? (
        <p className="mt-3 text-sm text-muted-fg">All clear.</p>
      ) : (
        <ul className="mt-2 divide-y divide-line">{open.slice(0, 8).map((t) => <TodoItem key={t.id} todo={t} showList compact />)}</ul>
      )}
      {open.length > 8 && <Button variant="ghost" size="sm" className="-ml-3 mt-1" onClick={() => go("todos")}>{open.length - 8} more</Button>}
    </Panel>
  );
}
