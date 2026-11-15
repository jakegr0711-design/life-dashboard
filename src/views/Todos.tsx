import { useState } from "react";
import * as Tabs from "@radix-ui/react-tabs";
import { ExternalLink } from "lucide-react";
import type { ViewProps } from "@/App";
import { useData } from "@/lib/data";
import { addDays, dayKey, fmtTime, relDay } from "@/lib/time";
import { catColor, Empty, Panel } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { AddTodo, sortOpen, TodoItem } from "@/components/todos";

const KEY = "jld-todo-tab";
const saved = () => { try { return localStorage.getItem(KEY) || "general"; } catch { return "general"; } };

export default function Todos(_: ViewProps) {
  const { life, state, update } = useData();
  const [tab, setTab] = useState(saved);
  if (!life) return null;
  if (!state) return <Empty>To-dos need storage, which isn't connected yet.</Empty>;

  const today = dayKey();
  const choose = (id: string) => { setTab(id); try { localStorage.setItem(KEY, id); } catch { /* ignore */ } };
  const openIn = (id: string) => state.todos.filter((t) => t.list === id && !t.done);
  const allOpen = state.todos.filter((t) => !t.done);
  const dueWeek = allOpen.filter((t) => t.due && t.due <= addDays(today, 7)).length;

  return (
    <Tabs.Root value={life.todoLists.some((l) => l.id === tab) ? tab : "general"} onValueChange={choose}>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">To-dos</h2>
          <p className="text-sm text-muted-fg">{allOpen.length} open{dueWeek ? ` · ${dueWeek} due in the next week` : ""}</p>
        </div>
      </div>

      <Tabs.List aria-label="To-do lists" className="mb-5 flex flex-wrap gap-2">
        {life.todoLists.map((l) => {
          const n = openIn(l.id).length;
          return (
            <Tabs.Trigger
              key={l.id} value={l.id}
              className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-line bg-card px-4 text-sm font-semibold text-fg transition-colors duration-150 hover:bg-muted data-[state=active]:border-fg data-[state=active]:bg-fg data-[state=active]:text-white"
            >
              <span aria-hidden className="size-2.5 rounded-full" style={{ background: catColor(life, l.id) }} />
              {l.label}
              {n > 0 && <span className="rounded-full bg-muted px-1.5 text-xs text-fg group-data-[state=active]:bg-white/20 group-data-[state=active]:text-white">{n}</span>}
            </Tabs.Trigger>
          );
        })}
      </Tabs.List>

      {life.todoLists.map((l) => {
        const open = sortOpen(openIn(l.id));
        const done = state.todos.filter((t) => t.list === l.id && t.done).sort((a, b) => (b.doneAt || "").localeCompare(a.doneAt || ""));
        return (
          <Tabs.Content key={l.id} value={l.id} className="grid gap-4 focus-visible:outline-none md:grid-cols-12 md:gap-5">
            <Panel title={l.id === "general" ? "General to-dos" : `${l.label} to-dos`} className="md:col-span-7">
              <AddTodo list={l.id} />
              {open.length === 0 ? (
                <div className="mt-4"><Empty>Nothing open here. Add the next thing you need to do for {l.id === "general" ? "school, recruiting or life" : l.label}.</Empty></div>
              ) : (
                <ul className="mt-3 divide-y divide-line">{open.map((t) => <TodoItem key={t.id} todo={t} />)}</ul>
              )}
              {done.length > 0 && (
                <details className="mt-4 rounded-xl bg-muted/50 px-3 py-2">
                  <summary className="min-h-9 py-1.5 text-sm font-semibold text-muted-fg">Completed ({done.length})</summary>
                  <ul className="divide-y divide-line">{done.slice(0, 30).map((t) => <TodoItem key={t.id} todo={t} />)}</ul>
                  <Button variant="ghost" size="sm" className="mt-1"
                    onClick={() => update((s) => { s.todos = s.todos.filter((t) => !(t.list === l.id && t.done)); })}>
                    Clear completed
                  </Button>
                </details>
              )}
            </Panel>
            <div className="grid content-start gap-4 md:col-span-5 md:gap-5">
              {l.id === "general" ? <GeneralSide /> : <OrgSide id={l.id} />}
            </div>
          </Tabs.Content>
        );
      })}
    </Tabs.Root>
  );
}

function OrgSide({ id }: { id: string }) {
  const { life, events } = useData();
  const org = life!.involvements.find((o) => o.id === id);
  const now = new Date();
  const upcoming = events
    .filter((e) => e.cat === id && !e.allDay && e.end && e.end > now)
    .sort((a, b) => a.start!.getTime() - b.start!.getTime())
    .slice(0, 4);
  if (!org) return null;
  return (
    <>
      <Panel title={org.name}>
        <div className="flex gap-3">
          <span aria-hidden className="w-1.5 shrink-0 rounded-full" style={{ background: catColor(life, id) }} />
          <div>
            <p className="font-semibold">{org.role}</p>
            {org.when && <p className="mt-0.5 text-sm">{org.when}</p>}
            {org.notes.length > 0 && (
              <ul className="mt-2 list-disc space-y-0.5 pl-4 text-sm leading-relaxed text-muted-fg marker:text-line">
                {org.notes.map((n) => <li key={n}>{n}</li>)}
              </ul>
            )}
          </div>
        </div>
      </Panel>
      <Panel title="Coming up">
        {upcoming.length === 0 ? (
          <p className="text-sm text-muted-fg">Nothing on the calendar for {life!.categories[id]?.label || org.name} soon.</p>
        ) : (
          <ul className="space-y-2.5">
            {upcoming.map((e) => (
              <li key={e.id} className="text-sm">
                <p className="text-xs font-semibold text-muted-fg">{relDay(e.date)}, {fmtTime(e.start!)}</p>
                <p className="font-semibold">{e.title}</p>
              </li>
            ))}
          </ul>
        )}
      </Panel>
    </>
  );
}

function GeneralSide() {
  const { life } = useData();
  const listIds = new Set(life!.todoLists.map((l) => l.id));
  const others = life!.involvements.filter((o) => !listIds.has(o.id));
  return (
    <>
      <Panel title="Career track" tone="tint">
        <ul className="space-y-3">
          {life!.career.map((c) => (
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
      <Panel title="Other involvements">
        <ul className="space-y-2.5 text-sm">
          {others.map((o) => (
            <li key={o.id}><span className="font-bold">{o.name}</span> <span className="text-muted-fg">· {o.role}</span></li>
          ))}
          {life!.ventures.map((v) => (
            <li key={v.name}><span className="font-bold">{v.name}</span> <span className="text-muted-fg">· {v.role}</span></li>
          ))}
          {life!.work.map((w) => (
            <li key={w.name}><span className="font-bold">{w.name}</span> <span className="text-muted-fg">· {w.role}</span></li>
          ))}
        </ul>
      </Panel>
      <Panel title="Quick links">
        <ul className="grid grid-cols-2 gap-1">
          {life!.links.map((l) => (
            <li key={l.url}>
              <a href={l.url} target="_blank" rel="noreferrer" className="flex min-h-11 items-center justify-between gap-2 rounded-lg px-3 text-sm font-semibold hover:bg-muted">
                {l.label} <ExternalLink className="size-3.5 text-muted-fg" aria-hidden />
              </a>
            </li>
          ))}
        </ul>
      </Panel>
    </>
  );
}
