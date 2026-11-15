import { checkPasscode, passcode, readJson, sessionCookie } from "./_lib/auth.js";

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (req.method !== "POST") return res.status(405).json({ error: "method_not_allowed" });
  if (!passcode()) return res.status(503).json({ error: "not_configured" });
  const body = await readJson(req);
  if (!checkPasscode(body.passcode)) {
    await new Promise((r) => setTimeout(r, 800));
    return res.status(401).json({ error: "wrong_passcode" });
  }
  res.setHeader("Set-Cookie", sessionCookie());
  return res.status(200).json({ ok: true });
}
