"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import {
  BarChart3, Bell, BookOpen, CalendarDays, CircleHelp,
  Command, CreditCard, FileStack, Flag, Gauge, Home, Layers3, LayoutDashboard,
  LibraryBig, Menu, Moon, NotebookPen, PanelLeftClose, Search, Settings, ShieldCheck,
  Sparkles, Sun, Users, X
} from "lucide-react";
import { useStepwise } from "@/lib/store";
import { Avatar, Logo, Modal } from "./ui";
import { LearnerPage } from "./Learner";
import { AdminPage } from "./Admin";

const learnerNav = [
  { href: "/app", label: "Overview", icon: Home },
  { href: "/app/qbank", label: "QBank", icon: BookOpen },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/app/study-plan", label: "Study plan", icon: CalendarDays },
  { href: "/app/flashcards", label: "Flashcards", icon: Layers3 },
  { href: "/app/library", label: "Medical library", icon: LibraryBig },
  { href: "/app/notebook", label: "Notebook", icon: NotebookPen },
  { href: "/app/community", label: "Study circle", icon: Users },
];

const adminNav = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/questions", label: "Questions", icon: FileStack },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/content", label: "Content map", icon: Gauge },
  { href: "/admin/reports", label: "Reports", icon: Flag },
  { href: "/admin/billing", label: "Billing", icon: CreditCard },
  { href: "/admin/settings", label: "Settings", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/app" || href === "/admin") return pathname === href;
  return pathname.startsWith(href);
}

