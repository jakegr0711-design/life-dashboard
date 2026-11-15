import { get, put } from "@vercel/blob";
import fs from "node:fs/promises";

const PATH = "state/dashboard.json";

// Starting point for the networking tracker, to-dos and settings.
// Contacts come from coffee-chat prep this fall; fill in names and update stages.
export const DEFAULT_STATE = {
  version: 0,
  updatedAt: null,
  settings: { feeds: [], weeklyChatGoal: 3, weeklyOutreachGoal: 5 },
  todos: [
    { id: "t1", text: "Send thank-you notes within a day of each coffee chat", done: false },
    { id: "t2", text: "Ask Dr. MG about an MS-ISOM recommendation", done: false },
    { id: "t3", text: "Get resume consulting-ready before December", done: false },
  ],
  contacts: [
    {
      id: "c1", name: "BCG associate (add name)", firm: "bcg", office: "Atlanta", title: "Associate",
      connection: "UF Information Systems, Rem alum, Heavener International Case Competition",
      stage: "scheduled", lastContact: "", nextFollowUp: "", email: "", linkedin: "",
      notes: "Prepped questions in late October. Update the stage after you talk.", log: [],
    },
    {
      id: "c2", name: "Bain consultant (add name)", firm: "bain", office: "", title: "Consultant",
      connection: "Rem alum; Bain Freshman Leadership Accelerator, then intern, then full-time",
      stage: "scheduled", lastContact: "", nextFollowUp: "", email: "", linkedin: "",
      notes: "Prepped Nov 5 for a 30-minute chat. Ask who else you should talk to.", log: [],
    },
    {
      id: "c3", name: "McKinsey contact (add name)", firm: "mckinsey", office: "", title: "",
      connection: "", stage: "scheduled", lastContact: "", nextFollowUp: "", email: "", linkedin: "",
      notes: "Call came up in late September. Fill in details.", log: [],
    },
    {
      id: "c4", name: "Andrew", firm: "other", firmName: "Accenture", office: "", title: "Advisory Analyst",
      connection: "Likely HICC teammate", stage: "scheduled", lastContact: "", nextFollowUp: "", email: "", linkedin: "",
      notes: "Ask about Strategy vs Consulting vs Technology tracks.", log: [],
    },
    {
      id: "c5", name: "Jonathan", firm: "other", firmName: "Accenture", office: "", title: "Managing Director",
      connection: "Played UF football, industrial engineering", stage: "scheduled", lastContact: "", nextFollowUp: "",
      email: "", linkedin: "", notes: "Lead with the student-athlete connection. Ask for introductions.", log: [],
    },
  ],
};

const local = process.env.LOCAL_STATE_FILE; // for local testing only

export function storageReady() {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN || local);
}

export async function readState() {
  if (!process.env.BLOB_READ_WRITE_TOKEN && local) {
    try { return JSON.parse(await fs.readFile(local, "utf8")); } catch { return structuredClone(DEFAULT_STATE); }
  }
  const res = await get(PATH, { access: "private", useCache: false });
  if (!res) return structuredClone(DEFAULT_STATE);
  return JSON.parse(await new Response(res.stream).text());
}

export async function writeState(state) {
  const body = JSON.stringify(state);
  if (!process.env.BLOB_READ_WRITE_TOKEN && local) return fs.writeFile(local, body);
  await put(PATH, body, {
    access: "private",
    addRandomSuffix: false,
    allowOverwrite: true,
    contentType: "application/json",
    cacheControlMaxAge: 60,
  });
}
