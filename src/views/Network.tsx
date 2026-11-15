import { useMemo, useState } from "react";
import { ArrowDownUp, ExternalLink, Linkedin, Mail, MessageSquarePlus, Plus, Search, UserRound } from "lucide-react";
import type { ViewProps } from "@/App";
import type { Contact, Stage, State } from "@/lib/types";
import { useData } from "@/lib/data";
import { addDays, dayKey, fmtShort, relDay, weekStart } from "@/lib/time";
import { cn, uid } from "@/lib/utils";
import { Badge, Empty, Meter, Panel } from "@/components/ui/misc";
import { Button } from "@/components/ui/button";
import { Field, Input, Select, Textarea } from "@/components/ui/field";
import { Dialog } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

export const STAGES: { id: Stage; label: string; color: string }[] = [
  { id: "target", label: "To contact", color: "#94A3B8" },
  { id: "contacted", label: "Reached out", color: "#0EA5E9" },
  { id: "scheduled", label: "Chat scheduled", color: "#EA580C" },
  { id: "chatted", label: "Chatted", color: "#0D9488" },
  { id: "advocate", label: "Advocate", color: "#7C3AED" },
];
const stageIdx = (s: string) => STAGES.findIndex((x) => x.id === s);
const stageOf = (s: string) => STAGES[Math.max(0, stageIdx(s))];

const LOG_TYPES = [
  { id: "chat", label: "Coffee chat" },
  { id: "outreach", label: "Outreach message" },
  { id: "followup", label: "Follow-up" },
  { id: "note", label: "Note" },
];

const blank = (): Contact => ({
  id: uid(), name: "", firm: "mckinsey", firmName: "", office: "", title: "", connection: "", stage: "target",
  lastContact: "", nextFollowUp: "", email: "", linkedin: "", notes: "", log: [],
});

/** Apply a logged interaction to a contact: updates last contact, stage and the next follow-up. */
function applyLog(c: Contact, type: string, date: string, text: string) {
  c.log.push({ date, type, text });
  if (type !== "note") c.lastContact = !c.lastContact || date > c.lastContact ? date : c.lastContact;
  if (type === "outreach") {
    if (stageIdx(c.stage) < 1) c.stage = "contacted";
    if (!c.nextFollowUp || c.nextFollowUp < date) c.nextFollowUp = addDays(date, 7);
  }
  if (type === "chat") {
    if (stageIdx(c.stage) < 3) c.stage = "chatted";
    c.nextFollowUp = addDays(date, 30);
  }
  if (type === "followup") c.nextFollowUp = addDays(date, 30);
}

