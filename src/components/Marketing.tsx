"use client";

import Link from "next/link";
import { useId, useState } from "react";
import {
  ArrowRight, BarChart3, BookOpenCheck, BrainCircuit, Check, ChevronDown, Command,
  FileText, Layers3, Menu, MessageSquareText, MonitorPlay, ShieldCheck, Sparkles,
  Target, TimerReset, X, Zap
} from "lucide-react";
import { Donut, Logo, Progress, Sparkline } from "./ui";
import { ReasoningTrace } from "./ReasoningTrace";

const faqs = [
  ["Is Stepwise affiliated with the USMLE program?", "No. Stepwise is an independent learning interface concept. USMLE is a jointly sponsored program of the Federation of State Medical Boards and the National Board of Medical Examiners."],
  ["Which exams does this preview support?", "The learner workspace, question filters, analytics, study plan, notes, flashcards, and exam-day rehearsal can be scoped to USMLE Step 1 or Step 2 CK."],
  ["What happens after I miss a question?", "Stepwise shows the option-level context, classifies the reasoning pattern behind the miss, and turns the correction into a focused next block, note, or recall card."],
  ["How does adaptive mode choose questions?", "The explainable preview model prioritizes unseen items, weak systems, recent overconfidence errors, stale knowledge, and an appropriate difficulty challenge."],
  ["Where is my progress stored in this preview?", "This frontend preview saves activity in the current browser so every workflow stays interactive. Secure account sync, production billing, APIs, and protected medical content still require production services."],
];

const examSpecs = [
  {
    step: "Step 1",
    descriptor: "Foundational mechanisms",
    blocks: 14,
    blockMinutes: 30,
    itemLimit: 20,
    dayHours: 8,
    focus: "Pathophysiology, mechanisms, pharmacology, microbiology, and integrated foundational science.",
    signals: ["Mechanism-first explanations", "System and discipline analytics", "Pass/fail-safe readiness language"]
  },
  {
    step: "Step 2 CK",
    descriptor: "Clinical decisions",
    blocks: 16,
    blockMinutes: 30,
    itemLimit: 20,
    dayHours: 9,
    focus: "Diagnosis, management, prevention, emergency care, and patient-centered clinical decision making.",
    signals: ["Next-best-step reasoning", "Management sequence diagnostics", "Pacing and confidence calibration"]
  }
] as const;

const features = [
  { icon: <BrainCircuit/>, title: "Adaptive intelligence", body: "Blocks evolve with your weaknesses, confidence calibration, recency, and difficulty fit—not a generic shuffle.", className: "feature-large feature-purple" },
  { icon: <Target/>, title: "Exam-faithful sessions", body: "Tutor, timed, exam, and adaptive modes with navigation, strikeout, flags, notes, lab values, and pacing controls.", className: "feature-tall" },
  { icon: <BarChart3/>, title: "Actionable analytics", body: "See mastery by system, accuracy trends, pacing, coverage, confidence gaps, and a readiness estimate.", className: "feature-blue" },
  { icon: <Layers3/>, title: "Spaced repetition", body: "Turn explanations into cards and review them through an SM-2-inspired scheduling workflow.", className: "feature-green" },
  { icon: <FileText/>, title: "Connected notebook", body: "Keep searchable notes linked to the exact question, system, and topic that produced the insight.", className: "feature-sand" },
  { icon: <ShieldCheck/>, title: "Private study circles", body: "Share aggregate learning signals only after identity, consent, and activity thresholds are satisfied—never individual answer history.", className: "feature-blue" },
];

