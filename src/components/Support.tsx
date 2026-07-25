"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleHelp, FileText, KeyRound, Mail, Search, ShieldCheck } from "lucide-react";
import { Logo, Toast } from "./ui";

const legalCopy = {
  privacy: {
    title: "Privacy Policy",
    updated: "July 22, 2026",
    intro: "This frontend demonstration stores sample study data in your current browser. It is not yet connected to production identity, analytics, payment, or data-processing services.",
    sections: [
      ["Data stored in this demo", "Question attempts, notes, flashcards, study-plan settings, interface preferences, and demo administration changes are stored in localStorage in the current browser. Browser storage is not a substitute for a secured production data service."],
      ["No production accounts", "The included sign-in, study-circle, analytics, and subscription flows are interface simulations. They do not create a remote account, verify peers, process payment, or transmit credentials to Stepwise services."],
      ["Export and deletion", "Use Settings → Privacy & data to export the current local workspace as JSON or reset it to its original sample state. Clearing this site's browser storage also removes the local demo state."],
      ["Before production use", "A production release needs reviewed privacy terms, consent and retention controls, secured service integrations, and jurisdiction-specific legal and security review before collecting personal information."]
    ]
  },
  terms: {
    title: "Terms of Service",
    updated: "July 22, 2026",
    intro: "These sample terms describe the educational scope of this frontend demonstration. They are not a substitute for reviewed production terms.",
    sections: [
      ["Educational & Non-Clinical Disclaimer", "Stepwise is designed exclusively as an examination preparation and learning interface tool for medical students and health professionals. It is not intended for clinical diagnosis, patient management decisions, or direct healthcare delivery."],
      ["Independent Examination Notice", "Stepwise is an independent educational product. Stepwise is not affiliated with, sponsored by, or endorsed by the United States Medical Licensing Examination (USMLE), the National Board of Medical Examiners (NBME), or the Federation of State Medical Boards (FSMB)."],
      ["Demonstration content", "The repository includes original sample questions and simulated learner data for interface evaluation. Do not add or distribute third-party question-bank content without authorization."],
      ["Production review required", "Medical content, identity, billing, accessibility, security, and commercial terms require appropriate professional review before a public production release."]
    ]
  },
  cookies: {
    title: "Cookie & Local Storage Policy",
    updated: "July 22, 2026",
    intro: "This demonstration uses browser storage to preserve an interactive sample workspace.",
    sections: [
      ["Local workspace storage", "The interface uses localStorage to save session state, theme preferences, bookmarks, notes, and flashcard progress in the current browser."],
      ["Current demonstration boundary", "The repository does not include a production advertising or analytics integration. A deployed environment may add services only after its own consent and disclosure review."],
      ["Managing stored data", "Clear this site's browser storage or use Reset workspace in Stepwise Settings to remove the local sample state."],
      ["Production policy required", "Replace this sample notice with an accurate inventory of every production cookie, SDK, storage purpose, duration, and provider before launch."]
    ]
  },
  accessibility: {
    title: "Accessibility Statement",
    updated: "July 22, 2026",
    intro: "Stepwise is being designed toward WCAG 2.2 Level AA. This development build has not completed the manual testing required for a conformance claim.",
    sections: [
      ["Keyboard and semantics", "Core controls are being implemented with semantic markup and keyboard behavior. Complete journey testing is still required before keyboard or assistive-technology support is considered verified."],
      ["Current implementation", "The interface includes semantic controls, keyboard-operable workflows, visible focus styles, responsive layouts, light and dark themes, and reduced-motion support. Coverage continues to be reviewed as the product develops."],
      ["Verification still required", "Before claiming conformance, the complete product must pass automated checks and manual keyboard, screen-reader, contrast, zoom, reflow, touch-target, and error-recovery testing with representative content."],
      ["Accessibility feedback", "If you encounter a barrier in this demonstration, email support@stepwise.page with the page, task, browser, and assistive technology involved."]
    ]
  }
} as const;

