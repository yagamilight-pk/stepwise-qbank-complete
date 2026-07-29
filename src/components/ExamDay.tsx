"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BookOpenCheck, Check, CheckCircle2, Clock3, Coffee, Gauge,
  LockKeyhole, MonitorPlay, Play, RotateCcw, ShieldCheck, TimerReset, TriangleAlert, X
} from "lucide-react";
import {
  clearExamDayRun,
  completeTutorial,
  createExamDayRun,
  examBlockConfig,
  readExamDayRun,
  settleExamBreak,
  startExamBlock,
  startExamBreak,
  visibleBreakOverrunSeconds,
  visibleBreakSeconds,
  writeExamDayRun,
  type ExamDayPreset,
  type ExamDayRun
} from "@/lib/exam-day";
import { ACTIVE_SESSION_KEY, SESSION_CONFIG_KEY } from "@/lib/session";
import { useStepwise } from "@/lib/store";
import type { Step } from "@/lib/types";
import { getUsmleExamProfile } from "@/lib/usmle";
import { Badge, Donut, formatSeconds, Modal, PageHeader, Progress, Toast } from "./ui";

const ORIENTATION = [
  "Answer every item; unanswered items count as incorrect.",
  "Use the navigator to review only within the active block.",
  "Once a block closes, its responses cannot be changed.",
  "Unused block and tutorial time is credited to the break reserve.",
  "Use display settings and image controls before they are urgently needed."
];

