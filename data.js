import { requireAuth } from "./_lib/auth.js";
import { storageReady } from "./_lib/store.js";
import life from "./_lib/life.js";

export default function handler(req, res) {
  if (!requireAuth(req, res)) return;
  res.status(200).json({ life, storage: storageReady() });
}
