"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { usePathname, useRouter } from "next/navigation";
import type { CSSProperties } from "react";
import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  BarChart3, Bell, BookOpen, CalendarDays, CircleHelp,
  Command, CreditCard, FileStack, Flag, Gauge, GraduationCap, Home, Layers3, LayoutDashboard,
  LibraryBig, Menu, Moon, NotebookPen, PanelLeftClose, PanelLeftOpen, Search, Settings, ShieldCheck,
  Sparkles, Sun, UploadCloud, Users, X
} from "lucide-react";
import { useStepwise } from "@/lib/store";
import { localDateKey } from "@/lib/algorithms";
import { Avatar, Logo, Modal } from "./ui";
const SurfaceLoading = () => (
  <div className="route-loading" role="status">
    <span className="loading-mark" aria-hidden="true"><i/><i/><i/></span>
    <div>
      <b>Preparing your workspace</b>
      <p>Connecting today&apos;s plan, performance signals, and review queue.</p>
    </div>
  </div>
);
const LearnerPage = dynamic(() => import("./Learner").then((module) => module.LearnerPage), { loading: SurfaceLoading });
const AdminPage = dynamic(() => import("./Admin").then((module) => module.AdminPage), { loading: SurfaceLoading });
const InfluencerPage = dynamic(() => import("./Influencer").then((module) => module.InfluencerPage), { loading: SurfaceLoading });

const learnerNav = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/qbank", label: "QBank", icon: GraduationCap },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/study-plan", label: "Study plan", icon: CalendarDays },
  { href: "/app/flashcards", label: "Flashcards", icon: Layers3 },
  { href: "/app/library", label: "Medical library", icon: LibraryBig },
  { href: "/app/notebook", label: "Notebook", icon: NotebookPen },
  { href: "/app/community", label: "Study circle", icon: Users },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/importer", label: "Importer", icon: UploadCloud },
  { href: "/admin/questions", label: "Explorer & Editor", icon: FileStack },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/content", label: "Content map", icon: Gauge },
  { href: "/admin/affiliates", label: "Affiliates & Rev-Share", icon: Sparkles },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

const influencerNav = [
  { href: "/influencer", label: "Overview", icon: LayoutDashboard },
  { href: "/influencer/links", label: "Links & Codes", icon: Sparkles },
  { href: "/influencer/conversions", label: "Conversions & Ledger", icon: BarChart3 },
  { href: "/influencer/payouts", label: "Payouts", icon: CreditCard },
  { href: "/influencer/media", label: "Media Kit", icon: FileStack },
];

function isActive(pathname: string, href: string) {
  if (href === "/app" || href === "/admin") return pathname === href;
  return pathname.startsWith(href);
}

function StudyPulse() {
  const { state } = useStepwise();
  const metrics = useMemo(() => {
    const todayKey = localDateKey(new Date());
    const targetQuestionIds = new Set(
      state.questions
        .filter((question) => question.step === state.planSettings.targetStep)
        .map((question) => question.id)
    );
    const answered = state.attempts.filter(
      (attempt) => targetQuestionIds.has(attempt.questionId) && localDateKey(new Date(attempt.createdAt)) === todayKey
    ).length;
    const dueCards = state.flashcards.filter((card) => new Date(card.dueAt) <= new Date()).length;
    const goal = Math.max(state.settings.dailyGoal, 1);
    return {
      answered,
      dueCards,
      goal,
      progress: Math.min(100, Math.round((answered / goal) * 100))
    };
  }, [
    state.attempts,
    state.flashcards,
    state.planSettings.targetStep,
    state.questions,
    state.settings.dailyGoal
  ]);
  const detail = metrics.answered
    ? `${metrics.answered} of ${metrics.goal} questions`
    : metrics.dueCards
      ? `${metrics.dueCards} recall card${metrics.dueCards === 1 ? "" : "s"} ready`
      : "Ready for a focused block";
  const pulseStyle = { "--pulse-angle": `${metrics.progress * 3.6}deg` } as CSSProperties;

  return (
    <Link
      className="study-pulse"
      href={metrics.dueCards && !metrics.answered ? "/app/flashcards" : "/app/qbank"}
      aria-label={`Daily momentum: ${detail}`}
    >
      <span className="study-pulse-ring" style={pulseStyle} aria-hidden="true"><Gauge /></span>
      <span><small>Daily momentum</small><b>{detail}</b></span>
      <i aria-hidden="true" />
    </Link>
  );
}

