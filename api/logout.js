import { clearedCookie } from "./_lib/auth.js";

export default function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  res.setHeader("Set-Cookie", clearedCookie());
  res.status(200).json({ ok: true });
}
