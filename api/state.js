import { readJson, requireAuth } from "./_lib/auth.js";
import { readState, storageReady } from "./_lib/store.js";
import {
  contactFields, createMany, deleteMany, readSettings, TABLES, todoFields, updateMany, writeSetting,
} from "./_lib/airtable.js";

const str = (v, max = 2000) => String(v ?? "").slice(0, max);
const isRec = (id) => /^rec[A-Za-z0-9]{14}$/.test(String(id));

const cleanTodo = (t) => ({
  id: str(t.id, 40), list: str(t.list, 30) || "general", text: str(t.text, 500), done: Boolean(t.done),
  due: str(t.due, 10), doneAt: str(t.doneAt, 10),
});

const cleanContact = (c) => ({
  id: str(c.id, 40), name: str(c.name, 120), firm: str(c.firm, 20), firmName: str(c.firmName, 80),
  office: str(c.office, 80), title: str(c.title, 120), connection: str(c.connection, 300),
  stage: str(c.stage, 20), lastContact: str(c.lastContact, 10), nextFollowUp: str(c.nextFollowUp, 10),
  email: str(c.email, 160), linkedin: str(c.linkedin, 300), notes: str(c.notes, 5000),
  log: (Array.isArray(c.log) ? c.log : []).slice(-200).map((l) => ({ date: str(l.date, 10), type: str(l.type, 20), text: str(l.text, 1000) })),
});

/** Apply create / update / delete changes for one table. Returns temp id -> Airtable id. */
async function apply(table, ops, clean, toFields) {
  const map = {};
  if (!ops) return map;
  const creates = (ops.create || []).slice(0, 100).map(clean);
  if (creates.length) {
    const made = await createMany(table, creates.map(toFields));
    creates.forEach((c, i) => { map[c.id] = made[i].id; });
  }
  const updates = (ops.update || []).slice(0, 200).map(clean).filter((x) => isRec(x.id));
  if (updates.length) await updateMany(table, updates.map((x) => ({ id: x.id, fields: toFields(x) })));
  const deletes = (ops.delete || []).slice(0, 200).filter(isRec);
  if (deletes.length) await deleteMany(table, deletes);
  return map;
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (!storageReady()) return res.status(503).json({ error: "storage_not_configured" });

  try {
    if (req.method === "GET") return res.status(200).json({ state: await readState() });

    if (req.method === "PATCH") {
      const body = await readJson(req);
      const ids = {
        ...(await apply(TABLES.todos, body.todos, cleanTodo, todoFields)),
        ...(await apply(TABLES.contacts, body.contacts, cleanContact, contactFields)),
      };
      if (body.settings) {
        const s = body.settings;
        const current = await readSettings();
        if (Array.isArray(s.feeds)) {
          const feeds = s.feeds.slice(0, 10)
            .map((f) => ({ label: str(f.label, 60) || "Calendar", url: str(f.url, 1000), enabled: f.enabled !== false }))
            .filter((f) => /^(https|webcal):\/\//i.test(f.url));
          await writeSetting("calendarFeeds", feeds, current);
        }
        if (s.weeklyChatGoal !== undefined) await writeSetting("weeklyChatGoal", String(Math.max(0, Math.min(50, Number(s.weeklyChatGoal) || 0))), current);
        if (s.weeklyOutreachGoal !== undefined) await writeSetting("weeklyOutreachGoal", String(Math.max(0, Math.min(100, Number(s.weeklyOutreachGoal) || 0))), current);
      }
      return res.status(200).json({ ids });
    }

    res.setHeader("Allow", "GET, PATCH");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    return res.status(500).json({ error: "storage_error", message: e.message });
  }
}
