import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import type { CalendarResponse, DueItem, Ev, GoogleStatus, Life, NewEvent, State } from "./types";
import { addDays, dayKey, isoWeekday, zoned } from "./time";

type Status = "loading" | "signed_out" | "not_configured" | "ready" | "error";

type Ctx = {
  status: Status;
  life: Life | null;
  storage: boolean;
  state: State | null;
  stateError: string | null;
  calendar: CalendarResponse | null;
  calendarLoading: boolean;
  events: Ev[];
  live: boolean;
  due: DueItem[];
  dueLive: boolean;
  google: GoogleStatus;
  addEvent: (e: NewEvent) => Promise<string | null>;
  deleteEvent: (gid: string) => Promise<string | null>;
  disconnectGoogle: () => Promise<void>;
  update: (mutate: (s: State) => State | void) => void;
  refreshCalendar: () => void;
  signIn: (passcode: string) => Promise<string | null>;
  notice: string | null;
  setNotice: (n: string | null) => void;
  signOut: () => Promise<void>;
  dismissError: () => void;
};

const DataCtx = createContext<Ctx | null>(null);
export const useData = () => useContext(DataCtx)!;

export function categorize(life: Life, title: string) {
  for (const m of life.matchers) if (m.any.some((k) => title.includes(k))) return m.cat;
  return "personal";
}

const TA_COURSES = ["CGS2531"];

