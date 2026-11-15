import { ExternalLink } from "lucide-react";
import type { ViewProps } from "@/App";
import { useData } from "@/lib/data";
import { catColor, Panel } from "@/components/ui/misc";

export default function Involvements(_: ViewProps) {
  const { life } = useData();
  if (!life) return null;

  return (
    <div className="grid gap-4 md:grid-cols-12 md:gap-5">
      <Panel title="Organizations" className="md:col-span-7">
        <ul className="divide-y divide-line">
          {life.involvements.map((o) => (
            <li key={o.id} className="flex gap-4 py-4 first:pt-0 last:pb-0">
              <span aria-hidden className="w-1.5 shrink-0 rounded-full" style={{ background: catColor(life, o.id) }} />
              <div className="min-w-0">
                <h3 className="text-[17px] font-extrabold leading-snug">{o.name}</h3>
                <p className="text-sm font-semibold text-fg/80">{o.role}</p>
                {o.when && <p className="mt-1 text-sm text-fg">{o.when}</p>}
                {o.notes.length > 0 && (
                  <ul className="mt-1.5 list-disc space-y-0.5 pl-4 text-sm leading-relaxed text-muted-fg marker:text-line">
                    {o.notes.map((n) => <li key={n}>{n}</li>)}
                  </ul>
                )}
              </div>
            </li>
          ))}
        </ul>
      </Panel>

      <div className="grid content-start gap-4 md:col-span-5 md:gap-5">
        <Panel title="Career track" tone="tint">
          <ul className="space-y-3">
            {life.career.map((c) => (
              <li key={c.title}>
                <div className="flex items-start justify-between gap-3">
                  <p className="font-bold leading-snug">{c.title}</p>
                  <span className="shrink-0 rounded-full bg-card px-2.5 py-0.5 text-xs font-bold text-primary-strong">{c.status}</span>
                </div>
                <p className="text-sm text-muted-fg">{c.when}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Ventures and projects">
          <ul className="space-y-3">
            {life.ventures.map((v) => (
              <li key={v.name}>
                <p className="font-bold leading-snug">{v.name} <span className="text-sm font-semibold text-muted-fg">· {v.role}</span></p>
                <p className="text-sm text-muted-fg">{v.note}</p>
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Work and volunteering">
          <ul className="space-y-1.5 text-sm">
            {life.work.map((w) => (
              <li key={w.name} className="flex justify-between gap-3"><span className="font-semibold">{w.name}</span><span className="text-muted-fg">{w.role}</span></li>
            ))}
          </ul>
        </Panel>

        <Panel title="Quick links">
          <ul className="grid grid-cols-2 gap-1">
            {life.links.map((l) => (
              <li key={l.url}>
                <a href={l.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-muted">
                  {l.label} <ExternalLink className="size-3.5 text-muted-fg" aria-hidden />
                </a>
              </li>
            ))}
          </ul>
        </Panel>
      </div>
    </div>
  );
}
