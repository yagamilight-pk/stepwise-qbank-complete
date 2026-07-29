"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleHelp, FileText, KeyRound, Mail, Search, ShieldCheck } from "lucide-react";
import { Logo, Toast } from "./ui";
import { completePasswordRecovery, requestPasswordRecovery } from "@/app/actions/auth";
import { SupportContactForm } from "./SupportContactForm";

const helpTopics = [
  { title:"Start a question block", body:"Open QBank, choose Step 1 or Step 2 CK, select a mode and filters, then start the block.", icon:BookOpen },
  { title:"Reset or export data", body:"Open Settings → Privacy & data to download the synchronized learner workspace or reset the account state.", icon:ShieldCheck },
  { title:"Use keyboard shortcuts", body:"Press Ctrl/Cmd + K to open command search. Question sessions also expose navigation and utility controls.", icon:KeyRound },
  { title:"Review flashcards", body:"Open Flashcards and choose Review due cards. Ratings update the learner’s synchronized spaced-repetition schedule.", icon:CheckCircle2 },
  { title:"Report a question", body:"Use Report issue during a session to route a specific medical-accuracy, ambiguity, typo, or guideline concern to review.", icon:FileText },
  { title:"Subscription access", body:"One-time 90-, 180-, and 360-day plans activate only after a verified payment event. Plans do not renew automatically.", icon:Mail }
];

export function HelpPage() {
  const [query,setQuery]=useState("");
  const topics=useMemo(()=>helpTopics.filter(topic=>`${topic.title} ${topic.body}`.toLowerCase().includes(query.toLowerCase())),[query]);
  return <main className="static-page help-page"><header className="static-nav"><Logo/><div><Link href="/app" className="btn btn-secondary">Learner workspace</Link><a href="mailto:support@stepwise.page" className="btn btn-brand">Email support</a></div></header><section className="help-hero" aria-labelledby="help-title"><CircleHelp aria-hidden="true"/><h1 id="help-title">How can we help?</h1><p>Search the Stepwise study workflows or open a tracked support request.</p><label><Search aria-hidden="true"/><input type="search" aria-label="Search help topics" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Stepwise help…" autoComplete="off"/></label><p role="status" aria-live="polite">{topics.length} {topics.length === 1 ? "topic" : "topics"} found</p></section><section className="help-grid" aria-label="Help topics">{topics.map(topic=>{const Icon=topic.icon;return <article key={topic.title}><span><Icon aria-hidden="true"/></span><h2>{topic.title}</h2><p>{topic.body}</p><button type="button" onClick={()=>setQuery(topic.title)}>Show only this topic <ArrowRight/></button></article>})}{!topics.length && <p>No help topics match “{query}”. Try a broader term or email support.</p>}</section><SupportContactForm/><footer className="help-footer"><div><Mail aria-hidden="true"/><span><b>Need direct assistance?</b><small>Contact our team at support@stepwise.page.</small></span></div><Link className="btn btn-secondary" href="/">Return home</Link></footer></main>;
}

export function ForgotPasswordPage() {
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  return <main className="recovery-page"><section><Logo/><div className="recovery-card"><span><KeyRound aria-hidden="true"/></span><h1>Reset your password</h1><p>Enter your account email and Appwrite will send a secure recovery link.</p><form onSubmit={async event=>{event.preventDefault();setLoading(true);setError("");const result=await requestPasswordRecovery(email);setLoading(false);if(result.success)setSent(true);else setError(result.error??"Unable to send a reset link.");}}><label className="field"><span className="field-label">Email address</span><input type="email" required value={email} onChange={e=>{setEmail(e.target.value);setSent(false);setError("");}} placeholder="you@example.com" autoComplete="email"/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button type="submit" className="btn btn-brand btn-block btn-lg" disabled={!email||loading}>{loading?"Sending securely…":"Send reset link"}</button></form><Link href="/login"><ArrowLeft/> Back to sign in</Link></div></section><Toast visible={sent} message="If an account exists, a recovery link has been sent."/></main>;
}

export function ResetPasswordPage({userId,secret}:{userId:string;secret:string}) {
  const [password,setPassword]=useState("");
  const [confirm,setConfirm]=useState("");
  const [loading,setLoading]=useState(false);
  const [complete,setComplete]=useState(false);
  const [error,setError]=useState("");
  const validLink=Boolean(userId&&secret);
  return <main className="recovery-page"><section><Logo/><div className="recovery-card"><span><KeyRound aria-hidden="true"/></span><h1>Choose a new password</h1><p>{validLink?"Use at least 8 characters for your new Stepwise password.":"This recovery link is incomplete or invalid."}</p>{validLink&&!complete&&<form onSubmit={async event=>{event.preventDefault();if(password!==confirm){setError("Passwords do not match.");return;}setLoading(true);setError("");const result=await completePasswordRecovery(userId,secret,password);setLoading(false);if(result.success)setComplete(true);else setError(result.error??"Unable to reset your password.");}}><label className="field"><span className="field-label">New password</span><input type="password" required minLength={8} value={password} onChange={event=>setPassword(event.target.value)} autoComplete="new-password"/></label><label className="field"><span className="field-label">Confirm password</span><input type="password" required minLength={8} value={confirm} onChange={event=>setConfirm(event.target.value)} autoComplete="new-password"/></label>{error&&<p className="form-error" role="alert">{error}</p>}<button type="submit" className="btn btn-brand btn-block btn-lg" disabled={loading}>{loading?"Updating securely…":"Update password"}</button></form>}{complete&&<p role="status">Your password has been updated. You can now sign in.</p>}<Link href="/login"><ArrowLeft/> {complete?"Continue to sign in":"Back to sign in"}</Link></div></section></main>;
}

export function NotFoundPage() {
  return <main className="recovery-page"><section><Logo/><div className="recovery-card"><span><Search aria-hidden="true"/></span><h1>Page not found</h1><p>The requested Stepwise route does not exist in this frontend repository.</p><Link className="btn btn-brand btn-block" href="/">Return home</Link><Link href="/app">Open learner workspace <ArrowRight/></Link></div></section></main>;
}
