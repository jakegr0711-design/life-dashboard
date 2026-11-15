import crypto from "node:crypto";
import { requireAuth } from "../_lib/auth.js";
import { authUrl, googleConfigured } from "../_lib/google.js";
import { storageReady } from "../_lib/store.js";

// Starts the Google sign-in. The state value guards against forged callbacks.
export default function handler(req, res) {
  if (!requireAuth(req, res)) return;
  if (!googleConfigured() || !storageReady()) {
    res.statusCode = 302;
    res.setHeader("Location", "/?google=not_configured");
    return res.end();
  }
  const state = crypto.randomBytes(18).toString("base64url");
  res.setHeader("Set-Cookie", `jld_gstate=${state}; Path=/api/google; HttpOnly; Secure; SameSite=Lax; Max-Age=600`);
  res.statusCode = 302;
  res.setHeader("Location", authUrl(req, state));
  res.end();
}
