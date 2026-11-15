import { useState } from "react";
import type { Ev } from "@/lib/types";
import { useData } from "@/lib/data";
import { dayKey, fmtDayLong, fmtTime, pad } from "@/lib/time";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/field";

function nextHalfHour() {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", minute: "numeric", hourCycle: "h23" })
    .formatToParts(new Date());
  const h = Number(parts.find((p) => p.type === "hour")?.value);
  const m = Number(parts.find((p) => p.type === "minute")?.value);
  const total = Math.min(23 * 60, Math.ceil((h * 60 + m + 1) / 30) * 30);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
}
const plusHour = (t: string) => {
  const [h, m] = t.split(":").map(Number);
  const total = Math.min(23 * 60 + 59, h * 60 + m + 60);
  return `${pad(Math.floor(total / 60))}:${pad(total % 60)}`;
};

/** Add an event to Google Calendar. */
export function AddEventDialog({ open, onOpenChange, date }: { open: boolean; onOpenChange: (o: boolean) => void; date?: string }) {
  const { addEvent } = useData();
  const [title, setTitle] = useState("");
  const [day, setDay] = useState(date || dayKey());
  const [allDay, setAllDay] = useState(false);
  const [start, setStart] = useState(nextHalfHour);
  const [end, setEnd] = useState(() => plusHour(nextHalfHour()));
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save() {
    if (!title.trim()) { setError("Add a title for the event."); return; }
    if (!allDay && end <= start) { setError("The end time has to be after the start time."); return; }
    setBusy(true);
    const err = await addEvent({ title: title.trim(), date: day, allDay, start, end, location, notes });
    setBusy(false);
    if (err) { setError(err); return; }
    onOpenChange(false);
  }

  return (
    <Dialog
      open={open} onOpenChange={onOpenChange} title="Add event" description="Saves to your Google Calendar."
      footer={<><Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button><Button onClick={save} disabled={busy}>{busy ? "Adding…" : "Add event"}</Button></>}
    >
      <div className="grid gap-4">
        <Field label="Title">
          <Input value={title} onChange={(e) => { setTitle(e.target.value); setError(null); }} autoFocus placeholder="Coffee chat with…" />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Date"><Input type="date" value={day} onChange={(e) => setDay(e.target.value)} /></Field>
          <label className="flex items-center gap-3 self-end pb-3 text-sm font-semibold">
            <input type="checkbox" checked={allDay} onChange={(e) => setAllDay(e.target.checked)} className="size-5 accent-[#0f766e]" />
            All day
          </label>
        </div>
        {!allDay && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="Starts">
              <Input type="time" value={start} onChange={(e) => { setStart(e.target.value); if (e.target.value >= end) setEnd(plusHour(e.target.value)); }} />
            </Field>
            <Field label="Ends"><Input type="time" value={end} onChange={(e) => { setEnd(e.target.value); setError(null); }} /></Field>
          </div>
        )}
        <Field label="Location"><Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Optional" /></Field>
        <Field label="Notes"><Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional" className="min-h-20" /></Field>
        {error && <p role="alert" className="text-sm text-danger">{error}</p>}
      </div>
    </Dialog>
  );
}

/** Confirm, then delete an event from Google Calendar. */
export function DeleteEventDialog({ ev, onClose }: { ev: Ev | null; onClose: () => void }) {
  const { deleteEvent } = useData();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  if (!ev) return null;

  async function confirm() {
    setBusy(true);
    const err = await deleteEvent(ev!.gid!);
    setBusy(false);
    if (err) setError(err); else onClose();
  }

  return (
    <Dialog
      open onOpenChange={(o) => !o && onClose()} title="Delete event?"
      footer={<><Button variant="outline" onClick={onClose}>Keep it</Button><Button variant="primary" className="bg-danger hover:bg-[#b91c1c]" onClick={confirm} disabled={busy}>{busy ? "Deleting…" : "Delete event"}</Button></>}
    >
      <p className="font-semibold">{ev.title}</p>
      <p className="text-sm text-muted-fg">
        {fmtDayLong(ev.date)}{ev.start && ev.end ? `, ${fmtTime(ev.start)} – ${fmtTime(ev.end)}` : ""}
      </p>
      <p className="mt-3 text-sm leading-relaxed">
        {ev.recurring
          ? "This removes only this occurrence from Google Calendar. The rest of the series stays."
          : "This removes it from your Google Calendar."}
      </p>
      {error && <p role="alert" className="mt-2 text-sm text-danger">{error}</p>}
    </Dialog>
  );
}
