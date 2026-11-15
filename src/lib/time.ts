// All dates are shown in Gainesville time.
export const TZ = "America/New_York";

const partsFmt = new Intl.DateTimeFormat("en-US", {
  timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
  hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23",
});

function parts(d: Date) {
  const o: Record<string, number> = {};
  for (const p of partsFmt.formatToParts(d)) if (p.type !== "literal") o[p.type] = Number(p.value);
  return o as { year: number; month: number; day: number; hour: number; minute: number; second: number };
}

export const pad = (n: number) => String(n).padStart(2, "0");

export function dayKey(d: Date = new Date()) {
  const p = parts(d);
  return `${p.year}-${pad(p.month)}-${pad(p.day)}`;
}

export function addDays(key: string, n: number) {
  const [y, m, d] = key.split("-").map(Number);
  const t = new Date(Date.UTC(y, m - 1, d + n));
  return `${t.getUTCFullYear()}-${pad(t.getUTCMonth() + 1)}-${pad(t.getUTCDate())}`;
}

export function daysBetween(a: string, b: string) {
  const [y1, m1, d1] = a.split("-").map(Number);
  const [y2, m2, d2] = b.split("-").map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 864e5);
}

/** 1 = Monday ... 7 = Sunday */
export function isoWeekday(key: string) {
  const [y, m, d] = key.split("-").map(Number);
  const w = new Date(Date.UTC(y, m - 1, d)).getUTCDay();
  return w === 0 ? 7 : w;
}

export function weekStart(key: string) {
  return addDays(key, 1 - isoWeekday(key));
}

/** Wall-clock time in Gainesville -> real instant */
export function zoned(key: string, hhmm: string) {
  const [y, m, d] = key.split("-").map(Number);
  const [hh, mm] = hhmm.split(":").map(Number);
  const guess = Date.UTC(y, m - 1, d, hh, mm);
  const p = parts(new Date(guess));
  const asUtc = Date.UTC(p.year, p.month - 1, p.day, p.hour, p.minute);
  return new Date(guess - (asUtc - guess));
}

const fmt = (o: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-US", { timeZone: TZ, ...o });
const timeF = fmt({ hour: "numeric", minute: "2-digit" });
const keyDate = (key: string) => zoned(key, "12:00");

export const fmtTime = (d: Date) => timeF.format(d).replace(":00", "").replace(" ", " ").toLowerCase();
export const fmtDay = (key: string) => fmt({ weekday: "short", month: "short", day: "numeric" }).format(keyDate(key));
export const fmtDayLong = (key: string) => fmt({ weekday: "long", month: "long", day: "numeric" }).format(keyDate(key));
export const fmtShort = (key: string) => fmt({ month: "short", day: "numeric" }).format(keyDate(key));
export const fmtWeekday = (key: string) => fmt({ weekday: "short" }).format(keyDate(key));

export function relDay(key: string, today = dayKey()) {
  const n = daysBetween(today, key);
  if (n === 0) return "Today";
  if (n === 1) return "Tomorrow";
  if (n === -1) return "Yesterday";
  if (n > 1 && n < 7) return fmt({ weekday: "long" }).format(keyDate(key));
  return fmtDay(key);
}

export function countdown(target: Date, now = new Date()) {
  const mins = Math.round((target.getTime() - now.getTime()) / 60000);
  if (mins <= 0) return "now";
  if (mins < 60) return `in ${mins} min`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  if (h < 24) return m ? `in ${h} h ${m} min` : `in ${h} h`;
  const days = daysBetween(dayKey(now), dayKey(target));
  return days === 1 ? `tomorrow at ${fmtTime(target)}` : `${relDay(dayKey(target))} at ${fmtTime(target)}`;
}

export function inDays(key: string, today = dayKey()) {
  const n = daysBetween(today, key);
  if (n === 0) return "today";
  if (n === 1) return "tomorrow";
  if (n < 0) return `${-n} day${n === -1 ? "" : "s"} ago`;
  return `in ${n} days`;
}