function CommandPalette({ open, onClose, admin = false }: { open: boolean; onClose: () => void; admin?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const listId = useId();
  const optionRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const nav = admin ? adminNav : learnerNav;
  const quick = admin
    ? [{ href: "/admin/questions", label: "Create a new question", icon: FileStack }, { href: "/admin/reports", label: "Review content reports", icon: Flag }]
    : [{ href: "/app/qbank", label: "Start an adaptive block", icon: Sparkles }, { href: "/app/library", label: "Search the medical library", icon: LibraryBig }, { href: "/app/flashcards", label: "Review due flashcards", icon: Layers3 }];
  const results = [...quick, ...nav].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && results[index]) {
        router.push(results[index].href);
        onClose();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onClose, open, results, router]);
  return <Modal open={open} onClose={onClose} title="Command center" description="Search destinations and actions. Use arrow keys to move through results.">
    <div className="command-search"><Search size={18} aria-hidden="true"/><input
      data-modal-autofocus
      value={query}
      onChange={event=>{setQuery(event.target.value);setActiveIndex(0);}}
      onKeyDown={event=>{
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        const nextIndex = event.key === "ArrowDown" ? 0 : Math.max(results.length - 1, 0);
        setActiveIndex(nextIndex);
        optionRefs.current[nextIndex]?.focus();
      }}
      placeholder="Search pages and actions…"
      aria-label="Search pages and actions"
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listId}
    /><kbd aria-hidden="true">esc</kbd></div>
    <div className="command-results" id={listId} role="listbox" aria-label="Command results"><small>GO TO OR RUN</small>{results.map((item,index)=>{const Icon=item.icon; return <button
      ref={element=>{optionRefs.current[index]=element;}}
      key={`${item.href}-${item.label}`}
      role="option"
      aria-selected={activeIndex === index}
      onFocus={()=>setActiveIndex(index)}
      onKeyDown={event=>{
        if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
        event.preventDefault();
        const nextIndex = event.key === "ArrowDown" ? Math.min(index + 1, results.length - 1) : Math.max(index - 1, 0);
        setActiveIndex(nextIndex);
        optionRefs.current[nextIndex]?.focus();
      }}
      onClick={()=>{router.push(item.href);onClose();}}
    ><span><Icon size={17} aria-hidden="true"/>{item.label}</span><kbd aria-hidden="true">{index+1}</kbd></button>})}{!results.length && <p role="status">No matching actions.</p>}</div>
  </Modal>;
}

function NotificationPopover({ open, close, id }: { open: boolean; close: () => void; id: string }) {
  const { state, dispatch } = useStepwise();
  const closeRef = useRef(close);
  useEffect(() => {
    closeRef.current = close;
  }, [close]);
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeRef.current();
    };
    document.addEventListener("keydown", listener);
    return () => document.removeEventListener("keydown", listener);
  }, [open]);
  if (!open) return null;
  return <div className="popover notification-popover" id={id} role="region" aria-label="Notifications"><header><div><b>Notifications</b><span aria-live="polite">{state.notifications.filter(item=>!item.read).length} unread</span></div><button type="button" onClick={()=>dispatch({type:"MARK_NOTIFICATIONS_READ"})}>Mark all read</button></header><div>{state.notifications.map(item=><article key={item.id} className={!item.read?"unread":""}><i aria-hidden="true"/><div><b>{item.title}</b><p>{item.body}</p><span>{item.time}</span></div></article>)}</div><footer><button type="button" onClick={close}>Close</button></footer></div>;
}

