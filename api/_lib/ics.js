import ICAL from "ical.js";

const COURSE_RE = /\[([A-Z]{3}\d{4}[A-Z]?)\]\s*$/;

export function feedKind(url) {
  return /instructure\.com|canvas/i.test(url) ? "canvas" : "calendar";
}

export function normalizeUrl(url) {
  return String(url || "").trim().replace(/^webcal:\/\//i, "https://");
}

// Parse an iCalendar feed and expand recurring events inside [from, to].
export function expandFeed(text, { from, to, source, kind }) {
  const root = new ICAL.Component(ICAL.parse(text));
  for (const tz of root.getAllSubcomponents("vtimezone")) {
    try { ICAL.TimezoneService.register(tz); } catch { /* already registered */ }
  }

  const masters = new Map();
  const exceptions = [];
  for (const ve of root.getAllSubcomponents("vevent")) {
    const ev = new ICAL.Event(ve);
    if (ev.isRecurrenceException()) exceptions.push(ev);
    else masters.set(ev.uid || Math.random().toString(36), ev);
  }
  for (const ex of exceptions) {
    const m = masters.get(ex.uid);
    if (m) m.relateException(ex);
    else masters.set(`${ex.uid}-${ex.recurrenceId}`, ex);
  }

  const out = [];
  const push = (item, start, end) => {
    if (String(item.component.getFirstPropertyValue("status") || "").toUpperCase() === "CANCELLED") return;
    const allDay = start.isDate;
    const s = start.toJSDate();
    const e = end ? end.toJSDate() : s;
    if (e < from || s > to) return;
    const title = (item.summary || "(no title)").trim();
    const course = (title.match(COURSE_RE) || [])[1] || null;
    out.push({
      id: `${item.uid}:${start.toString()}`,
      title,
      course,
      allDay,
      date: allDay ? start.toString().slice(0, 10) : null,
      endDate: allDay && end ? end.toString().slice(0, 10) : null,
      start: allDay ? null : s.toISOString(),
      end: allDay ? null : e.toISOString(),
      location: (item.location || "").trim(),
      source,
      kind,
      due: kind === "canvas" && (allDay || +s === +e),
    });
  };

  for (const ev of masters.values()) {
    if (!ev.startDate) continue;
    if (ev.isRecurring()) {
      const it = ev.iterator();
      let next;
      let n = 0;
      while ((next = it.next()) && n++ < 6000) {
        if (next.toJSDate() > to) break;
        const d = ev.getOccurrenceDetails(next);
        if (d.endDate && d.endDate.toJSDate() < from) continue;
        push(d.item, d.startDate, d.endDate);
      }
    } else {
      push(ev, ev.startDate, ev.endDate);
    }
  }
  return out;
}
