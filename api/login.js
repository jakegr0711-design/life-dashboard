import { checkPasscode, passcode, readJson, sessionCookie } from "./_lib/auth.js";
import { readDoc, storageReady, writeDoc } from "./_lib/store.js";

// After 5 wrong passcodes in 15 minutes, sign-in pauses for 15 minutes.
const LOCK_PATH = "state/auth.json";
const WINDOW = 15 * 60 * 1000;
const MAX_FAILS = 5;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!passcode()) return res.status(503).json({ error: "not_configured" });

  const lockable = storageReady();
  const now = Date.now();
  let fails = [];
  if (lockable) {
    try { fails = ((await readDoc(LOCK_PATH, { fails: [] })).fails || []).filter((t) => now - t < WINDOW); } catch { fails = []; }
    if (fails.length >= MAX_FAILS) {
      const wait = Math.ceil((fails[0] + WINDOW - now) / 60000);
      return res.status(429).json({ error: "locked", minutes: wait });
    }
  }

  const body = await readJson(req);
  if (!checkPasscode(body.passcode)) {
    await new Promise((r) => setTimeout(r, 800));
    if (lockable) {
      fails.push(now);
      try { await writeDoc(LOCK_PATH, { fails: fails.slice(-20) }); } catch { /* best effort */ }
    }
    return res.status(401).json({ error: "wrong_passcode", remaining: Math.max(0, MAX_FAILS - fails.length) });
  }

  if (lockable && fails.length) {
    try { await writeDoc(LOCK_PATH, { fails: [] }); } catch { /* best effort */ }
  }
  res.setHeader("Set-Cookie", sessionCookie());
  return res.status(200).json({ ok: true });
}