function LearnerSidebar({ collapsed, mobileOpen, onClose }: { collapsed: boolean; mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { state } = useStepwise();
  const due = state.flashcards.filter(card => new Date(card.dueAt) <= new Date()).length;
  return <aside id="learner-sidebar" aria-label="Learner workspace" className={`app-sidebar ${collapsed?"collapsed":""} ${mobileOpen?"mobile-open":""}`}>
    <div className="sidebar-logo"><Logo compact={collapsed}/><button className="sidebar-mobile-close" onClick={onClose} aria-label="Close menu"><X/></button></div>
    <Link href="/app/settings" className="exam-switch" title={`${state.planSettings.targetStep} settings`}><span className="exam-badge">{state.planSettings.targetStep === "Step 1" ? "S1" : "S2"}</span>{!collapsed&&<div><small>Preparing for</small><b>{state.planSettings.targetStep}</b></div>}{!collapsed&&<Settings size={15}/>}</Link>
    <nav aria-label="Learner sections">{learnerNav.map(item=>{const Icon=item.icon; const active=isActive(pathname,item.href); return <Link key={item.href} href={item.href} title={item.label} className={active?"active":""} aria-current={active?"page":undefined} onClick={onClose}><Icon/><span>{item.label}</span>{item.label==="Flashcards"&&due>0&&<b aria-label={`${due} cards due`}>{due}</b>}</Link>})}</nav>
    <div className="sidebar-bottom">
      <Link href="/app/settings" title="Settings" className={isActive(pathname,"/app/settings")?"active":""}><Settings/><span>Settings</span></Link>
      <Link href="/help" title="Help center"><CircleHelp/><span>Help center</span></Link>
      <div className="sidebar-upgrade" title="Your study signal">
        <Sparkles/>
        {!collapsed&&<><b>Your study signal</b><p>Weaknesses, pacing, and calibration</p><Link href="/app/analytics">View analytics</Link></>}
      </div>
    </div>
  </aside>;
}

function AdminSidebar({ collapsed, mobileOpen, onClose }: { collapsed: boolean; mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { state } = useStepwise();
  const openReports = state.reports.filter((report) => report.status === "Open").length;
  return <aside id="admin-sidebar" aria-label="Administration workspace" className={`admin-sidebar ${collapsed?"collapsed":""} ${mobileOpen?"mobile-open":""}`}>
    <div className="sidebar-logo"><Logo compact={collapsed}/><button className="sidebar-mobile-close" onClick={onClose} aria-label="Close menu"><X/></button></div>
    <div className="admin-workspace" title="Stepwise Admin Workspace"><span><ShieldCheck/></span>{!collapsed&&<div><small>Workspace</small><b>Stepwise Admin</b></div>}</div>
    <nav aria-label="Administration sections">
      {!collapsed&&<small>OPERATIONS</small>}
      {adminNav.map(item=>{const Icon=item.icon; const active=isActive(pathname,item.href); return <Link key={item.href} href={item.href} title={item.label} className={active?"active":""} aria-current={active?"page":undefined} onClick={onClose}><Icon/><span>{item.label}</span>{item.label==="Reports"&&openReports>0&&<b aria-label={`${openReports} open reports`}>{openReports}</b>}</Link>})}
    </nav>
    <div className="admin-sidebar-bottom">
      <Link href="/admin/settings" className="admin-user" title="Dr. Maya Patel - Settings"><Avatar name="Maya Patel"/>{!collapsed&&<div><b>Dr. Maya Patel</b><small>Content administrator</small></div>}</Link>
      <Link href="/app" title="Learner workspace"><BookOpen/>{!collapsed&&<span>Learner workspace</span>}</Link>
    </div>
  </aside>;
}

export function LearnerShell() {
  const pathname = usePathname();
  const { state, dispatch, persistenceStatus } = useStepwise();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const notificationId = useId();
  const notificationButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setCommandOpen(true)}};
    window.addEventListener("keydown",listener); return()=>window.removeEventListener("keydown",listener);
  },[]);
  const section = pathname.split("/")[2] || "overview";
  const titles: Record<string,string> = { overview:"Overview", qbank:"QBank", session:"Question session", analytics:"Analytics", "study-plan":"Study plan", flashcards:"Flashcards", library:"Medical library", notebook:"Notebook", community:"Study circle", settings:"Settings" };
  const unread = state.notifications.filter(item=>!item.read).length;
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  if (section === "session") return <LearnerPage section="session"/>;
  return <div className={`app-shell ${collapsed?"sidebar-collapsed":""}`}>
    <LearnerSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={()=>setMobileOpen(false)}/>
    <div className="app-main">
      <header className="app-topbar">
        <div className="topbar-left">
          <button className="mobile-sidebar-button" onClick={()=>setMobileOpen(true)} aria-label="Open learner navigation" aria-expanded={mobileOpen} aria-controls="learner-sidebar"><Menu/></button>
          <button className="collapse-button" onClick={()=>setCollapsed(!collapsed)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={collapsed ? "Expand learner sidebar" : "Collapse learner sidebar"} aria-expanded={!collapsed} aria-controls="learner-sidebar"><ToggleIcon /></button>
          <span>{titles[section] || "Stepwise"}</span>
        </div>
        <div className="topbar-actions">
          <StudyPulse/>
          <button className="command-trigger" onClick={()=>setCommandOpen(true)} aria-haspopup="dialog"><Search/><span>Search anything</span><kbd><Command/>K</kbd></button>
          <button className="icon-btn theme-button" onClick={()=>dispatch({type:"SET_SETTINGS",settings:{theme:state.settings.theme==="dark"?"light":"dark"}})} aria-label="Toggle color theme">{state.settings.theme==="dark"?<Sun/>:<Moon/>}</button>
          <div className="popover-wrap">
            <button ref={notificationButtonRef} className="icon-btn" onClick={()=>setNotificationsOpen(!notificationsOpen)} aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={notificationsOpen} aria-controls={notificationId}><Bell/>{unread>0&&<i aria-hidden="true">{unread}</i>}</button>
            <NotificationPopover open={notificationsOpen} id={notificationId} close={()=>{setNotificationsOpen(false);window.requestAnimationFrame(()=>notificationButtonRef.current?.focus());}}/>
          </div>
          <Link className="profile-button" href="/app/settings"><Avatar name={state.learnerProfile.name}/><span><b>{state.learnerProfile.name}</b><small>Profile & settings</small></span></Link>
        </div>
      </header>
      <main className="app-content" id="main-content" tabIndex={-1}>
        <div className="workspace-trustline"><span><ShieldCheck/> {state.planSettings.targetStep} study workspace</span><span className={persistenceStatus}><i/>{persistenceStatus === "ready" ? "Saved in this browser" : persistenceStatus === "loading" ? "Restoring workspace" : "Local save unavailable"}</span></div>
        <LearnerPage section={section}/>
      </main>
    </div>
    <nav className="mobile-bottom-nav" aria-label="Primary learner navigation">
      {learnerNav.filter((item) => ["Overview", "QBank", "Analytics", "Flashcards", "Medical library"].includes(item.label)).map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined}><Icon/><span>{item.label === "Medical library" ? "Library" : item.label}</span>{item.label === "Flashcards" && state.flashcards.some((card) => new Date(card.dueAt) <= new Date()) && <i aria-label="Cards due"/>}</Link>;
      })}
    </nav>
    {mobileOpen&&<button className="mobile-overlay" onClick={()=>setMobileOpen(false)} aria-label="Close menu"/>}
    <CommandPalette open={commandOpen} onClose={()=>setCommandOpen(false)}/>
  </div>;
}

