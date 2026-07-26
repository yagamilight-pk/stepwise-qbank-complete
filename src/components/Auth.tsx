"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useId, useState } from "react";
import { ArrowLeft, ArrowRight, Check, Eye, EyeOff, LockKeyhole, ShieldCheck } from "lucide-react";
import { Logo } from "./ui";
import { useStepwise } from "@/lib/store";
import type { Step } from "@/lib/types";

const SIGNUP_INTENT_KEY = "stepwise-signup-intent-v1";

interface SignupIntent {
  name: string;
  email: string;
  exam: Step;
  date: string;
}

interface OnboardingValues {
  name: string;
  email: string;
  exam: Step;
  examDate: string;
  score: string;
  baseline: "Early preparation" | "Building consistency" | "Dedicated period" | "Final review";
  time: "45 minutes" | "90 minutes" | "2 hours" | "3+ hours";
  days: number[];
  priorities: string[];
}

export function AuthPage({ mode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({ name: "", email: "", password: "", exam: "Step 2 CK", date: "2026-10-17" });
  const nameId = useId();
  const emailId = useId();
  const passwordId = useId();
  const examGroupId = useId();
  const examDateId = useId();

  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    if (mode === "signup" && step === 1) { setStep(2); return; }
    if (mode === "signup") {
      const intent: SignupIntent = {
        name: form.name.trim(),
        email: form.email.trim(),
        exam: form.exam as Step,
        date: form.date
      };
      sessionStorage.setItem(SIGNUP_INTENT_KEY, JSON.stringify(intent));
    }
    setLoading(true);
    window.setTimeout(() => router.push(mode === "signup" ? "/onboarding" : "/app"), 450);
  };

  return (
    <main className="auth-page">
      <section className="auth-visual">
        <Link href="/" className="auth-back"><ArrowLeft size={16}/> Back to home</Link>
        <div className="auth-visual-content"><Logo inverse/><div className="auth-quote"><span>“</span><h2>Preparation becomes manageable when every study decision has a reason.</h2><p>One connected workspace for practice, review, planning, and retention.</p></div><div className="auth-proof"><div><ShieldCheck/><span><b>Local demo persistence</b><small>Your workspace survives refreshes in this browser.</small></span></div><div><LockKeyhole/><span><b>Backend-ready structure</b><small>Replace the store with your API when ready.</small></span></div></div></div>
        <div className="auth-pattern" aria-hidden="true"/>
      </section>
      <section className="auth-form-wrap">
        <div className="auth-form-card">
          <div className="auth-mobile-logo"><Logo/></div>
          {mode === "signup" && <div className="auth-step"><span>Step {step} of 2</span><div><i className="active"/><i className={step === 2 ? "active" : ""}/></div></div>}
          <div className="auth-title"><h1>{mode === "login" ? "Welcome back" : step === 1 ? "Create your workspace" : "Set your direction"}</h1><p>{mode === "login" ? "Continue where your last study session ended." : step === 1 ? "Start with the essentials. No card required." : "We will use this to initialize your study experience."}</p></div>
          <form onSubmit={submit} aria-busy={loading}>
            {mode === "signup" && step === 1 && <label className="field" htmlFor={nameId}><span className="field-label">Full name</span><input id={nameId} required value={form.name} onChange={(e)=>setForm({...form,name:e.target.value})} placeholder="Alex Morgan" autoComplete="name"/></label>}
            {(mode === "login" || step === 1) && <>
              <label className="field" htmlFor={emailId}><span className="field-label">Email address</span><input id={emailId} required type="email" value={form.email} onChange={(e)=>setForm({...form,email:e.target.value})} placeholder="you@example.com" autoComplete="email"/></label>
              <div className="field"><span className="field-label"><label htmlFor={passwordId}>Password</label> {mode === "login" && <Link href="/forgot-password">Forgot password?</Link>}</span><span className="password-field"><input id={passwordId} required minLength={8} type={showPassword ? "text" : "password"} value={form.password} onChange={(e)=>setForm({...form,password:e.target.value})} placeholder="At least 8 characters" autoComplete={mode === "login" ? "current-password" : "new-password"}/><button type="button" onClick={()=>setShowPassword(!showPassword)} aria-label={showPassword ? "Hide password" : "Show password"} aria-pressed={showPassword}>{showPassword?<EyeOff/>:<Eye/>}</button></span></div>
            </>}
            {mode === "signup" && step === 2 && <>
              <div className="field" role="group" aria-labelledby={examGroupId}><span className="field-label" id={examGroupId}>Preparing for</span><div className="choice-cards"><button type="button" aria-pressed={form.exam === "Step 1"} className={form.exam === "Step 1" ? "active" : ""} onClick={()=>setForm({...form,exam:"Step 1"})}><span><b>USMLE Step 1</b><small>Foundational science and mechanisms</small></span>{form.exam === "Step 1" && <Check aria-hidden="true"/>}</button><button type="button" aria-pressed={form.exam === "Step 2 CK"} className={form.exam === "Step 2 CK" ? "active" : ""} onClick={()=>setForm({...form,exam:"Step 2 CK"})}><span><b>USMLE Step 2 CK</b><small>Clinical knowledge and decisions</small></span>{form.exam === "Step 2 CK" && <Check aria-hidden="true"/>}</button></div></div>
              <label className="field" htmlFor={examDateId}><span className="field-label">Target exam date <small>You can change this later</small></span><input id={examDateId} type="date" value={form.date} onChange={(e)=>setForm({...form,date:e.target.value})}/></label>
            </>}
            <button type="submit" className="btn btn-brand btn-block btn-lg" disabled={loading}>{loading ? "Opening workspace…" : mode === "signup" && step === 1 ? <>Continue <ArrowRight/></> : mode === "signup" ? <>Create demo workspace <ArrowRight/></> : <>Open demo workspace <ArrowRight/></>}</button>
            {loading && <span role="status" aria-live="polite">Opening your local demo workspace.</span>}
            {mode === "signup" && step === 2 && <button className="btn btn-ghost btn-block" type="button" onClick={()=>setStep(1)}>Back</button>}
          </form>
          {step === 1 && <><div className="auth-divider"><span>or preview with</span></div><div className="social-auth"><button type="button" aria-label="Preview Google sign-in flow" onClick={()=>router.push("/onboarding")}><b aria-hidden="true">G</b> Google demo</button><button type="button" aria-label="Preview Apple sign-in flow" onClick={()=>router.push("/onboarding")}><b aria-hidden="true">●</b> Apple demo</button></div></>}
          <p className="auth-switch">{mode === "login" ? <>New to Stepwise? <Link href="/signup">Create an account</Link></> : <>Already have an account? <Link href="/login">Sign in</Link></>}</p>
          {mode === "signup" && <p className="legal-copy">By opening the demo, you agree to the <Link href="/terms">Terms</Link> and <Link href="/privacy">Privacy Policy</Link>. This frontend does not create a production account or transmit these credentials.</p>}
        </div>
      </section>
    </main>
  );
}

