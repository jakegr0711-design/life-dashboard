import crypto from "node:crypto";

const COOKIE = "jld_session";
const MAX_AGE = 60 * 60 * 24 * 90; // 90 days

const norm = (s) => String(s || "").trim().toLowerCase();

export function passcode() {
  return norm(process.env.DASHBOARD_PASSCODE);
}

function token() {
  return crypto.createHmac("sha256", passcode()).update("jake-life-dashboard:v1").digest("base64url");
}

function cookies(header = "") {
  const out = {};
  for (const part of header.split(";")) {
    const i = part.indexOf("=");
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function safeEqual(a, b) {
  const x = crypto.createHash("sha256").update(String(a)).digest();
  const y = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(x, y);
}

export function checkPasscode(given) {
  return passcode() !== "" && safeEqual(norm(given), passcode());
}

export function isAuthed(req) {
  if (!passcode()) return false;
  const c = cookies(req.headers.cookie)[COOKIE];
  return Boolean(c) && safeEqual(c, token());
}

export function requireAuth(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (isAuthed(req)) return true;
  res.status(401).json({ error: passcode() ? "signed_out" : "not_configured" });
  return false;
}

export function sessionCookie() {
  return `${COOKIE}=${token()}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${MAX_AGE}`;
}

export function clearedCookie() {
  return `${COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=0`;
}

export async function readJson(req) {
  if (req.body && typeof req.body === "object") return req.body;
  if (typeof req.body === "string") {
    try { return JSON.parse(req.body); } catch { return {}; }
  }
  const chunks = [];
  for await (const c of req) chunks.push(c);
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { return {}; }
}
