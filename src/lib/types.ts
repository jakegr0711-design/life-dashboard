export type Category = { label: string; color: string };

export type Life = {
  person: { name: string; fullName: string; school: string; college: string; major: string; year: string; grad: string; gpa: number };
  term: {
    name: string; classesBegin: string; thanksgiving: [string, string]; classesEnd: string;
    readingDays: [string, string]; finals: [string, string]; next: { name: string; start: string };
  };
  categories: Record<string, Category>;
  matchers: { cat: string; any: string[] }[];
  schedule: { day: number; start: string; end: string; title: string; where: string; cat: string }[];
  classes: { code: string; name: string; instructor?: string; focus: string; meetings: string[] }[];
  teaching: { code: string; role: string; instructor: string; meetings: string[]; focus: string };
  officeHours: { who: string; when: string; where: string }[];
  involvements: { id: string; name: string; role: string; when: string; notes: string[] }[];
  ventures: { name: string; role: string; note: string }[];
  work: { name: string; role: string }[];
  career: { title: string; when: string; status: string }[];
  keyDates: { date?: string; end?: string; label?: string; sort?: string; title: string; cat: string }[];
  links: { label: string; url: string }[];
  todoLists: { id: string; label: string }[];
  dueSnapshot: { asOf: string; items: { date: string; time?: string; course: string; title: string; ta?: boolean }[] };
  networking: {
    firms: { id: string; name: string; careers: string }[];
    timeline: { when: string; title: string; detail: string }[];
  };
};

export type FeedEvent = {
  id: string; title: string; course: string | null; allDay: boolean; date: string | null;
  start: string | null; end: string | null; location: string; source: string; kind: "canvas" | "calendar"; due: boolean;
  endDate?: string | null; gid?: string; editable?: boolean; recurring?: boolean; link?: string;
};

export type GoogleStatus = { configured: boolean; connected: boolean; email: string; error: string };

export type CalendarResponse = {
  google?: GoogleStatus;
  configured: boolean; hasCanvas: boolean; hasCalendar: boolean;
  status: { label: string; kind: string; ok: boolean; count?: number; message?: string }[];
  events: FeedEvent[]; fetchedAt: string;
};

/** Unified event used by every view */
export type Ev = {
  id: string; title: string; date: string; allDay: boolean; start?: Date; end?: Date;
  location: string; cat: string; course?: string | null; gid?: string; recurring?: boolean; link?: string;
};

export type NewEvent = {
  title: string; date: string; endDate?: string; allDay: boolean; start?: string; end?: string; location?: string; notes?: string;
};

export type DueItem = { id: string; date: string; time?: string; course: string; title: string; ta: boolean };

export type Stage = "target" | "contacted" | "scheduled" | "chatted" | "advocate";

export type LogEntry = { date: string; type: string; text: string };

export type Contact = {
  id: string; name: string; firm: string; firmName?: string; office: string; title: string; connection: string;
  stage: Stage; lastContact: string; nextFollowUp: string; email: string; linkedin: string; notes: string; log: LogEntry[];
};

export type Todo = { id: string; list: string; text: string; done: boolean; due?: string; doneAt?: string; createdAt?: string };

export type Feed = { label: string; url: string; enabled: boolean };

export type State = {
  version: number; updatedAt: string | null;
  settings: { feeds: Feed[]; weeklyChatGoal: number; weeklyOutreachGoal: number };
  todos: Todo[]; contacts: Contact[];
};