export function LegalPage({ type }: { type: keyof typeof legalCopy }) {
  const copy = legalCopy[type];
  return <main className="static-page"><header className="static-nav"><Logo/><Link className="btn btn-secondary" href="/"><ArrowLeft/> Back home</Link></header><article className="static-document" aria-labelledby="legal-title"><div className="eyebrow"><FileText/> Stepwise development documentation</div><h1 id="legal-title">{copy.title}</h1><p className="static-updated">Last updated {copy.updated}</p><p className="static-intro">{copy.intro}</p>{copy.sections.map(section=><section key={section[0]}><h2>{section[0]}</h2><p>{section[1]}</p></section>)}<aside><ShieldCheck/><div><b>Frontend demonstration notice</b><p>Replace this sample document with reviewed production terms before collecting personal information or processing payments. Questions: <a href="mailto:support@stepwise.page">support@stepwise.page</a>.</p></div></aside></article></main>;
}

const helpTopics = [
  { title:"Start a question block", body:"Open QBank, choose Step 1 or Step 2 CK, select a mode and filters, then start the block.", icon:BookOpen },
  { title:"Reset or export data", body:"Open Settings → Privacy & data to download your local state or restore the original demo workspace.", icon:ShieldCheck },
  { title:"Use keyboard shortcuts", body:"Press Ctrl/Cmd + K to open command search. Question sessions also expose navigation and utility controls.", icon:KeyRound },
  { title:"Review flashcards", body:"Open Flashcards and choose Review due cards. Ratings update the local spaced-repetition schedule.", icon:CheckCircle2 },
  { title:"Administer content", body:"Open the Admin demo to create questions, manage reports, inspect coverage, and review learners.", icon:FileText },
  { title:"Connect production services", body:"Use .env.example and replace local persistence with your authentication, database, billing, email, and analytics providers.", icon:Mail }
];

export function HelpPage() {
  const [query,setQuery]=useState("");
  const topics=useMemo(()=>helpTopics.filter(topic=>`${topic.title} ${topic.body}`.toLowerCase().includes(query.toLowerCase())),[query]);
  return <main className="static-page help-page"><header className="static-nav"><Logo/><div><Link href="/app" className="btn btn-secondary">Learner workspace</Link><a href="mailto:support@stepwise.page" className="btn btn-brand">Email support</a></div></header><section className="help-hero" aria-labelledby="help-title"><CircleHelp aria-hidden="true"/><h1 id="help-title">How can we help?</h1><p>Search the Stepwise study workflows or contact support directly at support@stepwise.page.</p><label><Search aria-hidden="true"/><input type="search" aria-label="Search help topics" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Stepwise help…" autoComplete="off"/></label><p role="status" aria-live="polite">{topics.length} {topics.length === 1 ? "topic" : "topics"} found</p></section><section className="help-grid" aria-label="Help topics">{topics.map(topic=>{const Icon=topic.icon;return <article key={topic.title}><span><Icon aria-hidden="true"/></span><h2>{topic.title}</h2><p>{topic.body}</p><button type="button" onClick={()=>setQuery(topic.title)}>Show only this topic <ArrowRight/></button></article>})}{!topics.length && <p>No help topics match “{query}”. Try a broader term or email support.</p>}</section><footer className="help-footer"><div><Mail aria-hidden="true"/><span><b>Need direct assistance?</b><small>Contact our team at support@stepwise.page.</small></span></div><Link className="btn btn-secondary" href="/">Return home</Link></footer></main>;
}

export function ForgotPasswordPage() {
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  return <main className="recovery-page"><section><Logo/><div className="recovery-card"><span><KeyRound aria-hidden="true"/></span><h1>Reset your password</h1><p>Enter your email to simulate a reset request. This frontend demo does not send email.</p><form onSubmit={event=>{event.preventDefault();setSent(true);}}><label className="field"><span className="field-label">Email address</span><input type="email" required value={email} onChange={e=>{setEmail(e.target.value);setSent(false);}} placeholder="you@example.com" autoComplete="email"/></label><button type="submit" className="btn btn-brand btn-block btn-lg" disabled={!email}>Simulate reset request</button></form><Link href="/login"><ArrowLeft/> Back to sign in</Link></div></section><Toast visible={sent} message="Demo reset request completed. No email was sent."/></main>;
}

export function NotFoundPage() {
  return <main className="recovery-page"><section><Logo/><div className="recovery-card"><span><Search aria-hidden="true"/></span><h1>Page not found</h1><p>The requested Stepwise route does not exist in this frontend repository.</p><Link className="btn btn-brand btn-block" href="/">Return home</Link><Link href="/app">Open learner workspace <ArrowRight/></Link></div></section></main>;
}
