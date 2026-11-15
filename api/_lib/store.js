// Storage now lives in Airtable (see airtable.js).
import {
  airtableReady, contactFrom, listAll, parseJson, readSettings, TABLES, todoFrom, writeSetting,
} from "./airtable.js";

export const storageReady = airtableReady;

// Small internal documents (Google sign-in, login lockout) are kept as rows in the Settings table
const KEYS = { "state/google.json": "googleAuth", "state/auth.json": "loginFails" };

export async function readDoc(path, fallback = null) {
  const s = await readSettings();
  return parseJson(s[KEYS[path]]?.value, fallback);
}

export async function writeDoc(path, doc) {
  await writeSetting(KEYS[path], doc);
}

export async function readFeeds() {
  const s = await readSettings();
  return parseJson(s.calendarFeeds?.value, []);
}

/** Everything the dashboard edits: settings, to-dos and contacts. */
export async function readState() {
  const [settings, todos, contacts] = await Promise.all([
    readSettings(), listAll(TABLES.todos), listAll(TABLES.contacts),
  ]);
  return {
    version: 0,
    updatedAt: new Date().toISOString(),
    settings: {
      feeds: parseJson(settings.calendarFeeds?.value, []),
      weeklyChatGoal: Number(settings.weeklyChatGoal?.value) || 3,
      weeklyOutreachGoal: Number(settings.weeklyOutreachGoal?.value) || 5,
    },
    todos: todos.map(todoFrom).filter((t) => t.text),
    contacts: contacts.map(contactFrom).filter((c) => c.name),
  };
}