export function AdminShell() {
  const pathname=usePathname();
  const { state, persistenceStatus } = useStepwise();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen,setMobileOpen]=useState(false);
  const [commandOpen,setCommandOpen]=useState(false);
  const section=pathname.split("/")[2]||"overview";
  const title=useMemo(()=>adminNav.find(item=>item.href===pathname)?.label||"Admin",[pathname]);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  return <div className={`admin-shell ${collapsed?"sidebar-collapsed":""}`}>
    <AdminSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={()=>setMobileOpen(false)}/>
    <div className="admin-main">
      <header className="admin-topbar">
        <div>
          <button className="mobile-sidebar-button" onClick={()=>setMobileOpen(true)} aria-label="Open administration navigation" aria-expanded={mobileOpen} aria-controls="admin-sidebar"><Menu/></button>
          <button className="collapse-button" onClick={()=>setCollapsed(!collapsed)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={collapsed ? "Expand administration sidebar" : "Collapse administration sidebar"} aria-expanded={!collapsed} aria-controls="admin-sidebar"><ToggleIcon /></button>
          <span>{title}</span>
        </div>
        <div>
          <button className="command-trigger admin-command" onClick={()=>setCommandOpen(true)} aria-haspopup="dialog"><Search/><span>Search admin</span><kbd><Command/>K</kbd></button>
          <span className="environment-badge"><ShieldCheck/> Local demo</span>
          <Link className="icon-btn" href="/admin/reports" aria-label="Open reports"><Bell/>{state.reports.some((report)=>report.status==="Open")&&<i>{state.reports.filter((report)=>report.status==="Open").length}</i>}</Link>
          <Avatar name="Maya Patel"/>
        </div>
      </header>
      <main className="admin-content" id="main-content" tabIndex={-1}>
        <div className="workspace-trustline admin"><span><ShieldCheck/> Administrative sandbox · no live providers</span><span className={persistenceStatus}><i/>{persistenceStatus === "ready" ? "Local state saved" : persistenceStatus === "loading" ? "Restoring state" : "Local save unavailable"}</span></div>
        <AdminPage section={section}/>
      </main>
    </div>
    {mobileOpen&&<button className="mobile-overlay" onClick={()=>setMobileOpen(false)} aria-label="Close menu"/>}
    <CommandPalette open={commandOpen} onClose={()=>setCommandOpen(false)} admin/>
  </div>;
}