export default function Network(_: ViewProps) {
  const { life, state, update, storage } = useData();
  const [editing, setEditing] = useState<Contact | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [logFor, setLogFor] = useState<Contact | null>(null);
  const [q, setQ] = useState("");
  const [firm, setFirm] = useState("all");
  const [sort, setSort] = useState<"next" | "name" | "last" | "stage">("next");
  const today = dayKey();

  const firmName = (c: Contact) => (c.firm === "other" ? c.firmName || "Other" : life?.networking.firms.find((f) => f.id === c.firm)?.name || c.firm);

  const contacts = state?.contacts || [];
  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    const list = contacts.filter((c) =>
      (firm === "all" || c.firm === firm) &&
      (!s || [c.name, c.firmName, c.office, c.title, c.connection, c.notes].join(" ").toLowerCase().includes(s))
    );
    const by = {
      next: (a: Contact, b: Contact) => (a.nextFollowUp || "9999").localeCompare(b.nextFollowUp || "9999"),
      name: (a: Contact, b: Contact) => a.name.localeCompare(b.name),
      last: (a: Contact, b: Contact) => (b.lastContact || "").localeCompare(a.lastContact || ""),
      stage: (a: Contact, b: Contact) => stageIdx(b.stage) - stageIdx(a.stage),
    }[sort];
    return [...list].sort(by);
  }, [contacts, q, firm, sort]);

  if (!life) return null;
  if (!storage || !state) {
    return <Empty>Networking needs storage, which isn't connected yet. Once it's on, contacts sync across your phone and laptop.</Empty>;
  }

  const wk = weekStart(today);
  const logsThisWeek = contacts.flatMap((c) => c.log).filter((l) => l.date >= wk && l.date <= today);
  const chats = logsThisWeek.filter((l) => l.type === "chat").length;
  const outreach = logsThisWeek.filter((l) => l.type === "outreach").length;
  const queue = contacts
    .filter((c) => c.nextFollowUp && c.nextFollowUp <= addDays(today, 7))
    .sort((a, b) => a.nextFollowUp.localeCompare(b.nextFollowUp));

  const save = (c: Contact) => {
    update((s: State) => {
      const i = s.contacts.findIndex((x) => x.id === c.id);
      if (i >= 0) s.contacts[i] = c; else s.contacts.push(c);
    });
  };

  const firmTabs = [{ id: "all", name: "All" }, ...life.networking.firms, { id: "other", name: "Other" }];

  return (
    <div className="grid gap-4 md:grid-cols-12 md:gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3 md:col-span-12">
        <div>
          <h2 className="text-xl font-extrabold tracking-tight">MBB networking</h2>
          <p className="text-sm text-muted-fg">Summer 2028 internship cycle. Track every conversation and never miss a follow-up.</p>
        </div>
        <Button onClick={() => { setEditing(blank()); setIsNew(true); }}><Plus /> Add contact</Button>
      </div>

      {/* Firm summary */}
      <section aria-label="Firms" className="grid grid-cols-2 gap-3 md:col-span-8 md:grid-cols-4">
        {[...life.networking.firms, { id: "other", name: "Other firms", careers: "" }].map((f) => {
          const list = contacts.filter((c) => c.firm === f.id);
          const talked = list.filter((c) => stageIdx(c.stage) >= 3).length;
          const adv = list.filter((c) => c.stage === "advocate").length;
          return (
            <div key={f.id} className="flex flex-col rounded-2xl border border-line bg-card p-4">
              <div className="flex min-h-9 items-center justify-between gap-2">
                <h3 className="font-extrabold">{f.name}</h3>
                {f.careers && (
                  <a href={f.careers} target="_blank" rel="noreferrer" aria-label={`${f.name} careers site`} className="grid size-9 place-items-center rounded-lg text-muted-fg hover:bg-muted">
                    <ExternalLink className="size-4" />
                  </a>
                )}
              </div>
              <div className="mt-auto pt-3">
                <p className="text-4xl font-extrabold tracking-tight">{list.length}</p>
                <p className="text-xs text-muted-fg">{list.length === 1 ? "contact" : "contacts"}</p>
                <dl className="mt-2 grid grid-cols-2 gap-1 border-t border-line pt-2 text-xs">
                  <div><dt className="text-muted-fg">Talked to</dt><dd className="font-bold">{talked}</dd></div>
                  <div><dt className="text-muted-fg">Advocates</dt><dd className="font-bold">{adv}</dd></div>
                </dl>
              </div>
            </div>
          );
        })}
      </section>

      <Panel title="This week" className="md:col-span-4">
        <div className="space-y-4">
          <div>
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold">Coffee chats</span><span className="text-muted-fg">{chats} of {state.settings.weeklyChatGoal}</span></div>
            <Meter value={chats} max={state.settings.weeklyChatGoal} label="Coffee chats this week" />
          </div>
          <div>
            <div className="mb-1.5 flex justify-between text-sm"><span className="font-semibold">Outreach</span><span className="text-muted-fg">{outreach} of {state.settings.weeklyOutreachGoal}</span></div>
            <Meter value={outreach} max={state.settings.weeklyOutreachGoal} label="Outreach this week" color="var(--color-accent)" />
          </div>
          <p className="text-xs text-muted-fg">Counts come from interactions you log. Goals are in Settings.</p>
        </div>
      </Panel>

      <Panel title="Follow-up queue" className="md:col-span-4">
        {queue.length === 0 ? (
          <Empty>Nothing due this week. Log a chat or outreach and the next follow-up gets scheduled for you.</Empty>
        ) : (
          <ul className="divide-y divide-line">
            {queue.map((c) => {
              const overdue = c.nextFollowUp < today;
              return (
                <li key={c.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={() => { setEditing(c); setIsNew(false); }} className="text-left font-semibold hover:underline">{c.name}</button>
                    <p className="text-xs text-muted-fg">
                      {firmName(c)} · <span className={overdue ? "font-bold text-danger" : "font-semibold text-accent"}>{overdue ? `Overdue since ${fmtShort(c.nextFollowUp)}` : relDay(c.nextFollowUp, today)}</span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => setLogFor(c)}><MessageSquarePlus /> Log</Button>
                </li>
              );
            })}
          </ul>
        )}
      </Panel>

      <Panel title="Pipeline" className="md:col-span-8">
        <ol className="grid gap-3 sm:grid-cols-5 sm:gap-2">
          {STAGES.map((s) => {
            const list = contacts.filter((c) => c.stage === s.id);
            return (
              <li key={s.id} className="min-w-0 rounded-xl bg-muted/60 p-2.5">
                <p className="mb-2 flex items-center gap-1.5 text-xs font-bold">
                  <span aria-hidden className="size-2 rounded-full" style={{ background: s.color }} />{s.label}
                  <span className="ml-auto text-muted-fg">{list.length}</span>
                </p>
                <ul className="space-y-1.5">
                  {list.map((c) => (
                    <li key={c.id}>
                      <button type="button" onClick={() => { setEditing(c); setIsNew(false); }}
                        className="w-full rounded-lg border border-line bg-card px-2.5 py-2 text-left text-xs transition-colors duration-150 hover:border-primary">
                        <span className="block truncate font-semibold">{c.name || "Unnamed"}</span>
                        <span className="block truncate text-muted-fg">{firmName(c)}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              </li>
            );
          })}
        </ol>
      </Panel>

      <Panel title="Contacts" className="md:col-span-12">
        <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center">
          <div className="relative md:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-fg" aria-hidden />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name, office, notes" aria-label="Search contacts" className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-1.5" role="group" aria-label="Filter by firm">
            {firmTabs.map((f) => (
              <button key={f.id} type="button" aria-pressed={firm === f.id} onClick={() => setFirm(f.id)}
                className="min-h-9 rounded-full border border-line px-3.5 text-sm font-semibold text-muted-fg transition-colors duration-150 hover:bg-muted aria-pressed:border-fg aria-pressed:bg-fg aria-pressed:text-white">
                {f.name}
              </button>
            ))}
          </div>
          <label className="flex items-center gap-2 text-sm md:ml-auto">
            <ArrowDownUp className="size-4 text-muted-fg" aria-hidden /><span className="sr-only">Sort by</span>
            <Select value={sort} onChange={(e) => setSort(e.target.value as typeof sort)} className="h-10 w-auto">
              <option value="next">Next follow-up</option>
              <option value="last">Last contact</option>
              <option value="stage">Stage</option>
              <option value="name">Name</option>
            </Select>
          </label>
        </div>

        {filtered.length === 0 ? (
          <Empty>{contacts.length ? "No contacts match that search." : "No contacts yet. Add the first person you want to talk to."}</Empty>
        ) : (
          <>
            <ul className="divide-y divide-line md:hidden">
              {filtered.map((c) => (
                <li key={c.id}>
                  <button type="button" onClick={() => { setEditing(c); setIsNew(false); }} className="flex w-full items-start gap-3 py-3 text-left">
                    <span aria-hidden className="mt-1.5 size-2.5 shrink-0 rounded-full" style={{ background: stageOf(c.stage).color }} />
                    <span className="min-w-0 flex-1">
                      <span className="block font-semibold">{c.name || "Unnamed"}</span>
                      <span className="block text-sm text-muted-fg">{[firmName(c), c.office, c.title].filter(Boolean).join(" · ")}</span>
                      <span className="block text-xs text-muted-fg">{stageOf(c.stage).label}{c.nextFollowUp ? ` · follow up ${fmtShort(c.nextFollowUp)}` : ""}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
            <div className="hidden md:block">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead><TableHead>Firm</TableHead><TableHead>Connection</TableHead>
                    <TableHead>Stage</TableHead><TableHead>Last contact</TableHead><TableHead>Next follow-up</TableHead><TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((c) => (
                    <TableRow key={c.id} className="hover:bg-bg">
                      <TableCell>
                        <button type="button" onClick={() => { setEditing(c); setIsNew(false); }} className="text-left font-semibold hover:underline">{c.name || "Unnamed"}</button>
                        {c.title && <p className="text-xs text-muted-fg">{c.title}</p>}
                      </TableCell>
                      <TableCell>{firmName(c)}{c.office && <p className="text-xs text-muted-fg">{c.office}</p>}</TableCell>
                      <TableCell className="max-w-64 text-muted-fg"><span className="line-clamp-2">{c.connection || "—"}</span></TableCell>
                      <TableCell><Badge color={stageOf(c.stage).color}>{stageOf(c.stage).label}</Badge></TableCell>
                      <TableCell className="whitespace-nowrap">{c.lastContact ? fmtShort(c.lastContact) : "—"}</TableCell>
                      <TableCell className={cn("whitespace-nowrap", c.nextFollowUp && c.nextFollowUp < today && "font-bold text-danger")}>
                        {c.nextFollowUp ? fmtShort(c.nextFollowUp) : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm" onClick={() => setLogFor(c)}><MessageSquarePlus /> Log</Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </>
        )}
      </Panel>

      <Panel title="Recruiting timeline" className="md:col-span-7">
        <ol className="relative space-y-4 border-l-2 border-line pl-5">
          {life.networking.timeline.map((t) => (
            <li key={t.title} className="relative">
              <span aria-hidden className="absolute -left-[27px] top-1 size-3 rounded-full border-2 border-card bg-primary" />
              <p className="text-xs font-bold text-primary-strong">{t.when}</p>
              <p className="font-bold leading-snug">{t.title}</p>
              <p className="text-sm text-muted-fg">{t.detail}</p>
            </li>
          ))}
        </ol>
        <p className="mt-4 text-xs text-muted-fg">Windows are based on last cycle. Confirm dates on each firm's careers site when they post.</p>
      </Panel>

      <Panel title="Coffee chat playbook" tone="tint" className="md:col-span-5">
        <ul className="space-y-2.5 text-sm leading-relaxed">
          <li><strong>Before:</strong> know their path (school, office, practice) and pick 5 or 6 questions for a 30-minute chat.</li>
          <li><strong>During:</strong> open with what you have in common, keep your intro to 60 seconds, and end by asking who else you should talk to.</li>
          <li><strong>Within 24 hours:</strong> send a thank-you that mentions something specific they said.</li>
          <li><strong>Every 4 to 6 weeks:</strong> a short update on something you acted on from their advice.</li>
          <li><strong>Before applying:</strong> ask your strongest contacts if they'd be comfortable flagging your application.</li>
        </ul>
      </Panel>

      {editing && (
        <ContactDialog
          key={editing.id} contact={editing} isNew={isNew} firms={life.networking.firms}
          onClose={() => setEditing(null)}
          onSave={(c) => { save(c); setEditing(null); }}
          onDelete={(id) => { update((s) => { s.contacts = s.contacts.filter((x) => x.id !== id); }); setEditing(null); }}
        />
      )}
      {logFor && (
        <LogDialog contact={logFor} onClose={() => setLogFor(null)}
          onSave={(type, date, text) => {
            update((s) => { const c = s.contacts.find((x) => x.id === logFor.id); if (c) applyLog(c, type, date, text); });
            setLogFor(null);
          }} />
      )}
    </div>
  );
}

function ContactDialog({ contact, isNew, firms, onClose, onSave, onDelete }: {
  contact: Contact; isNew: boolean; firms: { id: string; name: string }[];
  onClose: () => void; onSave: (c: Contact) => void; onDelete: (id: string) => void;
}) {
  const [c, setC] = useState<Contact>(() => structuredClone(contact));
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = <K extends keyof Contact>(k: K, v: Contact[K]) => setC((p) => ({ ...p, [k]: v }));

  return (
    <Dialog
      open onOpenChange={(o) => !o && onClose()} wide
      title={isNew ? "Add contact" : c.name || "Contact"}
      description={isNew ? "Who do you want to talk to?" : "Update details, stage and follow-up date."}
      footer={
        <>
          {!isNew && (
            confirmDelete
              ? <Button variant="danger" onClick={() => onDelete(c.id)} className="mr-auto">Confirm delete</Button>
              : <Button variant="ghost" onClick={() => setConfirmDelete(true)} className="mr-auto text-danger">Delete</Button>
          )}
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { if (!c.name.trim()) { setError("Add a name so you can find this contact later."); return; } onSave(c); }}>
            {isNew ? "Add contact" : "Save changes"}
          </Button>
        </>
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Name" className="sm:col-span-2">
          <Input value={c.name} onChange={(e) => { set("name", e.target.value); setError(null); }} autoFocus={isNew} aria-invalid={Boolean(error)} />
          {error && <span role="alert" className="text-sm text-danger">{error}</span>}
        </Field>
        <Field label="Firm">
          <Select value={c.firm} onChange={(e) => set("firm", e.target.value)}>
            {firms.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
            <option value="other">Other firm</option>
          </Select>
        </Field>
        {c.firm === "other" ? (
          <Field label="Firm name"><Input value={c.firmName || ""} onChange={(e) => set("firmName", e.target.value)} placeholder="Deloitte, Kearney…" /></Field>
        ) : (
          <Field label="Office"><Input value={c.office} onChange={(e) => set("office", e.target.value)} placeholder="Atlanta, Miami…" /></Field>
        )}
        <Field label="Title"><Input value={c.title} onChange={(e) => set("title", e.target.value)} placeholder="Associate, Consultant…" /></Field>
        <Field label="Stage">
          <Select value={c.stage} onChange={(e) => set("stage", e.target.value as Stage)}>
            {STAGES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
          </Select>
        </Field>
        <Field label="How you're connected" className="sm:col-span-2">
          <Input value={c.connection} onChange={(e) => set("connection", e.target.value)} placeholder="UF alum, Rem, referral from…" />
        </Field>
        <Field label="Last contact"><Input type="date" value={c.lastContact} onChange={(e) => set("lastContact", e.target.value)} /></Field>
        <Field label="Next follow-up"><Input type="date" value={c.nextFollowUp} onChange={(e) => set("nextFollowUp", e.target.value)} /></Field>
        <Field label="Email"><Input type="email" value={c.email} onChange={(e) => set("email", e.target.value)} /></Field>
        <Field label="LinkedIn URL"><Input type="url" value={c.linkedin} onChange={(e) => set("linkedin", e.target.value)} /></Field>
        <Field label="Notes" className="sm:col-span-2"><Textarea value={c.notes} onChange={(e) => set("notes", e.target.value)} placeholder="What they said, advice, who they suggested you meet" /></Field>
      </div>

      {(c.email || c.linkedin) && !isNew && (
        <div className="mt-4 flex flex-wrap gap-2">
          {c.email && <a href={`mailto:${c.email}`} className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-muted"><Mail className="size-4" aria-hidden /> Email</a>}
          {c.linkedin && <a href={c.linkedin} target="_blank" rel="noreferrer" className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-muted"><Linkedin className="size-4" aria-hidden /> LinkedIn</a>}
        </div>
      )}

      {!isNew && (
        <section className="mt-6" aria-label="History">
          <h3 className="mb-2 text-sm font-bold">History</h3>
          {c.log.length === 0 ? (
            <p className="text-sm text-muted-fg">Nothing logged yet. Use Log on the contact list after you reach out or talk.</p>
          ) : (
            <ol className="space-y-2">
              {[...c.log].reverse().map((l, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-16 shrink-0 text-xs font-semibold text-muted-fg">{fmtShort(l.date)}</span>
                  <span><strong>{LOG_TYPES.find((t) => t.id === l.type)?.label || l.type}</strong>{l.text && ` · ${l.text}`}</span>
                </li>
              ))}
            </ol>
          )}
        </section>
      )}
    </Dialog>
  );
}

function LogDialog({ contact, onClose, onSave }: { contact: Contact; onClose: () => void; onSave: (type: string, date: string, text: string) => void }) {
  const [type, setType] = useState("chat");
  const [date, setDate] = useState(dayKey());
  const [text, setText] = useState("");
  const hint = {
    chat: "Moves them to Chatted and sets a follow-up 30 days out.",
    outreach: "Moves them to Reached out and sets a nudge 7 days out.",
    followup: "Sets the next follow-up 30 days out.",
    note: "Just adds a note to their history.",
  }[type];
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()} title={`Log interaction · ${contact.name}`}
      footer={<><Button variant="outline" onClick={onClose}>Cancel</Button><Button onClick={() => onSave(type, date, text.trim())}>Save</Button></>}>
      <div className="grid gap-4">
        <div className="grid grid-cols-2 gap-3">
          <Field label="Type">
            <Select value={type} onChange={(e) => setType(e.target.value)}>{LOG_TYPES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}</Select>
          </Field>
          <Field label="Date"><Input type="date" value={date} onChange={(e) => setDate(e.target.value)} /></Field>
        </div>
        <p className="-mt-2 flex items-center gap-1.5 text-xs text-muted-fg"><UserRound className="size-3.5" aria-hidden />{hint}</p>
        <Field label="What happened"><Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Key advice, next steps, names they mentioned" /></Field>
      </div>
    </Dialog>
  );
}
