import crypto from "node:crypto";
import { readDoc, writeDoc } from "./store.js";

// Overridable for local testing against a mock server
const AUTH_URL = process.env.GOOGLE_AUTH_URL || "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = process.env.GOOGLE_TOKEN_URL || "https://oauth2.googleapis.com/token";
const REVOKE_URL = process.env.GOOGLE_REVOKE_URL || "https://oauth2.googleapis.com/revoke";
const API = process.env.GOOGLE_API_BASE || "https://www.googleapis.com/calendar/v3";
const DOC = "state/google.json";
const SCOPES = ["openid", "email", "https://www.googleapis.com/auth/calendar.events"];
export const TZ = "America/New_York";

export class GoogleError extends Error {
  constructor(message, code = "google_error", status = 502) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export const googleConfigured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET);

export function redirectUri(req) {
  if (process.env.GOOGLE_REDIRECT_URI) return process.env.GOOGLE_REDIRECT_URI;
  const host = req.headers["x-forwarded-host"] || req.headers.host;
  const proto = req.headers["x-forwarded-proto"] || (String(host).startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}/api/google/callback`;
}

export function authUrl(req, state) {
  const p = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri(req),
    response_type: "code",
    scope: SCOPES.join(" "),
    access_type: "offline",
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${p}`;
}

// Refresh tokens are encrypted at rest with a key derived from the client secret
const key = () => crypto.createHash("sha256").update(`jld-google:${process.env.GOOGLE_CLIENT_SECRET}`).digest();
function encrypt(text) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const data = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), data].map((b) => b.toString("base64url")).join(".");
}
function decrypt(blob) {
  const [iv, tag, data] = blob.split(".").map((s) => Buffer.from(s, "base64url"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(data), d.final()]).toString("utf8");
}

export async function connection() {
  const doc = await readDoc(DOC, {});
  return { connected: Boolean(doc.refresh), email: doc.email || "", expired: Boolean(doc.expired) };
}

async function tokenRequest(params) {
  const r = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID,
      client_secret: process.env.GOOGLE_CLIENT_SECRET,
      ...params,
    }),
  });
  const j = await r.json().catch(() => ({}));
  return { ok: r.ok, j };
}

let cache = null; // { token, exp }

export async function exchangeCode(req, code) {
  const { ok, j } = await tokenRequest({ code, redirect_uri: redirectUri(req), grant_type: "authorization_code" });
  if (!ok || !j.refresh_token) throw new GoogleError(j.error_description || j.error || "Google didn't return access", "exchange_failed", 400);
  let email = "";
  try { email = JSON.parse(Buffer.from(j.id_token.split(".")[1], "base64url").toString()).email || ""; } catch { /* optional */ }
  await writeDoc(DOC, { refresh: encrypt(j.refresh_token), email, connectedAt: new Date().toISOString() });
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3000) * 1000 };
  return email;
}

export async function disconnect() {
  const doc = await readDoc(DOC, {});
  if (doc.refresh) {
    try { await fetch(`${REVOKE_URL}?token=${encodeURIComponent(decrypt(doc.refresh))}`, { method: "POST" }); } catch { /* best effort */ }
  }
  cache = null;
  await writeDoc(DOC, {});
}

async function accessToken() {
  if (cache && cache.exp > Date.now() + 60000) return cache.token;
  const doc = await readDoc(DOC, {});
  if (!doc.refresh) throw new GoogleError("Google Calendar isn't connected", "not_connected", 409);
  const { ok, j } = await tokenRequest({ refresh_token: decrypt(doc.refresh), grant_type: "refresh_token" });
  if (!ok) {
    if (j.error === "invalid_grant") {
      await writeDoc(DOC, { ...doc, expired: true });
      throw new GoogleError("Google access expired. Reconnect in Settings.", "reconnect", 409);
    }
    throw new GoogleError(j.error_description || "Couldn't reach Google", "token_failed");
  }
  if (doc.expired) await writeDoc(DOC, { ...doc, expired: false });
  cache = { token: j.access_token, exp: Date.now() + (j.expires_in || 3000) * 1000 };
  return cache.token;
}

export async function gapi(path, { method = "GET", body } = {}) {
  const t = await accessToken();
  const r = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${t}`, ...(body ? { "Content-Type": "application/json" } : {}) },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 204) return null;
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new GoogleError(j.error?.message || `Google returned ${r.status}`, "api_error", r.status === 404 || r.status === 410 ? 404 : 502);
  return j;
}

const addDay = (d) => {
  const t = new Date(`${d}T12:00:00Z`);
  t.setUTCDate(t.getUTCDate() + 1);
  return t.toISOString().slice(0, 10);
};

export function normalize(ev) {
  const allDay = Boolean(ev.start?.date);
  return {
    id: `g:${ev.id}`,
    gid: ev.id,
    title: (ev.summary || "(no title)").trim(),
    course: null,
    allDay,
    date: allDay ? ev.start.date : null,
    endDate: allDay ? ev.end?.date || null : null,
    start: allDay ? null : new Date(ev.start.dateTime).toISOString(),
    end: allDay ? null : new Date(ev.end?.dateTime || ev.start.dateTime).toISOString(),
    location: (ev.location || "").trim(),
    source: "Google Calendar",
    kind: "calendar",
    due: false,
    editable: true,
    recurring: Boolean(ev.recurringEventId),
    link: ev.htmlLink || "",
  };
}

/** Events on the primary calendar between two instants, recurring events expanded. */
export async function listEvents(from, to) {
  const out = [];
  let pageToken = "";
  for (let i = 0; i < 5; i++) {
    const q = new URLSearchParams({
      timeMin: from.toISOString(), timeMax: to.toISOString(), singleEvents: "true",
      orderBy: "startTime", maxResults: "2500", timeZone: TZ, ...(pageToken ? { pageToken } : {}),
    });
    const j = await gapi(`/calendars/primary/events?${q}`);
    for (const ev of j.items || []) {
      if (ev.status === "cancelled") continue;
      const me = (ev.attendees || []).find((a) => a.self);
      if (me?.responseStatus === "declined") continue;
      out.push(normalize(ev));
    }
    if (!j.nextPageToken) break;
    pageToken = j.nextPageToken;
  }
  return out;
}

export function toGoogleBody(e) {
  const body = { summary: e.title, location: e.location || undefined, description: e.notes || undefined };
  if (e.allDay) {
    body.start = { date: e.date };
    body.end = { date: addDay(e.endDate && e.endDate > e.date ? e.endDate : e.date) }; // end date is exclusive
  } else {
    body.start = { dateTime: `${e.date}T${e.start}:00`, timeZone: TZ };
    body.end = { dateTime: `${e.endDate || e.date}T${e.end}:00`, timeZone: TZ };
  }
  return body;
}
