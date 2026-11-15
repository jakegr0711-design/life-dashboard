import { useState } from "react";
import { CheckCircle2, CircleAlert, Trash2 } from "lucide-react";
import { useData } from "@/lib/data";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/field";

const mask = (url: string) => {
  try {
    const u = new URL(url.replace(/^webcal:/i, "https:"));
    return `${u.host}/…${url.slice(-6)}`;
  } catch {
    return "Saved link";
  }
};

export default function Settings({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const { state, update, calendar, refreshCalendar, storage } = useData();
  const [label, setLabel] = useState("");
  const [url, setUrl] = useState("");
  const [error, setError] = useState<string | null>(null);

  function addFeed() {
    const u = url.trim();
    if (!/^(https|webcal):\/\//i.test(u)) { setError("Paste the full link. It starts with https:// or webcal://"); return; }
    const l = label.trim() || (/instructure/i.test(u) ? "Canvas" : "Google Calendar");
    update((s) => { s.settings.feeds.push({ label: l, url: u, enabled: true }); });
    setLabel(""); setUrl(""); setError(null);
    setTimeout(refreshCalendar, 600);
  }

  const statusFor = (l: string) => calendar?.status.find((s) => s.label === l);

  return (
    <Dialog open={open} onOpenChange={onOpenChange} title="Settings" description="Link your calendars and set weekly networking goals." wide>
      {!storage || !state ? (
        <p className="text-sm text-muted-fg">Storage isn't connected yet, so settings can't be saved.</p>
      ) : (
        <div className="space-y-6">
          <section aria-labelledby="feeds-h">
            <h3 id="feeds-h" className="font-bold">Calendar feeds</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-fg">
              Feeds are private links that let the dashboard read your calendar. They're stored privately and only used by your dashboard.
            </p>

            <ul className="mt-3 space-y-2">
              {state.settings.feeds.length === 0 && (
                <li className="rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-fg">No feeds linked yet. Today and Week show your typical schedule until you add one.</li>
              )}
              {state.settings.feeds.map((f, i) => {
                const st = statusFor(f.label);
                return (
                  <li key={i} className="flex items-center gap-3 rounded-xl border border-line px-3 py-2">
                    {st?.ok ? <CheckCircle2 className="size-5 shrink-0 text-primary" aria-label="Working" /> :
                      st ? <CircleAlert className="size-5 shrink-0 text-danger" aria-label="Not working" /> : <span className="size-5" />}
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{f.label}</p>
                      <p className="truncate text-xs text-muted-fg">
                        {st?.ok ? `${st.count} events loaded · ` : st?.message ? `${st.message} · ` : ""}{mask(f.url)}
                      </p>
                    </div>
                    <Button variant="danger" size="icon" aria-label={`Remove ${f.label}`}
                      onClick={() => { update((s) => { s.settings.feeds.splice(i, 1); }); setTimeout(refreshCalendar, 600); }}>
                      <Trash2 />
                    </Button>
                  </li>
                );
              })}
            </ul>

            <div className="mt-4 grid gap-3 rounded-xl bg-muted/50 p-4 md:grid-cols-[160px_1fr]">
              <Field label="Name"><Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Google Calendar" /></Field>
              <Field label="Private iCal link">
                <Input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://calendar.google.com/calendar/ical/…/basic.ics" aria-invalid={Boolean(error)} />
              </Field>
              {error && <p role="alert" className="text-sm text-danger md:col-span-2">{error}</p>}
              <div className="md:col-span-2"><Button onClick={addFeed}>Add feed</Button></div>
            </div>

            <details className="mt-3 rounded-xl border border-line px-4 py-3 text-sm">
              <summary className="font-semibold">Where to find these links</summary>
              <div className="mt-2 space-y-3 leading-relaxed text-muted-fg">
                <p><strong className="text-fg">Google Calendar:</strong> on a computer, open calendar.google.com, click the gear, then Settings. Under "Settings for my calendars" pick jakegr0711@gmail.com, scroll to "Integrate calendar" and copy "Secret address in iCal format". Do the same for any other calendar you want, like Family.</p>
                <p><strong className="text-fg">Canvas:</strong> open Canvas, go to Calendar, and click "Calendar Feed" at the bottom right. Copy that link. Canvas items show up under Due soon, and CGS2531 items are grouped under TA.</p>
                <p>Changes in Google or Canvas show up here within about 5 to 10 minutes.</p>
              </div>
            </details>
          </section>

          <section aria-labelledby="goals-h">
            <h3 id="goals-h" className="font-bold">Weekly networking goals</h3>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <Field label="Coffee chats per week">
                <Input type="number" min={0} max={50} inputMode="numeric" value={state.settings.weeklyChatGoal}
                  onChange={(e) => update((s) => { s.settings.weeklyChatGoal = Number(e.target.value) || 0; })} />
              </Field>
              <Field label="Outreach messages per week">
                <Input type="number" min={0} max={100} inputMode="numeric" value={state.settings.weeklyOutreachGoal}
                  onChange={(e) => update((s) => { s.settings.weeklyOutreachGoal = Number(e.target.value) || 0; })} />
              </Field>
            </div>
          </section>
        </div>
      )}
    </Dialog>
  );
}