function CommandPalette({ open, onClose, admin = false }: { open: boolean; onClose: () => void; admin?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const nav = admin ? adminNav : learnerNav;
  const quick = admin
    ? [{ href: "/admin/questions", label: "Create a new question", icon: FileStack }, { href: "/admin/reports", label: "Review content reports", icon: Flag }]
    : [{ href: "/app/qbank", label: "Start an adaptive block", icon: Sparkles }, { href: "/app/library", label: "Search the medical library", icon: LibraryBig }, { href: "/app/flashcards", label: "Review due flashcards", icon: Layers3 }];
  const results = [...quick, ...nav].filter((item) => item.label.toLowerCase().includes(query.toLowerCase()));
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
      const index = Number(event.key) - 1;
      if (Number.isInteger(index) && results[index]) {
        router.push(results[index].href);
        onClose();
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [onClose, open, results, router]);
  return <Modal open={open} onClose={onClose} title="Command center"><div className="command-search"><Search size={18}/><input autoFocus value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search pages and actions…"/><kbd>esc</kbd></div><div className="command-results"><small>GO TO OR RUN</small>{results.map((item,index)=>{const Icon=item.icon; return <button key={`${item.href}-${item.label}`} onClick={()=>{router.push(item.href);onClose();}}><span><Icon size={17}/>{item.label}</span><kbd>{index+1}</kbd></button>})}{!results.length && <p>No matching actions.</p>}</div></Modal>;
}

function NotificationPopover({ open, close }: { open: boolean; close: () => void }) {
  const { state, dispatch } = useStepwise();
  if (!open) return null;
  return <div className="popover notification-popover"><header><div><b>Notifications</b><span>{state.notifications.filter(item=>!item.read).length} unread</span></div><button onClick={()=>dispatch({type:"MARK_NOTIFICATIONS_READ"})}>Mark all read</button></header><div>{state.notifications.map(item=><article key={item.id} className={!item.read?"unread":""}><i/><div><b>{item.title}</b><p>{item.body}</p><span>{item.time}</span></div></article>)}</div><footer><button onClick={close}>Close</button></footer></div>;
}

function LearnerSidebar({ collapsed, mobileOpen, onClose }: { collapsed: boolean; mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  const { state } = useStepwise();
  const due = state.flashcards.filter(card => new Date(card.dueAt) <= new Date()).length;
  return <aside className={`app-sidebar ${collapsed?"collapsed":""} ${mobileOpen?"mobile-open":""}`}>
    <div className="sidebar-logo"><Logo compact={collapsed}/><button className="sidebar-mobile-close" onClick={onClose}><X/></button></div>
    <Link href="/app/settings" className="exam-switch"><span className="exam-badge">S2</span>{!collapsed&&<div><small>Preparing for</small><b>Step 2 CK</b></div>}{!collapsed&&<Settings size={15}/>}</Link>
    <nav>{learnerNav.map(item=>{const Icon=item.icon; return <Link key={item.href} href={item.href} className={isActive(pathname,item.href)?"active":""} onClick={onClose}><Icon/><span>{item.label}</span>{item.label==="Flashcards"&&due>0&&<b>{due}</b>}</Link>})}</nav>
    <div className="sidebar-bottom"><Link href="/app/settings" className={isActive(pathname,"/app/settings")?"active":""}><Settings/><span>Settings</span></Link><Link href="/help"><CircleHelp/><span>Help center</span></Link><div className="sidebar-upgrade"><Sparkles/>{!collapsed&&<><b>Your study signal</b><p>Weaknesses, pacing, and calibration</p><Link href="/app/analytics">View analytics</Link></>}</div></div>
  </aside>;
}

function AdminSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname();
  return <aside className={`admin-sidebar ${mobileOpen?"mobile-open":""}`}><div className="sidebar-logo"><Logo/><button className="sidebar-mobile-close" onClick={onClose}><X/></button></div><div className="admin-workspace"><span><ShieldCheck/></span><div><small>Workspace</small><b>Stepwise Admin</b></div></div><nav><small>OPERATIONS</small>{adminNav.map(item=>{const Icon=item.icon; return <Link key={item.href} href={item.href} className={isActive(pathname,item.href)?"active":""} onClick={onClose}><Icon/><span>{item.label}</span>{item.label==="Reports"&&<b>2</b>}</Link>})}</nav><div className="admin-sidebar-bottom"><Link href="/admin/settings" className="admin-user"><Avatar name="Maya Patel"/><div><b>Dr. Maya Patel</b><small>Content administrator</small></div></Link><Link href="/app"><BookOpen/> Learner workspace</Link></div></aside>;
}

export function LearnerShell() {
  const pathname = usePathname();
  const { state, dispatch } = useStepwise();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [commandOpen, setCommandOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{if((event.metaKey||event.ctrlKey)&&event.key.toLowerCase()==="k"){event.preventDefault();setCommandOpen(true)}};
    window.addEventListener("keydown",listener); return()=>window.removeEventListener("keydown",listener);
  },[]);
  const section = pathname.split("/")[2] || "overview";
  const titles: Record<string,string> = { overview:"Overview", qbank:"QBank", session:"Question session", analytics:"Analytics", "study-plan":"Study plan", flashcards:"Flashcards", library:"Medical library", notebook:"Notebook", community:"Study circle", settings:"Settings" };
  const unread = state.notifications.filter(item=>!item.read).length;
  if (section === "session") return <LearnerPage section="session"/>;
  return <div className={`app-shell ${collapsed?"sidebar-collapsed":""}`}>
    <LearnerSidebar collapsed={collapsed} mobileOpen={mobileOpen} onClose={()=>setMobileOpen(false)}/>
    <div className="app-main">
      <header className="app-topbar"><div className="topbar-left"><button className="mobile-sidebar-button" onClick={()=>setMobileOpen(true)}><Menu/></button><button className="collapse-button" onClick={()=>setCollapsed(!collapsed)} aria-label="Toggle sidebar"><PanelLeftClose/></button><span>{titles[section] || "Stepwise"}</span></div><div className="topbar-actions"><button className="command-trigger" onClick={()=>setCommandOpen(true)}><Search/><span>Search anything</span><kbd><Command/>K</kbd></button><button className="icon-btn theme-button" onClick={()=>dispatch({type:"SET_SETTINGS",settings:{theme:state.settings.theme==="dark"?"light":"dark"}})} aria-label="Toggle color theme">{state.settings.theme==="dark"?<Sun/>:<Moon/>}</button><div className="popover-wrap"><button className="icon-btn" onClick={()=>setNotificationsOpen(!notificationsOpen)} aria-label="Notifications"><Bell/>{unread>0&&<i>{unread}</i>}</button><NotificationPopover open={notificationsOpen} close={()=>setNotificationsOpen(false)}/></div><Link className="profile-button" href="/app/settings"><Avatar name="Alex Kim"/><span><b>Alex Kim</b><small>Profile & settings</small></span></Link></div></header>
      <div className="app-content"><LearnerPage section={section}/></div>
    </div>
    <nav className="mobile-bottom-nav" aria-label="Primary learner navigation">
      {learnerNav.filter((item) => ["Overview", "QBank", "Analytics", "Flashcards", "Medical library"].includes(item.label)).map((item) => {
        const Icon = item.icon;
        return <Link key={item.href} href={item.href} className={isActive(pathname, item.href) ? "active" : ""}><Icon/><span>{item.label === "Medical library" ? "Library" : item.label}</span>{item.label === "Flashcards" && state.flashcards.some((card) => new Date(card.dueAt) <= new Date()) && <i/>}</Link>;
      })}
    </nav>
    {mobileOpen&&<button className="mobile-overlay" onClick={()=>setMobileOpen(false)} aria-label="Close menu"/>}
    <CommandPalette open={commandOpen} onClose={()=>setCommandOpen(false)}/>
  </div>;
}

export function AdminShell() {
  const pathname=usePathname();
  const [mobileOpen,setMobileOpen]=useState(false);
  const [commandOpen,setCommandOpen]=useState(false);
  const section=pathname.split("/")[2]||"overview";
  const title=useMemo(()=>adminNav.find(item=>item.href===pathname)?.label||"Admin",[pathname]);
  return <div className="admin-shell"><AdminSidebar mobileOpen={mobileOpen} onClose={()=>setMobileOpen(false)}/><div className="admin-main"><header className="admin-topbar"><div><button className="mobile-sidebar-button" onClick={()=>setMobileOpen(true)}><Menu/></button><span>{title}</span></div><div><button className="command-trigger admin-command" onClick={()=>setCommandOpen(true)}><Search/><span>Search admin</span><kbd><Command/>K</kbd></button><Link className="icon-btn" href="/admin/reports" aria-label="Open reports"><Bell/><i>2</i></Link><Avatar name="Maya Patel"/></div></header><div className="admin-content"><AdminPage section={section}/></div></div>{mobileOpen&&<button className="mobile-overlay" onClick={()=>setMobileOpen(false)} aria-label="Close menu"/>}<CommandPalette open={commandOpen} onClose={()=>setCommandOpen(false)} admin/></div>;
}