export function ExamDayPage() {
  const { state } = useStepwise();
  const router = useRouter();
  const [run, setRun] = useState<ExamDayRun | null>(null);
  const [step, setStep] = useState<Step>(state.planSettings.targetStep);
  const [preset, setPreset] = useState<ExamDayPreset>("Three-block rehearsal");
  const [orientationChecks, setOrientationChecks] = useState<boolean[]>(ORIENTATION.map(() => false));
  const [now, setNow] = useState(() => Date.now());
  const [loaded, setLoaded] = useState(false);
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, setToast] = useState("");
  const profile = getUsmleExamProfile(step, state.planSettings.examDate);

  useEffect(() => {
    const restoreTimer = window.setTimeout(() => {
      const restored = readExamDayRun(localStorage);
      setRun(restored);
      setLoaded(true);
    }, 0);
    return () => window.clearTimeout(restoreTimer);
  }, []);

  useEffect(() => {
    if (!run || (run.status !== "On break" && run.status !== "Tutorial")) return;
    const timer = window.setInterval(() => {
      const currentNow = Date.now();
      setNow(currentNow);
      if (run.status !== "Tutorial") return;
      const allowance = getUsmleExamProfile(run.step, run.examDate).tutorialMinutes * 60;
      const startedAt = Date.parse(run.tutorialStartedAt ?? run.createdAt);
      const elapsed = Number.isFinite(startedAt)
        ? Math.max(0, Math.floor((currentNow - startedAt) / 1000))
        : 0;
      if (elapsed < allowance) return;
      const next = completeTutorial(run, allowance);
      setRun(next);
      if (!writeExamDayRun(localStorage, next)) {
        setToast("This browser could not save the exam-day run.");
      }
    }, 1000);
    return () => window.clearInterval(timer);
  }, [run]);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };

  const saveRun = (next: ExamDayRun) => {
    setRun(next);
    if (!writeExamDayRun(localStorage, next)) showToast("This browser could not save the exam-day run.");
  };

  const beginRun = () => {
    const eligible = state.questions.filter((question) => question.step === step && question.status === "Published");
    if (!eligible.length) {
      showToast(`No published ${step} demo items are available.`);
      return;
    }
    const next = createExamDayRun(step, state.planSettings.examDate, preset, state.questions);
    setOrientationChecks(ORIENTATION.map(() => false));
    saveRun(next);
  };

  const finishOrientation = () => {
    if (!run) return;
    const tutorialStartedAt = Date.parse(run.tutorialStartedAt ?? run.createdAt);
    const elapsed = Number.isFinite(tutorialStartedAt)
      ? Math.floor((Date.now() - tutorialStartedAt) / 1000)
      : 0;
    saveRun(completeTutorial(run, elapsed));
  };

  const openBlock = (targetRun: ExamDayRun, blockIndex: number) => {
    const settled = targetRun.status === "On break" ? settleExamBreak(targetRun) : targetRun;
    const block = settled.blocks.find((item) => item.index === blockIndex);
    if (!block?.questionIds.length) {
      showToast("This block has no eligible demonstration items.");
      return;
    }
    const next = block.status === "Active" ? settled : startExamBlock(settled, blockIndex);
    const activeBlock = next.blocks.find((item) => item.index === blockIndex);
    if (!activeBlock) {
      showToast("This exam block could not be restored.");
      return;
    }
    writeExamDayRun(localStorage, next);
    sessionStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify(examBlockConfig(next, activeBlock)));
    if (block.status !== "Active") sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    router.push("/app/session");
  };

  const beginBreak = () => {
    if (!run) return;
    saveRun(startExamBreak(run));
  };

  const resetRun = () => {
    clearExamDayRun(localStorage);
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    sessionStorage.removeItem(SESSION_CONFIG_KEY);
    setRun(null);
    setResetOpen(false);
    setOrientationChecks(ORIENTATION.map(() => false));
    showToast("Exam-day run cleared.");
  };

  const tutorialAllowance = run?.status === "Tutorial"
    ? getUsmleExamProfile(run.step, run.examDate).tutorialMinutes * 60
    : 0;
  const tutorialStartMs = run?.status === "Tutorial"
    ? Date.parse(run.tutorialStartedAt ?? run.createdAt)
    : Number.NaN;
  const tutorialElapsed = run?.status === "Tutorial" && Number.isFinite(tutorialStartMs)
    ? Math.max(0, Math.floor((now - tutorialStartMs) / 1000))
    : 0;

  if (!loaded) {
    return <div className="exam-day-loading" role="status"><span><Gauge/></span><b>Restoring exam-day command deck</b></div>;
  }

  if (!run) {
    return <>
      <PageHeader
        eyebrow="Testing-day rehearsal"
        title="Rehearse the day, not only the questions."
        description="Train block closure, break allocation, pacing, and restart recovery with the current USMLE delivery structure."
      />
      <section className="exam-setup-grid">
        <article className="panel exam-setup-primary">
          <header><span><MonitorPlay/></span><div><Badge tone="brand">Exam Command Deck</Badge><h2>Configure a realistic run</h2><p>Your responses and phase are recovered locally if the tab refreshes.</p></div></header>
          <div className="exam-setup-field">
            <span>Exam</span>
            <div role="group" aria-label="Select exam">
              {(["Step 1", "Step 2 CK"] as Step[]).map((item) => <button key={item} className={step === item ? "active" : ""} aria-pressed={step === item} onClick={() => setStep(item)}>{item}</button>)}
            </div>
          </div>
          <div className="exam-setup-field">
            <span>Rehearsal depth</span>
            <div className="exam-preset-grid" role="group" aria-label="Select rehearsal depth">
              {(["Three-block rehearsal", "Full-day simulation"] as ExamDayPreset[]).map((item) => <button key={item} className={preset === item ? "active" : ""} aria-pressed={preset === item} onClick={() => setPreset(item)}><b>{item}</b><small>{item === "Three-block rehearsal" ? "A focused sequence with a 15-minute training reserve." : `${profile.blocksPerExam} blocks with the official ${profile.breakMinutes}-minute starting reserve.`}</small></button>)}
            </div>
          </div>
          <button className="btn btn-brand btn-lg" onClick={beginRun}><Play/> Enter orientation <ArrowRight/></button>
        </article>
        <aside className="panel exam-spec-card">
          <header><ShieldCheck/><div><small>{profile.label}</small><h2>{step} day architecture</h2></div></header>
          <dl>
            <div><dt>Blocks</dt><dd>{profile.blocksPerExam}</dd></div>
            <div><dt>Block length</dt><dd>{profile.blockMinutes} min</dd></div>
            <div><dt>Items per block</dt><dd>up to {profile.maxItemsPerBlock}</dd></div>
            <div><dt>Break reserve</dt><dd>{profile.breakMinutes} min</dd></div>
            <div><dt>Optional tutorial</dt><dd>{profile.tutorialMinutes} min</dd></div>
            <div><dt>Exam-day length</dt><dd>{profile.examDayHours} hr</dd></div>
          </dl>
          <div className="exam-scope-note"><TriangleAlert/><p>This simulates frontend workflow using original demonstration items. It is not an official USMLE form, score prediction, or licensed test-center emulator.</p></div>
        </aside>
      </section>
      <Toast message={toast} visible={Boolean(toast)}/>
    </>;
  }

  if (run.status === "Tutorial") {
    const boundedTutorialElapsed = Math.min(tutorialAllowance, tutorialElapsed);
    const ready = orientationChecks.every(Boolean);
    return <main className="exam-orientation">
      <header><div><Badge tone="brand">Optional tutorial</Badge><h1>Build your testing-day muscle memory.</h1><p>Confirm the operational rules you will rely on when fatigue rises.</p></div><div className="orientation-timer"><Clock3/><span><b>{formatSeconds(Math.max(0, tutorialAllowance - boundedTutorialElapsed))}</b><small>tutorial remaining</small></span></div></header>
      <section className="panel orientation-panel">
        <div className="orientation-screen"><MonitorPlay/><div><span>Stepwise testing workspace</span><b>One active block. One visible timer. Deliberate closure.</b><p>Keyboard navigation, answer elimination, flagging, laboratory values, calculator, display controls, crash recovery, and block review are available in the session workspace.</p></div></div>
        <div className="orientation-checklist">
          <h2>Readiness checklist</h2>
          {ORIENTATION.map((item, index) => <label key={item} className={orientationChecks[index] ? "checked" : ""}><input type="checkbox" checked={orientationChecks[index]} onChange={(event) => setOrientationChecks((current) => current.map((value, itemIndex) => itemIndex === index ? event.target.checked : value))}/><span>{orientationChecks[index] ? <Check/> : index + 1}</span><b>{item}</b></label>)}
        </div>
        <footer><button className="btn btn-ghost" onClick={() => setResetOpen(true)}><X/> Leave run</button><button className="btn btn-brand btn-lg" disabled={!ready} onClick={finishOrientation}>Complete orientation <ArrowRight/></button></footer>
      </section>
      <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Clear this exam-day run?" description="The tutorial and all completed block records in this run will be removed from this browser."><div className="exit-modal-actions"><button className="btn btn-secondary" onClick={() => setResetOpen(false)}>Keep run</button><button className="btn btn-danger" onClick={resetRun}>Clear run</button></div></Modal>
      <Toast message={toast} visible={Boolean(toast)}/>
    </main>;
  }

  const completed = run.blocks.filter((block) => block.status === "Complete");
  const active = run.blocks.find((block) => block.status === "Active");
  const next = run.blocks.find((block) => block.status === "Ready");
  const breakSeconds = visibleBreakSeconds(run, now);
  const activeBreakOverrun = visibleBreakOverrunSeconds(run, now);
  const totalBreakOverrun = Math.max(0, run.totalBreakOverrunSeconds ?? 0) + activeBreakOverrun;
  const totalCorrect = completed.reduce((sum, block) => sum + block.correct, 0);
  const totalItems = completed.reduce((sum, block) => sum + block.questionIds.length, 0);
  const aggregateAccuracy = totalItems ? Math.round((totalCorrect / totalItems) * 100) : 0;
  const earnedBreak = completed.reduce((sum, block) => sum + block.breakSecondsEarned, 0)
    + Math.max(0, getUsmleExamProfile(run.step, run.examDate).tutorialMinutes * 60 - run.tutorialSecondsUsed);

  return <main className="exam-command">
    <PageHeader
      eyebrow={`${run.step} · ${run.preset}`}
      title={run.status === "Complete" ? "Testing-day rehearsal complete." : run.status === "On break" ? "Break clock is active." : "Your next irreversible action is clear."}
      description={run.status === "Complete" ? "Review the day as a pacing and endurance signal, then translate it into the next study decision." : "Completed blocks stay locked. The command deck preserves the run, break reserve, and next block across refreshes."}
      actions={<button className="btn btn-secondary" onClick={() => setResetOpen(true)}><RotateCcw/> New run</button>}
    />

    <section className="command-strip panel" aria-label="Exam-day status">
      <div className="command-identity"><span><ShieldCheck/></span><div><small>RUN ID</small><b>{run.id.toUpperCase()}</b></div></div>
      <div><small>PHASE</small><b>{run.status}</b></div>
      <div><small>BLOCKS CLOSED</small><b>{completed.length} / {run.blocks.length}</b></div>
      <div><small>BREAK RESERVE</small><b className={breakSeconds < 300 ? "warning" : ""}>{formatSeconds(breakSeconds)}</b></div>
      <div><small>TIME EARNED</small><b>+{formatSeconds(earnedBreak)}</b></div>
      {totalBreakOverrun > 0 && <div><small>BREAK OVERAGE</small><b className="warning">-{formatSeconds(totalBreakOverrun)}</b></div>}
    </section>

    <section className="block-ledger panel">
      <header><div><span className="card-kicker"><LockKeyhole/> Block ledger</span><h2>Closed means closed</h2></div><div><span><i className="complete"/> Complete</span><span><i className="active"/> Active</span><span><i/> Ready</span></div></header>
      <div className="block-rail" role="list" aria-label="Exam blocks">{run.blocks.map((block) => <article key={block.index} role="listitem" className={block.status.toLowerCase()}>
        <span>{block.status === "Complete" ? <Check/> : block.index + 1}</span>
        <div><small>BLOCK {String(block.index + 1).padStart(2, "0")}</small><b>{block.status}</b></div>
        {block.status === "Complete" && <strong>{block.accuracy}%</strong>}
      </article>)}</div>
    </section>

    {run.status === "Complete" ? <section className="exam-complete-grid">
      <article className="panel exam-complete-score"><Donut value={aggregateAccuracy} size={188} detail="day accuracy"/><div><Badge tone="success"><CheckCircle2/> Run complete</Badge><h2>{totalCorrect} of {totalItems} demonstration items correct</h2><p>Treat this as a workflow, stamina, and pacing rehearsal—not a USMLE score estimate.</p><div><span><b>{formatSeconds(completed.reduce((sum, block) => sum + block.elapsedSeconds, 0))}</b><small>active block time</small></span><span><b>{formatSeconds(breakSeconds)}</b><small>reserve remaining</small></span></div></div></article>
      <aside className="panel exam-debrief"><span className="card-kicker"><BookOpenCheck/> Debrief protocol</span><h2>Convert the day into a decision.</h2><ol><li>Review confident misses before low-confidence misses.</li><li>Compare pace across the first, middle, and final blocks.</li><li>Record the break pattern that protected concentration.</li></ol><button className="btn btn-brand btn-block" onClick={() => router.push("/app/analytics")}>Open performance analysis <ArrowRight/></button></aside>
    </section> : <section className="exam-action-grid">
      <article className="panel next-block-card">
        <span className="card-kicker"><MonitorPlay/> Next testing action</span>
        {active ? <><Badge tone="warning">Block {active.index + 1} active</Badge><h2>Resume the block in progress.</h2><p>The saved session draft preserves position, answers, eliminations, flags, and elapsed exam time.</p><button className="btn btn-brand btn-lg" onClick={() => openBlock(run, active.index)}><Play/> Resume block {active.index + 1} <ArrowRight/></button></>
          : next ? <><Badge tone="brand">Block {next.index + 1} ready</Badge><h2>{run.status === "On break" ? "End the break when you are reset." : "Begin only when you are ready to commit."}</h2><p>Once started, the {run.blockMinutes}-minute clock runs continuously. Closing the block permanently locks its answers.</p><button className="btn btn-brand btn-lg" onClick={() => openBlock(run, next.index)}>{run.status === "On break" ? <TimerReset/> : <Play/>}{run.status === "On break" ? "End break & begin" : `Begin block ${next.index + 1}`} <ArrowRight/></button></> : null}
      </article>
      <aside className={`panel break-console ${run.status === "On break" ? "active" : ""}`}>
        <header><span><Coffee/></span><div><small>BREAK RESERVE</small><strong>{formatSeconds(breakSeconds)}</strong></div></header>
        <Progress value={(breakSeconds / Math.max(run.startingBreakSeconds + earnedBreak, 1)) * 100}/>
        {activeBreakOverrun > 0 && <div className="break-overrun-note" role="status"><TriangleAlert/><span><b>{formatSeconds(activeBreakOverrun)} over reserve</b><small>This time will be deducted from the next testing block.</small></span></div>}
        <p>{run.status === "On break" ? "The reserve is counting down from the stored wall clock—even if this page refreshes." : "Any time between blocks counts against the reserve. Unused block time is credited automatically."}</p>
        {run.status === "On break" ? <div className="break-lock-note"><LockKeyhole/><span><b>Break ends with the next block</b><small>This prevents uncounted time between phases.</small></span></div> : <button className="btn btn-secondary btn-block" disabled={Boolean(active) || breakSeconds <= 0} onClick={beginBreak}><Coffee/> Start break</button>}
      </aside>
    </section>}

    {run.recycledDemoContent && <div className="exam-demo-boundary"><TriangleAlert/><div><b>Workflow fidelity, limited content pool</b><p>The original demo library is smaller than a complete exam form, so questions repeat across blocks. Block timing, locking, break accounting, persistence, and recovery remain fully exercised.</p></div></div>}

    <Modal open={resetOpen} onClose={() => setResetOpen(false)} title="Start a new exam-day run?" description="This removes the current command deck, block records, and any active block draft from this browser."><div className="exit-modal-actions"><button className="btn btn-secondary" onClick={() => setResetOpen(false)}>Keep current run</button><button className="btn btn-danger" onClick={resetRun}>Clear & configure</button></div></Modal>
    <Toast message={toast} visible={Boolean(toast)}/>
  </main>;
}
