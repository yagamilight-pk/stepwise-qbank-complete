"use client";

import Link from "next/link";
import { Check, ChevronRight, X } from "lucide-react";
import { useEffect } from "react";

export function Logo({ compact = false, inverse = false }: { compact?: boolean; inverse?: boolean }) {
  return (
    <Link href="/" className={`logo ${inverse ? "logo-inverse" : ""}`} aria-label="Stepwise home">
      <span className="logo-mark" aria-hidden="true"><span>S</span><i /></span>
      {!compact && <span className="logo-type">Stepwise</span>}
    </Link>
  );
}

export function PageHeader({ eyebrow, title, description, actions }: { eyebrow?: string; title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <header className="page-header">
      <div>
        {eyebrow && <div className="eyebrow">{eyebrow}</div>}
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {actions && <div className="page-actions">{actions}</div>}
    </header>
  );
}

export function Badge({ children, tone = "neutral", dot = false }: { children: React.ReactNode; tone?: "neutral" | "success" | "warning" | "danger" | "brand" | "info"; dot?: boolean }) {
  return <span className={`badge badge-${tone}`}>{dot && <i aria-hidden="true" />}{children}</span>;
}

export function Progress({ value, label, showValue = false, size = "md" }: { value: number; label?: string; showValue?: boolean; size?: "sm" | "md" | "lg" }) {
  return (
    <div className="progress-wrap">
      {(label || showValue) && <div className="progress-label"><span>{label}</span>{showValue && <strong>{Math.round(value)}%</strong>}</div>}
      <div className={`progress progress-${size}`} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(value)}>
        <span style={{ width: `${Math.max(0, Math.min(100, value))}%` }} />
      </div>
    </div>
  );
}

export function Donut({ value, size = 112, label, detail }: { value: number; size?: number; label?: string; detail?: string }) {
  const radius = 44;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (Math.max(0, Math.min(100, value)) / 100) * circumference;
  return (
    <div className="donut" style={{ width: size, height: size }}>
      <svg viewBox="0 0 100 100" aria-hidden="true">
        <circle className="donut-track" cx="50" cy="50" r={radius} />
        <circle className="donut-value" cx="50" cy="50" r={radius} strokeDasharray={circumference} strokeDashoffset={offset} />
      </svg>
      <div className="donut-label"><strong>{Math.round(value)}{label || "%"}</strong>{detail && <span>{detail}</span>}</div>
    </div>
  );
}

export function Sparkline({ values, height = 54 }: { values: number[]; height?: number }) {
  const width = 240;
  if (!values.length) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const points = values.map((value, index) => `${(index / Math.max(values.length - 1, 1)) * width},${height - ((value - min) / range) * (height - 8) - 4}`).join(" ");
  return (
    <svg className="sparkline" viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
      <defs><linearGradient id="sparkFill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="currentColor" stopOpacity=".24"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
      <polygon points={`0,${height} ${points} ${width},${height}`} fill="url(#sparkFill)" />
      <polyline points={points} fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Modal({ open, onClose, title, description, children, wide = false }: { open: boolean; onClose: () => void; title: string; description?: string; children: React.ReactNode; wide?: boolean }) {
  useEffect(() => {
    if (!open) return;
    const listener = (event: KeyboardEvent) => { if (event.key === "Escape") onClose(); };
    document.addEventListener("keydown", listener);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", listener); document.body.style.overflow = ""; };
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section className={`modal ${wide ? "modal-wide" : ""}`} role="dialog" aria-modal="true" aria-labelledby="modal-title">
        <header className="modal-head"><div><h2 id="modal-title">{title}</h2>{description && <p>{description}</p>}</div><button className="icon-btn" onClick={onClose} aria-label="Close"><X size={18}/></button></header>
        <div className="modal-body">{children}</div>
      </section>
    </div>
  );
}

export function Toast({ message, visible }: { message: string; visible: boolean }) {
  return <div className={`toast ${visible ? "toast-show" : ""}`} role="status"><span><Check size={16}/></span>{message}</div>;
}

export function EmptyState({ icon, title, description, action }: { icon?: React.ReactNode; title: string; description: string; action?: React.ReactNode }) {
  return <div className="empty-state">{icon && <div className="empty-icon">{icon}</div>}<h3>{title}</h3><p>{description}</p>{action}</div>;
}

export function StatCard({ label, value, detail, icon, trend, children }: { label: string; value: string | number; detail?: string; icon?: React.ReactNode; trend?: string; children?: React.ReactNode }) {
  return (
    <article className="stat-card">
      <div className="stat-card-top"><span>{label}</span>{icon && <i>{icon}</i>}</div>
      <div className="stat-value">{value}</div>
      <div className="stat-detail">{trend && <b>{trend}</b>}{detail}</div>
      {children}
    </article>
  );
}

export function Field({ label, hint, children, className = "" }: { label: string; hint?: string; children: React.ReactNode; className?: string }) {
  return <label className={`field ${className}`}><span className="field-label">{label}{hint && <small>{hint}</small>}</span>{children}</label>;
}

export function Toggle({ checked, onChange, label, detail }: { checked: boolean; onChange: (checked: boolean) => void; label: string; detail?: string }) {
  return (
    <label className="toggle-row">
      <span><strong>{label}</strong>{detail && <small>{detail}</small>}</span>
      <input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} />
      <i aria-hidden="true"><b /></i>
    </label>
  );
}

export function Breadcrumbs({ items }: { items: { label: string; href?: string }[] }) {
  return <nav className="breadcrumbs" aria-label="Breadcrumb">{items.map((item, index) => <span key={`${item.label}-${index}`}>{item.href ? <Link href={item.href}>{item.label}</Link> : item.label}{index < items.length - 1 && <ChevronRight size={13}/>}</span>)}</nav>;
}

export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name.split(" ").map((part) => part[0]).join("").slice(0, 2).toUpperCase();
  return <span className={`avatar avatar-${size}`} aria-label={name}>{initials}</span>;
}

export const formatDate = (date: string, options?: Intl.DateTimeFormatOptions) => new Date(date).toLocaleDateString("en-US", options || { month: "short", day: "numeric", year: "numeric" });
export const formatSeconds = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
export const uid = (prefix: string) => `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
