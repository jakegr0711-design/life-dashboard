import * as Tabs from "@radix-ui/react-tabs";
import { BriefcaseBusiness, CalendarDays, GraduationCap, LogOut, RefreshCw, Settings as Gear, Sun, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { useData } from "@/lib/data";
import { fmtDayLong, dayKey } from "@/lib/time";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Login from "@/views/Login";
import Settings from "@/views/Settings";
import Today from "@/views/Today";
import Week from "@/views/Week";
import School from "@/views/School";
import Involvements from "@/views/Involvements";
import Network from "@/views/Network";

const TABS = [
  { id: "today", label: "Today", icon: Sun, View: Today },
  { id: "week", label: "Week", icon: CalendarDays, View: Week },
  { id: "school", label: "School", icon: GraduationCap, View: School },
  { id: "life", label: "Involvements", short: "Orgs", icon: Users, View: Involvements },
  { id: "network", label: "Networking", short: "Network", icon: BriefcaseBusiness, View: Network },
];

const fromHash = () => {
  const h = window.location.hash.replace("#", "");
  return TABS.some((t) => t.id === h) ? h : "today";
};

export default function App() {
  const { status, life, signOut, refreshCalendar, calendarLoading, stateError, dismissError } = useData();
  const [tab, setTab] = useState(fromHash);
  const [settingsOpen, setSettingsOpen] = useState(false);

  useEffect(() => {
    const onHash = () => setTab(fromHash());
    window.addEventListener("hashchange", onHash);
    return () => window.removeEventListener("hashchange", onHash);
  }, []);

  const go = (id: string) => {
    setTab(id);
    history.replaceState(null, "", id === "today" ? window.location.pathname : `#${id}`);
    window.scrollTo({ top: 0 });
  };

  if (status === "loading") {
    return (
      <div className="grid min-h-dvh place-items-center text-sm text-muted-fg" role="status">
        Loading your dashboard…
      </div>
    );
  }
  if (status === "signed_out" || status === "not_configured" || status === "error") return <Login status={status} />;
  if (!life) return null;

  return (
    <Tabs.Root value={tab} onValueChange={go} className="min-h-dvh pb-24 md:pb-10">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 pt-5 md:px-6 md:pt-7">
        <div>
          <p className="text-sm font-medium text-muted-fg">{fmtDayLong(dayKey())}</p>
          <h1 className="text-2xl font-extrabold tracking-tight text-fg md:text-3xl">
            {greeting()}, {life.person.name}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={refreshCalendar} aria-label="Refresh calendar" title="Refresh calendar">
            <RefreshCw className={cn(calendarLoading && "animate-spin")} />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setSettingsOpen(true)} aria-label="Settings" title="Settings">
            <Gear />
          </Button>
          <Button variant="ghost" size="icon" onClick={signOut} aria-label="Sign out" title="Sign out">
            <LogOut />
          </Button>
        </div>
      </header>

      <Tabs.List
        aria-label="Sections"
        className="pb-safe fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-line bg-card md:static md:mx-auto md:mt-5 md:flex md:max-w-6xl md:gap-1 md:border-0 md:bg-transparent md:px-6"
      >
        {TABS.map(({ id, label, short, icon: Icon }) => (
          <Tabs.Trigger
            key={id}
            value={id}
            className="group flex min-h-14 flex-col items-center justify-center gap-0.5 text-[11px] font-semibold text-muted-fg transition-colors duration-150 data-[state=active]:text-primary-strong md:min-h-10 md:flex-row md:gap-2 md:rounded-full md:px-4 md:text-sm md:data-[state=active]:bg-fg md:data-[state=active]:text-white md:hover:bg-muted md:data-[state=active]:hover:bg-fg"
          >
            <Icon className="size-5 md:size-4" aria-hidden />
            <span className="md:hidden">{short || label}</span>
            <span className="hidden md:inline">{label}</span>
          </Tabs.Trigger>
        ))}
      </Tabs.List>

      {stateError && (
        <div role="alert" className="mx-auto mt-4 flex max-w-6xl items-start justify-between gap-3 px-4 md:px-6">
          <p className="flex-1 rounded-xl bg-danger-soft px-4 py-3 text-sm text-[#991b1b]">{stateError}</p>
          <Button variant="outline" size="sm" onClick={dismissError}>Dismiss</Button>
        </div>
      )}

      <main className="mx-auto max-w-6xl px-4 pt-5 md:px-6">
        {TABS.map(({ id, View }) => (
          <Tabs.Content key={id} value={id} className="focus-visible:outline-none">
            <View go={go} openSettings={() => setSettingsOpen(true)} />
          </Tabs.Content>
        ))}
      </main>

      <Settings open={settingsOpen} onOpenChange={setSettingsOpen} />
    </Tabs.Root>
  );
}

function greeting() {
  const h = Number(new Intl.DateTimeFormat("en-US", { timeZone: "America/New_York", hour: "numeric", hourCycle: "h23" }).format(new Date()));
  return h < 12 ? "Good morning" : h < 17 ? "Good afternoon" : "Good evening";
}

export type ViewProps = { go: (tab: string) => void; openSettings: () => void };
