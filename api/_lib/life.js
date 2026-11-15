// Jake's life data. Served only to signed-in sessions via /api/data.
// Edit this file to change classes, involvements, dates and links.

export default {
  person: {
    name: "Jake",
    fullName: "Jake Rosoff",
    school: "University of Florida",
    college: "Warrington College of Business",
    major: "BSBA Information Systems",
    year: "Sophomore",
    grad: "May 2029",
    gpa: 3.6,
  },

  term: {
    name: "Fall 2026",
    classesBegin: "2026-08-20",
    thanksgiving: ["2026-11-23", "2026-11-28"],
    classesEnd: "2026-12-02",
    readingDays: ["2026-12-03", "2026-12-04"],
    finals: ["2026-12-05", "2026-12-11"],
    next: { name: "Spring 2027", start: "2027-01-11" },
  },

  categories: {
    class: { label: "Class", color: "#0D9488" },
    ta: { label: "TA", color: "#4F46E5" },
    oh: { label: "Office hours", color: "#64748B" },
    rem: { label: "Rem and Company", color: "#2563EB" },
    gatortech: { label: "GatorTech", color: "#16A34A" },
    dailybread: { label: "Daily Bread", color: "#B45309" },
    footballhotbed: { label: "Football Hotbed", color: "#C2410C" },
    fbk: { label: "Florida Blue Key", color: "#7C3AED" },
    bump: { label: "BUMP", color: "#DB2777" },
    career: { label: "Career", color: "#0F766E" },
    network: { label: "Networking", color: "#EA580C" },
    personal: { label: "Personal", color: "#475569" },
    general: { label: "General", color: "#0F766E" },
  },

  // Tabs on the To-dos page. "general" is for everything else.
  todoLists: [
    { id: "general", label: "General" },
    { id: "rem", label: "Rem" },
    { id: "gatortech", label: "GatorTech" },
    { id: "dailybread", label: "Daily Bread" },
    { id: "footballhotbed", label: "Football Hotbed" },
    { id: "ta", label: "CGS2531 TA" },
  ],

  // Keywords used to color live calendar events by involvement
  matchers: [
    { cat: "ta", any: ["CGS2531", "CGS Office", "CGS "] },
    { cat: "oh", any: ["Office Hours", "Office hours", "Drop In"] },
    { cat: "class", any: ["GEB2216", "COM2380", "BUL4310", "QMB3250"] },
    { cat: "rem", any: ["Rem ", "REM", "Rem meeting", "Rem Potluck"] },
    { cat: "gatortech", any: ["GatorTech"] },
    { cat: "dailybread", any: ["Daily Bread"] },
    { cat: "footballhotbed", any: ["Football Hotbed", "All-American", "All American"] },
    { cat: "fbk", any: ["Blue Key", "FBK"] },
    { cat: "bump", any: ["BUMP"] },
    { cat: "career", any: ["Siemens", "MS-ISOM", "Information Session", "Coffee chat", "coffee chat"] },
  ],

  // Weekly template, used for Today/Week until the live calendar is linked.
  // day: 1 = Monday ... 7 = Sunday
  schedule: [
    { day: 1, start: "10:00", end: "11:00", title: "BUL4310 Legal Environment", where: "Zoom", cat: "class" },
    { day: 1, start: "13:55", end: "14:45", title: "GEB2216 Lecture", where: "Carleton Auditorium (CAR 0100)", cat: "class" },
    { day: 1, start: "15:00", end: "17:00", title: "Dr. Trainor office hours", where: "233G Bryan Hall", cat: "oh" },
    { day: 1, start: "18:00", end: "19:00", title: "Rem meeting", where: "", cat: "rem" },
    { day: 2, start: "09:35", end: "10:25", title: "GEB2216", where: "Heavener 260", cat: "class" },
    { day: 2, start: "10:30", end: "12:00", title: "Dr. Calvert office hours", where: "2336 Bryan Hall", cat: "oh" },
    { day: 2, start: "11:45", end: "13:40", title: "COM2380", where: "Turlington 2336", cat: "class" },
    { day: 2, start: "16:00", end: "18:00", title: "CGS2531 office hours (TA)", where: "", cat: "ta" },
    { day: 2, start: "18:00", end: "19:00", title: "GatorTech GBM", where: "", cat: "gatortech" },
    { day: 3, start: "14:00", end: "15:00", title: "BUL4310 Legal Environment", where: "Zoom", cat: "class" },
    { day: 3, start: "14:30", end: "15:00", title: "Rem internal", where: "", cat: "rem" },
    { day: 4, start: "09:35", end: "10:25", title: "GEB2216", where: "Heavener 260", cat: "class" },
    { day: 4, start: "10:30", end: "12:00", title: "Dr. Calvert office hours", where: "2336 Bryan Hall", cat: "oh" },
    { day: 4, start: "11:45", end: "12:45", title: "COM2380", where: "Turlington 2353", cat: "class" },
    { day: 4, start: "18:00", end: "20:00", title: "Daily Bread meeting", where: "", cat: "dailybread" },
  ],

  classes: [
    {
      code: "GEB2216",
      name: "Business communication",
      focus: "Career portfolio (LinkedIn, recommendation request), team presentation, end-of-semester report",
      meetings: ["Mon 1:55–2:45 pm · Carleton Auditorium (lecture)", "Tue & Thu 9:35–10:25 am · Heavener 260"],
    },
    {
      code: "COM2380",
      name: "AI and communication",
      focus: "Final project: designing a responsible AI communication assistant, then peer review and a final essay",
      meetings: ["Tue 11:45 am–1:40 pm · Turlington 2336", "Thu 11:45 am–12:45 pm · Turlington 2353"],
    },
    {
      code: "BUL4310",
      name: "Legal Environment of Business",
      instructor: "Prof. Robert Emerson",
      focus: "Optional term paper in progress; extra-credit papers available",
      meetings: ["Mon 10–11 am · Zoom", "Wed 2–3 pm · Zoom"],
    },
    {
      code: "QMB3250",
      name: "Statistics for Business Decisions",
      instructor: "Megan Mocko",
      focus: "Online modules in JMP; Exam 3 on Dec 9",
      meetings: ["Online · drop-in office hours on Zoom"],
    },
  ],

  teaching: {
    code: "CGS2531",
    role: "Undergraduate Teaching Assistant",
    instructor: "Dr. John Mendoza Garcia (Dr. MG)",
    meetings: ["Office hours Tue 4–6 pm"],
    focus: "Excel and data analysis instruction, grading, office hours. Plan to ask Dr. MG for an MS-ISOM recommendation.",
  },

  officeHours: [
    { who: "Dr. Trainor", when: "Mon 3–5 pm", where: "233G Bryan Hall" },
    { who: "Dr. Calvert", when: "Tue & Thu 10:30 am–12 pm", where: "2336 Bryan Hall" },
    { who: "Megan Mocko (QMB3250)", when: "Drop-in times on Canvas", where: "Zoom" },
  ],

  involvements: [
    {
      id: "rem",
      name: "Rem and Company",
      role: "Strategist",
      when: "Mon 6–7 pm meetings, Wed 2:30 pm internal",
      notes: [
        "Promoted from Junior Strategist",
        "Engagement: Bicycle University (Gainesville nonprofit)",
        "Built an LLM-powered web app that writes marketplace listings for a client",
      ],
    },
    {
      id: "gatortech",
      name: "GatorTech UF",
      role: "VP of External Communications",
      when: "Tue 6–7 pm general body meeting",
      notes: [
        "About 80 members across two tracks",
        "Data Analysis track: Gainesville RTS. Strategy & Growth track: Snag Delivery",
        "Your lane: social and marketing, speakers and partnerships, recruitment",
      ],
    },
    {
      id: "dailybread",
      name: "Daily Bread UF",
      role: "Team Lead",
      when: "Thu 6–8 pm",
      notes: [
        "Leading a team of 4 analysts on a sports media client",
        "Acquisition committee: brought in 3 of the org's 4 clients",
      ],
    },
    {
      id: "footballhotbed",
      name: "Football Hotbed",
      role: "Director, Academic All-American Game",
      when: "Game each January in South Florida",
      notes: ["About 70 players: selection, sponsorships, logistics and media"],
    },
    {
      id: "ta",
      name: "CGS2531 Teaching Assistant",
      role: "Undergraduate TA for Dr. MG",
      when: "Tue 4–6 pm office hours",
      notes: ["Excel and data analysis help, grading"],
    },
    {
      id: "fbk",
      name: "Florida Blue Key",
      role: "Assistant Director, Congressional Debate",
      when: "",
      notes: [],
    },
    {
      id: "bump",
      name: "UF BUMP",
      role: "Mentor",
      when: "",
      notes: ["Was a mentee last year"],
    },
  ],

  ventures: [
    { name: "Next Up Prospects", role: "Founder", note: "College recruiting help for high school athletes" },
    { name: "Case Room", role: "Builder", note: "AI case-interview practice app with voice" },
    { name: "Sideline Dynasty", role: "Builder", note: "College football coach management sim" },
    { name: "Collision alert app", role: "Co-founder", note: "Pedestrian collision warning, pivoted to a phone app; name undecided" },
    { name: "Landscapes Unlimited", role: "Client lead, Objective 3", note: "Website build and a client dashboard" },
    { name: "Florida Storm Tracker", role: "Group project", note: "Hurricane-risk site for your Quest class" },
  ],

  work: [
    { name: "Whit's Frozen Custard", role: "Server" },
    { name: "Snag", role: "Delivery driver" },
    { name: "Humane Society of North Central Florida", role: "Volunteer" },
  ],

  career: [
    { title: "Siemens Finance Leadership Development Intern", when: "Summer 2027, Atlanta", status: "Accepted" },
    { title: "UF MS-ISOM (combined BS/MS)", when: "Info session Tue Nov 17, 12 pm online", status: "Planning" },
    { title: "MBB internship, Summer 2028", when: "Applications expected Dec 2026 to Mar 2027", status: "Networking" },
    { title: "GPA", when: "3.6 now (was 3.8)", status: "Top lever for consulting" },
  ],

  keyDates: [
    { date: "2026-11-17", title: "MS-ISOM info session, 12 pm online", cat: "career" },
    { date: "2026-11-18", title: "Rem potluck, 7 pm", cat: "rem" },
    { date: "2026-11-19", title: "GEB2216 team presentation due", cat: "class" },
    { date: "2026-11-23", end: "2026-11-28", title: "Thanksgiving break", cat: "personal" },
    { date: "2026-12-02", title: "Last day of classes", cat: "class" },
    { date: "2026-12-03", end: "2026-12-04", title: "Reading days", cat: "class" },
    { date: "2026-12-05", end: "2026-12-11", title: "Final exams", cat: "class" },
    { date: "2027-01-11", title: "Spring 2027 classes begin", cat: "class" },
    { label: "Jan 2027", sort: "2027-01-20", title: "Academic All-American Game", cat: "footballhotbed" },
    { label: "Summer 2027", sort: "2027-06-01", title: "Siemens FLDP internship, Atlanta", cat: "career" },
  ],

  links: [
    { label: "Canvas", url: "https://ufl.instructure.com" },
    { label: "ONE.UF", url: "https://one.uf.edu" },
    { label: "Google Calendar", url: "https://calendar.google.com" },
    { label: "Gmail", url: "https://mail.google.com" },
    { label: "UF Outlook", url: "https://outlook.office.com/mail/" },
    { label: "Handshake", url: "https://ufl.joinhandshake.com" },
    { label: "LinkedIn", url: "https://www.linkedin.com/feed/" },
  ],

  // Canvas deadlines pulled Nov 15, 2026. Used only until the Canvas feed is linked.
  dueSnapshot: {
    asOf: "2026-11-15",
    items: [
      { date: "2026-11-15", course: "GEB2216", title: "Career Portfolio: LinkedIn Profile" },
      { date: "2026-11-15", course: "GEB2216", title: "Career Portfolio: Recommendation Request" },
      { date: "2026-11-15", course: "GEB2216", title: "AI Disclosure Surveys (LinkedIn, Recommendation Request)" },
      { date: "2026-11-17", course: "QMB3250", title: "Module 21 HW" },
      { date: "2026-11-17", course: "QMB3250", title: "Module 21: Guest Speaker, Sports Analytics" },
      { date: "2026-11-19", course: "QMB3250", title: "Module 22 HW" },
      { date: "2026-11-19", time: "17:00", course: "GEB2216", title: "Team Oral Presentation + PowerPoint" },
      { date: "2026-11-19", time: "17:00", course: "GEB2216", title: "AI Disclosure Survey (Team Presentation)" },
      { date: "2026-11-24", course: "COM2380", title: "Final Project: Responsible AI Communication Assistant" },
      { date: "2026-12-01", course: "QMB3250", title: "Module 23 HW" },
      { date: "2026-12-01", course: "COM2380", title: "Peer Review: Final Project" },
      { date: "2026-12-05", time: "22:15", course: "BUL4310", title: "Final Exam" },
      { date: "2026-12-06", course: "GEB2216", title: "End of Semester Report + AI Disclosure Survey" },
      { date: "2026-12-07", course: "COM2380", title: "Final Essay (individual)" },
      { date: "2026-12-09", course: "QMB3250", title: "Exam 3: Concepts" },
      { date: "2026-12-09", course: "QMB3250", title: "Exam 3: Computation (JMP allowed)" },
      { date: "2026-11-17", course: "CGS2531", ta: true, title: "Problem-Solving Process (2/3): Reviews" },
      { date: "2026-11-17", course: "CGS2531", ta: true, title: "M13 Final Project: Defend Your Learning, Version 1" },
      { date: "2026-11-18", course: "CGS2531", ta: true, title: "AI as a metacognitive tool" },
      { date: "2026-11-19", course: "CGS2531", ta: true, title: "Mail-merging & Problem-solving assignment" },
      { date: "2026-11-20", course: "CGS2531", ta: true, title: "Discussion 6: Do Your Visuals Strengthen Your Argument?" },
      { date: "2026-12-02", course: "CGS2531", ta: true, title: "Problem-Solving Process (3/3): Final PowerPoint" },
    ],
  },

  networking: {
    firms: [
      { id: "mckinsey", name: "McKinsey", careers: "https://www.mckinsey.com/careers" },
      { id: "bcg", name: "BCG", careers: "https://careers.bcg.com" },
      { id: "bain", name: "Bain", careers: "https://www.bain.com/careers/" },
    ],
    // Expected windows from last cycle's pattern. Confirm on each firm's site.
    timeline: [
      { when: "Now to Dec 2026", title: "Networking season", detail: "Build relationships with UF alumni at Southeast offices before applications open." },
      { when: "Dec 2026 to Jan 2027", title: "Summer 2028 internship applications expected to open", detail: "Have your resume consulting-ready by early December." },
      { when: "Jan 1 to Mar 29, 2027", title: "McKinsey Summer Business Analyst window (expected)", detail: "Matches last cycle; confirm when posted." },
      { when: "Feb to Mar 2027", title: "First MBB deadlines expected", detail: "Referral conversations should happen before you submit." },
      { when: "Before first interview", title: "30 to 40 live cases", detail: "Use Case Room plus live partners." },
    ],
  },
};