export function OnboardingPage() {
  const router = useRouter();
  const { state, dispatch, rebuildPlan } = useStepwise();
  const [step, setStep] = useState(0);
  const [values, setValues] = useState<OnboardingValues>(() => ({
    name: state.learnerProfile.name,
    email: state.learnerProfile.email,
    exam: state.planSettings.targetStep,
    examDate: state.planSettings.examDate,
    score: "255",
    baseline: state.learnerProfile.preparationStage,
    time: "90 minutes",
    days: state.planSettings.weeklyDays,
    priorities: state.learnerProfile.toolkitPriorities.length
      ? state.learnerProfile.toolkitPriorities
      : ["Adaptive QBank", "Study plan"]
  }));

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const raw = sessionStorage.getItem(SIGNUP_INTENT_KEY);
        if (!raw) return;
        const intent = JSON.parse(raw) as SignupIntent;
        setValues((current) => ({
          ...current,
          name: intent.name || current.name,
          email: intent.email || current.email,
          exam: intent.exam || current.exam,
          examDate: intent.date || current.examDate
        }));
      } catch {
        // Continue with the saved learner profile when browser storage is unavailable.
      }
    }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const studyMinutes: Record<string, number> = { "45 minutes": 45, "90 minutes": 90, "2 hours": 120, "3+ hours": 180 };
  const screens = [
    {
      label: "Goal",
      title: "What outcome are you aiming for?",
      sub: "This sets the goal context for your dashboard and study plan. Performance signals begin only after you answer questions.",
      body: <div className="onboarding-stack">
        <div className="field" role="group" aria-label="Preparing for"><span className="field-label">Preparing for</span><div className="choice-cards onboarding-exam-cards">{(["Step 1","Step 2 CK"] as Step[]).map(exam=><button type="button" key={exam} aria-pressed={values.exam===exam} className={values.exam===exam?"active":""} onClick={()=>setValues({...values,exam})}><span><b>USMLE {exam}</b><small>{exam==="Step 1"?"Foundational mechanisms":"Clinical decisions and management"}</small></span>{values.exam===exam&&<Check aria-hidden="true"/>}</button>)}</div></div>
        {values.exam==="Step 2 CK"&&<label className="field"><span className="field-label">Target Step 2 CK score</span><input type="number" min="200" max="300" value={values.score} onChange={event=>setValues({...values,score:event.target.value})}/></label>}
        <label className="field"><span className="field-label">Target exam date <small>Used to build the complete study horizon</small></span><input type="date" required value={values.examDate} onChange={event=>setValues({...values,examDate:event.target.value})}/></label>
        <div className="field" role="group" aria-label="Where are you starting?"><span className="field-label">Where are you starting?</span><div className="choice-list">{(["Early preparation","Building consistency","Dedicated period","Final review"] as OnboardingValues["baseline"][]).map(item=><button type="button" key={item} aria-pressed={values.baseline===item} className={values.baseline===item?"active":""} onClick={()=>setValues({...values,baseline:item})}><span>{item}</span>{values.baseline===item&&<Check aria-hidden="true"/>}</button>)}</div></div>
      </div>
    },
    {
      label: "Schedule",
      title: "Build a realistic weekly rhythm",
      sub: "Choose the days and time you can usually protect. The plan will rebalance around your real availability.",
      body: <div className="onboarding-stack">
        <div className="field" role="group" aria-label="Available study days"><span className="field-label">Available study days</span><div className="day-picker">{["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((day,index)=><button type="button" key={day} aria-label={day} aria-pressed={values.days.includes(index)} className={values.days.includes(index)?"active":""} onClick={()=>setValues({...values,days:values.days.includes(index)?values.days.filter(d=>d!==index):[...values.days,index]})}>{day.slice(0,1)}</button>)}</div></div>
        <div className="field" role="group" aria-label="Typical study time"><span className="field-label">Typical study time</span><div className="choice-list horizontal">{(["45 minutes","90 minutes","2 hours","3+ hours"] as OnboardingValues["time"][]).map(item=><button type="button" key={item} aria-pressed={values.time===item} className={values.time===item?"active":""} onClick={()=>setValues({...values,time:item})}>{item}</button>)}</div></div>
        <div className="onboarding-preview"><b>Your starting cadence</b><span>{values.days.length} study days · {studyMinutes[values.time]} minutes per selected day</span></div>
      </div>
    },
    {
      label: "Toolkit",
      title: "Choose your starting toolkit",
      sub: "Everything remains available. These selections only shape the first dashboard and recommended actions.",
      body: <div className="toolkit-grid" role="group" aria-label="Starting toolkit">{[
        ["Adaptive QBank","Weakness-weighted question blocks"],
        ["Study plan","Daily tasks to your exam date"],
        ["Flashcards","Spaced repetition from explanations"],
        ["Analytics","Performance, pacing, and peer signals"],
        ["Medical library","High-yield linked reference articles"],
        ["Notebook","Consolidated notes and incorrects"]
      ].map(([title,body])=><button type="button" key={title} aria-pressed={values.priorities.includes(title)} className={values.priorities.includes(title)?"active":""} onClick={()=>setValues({...values,priorities:values.priorities.includes(title)?values.priorities.filter(p=>p!==title):[...values.priorities,title]})}><span aria-hidden="true">{values.priorities.includes(title)?<Check/>:<i/>}</span><span><b>{title}</b><small>{body}</small></span></button>)}</div>
    }
  ];

  const finish = () => {
    const minutes = studyMinutes[values.time];
    const nextSettings = {
      ...state.planSettings,
      examDate: values.examDate,
      targetStep: values.exam,
      targetScore: values.exam === "Step 2 CK" ? Number(values.score) || 255 : 0,
      preparationStage: values.baseline,
      weeklyDays: values.days.length ? values.days : [1,2,3,4,5],
      weekdayMinutes: minutes,
      weekendMinutes: Math.max(minutes, Math.round(minutes * 1.5))
    };
    dispatch({ type: "SET_SETTINGS", settings: { dailyGoal: Math.max(10, Math.round(minutes / 2.25)) } });
    dispatch({
      type: "SET_LEARNER_PROFILE",
      profile: {
        name: values.name,
        email: values.email,
        targetExam: values.exam,
        preparationStage: values.baseline,
        toolkitPriorities: values.priorities,
        onboardingCompleted: true
      }
    });
    rebuildPlan(nextSettings);
    sessionStorage.removeItem(SIGNUP_INTENT_KEY);
    router.push("/app");
  };

  return <main className="onboarding-page">
    <header className="onboarding-header"><Logo/><span>Workspace setup</span><b>{step+1} / {screens.length}</b></header>
    <aside className="onboarding-progress">
      <div><span>STEPWISE SETUP</span><h2>Personalize the learning engine.</h2><p>Your choices initialize the demo algorithms and can be changed later.</p></div>
      <ol>{screens.map((screen,index)=><li key={screen.label} className={index===step?"active":index<step?"complete":""}><span>{index<step?<Check/>:index+1}</span><div><b>{screen.label}</b><small>{index===0?"Exam and target":index===1?"Time and cadence":"Starting workspace"}</small></div></li>)}</ol>
      <div className="onboarding-security"><ShieldCheck/><span><b>Stored locally</b><small>This frontend demo keeps setup data in your browser.</small></span></div>
    </aside>
    <section className="onboarding-content">
      <div className="onboarding-card">
        <div className="onboarding-mobile-progress"><span>{screens[step].label}</span><div><i style={{width:`${((step+1)/screens.length)*100}%`}}/></div></div>
        <div className="onboarding-copy"><h1>{screens[step].title}</h1><p>{screens[step].sub}</p></div>
        <div className="onboarding-body">{screens[step].body}</div>
        <footer><button type="button" className="btn btn-ghost" disabled={step===0} onClick={()=>setStep(value=>Math.max(0,value-1))}>Back</button><button type="button" className="btn btn-brand btn-lg" onClick={()=>step===screens.length-1?finish():setStep(value=>value+1)}>{step===screens.length-1?"Open my workspace":"Continue"}<ArrowRight/></button></footer>
      </div>
    </section>
  </main>;
}
