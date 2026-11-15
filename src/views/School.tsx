import { ExternalLink } from "lucide-react";
import type { ViewProps } from "@/App";
import { useData } from "@/lib/data";
import { dayKey, fmtShort, inDays } from "@/lib/time";
import { Badge, catColor, Panel } from "@/components/ui/misc";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DueList } from "@/components/shared";

export default function School(_: ViewProps) {
  const { life, due, dueLive } = useData();
  if (!life) return null;
  const today = dayKey();
  const nextDue = (code: string) => due.filter((d) => d.course === code && d.date >= today).sort((a, b) => a.date.localeCompare(b.date))[0];
  const dates = life.keyDates
    .map((d) => ({ ...d, sortKey: d.date || d.sort || "" }))
    .filter((d) => (d.end || d.date || d.sort || "") >= today)
    .sort((a, b) => a.sortKey.localeCompare(b.sortKey));

  return (
    <div className="grid gap-4 md:grid-cols-12 md:gap-5">
      <div className="grid gap-4 md:col-span-7 md:gap-5">
        <Panel title={`Classes · ${life.term.name}`}>
          <ul className="divide-y divide-line">
            {life.classes.map((c) => {
              const nd = nextDue(c.code);
              return (
                <li key={c.code} className="py-4 first:pt-0 last:pb-0">
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="text-lg font-extrabold text-primary-strong">{c.code}</h3>
                    <p className="font-semibold">{c.name}</p>
                    {c.instructor && <p className="text-sm text-muted-fg">{c.instructor}</p>}
                  </div>
                  <ul className="mt-1.5 space-y-0.5 text-sm text-fg">{c.meetings.map((m) => <li key={m}>{m}</li>)}</ul>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-fg">{c.focus}</p>
                  {nd && (
                    <p className="mt-2 text-sm">
                      <span className="font-bold text-accent">Next due {inDays(nd.date, today)}:</span> {nd.title}
                    </p>
                  )}
                </li>
              );
            })}
          </ul>
        </Panel>

        <Panel title="Teaching">
          <div className="flex gap-3">
            <span aria-hidden className="w-1 shrink-0 rounded-full" style={{ background: catColor(life, "ta") }} />
            <div>
              <h3 className="font-extrabold">{life.teaching.code} · {life.teaching.role}</h3>
              <p className="text-sm text-muted-fg">{life.teaching.instructor}</p>
              <p className="mt-1 text-sm">{life.teaching.meetings.join(" · ")}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-fg">{life.teaching.focus}</p>
            </div>
          </div>
        </Panel>

        <Panel title="Professor office hours">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Who</TableHead><TableHead>When</TableHead><TableHead>Where</TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {life.officeHours.map((o) => (
                <TableRow key={o.who}>
                  <TableCell className="font-semibold">{o.who}</TableCell>
                  <TableCell>{o.when}</TableCell>
                  <TableCell className="text-muted-fg">{o.where}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Panel>
      </div>

      <div className="grid content-start gap-4 md:col-span-5 md:gap-5">
        <Panel title="All deadlines" action={<Badge>{dueLive ? "Live from Canvas" : `Snapshot · ${fmtShort(life.dueSnapshot.asOf)}`}</Badge>}>
          <DueList items={due} emptyText="No upcoming deadlines." />
          <a href="https://ufl.instructure.com" target="_blank" rel="noreferrer" className="mt-4 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-primary-strong hover:underline">
            Open Canvas <ExternalLink className="size-4" aria-hidden />
          </a>
        </Panel>

        <Panel title="Key dates">
          <ol className="relative space-y-3 border-l-2 border-line pl-4">
            {dates.map((d) => (
              <li key={d.title} className="relative">
                <span aria-hidden className="absolute -left-[23px] top-1.5 size-3 rounded-full border-2 border-card" style={{ background: catColor(life, d.cat) }} />
                <p className="text-xs font-bold text-muted-fg">
                  {d.label || `${fmtShort(d.date!)}${d.end ? ` – ${fmtShort(d.end)}` : ""}`}
                  {d.date && d.date >= today && <span className="ml-1.5 font-semibold">({inDays(d.date, today)})</span>}
                </p>
                <p className="text-sm font-semibold">{d.title}</p>
              </li>
            ))}
          </ol>
        </Panel>
      </div>
    </div>
  );
}
