import { isAuthed } from "../_lib/auth.js";
import { exchangeCode } from "../_lib/google.js";

const back = (res, query) => {
  res.setHeader("Set-Cookie", "jld_gstate=; Path=/api/google; HttpOnly; Secure; SameSite=Lax; Max-Age=0");
  res.statusCode = 302;
  res.setHeader("Location", `/?${query}#week`);
  res.end();
};

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "no-store");
  if (!isAuthed(req)) return back(res, "google=signed_out");
  const url = new URL(req.url, "http://x");
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const cookie = (req.headers.cookie || "").split(";").map((s) => s.trim()).find((s) => s.startsWith("jld_gstate="));
  if (url.searchParams.get("error")) return back(res, "google=denied");
  if (!code || !state || !cookie || cookie.slice("jld_gstate=".length) !== state) return back(res, "google=expired");
  try {
    await exchangeCode(req, code);
    return back(res, "google=connected");
  } catch {
    return back(res, "google=error");
  }
}
