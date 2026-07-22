"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BookOpen, CheckCircle2, CircleHelp, FileText, KeyRound, Mail, Search, ShieldCheck } from "lucide-react";
import { Logo, Toast } from "./ui";

const legalCopy = {
  privacy: {
    title: "Privacy notice",
    updated: "July 22, 2026",
    intro: "This repository is a frontend demonstration. It stores demo study data in your browser using localStorage and does not transmit that data to Stepwise servers.",
    sections: [
      ["Data stored locally", "Question attempts, notes, flashcards, study-plan settings, interface preferences, and demo administration changes are stored in the current browser."],
      ["No production accounts", "The included sign-in and subscription flows are interface simulations. They do not create an account, process payment, or send credentials to a remote service."],
      ["Export and deletion", "Use Settings → Privacy & data to export the local state as JSON or reset the workspace to its original sample data."],
      ["Production responsibility", "Before deploying with real users, connect a compliant backend, publish your own privacy terms, define retention controls, and complete appropriate security and legal review."]
    ]
  },
  terms: {
    title: "Terms of use",
    updated: "July 22, 2026",
    intro: "Stepwise in this repository is an educational product interface and sample codebase, not a medical service or official examination product.",
    sections: [
      ["Educational use", "Content is provided for interface demonstration and general learning workflows. It is not medical advice and should not be used for patient care decisions."],
      ["Independent product", "Stepwise is not affiliated with, sponsored by, or endorsed by USMLE, NBME, FSMB, or any medical licensing authority."],
      ["Original content", "The included sample questions are original demonstration items. Do not add copyrighted third-party QBank questions without authorization."],
      ["No warranty", "The repository is supplied as-is. Validate medical content, security, accessibility, payments, identity, and regulatory requirements before production use."]
    ]
  },
  accessibility: {
    title: "Accessibility statement",
    updated: "July 22, 2026",
    intro: "Stepwise is designed with keyboard navigation, visible focus states, responsive layouts, reduced-motion support, and semantic controls across learner and admin workflows.",
    sections: [
      ["Keyboard access", "Core navigation, forms, modals, question choices, filters, and action controls can be reached using standard keyboard navigation."],
      ["Visual presentation", "The interface supports light and dark themes, strong focus indicators, scalable layouts, and a reduced-motion preference."],
      ["Known production work", "A production release should complete automated and manual WCAG 2.2 testing with screen readers, zoom, reflow, contrast, and real content."],
      ["Feedback", "The help center includes an accessibility support path that can be connected to your production support system."]
    ]
  }
} as const;

export function LegalPage({ type }: { type: keyof typeof legalCopy }) {
  const copy = legalCopy[type];
  return <main className="static-page"><header className="static-nav"><Logo/><Link className="btn btn-secondary" href="/"><ArrowLeft/> Back home</Link></header><article className="static-document"><div className="eyebrow"><FileText/> Stepwise documentation</div><h1>{copy.title}</h1><p className="static-updated">Last updated {copy.updated}</p><p className="static-intro">{copy.intro}</p>{copy.sections.map(section=><section key={section[0]}><h2>{section[0]}</h2><p>{section[1]}</p></section>)}<aside><ShieldCheck/><div><b>Frontend demonstration notice</b><p>Replace this sample policy with reviewed production documents before collecting personal information.</p></div></aside></article></main>;
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
  return <main className="static-page help-page"><header className="static-nav"><Logo/><div><Link href="/app" className="btn btn-secondary">Learner demo</Link><Link href="/admin" className="btn btn-brand">Admin demo</Link></div></header><section className="help-hero"><CircleHelp/><h1>How can we help?</h1><p>Search the complete frontend workflow or jump directly into the workspace.</p><label><Search/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search Stepwise help…"/></label></section><section className="help-grid">{topics.map(topic=>{const Icon=topic.icon;return <article key={topic.title}><span><Icon/></span><h2>{topic.title}</h2><p>{topic.body}</p><button onClick={()=>setQuery(topic.title)}>Read guide <ArrowRight/></button></article>})}</section><footer className="help-footer"><div><Mail/><span><b>Need implementation support?</b><small>Connect this control to your preferred ticketing or email provider.</small></span></div><Link className="btn btn-secondary" href="/">Return home</Link></footer></main>;
}

export function ForgotPasswordPage() {
  const [email,setEmail]=useState("");
  const [sent,setSent]=useState(false);
  return <main className="recovery-page"><section><Logo/><div className="recovery-card"><span><KeyRound/></span><h1>Reset your password</h1><p>Enter your email to simulate a secure reset request in this frontend demo.</p><label className="field"><span className="field-label">Email address</span><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@example.com"/></label><button className="btn btn-brand btn-block btn-lg" disabled={!email} onClick={()=>setSent(true)}>Send reset link</button><Link href="/login"><ArrowLeft/> Back to sign in</Link></div></section><Toast visible={sent} message="Demo reset request completed"/></main>;
}

export function NotFoundPage() {
  return <main className="recovery-page"><section><Logo/><div className="recovery-card"><span><Search/></span><h1>Page not found</h1><p>The requested Stepwise route does not exist in this frontend repository.</p><Link className="btn btn-brand btn-block" href="/">Return home</Link><Link href="/app">Open learner workspace <ArrowRight/></Link></div></section></main>;
}
