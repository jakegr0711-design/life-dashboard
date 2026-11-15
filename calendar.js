import { requireAuth } from "./_lib/auth.js";
import { readState, storageReady } from "./_lib/store.js";
import { expandFeed, feedKind, normalizeUrl } from "./_lib/ics.js";

const cache = new Map(); // url -> { at, text }
const TTL = 5 * 60 * 1000;

async function fetchFeed(url) {
  const hit = cache.get(url);
  if (hit && Date.now() - hit.at < TTL) return hit.text;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 9000);
  try {
    const r = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "jake-life-dashboard" } });
    if (!r.ok) throw new Error(`The feed returned HTTP ${r.status}`);
    const text = await r.text();
    if (!text.includes("BEGIN:VCALENDAR")) throw new Error("That link is not an iCal feed");
    cache.set(url, { at: Date.now(), text });
    return text;
  } finally {
    clearTimeout(timer);
  }
}

function envFeeds() {
  return String(process.env.CALENDAR_FEEDS || "")
    .split(/[\n,]+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s, i) => {
      const [label, url] = s.includes("|") ? s.split("|") : [`Feed ${i + 1}`, s];
      return { label: label.trim(), url: url.trim() };
    });
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;

  let feeds = envFeeds();
  if (storageReady()) {
    try {
      const state = await readState();
      feeds = [...(state.settings?.feeds || []), ...feeds];
    } catch (e) {
      return res.status(500).json({ error: "storage_unavailable", message: e.message });
    }
  }
  feeds = feeds.filter((f) => f.url && f.enabled !== false);

  const now = Date.now();
  const from = new Date(now - 2 * 864e5);
  const to = new Date(now + 60 * 864e5);
  const events = [];
  const status = [];

  await Promise.all(
    feeds.map(async (f) => {
      const url = normalizeUrl(f.url);
      const kind = feedKind(url);
      try {
        const text = await fetchFeed(url);
        const evs = expandFeed(text, { from, to, source: f.label, kind });
        events.push(...evs);
        status.push({ label: f.label, kind, ok: true, count: evs.length });
      } catch (e) {
        status.push({ label: f.label, kind, ok: false, message: e.name === "AbortError" ? "The feed took too long to respond" : e.message });
      }
    })
  );

  const seen = new Set();
  const unique = events.filter((e) => {
    const k = `${e.title}|${e.start || e.date}`;
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
  unique.sort((a, b) => (a.start || a.date + "T00").localeCompare(b.start || b.date + "T00"));

  res.status(200).json({
    configured: feeds.length > 0,
    hasCanvas: status.some((s) => s.kind === "canvas" && s.ok),
    hasCalendar: status.some((s) => s.kind === "calendar" && s.ok),
    status,
    events: unique,
    fetchedAt: new Date().toISOString(),
  });
}