function InfluencerSidebar({ collapsed, mobileOpen, onClose, onLogout }: { collapsed: boolean; mobileOpen: boolean; onClose: () => void; onLogout: () => void }) {
  const pathname = usePathname();
  return <aside id="partner-sidebar" aria-label="Partner workspace" className={`admin-sidebar influencer-sidebar ${collapsed ? "collapsed" : ""} ${mobileOpen ? "mobile-open" : ""}`}>
    <header className="sidebar-head">
      <div className="brand-wrap"><Logo compact={collapsed}/>{!collapsed && <span className="badge badge-brand">Partner Hub</span>}</div>
      <button className="icon-btn sidebar-mobile-close" onClick={onClose} aria-label="Close menu"><X/></button>
    </header>
    <nav className="sidebar-nav" aria-label="Partner sections">
      <small>REV-SHARE PORTAL</small>
      {influencerNav.map((item) => {
        const Icon = item.icon;
        const active = isActive(pathname, item.href);
        return <Link key={item.href} href={item.href} className={active ? "active" : ""} aria-current={active ? "page" : undefined} onClick={onClose}><Icon/><span>{item.label}</span></Link>;
      })}
    </nav>
    <footer className="sidebar-foot">
      <button className="sidebar-btn danger-hover" onClick={onLogout}>
        <span>Sign Out</span>
      </button>
    </footer>
  </aside>;
}

export function InfluencerShell() {
  const { state, dispatch } = useStepwise();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const slug = pathname.split("/").filter(Boolean);
  const title = useMemo(() => influencerNav.find(item => item.href === pathname)?.label || "Influencer Portal", [pathname]);
  const ToggleIcon = collapsed ? PanelLeftOpen : PanelLeftClose;

  const currentInfluencer = state.influencers.find((i) => i.id === state.currentInfluencerId);

  const handleLogout = () => {
    dispatch({ type: "LOGOUT_INFLUENCER" });
  };

  if (!currentInfluencer) {
    return <div className="partner-full-page"><InfluencerPage slug={slug}/></div>;
  }

  return <div className={`admin-shell influencer-shell ${collapsed ? "sidebar-collapsed" : ""}`}>
    <InfluencerSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} onLogout={handleLogout}/>
    <div className="admin-main">
      <header className="admin-topbar">
        <div>
          <button className="mobile-sidebar-button" onClick={() => setMobileOpen(true)} aria-label="Open partner navigation" aria-expanded={mobileOpen} aria-controls="partner-sidebar"><Menu/></button>
          <button className="collapse-button" onClick={() => setCollapsed(!collapsed)} title={collapsed ? "Expand sidebar" : "Collapse sidebar"} aria-label={collapsed ? "Expand partner sidebar" : "Collapse partner sidebar"} aria-expanded={!collapsed} aria-controls="partner-sidebar"><ToggleIcon /></button>
          <span>{title}</span>
        </div>
        <div>
          <button className="command-trigger admin-command" onClick={() => setCommandOpen(true)} aria-haspopup="dialog"><Search/><span>Search portal</span><kbd><Command/>K</kbd></button>
          <Avatar name={currentInfluencer.name}/>
        </div>
      </header>
      <main className="admin-content" id="main-content" tabIndex={-1}><div className="workspace-trustline admin"><span><ShieldCheck/> Partner portal demonstration</span><span><i/>Sample ledger · no live payouts</span></div><InfluencerPage slug={slug}/></main>
    </div>
    {mobileOpen && <button className="mobile-overlay" onClick={() => setMobileOpen(false)} aria-label="Close menu"/>}
    <CommandPalette open={commandOpen} onClose={() => setCommandOpen(false)} admin/>
  </div>;
}