export function MarketingPage() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState(0);
  const mobileNavId = useId();
  const billingLabelId = useId();
  const faqId = useId();

  return (
    <main className="marketing-page">
      <div className="announcement"><span className="announcement-copy">Current 2026 test-delivery structure · Step 1 + Step 2 CK</span><Link href="/try">Try 5 questions <ArrowRight size={14}/></Link></div>
      <header className="marketing-nav shell-width">
        <Logo />
        <nav id={mobileNavId} aria-label="Primary navigation" className={mobileOpen ? "marketing-links is-open" : "marketing-links"}>
          <a href="#exams" onClick={()=>setMobileOpen(false)}>Exams</a><a href="#reasoning" onClick={()=>setMobileOpen(false)}>Reasoning trace</a><a href="#product" onClick={()=>setMobileOpen(false)}>Product</a><a href="#pricing" onClick={()=>setMobileOpen(false)}>Pricing</a><a href="#faq" onClick={()=>setMobileOpen(false)}>FAQ</a>
        </nav>
        <div className="marketing-actions"><Link className="btn btn-ghost" href="/login">Sign in</Link><Link className="btn btn-dark" href="/signup">Start preview <ArrowRight size={16}/></Link></div>
        <button className="mobile-menu" onClick={() => setMobileOpen((value) => !value)} aria-label={mobileOpen ? "Close navigation" : "Open navigation"} aria-expanded={mobileOpen} aria-controls={mobileNavId}>{mobileOpen ? <X/> : <Menu/>}</button>
      </header>

      <section className="hero shell-width">
        <div className="hero-copy">
          <div className="pill"><Sparkles size={14}/> USMLE Step 1 · Step 2 CK · Exam-day rehearsal</div>
          <h1>See why you miss USMLE questions.<br/><em>Know what to train next.</em></h1>
          <p>Stepwise connects exam-faithful question blocks to option-level reasoning diagnostics, focused review, and spaced repetition—so every miss becomes a specific correction.</p>
          <div className="hero-actions"><Link className="btn btn-brand btn-lg" href="/try">Try 5 questions <ArrowRight size={18}/></Link><Link className="btn btn-secondary btn-lg" href="/app/qbank">Explore the QBank</Link></div>
          <div className="hero-proof"><div className="avatar-stack" aria-hidden="true"><span>WHY</span><span>MISS</span><span>NEXT</span></div><div><b>Reasoning Trace</b><small>Cue → hypothesis → decision → correction → review</small></div></div>
        </div>
        <div className="hero-product" aria-label="Stepwise product preview">
          <div className="hero-glow"/>
          <div className="browser-frame">
            <div className="browser-top"><i/><i/><i/><div>app.stepwise.study</div><Command size={14}/></div>
            <div className="preview-app">
              <aside><Logo compact/><div className="preview-nav-item active"><span/><b>Overview</b></div><div className="preview-nav-item"><span/><b>QBank</b></div><div className="preview-nav-item"><span/><b>Analytics</b></div><div className="preview-nav-item"><span/><b>Plan</b></div><div className="preview-profile">AK</div></aside>
              <section>
                <div className="preview-head"><div><small>WEDNESDAY, JUL 22</small><h3>Good morning, Alex.</h3></div><span className="preview-demo-action">Start session <ArrowRight size={13}/></span></div>
                <div className="preview-grid">
                  <article className="preview-readiness"><div><small>READINESS</small><h4>On track for your goal</h4><p>Your recall is improving fastest in Cardiovascular.</p></div><Donut value={78} size={104} detail="ready"/></article>
                  <article className="preview-stat"><small>7-DAY ACCURACY</small><strong>76%</strong><span>↗ 6% this week</span><Sparkline values={[54, 61, 59, 68, 65, 73, 76]}/></article>
                  <article className="preview-today"><div><small>TODAY&apos;S FOCUS</small><b>Adaptive mixed block</b><p>20 questions · 34 min</p></div><Progress value={40}/><span className="preview-demo-link">Continue <ArrowRight size={13}/></span></article>
                  <article className="preview-systems"><small>MASTERY BY SYSTEM</small>{[["Cardiovascular",82],["Renal",68],["Neurology",54]].map(([label, value]) => <div key={String(label)}><span>{label}</span><Progress value={Number(value)}/><b>{value}%</b></div>)}</article>
                </div>
              </section>
            </div>
          </div>
          <div className="floating-card floating-card-one"><span><Zap size={17}/></span><div><b>Weakness detected</b><small>Neurology moved into today&apos;s block</small></div></div>
          <div className="floating-card floating-card-two"><span><Check size={17}/></span><div><b>Review complete</b><small>Retention interval: 6 days</small></div></div>
        </div>
      </section>

      <section className="trust-strip shell-width"><span>One connected preparation system</span><div><b>STEP 1</b><i/> <b>STEP 2 CK</b><i/> <b>EXAM-DAY REHEARSAL</b><i/> <b>REASONING DIAGNOSTICS</b></div></section>

      <section id="exams" className="section shell-width exam-pathways" aria-labelledby="exam-pathways-title">
        <div className="section-heading">
          <div className="eyebrow">Built around the exam you will take</div>
          <h2 id="exam-pathways-title">Two USMLE pathways.<br/>One deliberate practice system.</h2>
          <p>Choose the exam once. Stepwise carries that context through block construction, performance analysis, planning, recall, and testing-day rehearsal.</p>
        </div>
        <div className="exam-pathway-grid">
          {examSpecs.map((exam) => <article key={exam.step} className="exam-pathway-card">
            <header><div><span>{exam.step === "Step 1" ? "S1" : "S2"}</span><div><small>USMLE</small><h3>{exam.step}</h3></div></div><b>{exam.descriptor}</b></header>
            <p>{exam.focus}</p>
            <ul className="exam-focus-list">{exam.signals.map((signal) => <li key={signal}><Check/>{signal}</li>)}</ul>
            <div className="exam-delivery-rail">
              <div className="exam-rail-label"><span>Current delivery structure</span><b>{exam.blocks} blocks</b></div>
              <div className="exam-block-rail" aria-label={`${exam.blocks} blocks, ${exam.blockMinutes} minutes each`}>
                {Array.from({ length: exam.blocks }, (_, index) => <i key={index}/>)}
              </div>
            </div>
            <dl><div><dt>Block</dt><dd>{exam.blockMinutes} min</dd></div><div><dt>Items</dt><dd>up to {exam.itemLimit}</dd></div><div><dt>Exam day</dt><dd>{exam.dayHours} hr</dd></div></dl>
          </article>)}
          <aside className="exam-command-brief">
            <div className="exam-command-icon"><MonitorPlay/></div>
            <div><span className="eyebrow">Exam Command Deck</span><h3>Rehearse the operating conditions.</h3><p>Train the actions that disappear from ordinary practice blocks: orientation, irreversible block closure, break allocation, pacing, and recovery after a refresh.</p></div>
            <ul><li><TimerReset/> Three-block or full-day run</li><li><ShieldCheck/> Resume-safe phase recovery</li><li><BrainCircuit/> No answer feedback before block close</li></ul>
            <Link className="btn btn-white" href="/app/exam-day">Open exam-day rehearsal <ArrowRight/></Link>
          </aside>
        </div>
      </section>

      <section id="reasoning" className="section shell-width marketing-trace" aria-labelledby="reasoning-trace-preview">
        <div className="section-heading">
          <div className="eyebrow">The Stepwise difference</div>
          <h2 id="reasoning-trace-preview">Make the reasoning visible.</h2>
          <p>A signature learning path connects the clinical clue, the decision, the correction, and the next review—without presenting example data as a real learner outcome.</p>
        </div>
        <ReasoningTrace
          sample
          title="From missed clue to next review"
          description="An illustrative example of the diagnostic feedback shown after a question."
          steps={[
            { phase: "Clinical cue", title: "Hypotension after trauma", detail: "Prioritize the immediate physiologic threat.", state: "complete" },
            { phase: "Decision", title: "Selected a diagnostic test first", detail: "The choice delayed stabilization.", state: "complete" },
            { phase: "Correction", title: "Sequence error identified", detail: "Stabilize before confirmatory testing.", state: "current" },
            { phase: "Next review", title: "Rehearse the emergency sequence", detail: "A focused recall card is due tomorrow.", state: "next" }
          ]}
        />
      </section>

      <section id="product" className="section shell-width">
        <div className="section-heading centered"><div className="eyebrow">One system, every study loop</div><h2>Everything between “I missed it”<br/>and “I own it.”</h2><p>Practice, understand, retain, and recalibrate without stitching together five different tools.</p></div>
        <div className="feature-bento">{features.map((feature) => <article key={feature.title} className={`feature-card ${feature.className}`}><span className="feature-icon">{feature.icon}</span><h3>{feature.title}</h3><p>{feature.body}</p>{feature.title === "Adaptive intelligence" && <div className="mini-adaptive"><div><span>Next block composition</span><b>Updated now</b></div><p><i style={{width:"34%"}}/><i style={{width:"25%"}}/><i style={{width:"23%"}}/><i style={{width:"18%"}}/></p><footer><span>Neurology 34%</span><span>Immunology 25%</span></footer></div>}{feature.title === "Exam-faithful sessions" && <div className="mini-question"><small>Question 12 of 20</small><p>A patient presents with progressive...</p><i/><i/><i className="selected"/><i/></div>}</article>)}</div>
      </section>

      <section id="workflow" className="workflow-section">
        <div className="shell-width workflow-grid">
          <div className="workflow-copy"><div className="eyebrow">A closed learning loop</div><h2>Your next best action,<br/>already decided.</h2><p>Stepwise continuously connects performance signals to a concrete daily plan.</p>
            <ol>{[
              ["01", "Answer in context", "Build or launch blocks by system, discipline, difficulty, status, and exam mode."],
              ["02", "Diagnose the miss", "Separate knowledge gaps from poor pacing and overconfidence."],
              ["03", "Reinforce at the right time", "Send key ideas into notes and spaced repetition without losing context."],
              ["04", "Rebalance tomorrow", "The planner shifts time toward weak systems while preserving mixed recall."]
            ].map(([number,title,body], index) => <li key={number} className={index === 0 ? "active" : ""}><span>{number}</span><div><h3>{title}</h3><p>{body}</p></div></li>)}</ol>
          </div>
          <div className="workflow-visual">
            <div className="workflow-window">
              <div className="workflow-window-head"><span>Adaptive block builder</span><small>Live recommendation</small></div>
              <div className="workflow-window-body">
                <div className="recommendation"><BrainCircuit/><div><b>Recommended next block</b><p>We found a high-confidence error cluster in Neurology and a retention dip in Immunology.</p></div></div>
                <div className="builder-row"><span>Exam</span><div><b>Step 2 CK</b><small>Clinical decision making</small></div><ChevronDown/></div>
                <div className="builder-row"><span>Mode</span><div className="segmented"><b>Adaptive</b><i>Timed</i><i>Tutor</i></div></div>
                <div className="builder-row"><span>Focus</span><div className="topic-chips"><b>Neurology</b><b>Immunology</b><i>Mixed review</i></div></div>
                <div className="block-composition"><span>Block composition</span>{[["Weakness repair",42],["Mixed retrieval",28],["Stale knowledge",18],["Challenge",12]].map(([label,value]) => <div key={String(label)}><p><span>{label}</span><b>{value}%</b></p><Progress value={Number(value)}/></div>)}</div>
                <div className="btn btn-brand preview-static-cta" aria-hidden="true">Start 20-question block <ArrowRight size={16}/></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="outcomes section shell-width">
        <div className="section-heading"><div className="eyebrow">Progress you can act on</div><h2>Measure what changes<br/>your next decision.</h2></div>
        <div className="outcome-grid">
          <article><span>01</span><h3>Know where performance comes from</h3><p>Compare accuracy, time, confidence, exposure, and retention rather than relying on one blended score.</p><div className="outcome-chart"><div className="chart-label"><b>Accuracy trend</b><span>Last 8 blocks</span></div><Sparkline values={[54,59,57,64,68,66,73,78]} height={84}/><div className="chart-axis"><span>B1</span><span>B4</span><span>B8</span></div></div></article>
          <article><span>02</span><h3>Turn weaknesses into a schedule</h3><p>Build a daily plan from your exam date, availability, goals, and current mastery.</p><div className="week-card">{["M","T","W","T","F","S","S"].map((day,index)=><div key={`${day}-${index}`} className={index===2?"today":""}><span>{day}</span><b>{index===2?22:20+index}</b><i style={{height:`${18 + (index%3)*10}px`}}/></div>)}</div></article>
          <article><span>03</span><h3>Catch confident mistakes early</h3><p>Confidence calibration reveals errors that feel correct—the most dangerous kind on exam day.</p><div className="calibration-card"><div><Donut value={84} size={96} detail="calibrated"/><p><b>Strong calibration</b><span>You are underconfident in Renal but overconfident in Neurology.</span></p></div><span className="calibration-demo-link">View insight <ArrowRight size={14}/></span></div></article>
        </div>
      </section>

      <section className="testimonial-section" aria-labelledby="learner-outcome-title"><div className="shell-width"><div className="quote-mark" aria-hidden="true">“</div><p className="eyebrow">Product principle</p><blockquote id="learner-outcome-title">A missed question should become an understandable correction and a concrete next study action.</blockquote><div className="quote-person"><span aria-hidden="true">RT</span><div><b>The Stepwise Reasoning Trace</b><small>Product direction, not a learner testimonial</small></div></div></div></section>

      <section id="pricing" className="section shell-width pricing-section">
        <div className="section-heading centered"><div className="eyebrow">Access preview</div><h2>A plan for every phase of preparation.</h2><p id={billingLabelId}>These illustrative prices do not initiate checkout. Production billing and final commercial terms are not connected yet.</p></div>
        <div className="billing-toggle" role="group" aria-labelledby={billingLabelId}><button type="button" className={billing === "monthly" ? "active" : ""} aria-pressed={billing === "monthly"} onClick={() => setBilling("monthly")}>Monthly</button><button type="button" className={billing === "annual" ? "active" : ""} aria-pressed={billing === "annual"} onClick={() => setBilling("annual")}>Annual <span>Save about 25%</span></button></div>
        <div className="pricing-grid">
          <article><div><span className="plan-icon"><BookOpenCheck/></span><h3>Core</h3><p>Focused QBank practice and essential analytics.</p></div><div className="price"><b>${billing === "annual" ? 29 : 39}</b><span>/ month</span></div>{billing === "annual" && <small>$348 billed annually in this pricing preview</small>}<Link className="btn btn-secondary btn-block" href="/signup">Explore Core</Link><ul>{["Step 1 or Step 2 CK QBank","Tutor and timed modes","System analytics","Notes and bookmarks"].map(item=><li key={item}><Check/>{item}</li>)}</ul></article>
          <article className="featured"><div className="popular">FULL TOOLKIT</div><div><span className="plan-icon"><Sparkles/></span><h3>Pro</h3><p>The full adaptive learning and planning system.</p></div><div className="price"><b>${billing === "annual" ? 49 : 65}</b><span>/ month</span></div>{billing === "annual" && <small>$588 billed annually in this pricing preview</small>}<Link className="btn btn-brand btn-block" href="/signup">Explore Pro</Link><ul>{["Everything in Core","Adaptive mode and readiness score","Dynamic study planner","Spaced repetition cards","Advanced confidence analytics","Exam simulation workspace"].map(item=><li key={item}><Check/>{item}</li>)}</ul></article>
          <article><div><span className="plan-icon"><ShieldCheck/></span><h3>Institution</h3><p>Administration, cohorts, and content operations.</p></div><div className="price"><b>Custom</b></div><a className="btn btn-secondary btn-block" href="mailto:hello@stepwise.page">Contact enterprise</a><ul>{["Learner and cohort management","Question authoring workflow","Content reports and QA","Billing and access controls"].map(item=><li key={item}><Check/>{item}</li>)}</ul></article>
        </div>
      </section>

      <section id="faq" className="section shell-width faq-section"><div className="faq-intro"><div className="eyebrow">Questions, answered</div><h2>Before you start.</h2><p>Everything important about the demo, the learning model, and production integration.</p><div className="faq-help"><MessageSquareText/><div><b>Still exploring?</b><span>Questions or licensing? Email hello@stepwise.page</span></div></div></div><div className="faq-list">{faqs.map(([question,answer],index)=>{const questionId = `${faqId}-question-${index}`; const panelId = `${faqId}-panel-${index}`; const isOpen = openFaq === index; return <article key={question} className={isOpen ? "open" : ""}><h3 style={{margin:0,font:"inherit"}}><button type="button" id={questionId} aria-expanded={isOpen} aria-controls={panelId} onClick={()=>setOpenFaq(isOpen?-1:index)}><span>{question}</span><ChevronDown aria-hidden="true"/></button></h3><div id={panelId} role="region" aria-labelledby={questionId} hidden={!isOpen}><p>{answer}</p></div></article>})}</div></section>

      <section className="final-cta shell-width"><div className="cta-orbit cta-orbit-one"/><div className="cta-orbit cta-orbit-two"/><div className="pill"><Zap size={14}/> Your next block is waiting</div><h2>Make every USMLE question<br/>move you forward.</h2><p>Start with a five-question reasoning sample, then explore the complete Step 1 and Step 2 CK preparation workspace.</p><div><Link className="btn btn-white btn-lg" href="/try">Try 5 questions <ArrowRight size={18}/></Link><Link className="btn btn-glass btn-lg" href="/app">Open full workspace</Link></div></section>

      <footer className="marketing-footer"><div className="shell-width"><div className="footer-top"><div><Logo inverse/><p>An adaptive QBank experience for focused medical exam preparation.</p></div><div className="footer-links"><div><b>Product</b><a href="#product">Features</a><a href="#workflow">How it works</a><Link href="/try">Question demo</Link><Link href="/app">Learner workspace</Link></div><div><b>Workspace</b><Link href="/app/qbank">QBank</Link><Link href="/app/analytics">Analytics</Link><Link href="/app/study-plan">Study plan</Link><Link href="/app/flashcards">Flashcards</Link></div><div><b>Legal</b><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link><Link href="/cookies">Cookies</Link><Link href="/accessibility">Accessibility</Link></div><div><b>Contact</b><a href="mailto:support@stepwise.page">support@stepwise.page</a><a href="mailto:hello@stepwise.page">hello@stepwise.page</a><a href="mailto:billing@stepwise.page">billing@stepwise.page</a></div></div></div><div className="footer-bottom"><span>© 2026 Stepwise. All rights reserved.</span><span>Not affiliated with or endorsed by USMLE, NBME, or FSMB. Security: admin@stepwise.page</span></div></div></footer>
    </main>
  );
}
