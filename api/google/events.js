import { readJson, requireAuth } from "../_lib/auth.js";
import { disconnect, gapi, GoogleError, normalize, toGoogleBody } from "../_lib/google.js";

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const TIME = /^\d{2}:\d{2}$/;

// POST: add an event. DELETE ?id=: remove one event (or one occurrence of a repeating one).
// POST ?action=disconnect: unlink Google.
export default async function handler(req, res) {
  if (!requireAuth(req, res)) return;
  const url = new URL(req.url, "http://x");
  try {
    if (req.method === "POST" && url.searchParams.get("action") === "disconnect") {
      await disconnect();
      return res.status(200).json({ ok: true });
    }

    if (req.method === "POST") {
      const e = await readJson(req);
      const title = String(e.title || "").trim().slice(0, 300);
      if (!title) return res.status(400).json({ error: "Add a title for the event." });
      if (!DATE.test(e.date || "")) return res.status(400).json({ error: "Pick a date." });
      if (e.endDate && !DATE.test(e.endDate)) return res.status(400).json({ error: "Pick a valid end date." });
      if (!e.allDay) {
        if (!TIME.test(e.start || "") || !TIME.test(e.end || "")) return res.status(400).json({ error: "Pick a start and end time." });
        if (`${e.endDate || e.date}T${e.end}` <= `${e.date}T${e.start}`) return res.status(400).json({ error: "The end time has to be after the start time." });
      }
      const created = await gapi("/calendars/primary/events", {
        method: "POST",
        body: toGoogleBody({ ...e, title, location: String(e.location || "").slice(0, 300), notes: String(e.notes || "").slice(0, 4000) }),
      });
      return res.status(200).json({ event: normalize(created) });
    }

    if (req.method === "DELETE") {
      const id = url.searchParams.get("id") || "";
      if (!/^[A-Za-z0-9_@.-]+$/.test(id)) return res.status(400).json({ error: "Missing event id." });
      try {
        await gapi(`/calendars/primary/events/${encodeURIComponent(id)}`, { method: "DELETE" });
      } catch (err) {
        if (!(err instanceof GoogleError && err.status === 404)) throw err; // already gone is fine
      }
      return res.status(200).json({ ok: true });
    }

    res.setHeader("Allow", "POST, DELETE");
    return res.status(405).json({ error: "method_not_allowed" });
  } catch (err) {
    const status = err instanceof GoogleError ? err.status : 500;
    return res.status(status).json({ error: err.message, code: err.code || "error" });
  }
}
