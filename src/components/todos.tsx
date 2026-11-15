import { useState, type FormEvent } from "react";
import { Pencil, Plus, Trash2 } from "lucide-react";
import type { Todo } from "@/lib/types";
import { useData } from "@/lib/data";
import { addDays, dayKey, fmtDay, relDay } from "@/lib/time";
import { cn, uid } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input, Select } from "@/components/ui/field";
import { catColor } from "@/components/ui/misc";

export function sortOpen(list: Todo[]) {
  return [...list].sort((a, b) => {
    if (a.due && b.due) return a.due.localeCompare(b.due);
    if (a.due) return -1;
    if (b.due) return 1;
    return 0;
  });
}

function DueChip({ due }: { due: string }) {
  const today = dayKey();
  const overdue = due < today;
  const soon = due <= addDays(today, 1);
  return (
    <span className={cn(
      "whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-bold",
      overdue ? "bg-danger-soft text-[#991b1b]" : soon ? "bg-accent-soft text-[#9a3412]" : "bg-muted text-muted-fg"
    )}>
      {overdue ? `Overdue · ${fmtDay(due)}` : relDay(due, today)}
    </span>
  );
}

export function TodoItem({ todo, showList, compact }: { todo: Todo; showList?: boolean; compact?: boolean }) {
  const { life, update } = useData();
  const [editing, setEditing] = useState(false);
  const [text, setText] = useState(todo.text);
  const [due, setDue] = useState(todo.due || "");
  const [list, setList] = useState(todo.list);
  const listLabel = life?.todoLists.find((l) => l.id === todo.list)?.label || "General";

  const patch = (p: Partial<Todo>) => update((s) => { const t = s.todos.find((x) => x.id === todo.id); if (t) Object.assign(t, p); });

  if (editing) {
    return (
      <li className="rounded-xl border border-primary bg-card p-3">
        <form
          onSubmit={(e) => { e.preventDefault(); if (!text.trim()) return; patch({ text: text.trim(), due, list }); setEditing(false); }}
          className="grid gap-2 sm:grid-cols-[1fr_auto_auto]"
        >
          <Input value={text} onChange={(e) => setText(e.target.value)} aria-label="Task" autoFocus />
          <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date" className="sm:w-40" />
          <Select value={list} onChange={(e) => setList(e.target.value)} aria-label="List" className="sm:w-40">
            {life?.todoLists.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </Select>
          <div className="flex gap-2 sm:col-span-3">
            <Button type="submit" size="sm">Save</Button>
            <Button size="sm" variant="ghost" onClick={() => { setEditing(false); setText(todo.text); setDue(todo.due || ""); setList(todo.list); }}>Cancel</Button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className="group flex items-start gap-1">
      <label className="flex min-h-11 flex-1 cursor-pointer items-start gap-3 py-2 text-[15px] leading-snug">
        <input
          type="checkbox" checked={todo.done} className="mt-0.5 size-5 shrink-0 accent-[#0f766e]"
          onChange={() => patch({ done: !todo.done, doneAt: !todo.done ? dayKey() : "" })}
        />
        <span className="min-w-0">
          <span className={todo.done ? "text-muted-fg line-through" : ""}>{todo.text}</span>
          {(todo.due && !todo.done) || showList ? (
            <span className="mt-1 flex flex-wrap items-center gap-1.5">
              {showList && (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-muted-fg">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: catColor(life, todo.list) }} />{listLabel}
                </span>
              )}
              {todo.due && !todo.done && <DueChip due={todo.due} />}
            </span>
          ) : null}
        </span>
      </label>
      {!compact && <div className="flex shrink-0 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100">
        <button type="button" aria-label={`Edit ${todo.text}`} onClick={() => setEditing(true)}
          className="grid size-11 place-items-center rounded-lg text-muted-fg hover:bg-muted hover:text-fg">
          <Pencil className="size-4" />
        </button>
        <button type="button" aria-label={`Delete ${todo.text}`} onClick={() => update((s) => { s.todos = s.todos.filter((y) => y.id !== todo.id); })}
          className="grid size-11 place-items-center rounded-lg text-muted-fg hover:bg-danger-soft hover:text-danger">
          <Trash2 className="size-4" />
        </button>
      </div>}
    </li>
  );
}

export function AddTodo({ list, chooseList, compact }: { list?: string; chooseList?: boolean; compact?: boolean }) {
  const { life, update } = useData();
  const [text, setText] = useState("");
  const [due, setDue] = useState("");
  const [target, setTarget] = useState(list || "general");

  function add(e: FormEvent) {
    e.preventDefault();
    const v = text.trim();
    if (!v) return;
    const l = chooseList ? target : list || "general";
    update((s) => { s.todos.unshift({ id: uid(), list: l, text: v, done: false, due, createdAt: new Date().toISOString() }); });
    setText("");
    setDue("");
  }

  return (
    <form onSubmit={add} className={cn("grid gap-2", compact ? "grid-cols-[1fr_auto]" : "sm:grid-cols-[1fr_auto_auto]")}>
      <Input value={text} onChange={(e) => setText(e.target.value)} placeholder="Add a task" aria-label="New task" />
      {!compact && <Input type="date" value={due} onChange={(e) => setDue(e.target.value)} aria-label="Due date (optional)" className="sm:w-40" />}
      {compact ? (
        <Button type="submit" size="icon" aria-label="Add task"><Plus /></Button>
      ) : (
        <Button type="submit"><Plus /> Add</Button>
      )}
      {chooseList && (
        <Select value={target} onChange={(e) => setTarget(e.target.value)} aria-label="Add to list" className={compact ? "col-span-2" : "sm:col-span-3"}>
          {life?.todoLists.map((l) => <option key={l.id} value={l.id}>Add to {l.label}</option>)}
        </Select>
      )}
    </form>
  );
}
