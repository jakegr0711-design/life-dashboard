import { requireAuth, readJson } from "./_lib/auth.js";
import { readState, writeState, storageReady } from "./_lib/store.js";

const str = (v, max = 2000) => String(v ?? "").slice(0, max);

function clean(input) {
  const s = input || {};
  const settings = s.settings || {};
  return {
    settings: {
      feeds: (Array.isArray(settings.feeds) ? settings.feeds : []).slice(0, 10).map((f) => ({
        label: str(f.label, 60) || "Calendar",
        url: str(f.url, 1000),
        enabled: f.enabled !== false,
      })).filter((f) => /^(https|webcal):\/\//i.test(f.url)),
      weeklyChatGoal: Math.max(0, Math.min(50, Number(settings.weeklyChatGoal) || 3)),
      weeklyOutreachGoal: Math.max(0, Math.min(100, Number(settings.weeklyOutreachGoal) || 5)),
    },
    todos: (Array.isArray(s.todos) ? s.todos : []).slice(0, 300).map((t) => ({
      id: str(t.id, 40), text: str(t.text, 500), done: Boolean(t.done), due: str(t.due, 10),
    })),
    contacts: (Array.isArray(s.contacts) ? s.contacts : []).slice(0, 1000).map((c) => ({
      id: str(c.id, 40), name: str(c.name, 120), firm: str(c.firm, 20), firmName: str(c.firmName, 80),
      office: str(c.office, 80), title: str(c.title, 120), connection: str(c.connection, 300),
      stage: str(c.stage, 20), lastContact: str(c.lastContact, 10), nextFollowUp: str(c.nextFollowUp, 10),
      email: str(c.email, 160), linkedin: str(c.linkedin, 300), notes: str(c.notes, 5000),
      log: (Array.isArray(c.log) ? c.log : []).slice(-200).map((l) => ({
        date: str(l.date, 10), type: str(l.type, 20), text: str(l.text, 1000),
      })),
    })),
  };
}

export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (!storageReady()) return res.status(503).json({ error: "storage_not_configured" });

  try {
    const current = await readState();
    if (req.method === "GET") return res.status(200).json({ state: current });

    if (req.method === "PUT") {
      const body = await readJson(req);
      if (Number(body.baseVersion) !== Number(current.version || 0)) {
        return res.status(409).json({ error: "conflict", state: current });
      }
      const next = { ...clean(body.state), version: (current.version || 0) + 1, updatedAt: new Date().toISOString() };
      await writeState(next);
      return res.status(200).json({ state: next });
    }
    res.setHeader("Allow", "GET, PUT");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (e) {
    return res.status(500).json({ error: "storage_error", message: e.message });
  }
}