export function DataProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>("loading");
  const [life, setLife] = useState<Life | null>(null);
  const [storage, setStorage] = useState(false);
  const [state, setState] = useState<State | null>(null);
  const [stateError, setStateError] = useState<string | null>(null);
  const [calendar, setCalendar] = useState<CalendarResponse | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const stateRef = useRef<State | null>(null);
  const version = useRef(0);
  const queue = useRef<Promise<void>>(Promise.resolve());

  const loadCalendar = useCallback(async () => {
    setCalendarLoading(true);
    try {
      const r = await fetch("/api/calendar", { credentials: "same-origin" });
      if (r.ok) setCalendar(await r.json());
    } finally {
      setCalendarLoading(false);
    }
  }, []);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/data", { credentials: "same-origin" });
      if (r.status === 401) {
        const j = await r.json().catch(() => ({}));
        setStatus(j.error === "not_configured" ? "not_configured" : "signed_out");
        return;
      }
      if (!r.ok) throw new Error();
      const j = await r.json();
      setLife(j.life);
      setStorage(j.storage);
      setStatus("ready");
      if (j.storage) {
        const s = await fetch("/api/state").then((x) => (x.ok ? x.json() : null));
        if (s?.state) {
          for (const t of s.state.todos || []) t.list = t.list || "general";
          stateRef.current = s.state;
          version.current = s.state.version || 0;
          setState(s.state);
        }
      }
      loadCalendar();
    } catch {
      setStatus("error");
    }
  }, [loadCalendar]);

  useEffect(() => { load(); }, [load]);

  // Refresh the calendar every 10 minutes and when the tab comes back into view
  useEffect(() => {
    if (status !== "ready") return;
    const id = setInterval(loadCalendar, 10 * 60 * 1000);
    const onVis = () => document.visibilityState === "visible" && loadCalendar();
    document.addEventListener("visibilitychange", onVis);
    return () => { clearInterval(id); document.removeEventListener("visibilitychange", onVis); };
  }, [status, loadCalendar]);

  const update = useCallback((mutate: (s: State) => State | void) => {
    if (!stateRef.current) return;
    const draft = structuredClone(stateRef.current);
    const next = (mutate(draft) || draft) as State;
    stateRef.current = next;
    setState(next);
    queue.current = queue.current.then(async () => {
      try {
        const r = await fetch("/api/state", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ state: stateRef.current, baseVersion: version.current }),
        });
        const j = await r.json().catch(() => ({}));
        if (r.status === 409 && j.state) {
          version.current = j.state.version;
          stateRef.current = j.state;
          setState(j.state);
          setStateError("This dashboard was changed on another device, so your last edit wasn't saved. The latest version is loaded; make the edit again.");
        } else if (r.ok && j.state) {
          version.current = j.state.version;
        } else {
          setStateError("Couldn't save your last change. Check your connection and try again.");
        }
      } catch {
        setStateError("Couldn't save your last change. Check your connection and try again.");
      }
    });
  }, []);

  const signIn = useCallback(async (passcode: string) => {
    const r = await fetch("/api/login", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ passcode }),
    });
    if (r.ok) { setStatus("loading"); await load(); return null; }
    const j = await r.json().catch(() => ({}));
    if (r.status === 429) return `Too many wrong tries. Sign-in is paused for ${j.minutes || 15} more minute${j.minutes === 1 ? "" : "s"}.`;
    if (r.status === 401) {
      return j.remaining > 0 && j.remaining <= 3
        ? `That passcode doesn't match. ${j.remaining} ${j.remaining === 1 ? "try" : "tries"} left before sign-in pauses for 15 minutes.`
        : "That passcode doesn't match. Check it and try again.";
    }
    return "Sign-in isn't set up on the server yet.";
  }, [load]);

  const signOut = useCallback(async () => {
    await fetch("/api/logout", { method: "POST" });
    setLife(null); setState(null); setCalendar(null); setStatus("signed_out");
  }, []);

  const live = Boolean(calendar?.hasCalendar);
  const dueLive = Boolean(calendar?.hasCanvas);

  const events = useMemo<Ev[]>(() => {
    if (!life) return [];
    const today = dayKey();
    if (live && calendar) {
      return calendar.events
        .filter((e) => !e.due)
        .flatMap((e) => {
          const start = e.start ? new Date(e.start) : undefined;
          const base: Ev = {
            id: e.id, title: e.title.replace(/\s*\[[A-Z]{3}\d{4}[A-Z]?\]\s*$/, ""), allDay: e.allDay,
            date: e.allDay ? e.date! : dayKey(start), start, end: e.end ? new Date(e.end) : undefined,
            location: e.location, course: e.course, cat: categorize(life, e.title),
            gid: e.editable ? e.gid : undefined, recurring: e.recurring, link: e.link,
          };
          if (!e.allDay || !e.endDate) return [base];
          // all-day events that span several days show on each day (end date is exclusive)
          const days: Ev[] = [];
          for (let d = base.date; d < e.endDate && days.length < 31; d = addDays(d, 1)) days.push({ ...base, id: `${base.id}:${d}`, date: d });
          return days.length ? days : [base];
        });
    }
    // Typical week from the template, for the past week through the next 8 weeks
    const out: Ev[] = [];
    for (let i = -7; i < 56; i++) {
      const key = addDays(today, i);
      if (key >= life.term.thanksgiving[0] && key <= life.term.thanksgiving[1]) continue;
      if (key > life.term.classesEnd) break;
      const wd = isoWeekday(key);
      for (const s of life.schedule.filter((x) => x.day === wd)) {
        out.push({
          id: `${key}-${s.start}-${s.title}`, title: s.title, date: key, allDay: false,
          start: zoned(key, s.start), end: zoned(key, s.end), location: s.where, cat: s.cat,
        });
      }
    }
    return out;
  }, [life, calendar, live]);

  const due = useMemo<DueItem[]>(() => {
    if (!life) return [];
    if (dueLive && calendar) {
      return calendar.events.filter((e) => e.due).map((e) => {
        const start = e.start ? new Date(e.start) : undefined;
        const date = e.allDay ? e.date! : dayKey(start);
        const time = start ? new Intl.DateTimeFormat("en-GB", { timeZone: "America/New_York", hour: "2-digit", minute: "2-digit" }).format(start) : undefined;
        return {
          id: e.id, date, time: time === "23:59" ? undefined : time, course: e.course || "",
          title: e.title.replace(/\s*\[[A-Z]{3}\d{4}[A-Z]?\]\s*$/, ""), ta: TA_COURSES.includes(e.course || ""),
        };
      });
    }
    return life.dueSnapshot.items.map((d, i) => ({ id: `snap-${i}`, ...d, ta: Boolean(d.ta) }));
  }, [life, calendar, dueLive]);

  const google: GoogleStatus = calendar?.google || { configured: false, connected: false, email: "", error: "" };

  const addEvent = useCallback(async (e: NewEvent) => {
    try {
      const r = await fetch("/api/google/events", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(e) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return j.error || "Couldn't add the event. Try again.";
      await loadCalendar();
      return null;
    } catch {
      return "Couldn't reach the server. Check your connection and try again.";
    }
  }, [loadCalendar]);

  const deleteEvent = useCallback(async (gid: string) => {
    try {
      const r = await fetch(`/api/google/events?id=${encodeURIComponent(gid)}`, { method: "DELETE" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) return j.error || "Couldn't delete the event. Try again.";
      setCalendar((c) => (c ? { ...c, events: c.events.filter((x) => x.gid !== gid) } : c));
      return null;
    } catch {
      return "Couldn't reach the server. Check your connection and try again.";
    }
  }, []);

  const disconnectGoogle = useCallback(async () => {
    await fetch("/api/google/events?action=disconnect", { method: "POST" });
    await loadCalendar();
  }, [loadCalendar]);

  const value: Ctx = {
    status, life, storage, state, stateError, calendar, calendarLoading, events, live, due, dueLive,
    google, addEvent, deleteEvent, disconnectGoogle, notice, setNotice,
    update, refreshCalendar: loadCalendar, signIn, signOut, dismissError: () => setStateError(null),
  };
  return <DataCtx.Provider value={value}>{children}</DataCtx.Provider>;
}
