// Airtable is where to-dos, networking contacts and settings live.
// Base: "Jake's Dashboard". Token: AIRTABLE_TOKEN (personal access token with
// data.records:read and data.records:write on that base).
import life from "./life.js";

const BASE = process.env.AIRTABLE_BASE_ID || "appme1wpwwOElsxLE";
const API = process.env.AIRTABLE_API || "https://api.airtable.com/v0";

export const TABLES = {
  todos: "tbl4lUmdcJx0vjbKG",
  contacts: "tbl4MLWsSVWIZfZtI",
  settings: "tblgOGqL25iVvhfSN",
};

export const airtableReady = () => Boolean(process.env.AIRTABLE_TOKEN);

export class AirtableError extends Error {}

async function call(path, { method = "GET", body } = {}, attempt = 0) {
  const r = await fetch(`${API}/${BASE}/${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${process.env.AIRTABLE_TOKEN}`,
      ...(body ? { "Content-Type": "application/json" } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (r.status === 429 && attempt < 3) {
    await new Promise((res) => setTimeout(res, 1100 * (attempt + 1)));
    return call(path, { method, body }, attempt + 1);
  }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) {
    const msg = j.error?.message || j.error?.type || j.error || `Airtable returned ${r.status}`;
    throw new AirtableError(r.status === 401 || r.status === 403
      ? "Airtable refused the token. Check AIRTABLE_TOKEN has read and write access to Jake's Dashboard."
      : String(msg));
  }
  return j;
}

const chunks = (arr, n = 10) => Array.from({ length: Math.ceil(arr.length / n) }, (_, i) => arr.slice(i * n, i * n + n));

export async function listAll(table) {
  const out = [];
  let offset = "";
  for (let i = 0; i < 50; i++) {
    const j = await call(`${table}?pageSize=100${offset ? `&offset=${offset}` : ""}`);
    out.push(...(j.records || []));
    if (!j.offset) break;
    offset = j.offset;
  }
  return out;
}

export async function createMany(table, fieldsList) {
  const out = [];
  for (const c of chunks(fieldsList)) {
    const j = await call(table, { method: "POST", body: { records: c.map((fields) => ({ fields })), typecast: true } });
    out.push(...j.records);
  }
  return out;
}

export async function updateMany(table, records) {
  for (const c of chunks(records)) await call(table, { method: "PATCH", body: { records: c, typecast: true } });
}

export async function deleteMany(table, ids) {
  for (const c of chunks(ids)) await call(`${table}?${c.map((id) => `records[]=${encodeURIComponent(id)}`).join("&")}`, { method: "DELETE" });
}

// ---------- mapping between Airtable rows and the dashboard ----------

const listLabel = (id) => life.todoLists.find((l) => l.id === id)?.label || "General";
const listId = (label) => life.todoLists.find((l) => l.label === label)?.id || "general";

const FIRMS = { mckinsey: "McKinsey", bcg: "BCG", bain: "Bain", other: "Other" };
const STAGES = { target: "To contact", contacted: "Reached out", scheduled: "Chat scheduled", chatted: "Chatted", advocate: "Advocate" };
const LOG = { chat: "Coffee chat", outreach: "Outreach", followup: "Follow-up", note: "Note" };
const rev = (o) => Object.fromEntries(Object.entries(o).map(([k, v]) => [v, k]));
const FIRM_IDS = rev(FIRMS);
const STAGE_IDS = rev(STAGES);
const LOG_IDS = rev(LOG);

export function todoFrom(r) {
  const f = r.fields || {};
  return {
    id: r.id, list: listId(f.List), text: f.Task || "", done: Boolean(f.Done),
    due: f.Due || "", doneAt: f.Completed || "", createdAt: r.createdTime || "",
  };
}

export function todoFields(t) {
  return { Task: t.text, List: listLabel(t.list), Due: t.due || null, Done: Boolean(t.done), Completed: t.doneAt || null };
}

function parseHistory(text = "") {
  return text.split("\n").map((line) => {
    const m = line.match(/^(\d{4}-\d{2}-\d{2})\s*\|\s*([^|]+?)\s*(?:\|\s*(.*))?$/);
    return m ? { date: m[1], type: LOG_IDS[m[2]] || "note", text: (m[3] || "").trim() } : null;
  }).filter(Boolean);
}

const formatHistory = (log = []) =>
  log.map((l) => `${l.date} | ${LOG[l.type] || "Note"}${l.text ? ` | ${l.text.replace(/\n/g, " ")}` : ""}`).join("\n");

export function contactFrom(r) {
  const f = r.fields || {};
  return {
    id: r.id, name: f.Name || "", firm: FIRM_IDS[f.Firm] || "other", firmName: f["Firm name"] || "",
    office: f.Office || "", title: f.Title || "", connection: f.Connection || "",
    stage: STAGE_IDS[f.Stage] || "target", lastContact: f["Last contact"] || "", nextFollowUp: f["Next follow-up"] || "",
    email: f.Email || "", linkedin: f.LinkedIn || "", notes: f.Notes || "", log: parseHistory(f.History),
  };
}

export function contactFields(c) {
  return {
    Name: c.name, Firm: FIRMS[c.firm] || "Other", "Firm name": c.firmName || "", Office: c.office || "",
    Title: c.title || "", Connection: c.connection || "", Stage: STAGES[c.stage] || "To contact",
    "Last contact": c.lastContact || null, "Next follow-up": c.nextFollowUp || null,
    Email: c.email || null, LinkedIn: c.linkedin || null, Notes: c.notes || "", History: formatHistory(c.log),
  };
}

// ---------- settings (key/value rows) ----------

export async function readSettings() {
  const rows = await listAll(TABLES.settings);
  const map = {};
  for (const r of rows) if (r.fields?.Key) map[r.fields.Key] = { id: r.id, value: r.fields.Value || "" };
  return map;
}

export async function writeSetting(key, value, settings) {
  const s = settings || (await readSettings());
  const v = typeof value === "string" ? value : JSON.stringify(value);
  if (s[key]) await updateMany(TABLES.settings, [{ id: s[key].id, fields: { Value: v } }]);
  else await createMany(TABLES.settings, [{ Key: key, Value: v }]);
}

export function parseJson(v, fallback) {
  try { return v ? JSON.parse(v) : fallback; } catch { return fallback; }
}
