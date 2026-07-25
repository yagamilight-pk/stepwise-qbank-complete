"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Activity, AlarmClock, ArrowRight, BarChart3, BookCheck, BookOpen, BrainCircuit,
  Calendar, CalendarDays, Check, ChevronRight, CircleAlert, Clock3, Compass, Flame,
  Gauge, Layers3, Lightbulb, ListFilter, LockKeyhole, MoreHorizontal, Play, RefreshCw, Search,
  Settings2, SlidersHorizontal, Sparkles, Target, TrendingUp, Trophy, WandSparkles, Zap
} from "lucide-react";
import { confidenceMatrix, dailyActivity, peerBenchmark, performanceWindow, readinessEstimate, rollingAccuracy, selectQuestions, studyStreak, systemPerformance } from "@/lib/algorithms";
import { useStepwise } from "@/lib/store";
import type { Difficulty, SessionConfig, SessionMode, Step, StudyPlanSettings } from "@/lib/types";
import { Badge, Donut, EmptyState, Field, formatDate, Modal, PageHeader, Progress, Sparkline, StatCard, Toast, uid } from "./ui";
import { AccessibleTabs } from "./AccessibleTabs";
import { SessionPage } from "./Session";
import { CommunityPage, FlashcardsPage, NotebookPage, SettingsPage } from "./LearnerMore";
import { MedicalLibraryPage } from "./MedicalLibrary";

export function LearnerPage({ section }: { section: string }) {
  if (section === "qbank") return <QBankPage/>;
  if (section === "session") return <SessionPage/>;
  if (section === "analytics") return <AnalyticsPage/>;
  if (section === "study-plan") return <StudyPlanPage/>;
  if (section === "flashcards") return <FlashcardsPage/>;
  if (section === "library") return <MedicalLibraryPage/>;
  if (section === "notebook") return <NotebookPage/>;
  if (section === "community") return <CommunityPage/>;
  if (section === "settings") return <SettingsPage/>;
  return <DashboardPage/>;
}

function DashboardPage() {
  const { state, dispatch } = useStepwise();
  const [toast, setToast] = useState("");
  const [activityRange, setActivityRange] = useState<7 | 30>(7);
  const stepQuestions = state.questions.filter(question=>question.step==="Step 2 CK");
  const stepQuestionIds = new Set(stepQuestions.map(question=>question.id));
  const stepAttempts = state.attempts.filter(attempt=>stepQuestionIds.has(attempt.questionId));
  const readiness = readinessEstimate(state, "Step 2 CK");
  const performance = systemPerformance(stepQuestions, stepAttempts);
  const activity = dailyActivity(stepAttempts, activityRange);
  const sevenDay = performanceWindow(stepAttempts, 7);
  const streak = studyStreak(stepAttempts);
  const todayTasks = state.studyTasks.filter(task=>task.date === "2026-07-22");
  const completed = todayTasks.filter(task=>task.completed).length;
  const answeredToday = stepAttempts.filter(attempt=>attempt.createdAt.slice(0,10)==="2026-07-22").length;
  const dueCards = state.flashcards.filter(card=>new Date(card.dueAt)<=new Date("2026-07-22T23:59:59Z")).length;
  const recentMisses = stepAttempts.filter(attempt=>!attempt.correct).length;
  const highestLeverage = performance[0];
  const weeklyQuestions = activity.reduce((sum, day)=>sum+day.attempts,0);
  const streakWeek = dailyActivity(stepAttempts, 7);
  const remainingToday = todayTasks.filter(task=>!task.completed).reduce((sum,task)=>sum+task.minutes,0);
  const showToast = (message:string)=>{setToast(message);window.setTimeout(()=>setToast(""),1800)};
  const saveInsight = () => {
    const title = sevenDay.paceDelta > 0 ? "Pacing improved without an accuracy tradeoff" : "Current performance signal";
    const body = sevenDay.priorCount
      ? `Over the last 7 days, accuracy changed by ${sevenDay.accuracyDelta} points and average pace changed by ${sevenDay.paceDelta} seconds compared with the prior period.`
      : `Your current 7-day baseline is ${sevenDay.accuracy}% accuracy at ${sevenDay.averageTime || 0} seconds per question. Continue recording answers to unlock period-over-period comparison.`;
    dispatch({type:"UPSERT_NOTE",note:{id:uid("insight"),title,body,tags:["analytics","weekly insight"],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}});
    showToast("Insight saved to your notebook");
  };

  return <>
    <PageHeader eyebrow="Sample learner · Step 2 CK" title="Your next best action is ready." description={`This demonstration plan has ${remainingToday} focused minutes remaining in its sample day.`} actions={<Link className="btn btn-brand" href="/app/qbank"><Play size={16}/> Start a session</Link>}/>
    <section className="dashboard-hero-grid">
      <article className="readiness-card panel"><div><div className="card-kicker"><Target/> Readiness signal</div><h2>{readiness.score>=70?"On track for your goal":"Build coverage to strengthen readiness"}</h2><p>{highestLeverage?`${highestLeverage.system} is currently the highest-leverage focus based on mastery and coverage.`:"Complete a block to generate a personalized focus area."}</p><div className="readiness-details"><span><b>{readiness.accuracy}%</b> accuracy</span><span><b>{readiness.coverage}%</b> coverage</span><span><b>{readiness.calibrated}%</b> calibrated</span></div><small className="model-note">Frontend heuristic from sample activity—not a predicted exam score.</small><Link href="/app/analytics">Open readiness analysis <ArrowRight size={15}/></Link></div><Donut value={readiness.score} size={150} detail="readiness"/></article>
      <article className="streak-card panel"><div className="streak-icon"><Flame/></div><div><span>Current streak</span><strong>{streak.current} days</strong><p>Best: {streak.best} days</p></div><div className="streak-week">{streakWeek.map((day,index)=><span key={day.date} className={`${day.attempts?"done":""} ${index===streakWeek.length-1?"today":""}`.trim()}><b>{day.attempts?<Check/>:day.label.slice(0,1)}</b><small>{day.label.slice(0,1)}</small></span>)}</div></article>
    </section>

    <section className="stat-grid four">
      <StatCard label="Questions today" value={answeredToday} detail={` of ${state.settings.dailyGoal} daily goal`} icon={<BookCheck/>}><Progress value={(answeredToday/state.settings.dailyGoal)*100}/></StatCard>
      <StatCard label="7-day accuracy" value={`${sevenDay.accuracy}%`} trend={sevenDay.priorCount?`${sevenDay.accuracyDelta>=0?"↗":"↘"} ${Math.abs(sevenDay.accuracyDelta)} pts `:"Baseline "} detail={sevenDay.priorCount?"from prior week":"keep answering to compare"} icon={<TrendingUp/>}><Sparkline values={rollingAccuracy(stepAttempts).slice(-7)} height={34}/></StatCard>
      <StatCard label="Cards due" value={dueCards} detail=" about 4 minutes" icon={<Layers3/>}><Link href="/app/flashcards">Review now <ChevronRight/></Link></StatCard>
      <StatCard label="Average pace" value={sevenDay.averageTime?`${Math.floor(sevenDay.averageTime/60)}:${String(sevenDay.averageTime%60).padStart(2,"0")}`:"—"} trend={sevenDay.priorCount?`${Math.abs(sevenDay.paceDelta)} sec ${sevenDay.paceDelta>=0?"faster ":"slower "}`:"Baseline "} detail={sevenDay.priorCount?"than prior week":"safe target: 45–120 sec"} icon={<Clock3/>}><Progress value={sevenDay.averageTime?Math.max(0,Math.min(100,Math.round(120/sevenDay.averageTime*74))):0}/></StatCard>
    </section>

    <section className="dashboard-main-grid">
      <article className="panel todays-plan"><header><div><div className="card-kicker"><CalendarDays/> Sample day plan</div><h2>{completed} of {todayTasks.length} tasks complete</h2></div><Link href="/app/study-plan">Full plan <ArrowRight/></Link></header><Progress value={todayTasks.length ? (completed/todayTasks.length)*100 : 0}/><div className="task-list">{todayTasks.map(task=><div key={task.id} className={task.completed?"task-row completed":"task-row"}><button aria-label={`${task.completed?"Reopen":"Complete"} ${task.title}`} onClick={()=>{dispatch({type:"TOGGLE_TASK",id:task.id});showToast(task.completed?"Task reopened":"Task completed")}}>{task.completed?<Check/>:<span/>}</button><span className={`task-type task-type-${task.type.toLowerCase()}`}>{task.type === "Questions"?<BookCheck/>:task.type === "Flashcards"?<Layers3/>:<BookOpen/>}</span><div><b>{task.title}</b><p>{task.detail}</p></div><span>{task.minutes} min</span>{!task.completed&&<Link aria-label={`Open ${task.title}`} href={task.type==="Flashcards"?"/app/flashcards":"/app/qbank"}><ArrowRight/></Link>}</div>)}</div></article>
      <article className="panel mastery-panel"><header><div><div className="card-kicker"><Gauge/> System mastery</div><h2>Focus where it compounds</h2></div><Link href="/app/analytics">Details</Link></header><div className="mastery-list">{performance.slice(0,5).map((item,index)=><div key={item.system}><div><span><i className={`rank rank-${index+1}`}>{index+1}</i>{item.system}</span><b>{item.mastery}%</b></div><Progress value={item.mastery}/><small>{item.attempts?`${item.attempts} attempt${item.attempts===1?"":"s"} · ${item.accuracy}% accuracy`:`Not started · ${item.coverage} item${item.coverage===1?"":"s"}`}</small></div>)}</div><footer><CircleAlert/><span><b>Highest leverage:</b> {highestLeverage?`${highestLeverage.system} is prioritized because its mastery signal is ${highestLeverage.mastery}%.`:"Complete a question block to generate a system priority."}</span></footer></article>
    </section>

    <section className="dashboard-bottom-grid">
      <article className="panel activity-panel"><header><div><div className="card-kicker"><Activity/> Practice activity</div><h2>See the work behind the signal</h2></div><select aria-label="Activity date range" value={activityRange} onChange={event=>setActivityRange(Number(event.target.value) as 7|30)}><option value="7">Last 7 days</option><option value="30">Last 30 days</option></select></header><p className="sr-only">The sample learner answered {weeklyQuestions} questions in this period.</p><div className="activity-chart" aria-hidden="true">{activity.map((day,index)=><div key={day.date}><span>{day.attempts ? day.attempts : ""}</span><i style={{height:`${Math.max(6,day.attempts*13)}px`}} className={index===activity.length-1?"today":""}/><small>{day.label}</small></div>)}</div><div className="activity-summary"><span><i/> {weeklyQuestions} questions answered</span><b>{sevenDay.priorCount?`${sevenDay.count-sevenDay.priorCount>=0?"+":""}${sevenDay.count-sevenDay.priorCount} vs prior week`:"Baseline period"}</b></div></article>
      <article className="panel insight-card"><div className="insight-icon"><Lightbulb/></div><div className="card-kicker">Weekly insight</div><h2>{sevenDay.priorCount?(sevenDay.paceDelta>0?"Your speed improved across the comparison window.":"Your pacing signal needs deliberate review."):"Your baseline performance signal is ready."}</h2><p>{sevenDay.priorCount?`Accuracy changed ${sevenDay.accuracyDelta>=0?"+":""}${sevenDay.accuracyDelta} points while average response time changed ${sevenDay.paceDelta>=0?`${sevenDay.paceDelta} seconds faster`:`${Math.abs(sevenDay.paceDelta)} seconds slower`}.`:`You are at ${sevenDay.accuracy}% accuracy with an average pace of ${sevenDay.averageTime || 0} seconds. A second week will unlock a reliable trend comparison.`}</p><button className="btn btn-secondary" onClick={saveInsight}>Save insight</button></article>
      <article className="panel quick-actions"><div className="card-kicker"><Zap/> Quick actions</div><h2>Jump back in</h2><div><Link href="/app/qbank"><span><WandSparkles/></span><div><b>Adaptive block</b><small>Weakness weighted</small></div><ArrowRight/></Link><Link href="/app/flashcards"><span><Layers3/></span><div><b>Review due cards</b><small>{dueCards} ready now</small></div><ArrowRight/></Link><Link href="/app/notebook"><span><BookCheck/></span><div><b>Review incorrects</b><small>{recentMisses} recent miss{recentMisses===1?"":"es"}</small></div><ArrowRight/></Link></div></article>
    </section>
    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

const defaultConfig: SessionConfig = {
  step: "Step 2 CK", mode: "Adaptive", count: 20, systems: [], disciplines: [], difficulties: [], include: "All", timePerQuestionSec: 90
};

function QBankPage() {
  const { state } = useStepwise();
  const router = useRouter();
  const [config,setConfig]=useState<SessionConfig>(defaultConfig);
  const [tab,setTab]=useState<"build"|"library"|"history">("build");
  const [search,setSearch]=useState("");
  const [builderHelp,setBuilderHelp]=useState(false);
  const [toast,setToast]=useState("");
  const available=state.questions.filter(question=>question.status==="Published"&&question.step===config.step);
  const systems=[...new Set(available.map(question=>question.system))];
  const disciplines=[...new Set(available.map(question=>question.discipline))];
  const matches=available.filter(question=>question.stem.toLowerCase().includes(search.toLowerCase())||question.topic.toLowerCase().includes(search.toLowerCase())||question.id.toLowerCase().includes(search.toLowerCase()));
  const selectedCount=selectQuestions(state,{...config,count:999}).length;
  const start=(override?:SessionConfig)=>{const next=override??config;sessionStorage.setItem("stepwise-session-config",JSON.stringify(next));router.push("/app/session")};
  const toggleArray=<T,>(list:T[], value:T)=>list.includes(value)?list.filter(item=>item!==value):[...list,value];

  return <>
    <PageHeader title="Question bank" description="Build exam-style blocks or let the adaptive engine choose your highest-value questions." actions={<><button className="btn btn-secondary" onClick={()=>setBuilderHelp(true)}><CircleAlert/> How selection works</button><button className="btn btn-brand" onClick={()=>start()} disabled={!selectedCount}><Play/> Start block</button></>}/>
    <AccessibleTabs tabs={["build","library","history"]} value={tab} onChange={(value)=>setTab(value as typeof tab)} label="Question bank views" renderLabel={(value)=>value==="build"?"Build a block":value==="library"?"Browse library":"Session history"}/>
    {tab==="build"&&<section className="qbank-builder-grid">
      <article className="panel builder-main">
        <header><div><span className="feature-icon"><Settings2/></span><div><h2>Configure your block</h2><p>{selectedCount} eligible questions with current filters</p></div></div><button onClick={()=>setConfig(defaultConfig)}>Reset filters</button></header>
        <div className="builder-section"><div className="builder-section-title"><span>1</span><div><h3>Choose your exam</h3><p>Question style and content coverage change by exam.</p></div></div><div className="large-choice-grid">{(["Step 1","Step 2 CK"] as Step[]).map(step=><button key={step} className={config.step===step?"active":""} onClick={()=>setConfig({...config,step,systems:[],disciplines:[]})}><span className="exam-choice-mark">{step==="Step 1"?"S1":"S2"}</span><div><b>USMLE {step}</b><small>{step==="Step 1"?"Foundational science and mechanisms":"Clinical knowledge and decision making"}</small></div>{config.step===step&&<Check/>}</button>)}</div></div>
        <div className="builder-section"><div className="builder-section-title"><span>2</span><div><h3>Select a session mode</h3><p>Control feedback timing, pacing, and question selection.</p></div></div><div className="mode-grid">{(["Tutor","Timed","Exam","Adaptive"] as SessionMode[]).map(mode=><button key={mode} className={config.mode===mode?"active":""} onClick={()=>setConfig({...config,mode})}><span>{mode==="Tutor"?<BookOpen/>:mode==="Timed"?<Clock3/>:mode==="Exam"?<LockKeyhole/>:<Sparkles/>}</span><b>{mode}</b><small>{mode==="Tutor"?"Immediate explanations":mode==="Timed"?"Paced, review after":mode==="Exam"?"No feedback until end":"Weakness weighted"}</small>{mode==="Adaptive"&&<Badge tone="brand">Recommended</Badge>}</button>)}</div></div>
        <div className="builder-section"><div className="builder-section-title"><span>3</span><div><h3>Focus the content</h3><p>Leave selections empty to include every category.</p></div></div><div className="filter-columns"><div><div className="filter-head"><b>Systems</b><button onClick={()=>setConfig({...config,systems:config.systems.length?[]:systems})}>{config.systems.length?"Clear":"Select all"}</button></div><div className="check-list">{systems.map(system=><label key={system}><input type="checkbox" checked={config.systems.includes(system)} onChange={()=>setConfig({...config,systems:toggleArray(config.systems,system)})}/><i><Check/></i><span>{system}</span><small>{available.filter(q=>q.system===system).length}</small></label>)}</div></div><div><div className="filter-head"><b>Disciplines</b><button onClick={()=>setConfig({...config,disciplines:config.disciplines.length?[]:disciplines})}>{config.disciplines.length?"Clear":"Select all"}</button></div><div className="check-list">{disciplines.map(discipline=><label key={discipline}><input type="checkbox" checked={config.disciplines.includes(discipline)} onChange={()=>setConfig({...config,disciplines:toggleArray(config.disciplines,discipline)})}/><i><Check/></i><span>{discipline}</span><small>{available.filter(q=>q.discipline===discipline).length}</small></label>)}</div></div></div></div>
        <div className="builder-section builder-final"><div><div className="builder-section-title"><span>4</span><div><h3>Set block details</h3><p>Choose volume, difficulty, and question status.</p></div></div><div className="inline-fields"><Field label="Question count" hint="Focused 20 or exam-style 40"><div className="question-count-control"><div className="stepper"><button aria-label="Decrease question count" onClick={()=>setConfig({...config,count:Math.max(5,config.count-5)})}>−</button><input aria-label="Question count" type="number" min="1" max="40" value={config.count} onChange={e=>setConfig({...config,count:Math.min(40,Math.max(1,Number(e.target.value)||1))})}/><button aria-label="Increase question count" onClick={()=>setConfig({...config,count:Math.min(40,config.count+5)})}>+</button></div><div className="block-presets">{[10,20,40].map(count=><button type="button" key={count} className={config.count===count?"active":""} onClick={()=>setConfig({...config,count})}>{count}</button>)}</div></div></Field><Field label="Question status"><select value={config.include} onChange={e=>setConfig({...config,include:e.target.value as SessionConfig["include"]})}>{["All","Unused","Incorrect","Flagged","Bookmarked"].map(option=><option key={option}>{option}</option>)}</select></Field></div><div className="difficulty-picker"><span>Difficulty</span>{(["Easy","Medium","Hard"] as Difficulty[]).map(item=><button key={item} className={config.difficulties.includes(item)?"active":""} onClick={()=>setConfig({...config,difficulties:toggleArray(config.difficulties,item)})}>{item}</button>)}</div></div></div>
      </article>
      <aside className="builder-summary panel"><div className="adaptive-summary-icon"><Compass/></div><Badge tone="brand">Adaptive preview</Badge><h2>Your next block</h2><p>Based on current filters and performance signals.</p><div className="summary-number"><strong>{Math.min(config.count,selectedCount)}</strong><span>questions</span></div><dl><div><dt>Exam</dt><dd>{config.step}</dd></div><div><dt>Mode</dt><dd>{config.mode}</dd></div><div><dt>Estimated time</dt><dd>{Math.ceil(Math.min(config.count,selectedCount)*config.timePerQuestionSec/60)} min</dd></div><div><dt>Feedback</dt><dd>{config.mode==="Tutor"?"Immediate":"After block"}</dd></div></dl>{config.mode==="Adaptive"&&<div className="adaptive-breakdown"><b>Selection signals</b>{[["Weakness repair",30],["Unseen coverage",28],["Knowledge staleness",17],["Confidence mismatch",13],["Challenge fit",12]].map(([label,value])=><div key={String(label)}><span>{label}</span><Progress value={Number(value)}/><small>{value}%</small></div>)}</div>}<button className="btn btn-brand btn-block btn-lg" onClick={()=>start()} disabled={!selectedCount}>Start block <ArrowRight/></button><small className="keyboard-hint">Submitted answers and analytics signals save automatically.</small></aside>
    </section>}
    {tab==="library"&&<section className="panel library-panel"><header><div className="table-search"><Search/><input aria-label="Search questions" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search question IDs, topics, or stems…"/></div><div><select aria-label="Question library exam" value={config.step} onChange={e=>setConfig({...config,step:e.target.value as Step})}><option>Step 1</option><option>Step 2 CK</option></select><button className="btn btn-secondary" onClick={()=>{setTab("build");setToast("Advanced filters opened in the block builder");setTimeout(()=>setToast(""),1600)}}><ListFilter/> Filters</button></div></header><div className="responsive-table"><table><caption className="sr-only">Available demonstration questions</caption><thead><tr><th scope="col">Question</th><th scope="col">System</th><th scope="col">Topic</th><th scope="col">Difficulty</th><th scope="col">Sample accuracy</th><th scope="col">Action</th></tr></thead><tbody>{matches.map(question=><tr key={question.id}><td><div className="question-cell"><span>{question.id}</span><p>{question.stem.slice(0,90)}…</p></div></td><td>{question.system}</td><td>{question.topic}</td><td><Badge tone={question.difficulty==="Hard"?"danger":question.difficulty==="Easy"?"success":"warning"}>{question.difficulty}</Badge></td><td>{question.globalAccuracy}%</td><td><button className="icon-btn" aria-label={`Start ${question.id}`} onClick={()=>start({...config,step:question.step,mode:"Tutor",count:1,systems:[question.system],disciplines:[],difficulties:[],include:"All",questionIds:[question.id]})}><Play/></button></td></tr>)}{!matches.length&&<tr><td colSpan={6}><EmptyState icon={<Search/>} title="No matching questions" description="Clear the search or choose a different exam to restore the question list." action={<button className="btn btn-secondary" onClick={()=>setSearch("")}>Clear search</button>}/></td></tr>}</tbody></table></div></section>}
    {tab==="history"&&<section className="panel history-panel">{state.sessions.length?<div className="responsive-table"><table><caption className="sr-only">Question session history</caption><thead><tr><th scope="col">Date</th><th scope="col">Exam</th><th scope="col">Mode</th><th scope="col">Questions</th><th scope="col">Status</th><th scope="col">Action</th></tr></thead><tbody>{state.sessions.map(session=><tr key={session.id}><td>{formatDate(session.createdAt)}</td><td>{session.config.step}</td><td>{session.config.mode}</td><td>{session.questionIds.length}</td><td><Badge tone={session.completedAt?"success":"warning"}>{session.completedAt?"Complete":"Interrupted"}</Badge></td><td><button className="btn btn-secondary" onClick={()=>start({...session.config,count:session.questionIds.length,questionIds:session.questionIds})}>Build similar</button></td></tr>)}</tbody></table></div>:<EmptyState icon={<AlarmClock/>} title="No session history yet" description="Complete your first question block and its performance summary will appear here." action={<button className="btn btn-brand" onClick={()=>setTab("build")}>Build a block</button>}/>}</section>}
    <Modal open={builderHelp} onClose={()=>setBuilderHelp(false)} title="How adaptive selection works" description="The frontend uses a deterministic, explainable ranking model."><div className="algorithm-explainer">{[["30%","Weakness","Prior incorrect answers and low topic accuracy"],["28%","Unseen coverage","New items receive a meaningful first-exposure boost"],["17%","Knowledge staleness","Older encounters are more likely to reappear"],["13%","Confidence mismatch","Confident misses are prioritized over low-confidence misses"],["12%","Challenge fit","Difficulty is matched to recent performance"]].map(([weight,title,body])=><div key={title}><b>{weight}</b><span><strong>{title}</strong><p>{body}</p></span></div>)}</div></Modal>
    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function AnalyticsPage() {
  const { state } = useStepwise();
  const router = useRouter();
  const [step,setStep]=useState<Step>("Step 2 CK");
  const [range,setRange]=useState("30 days");
  const [tab,setTab]=useState("Overview");
  const questions=state.questions.filter(question=>question.step===step);
  const ids=new Set(questions.map(question=>question.id));
  const cutoff=range==="All time"?0:new Date("2026-07-22T23:59:59Z").getTime()-(range==="7 days"?7:30)*86_400_000;
  const attempts=state.attempts.filter(attempt=>ids.has(attempt.questionId)&&new Date(attempt.createdAt).getTime()>=cutoff);
  const performance=systemPerformance(questions,attempts);
  const readiness=readinessEstimate({...state,attempts},step);
  const accuracy=attempts.length?Math.round(attempts.filter(a=>a.correct).length/attempts.length*100):0;
  const avgTime=attempts.length?Math.round(attempts.reduce((sum,a)=>sum+a.timeSec,0)/attempts.length):0;
  const highConfidenceMisses=attempts.filter(a=>!a.correct&&a.confidence>=4).length;
  const trendValues=rollingAccuracy(attempts);
  const peer=peerBenchmark(attempts,questions);
  const matrix=confidenceMatrix(attempts);
  const maxTrend=Math.max(...trendValues,1);
  const trendPoints=trendValues.map((value,index)=>`${Math.round(index/Math.max(trendValues.length-1,1)*700)},${Math.round(225-value/maxTrend*175)}`).join(" ");
  const peerBands=[8,14,25,38,55,72,84,68,48,31,18,9];
  const startPractice = (systems: string[] = [], questionIds?: string[]) => {
    const config: SessionConfig = {
      step,
      mode: questionIds?.length ? "Tutor" : "Adaptive",
      count: Math.max(1, questionIds?.length ?? 10),
      systems,
      disciplines: [],
      difficulties: [],
      include: questionIds?.length || systems.length ? "All" : "Incorrect",
      timePerQuestionSec: 90,
      questionIds
    };
    sessionStorage.setItem("stepwise-session-config", JSON.stringify(config));
    router.push("/app/session");
  };
  const correctionIds = [...new Set(attempts.filter(attempt=>!attempt.correct&&attempt.confidence>=4).map(attempt=>attempt.questionId))];

  return <>
    <PageHeader title="Analytics" description="See what is improving, what is fragile, and how this sample learner compares with a simulated cohort." actions={<div className="header-selects"><select aria-label="Analytics exam" value={step} onChange={e=>setStep(e.target.value as Step)}><option>Step 1</option><option>Step 2 CK</option></select><select aria-label="Analytics date range" value={range} onChange={e=>setRange(e.target.value)}><option>7 days</option><option>30 days</option><option>All time</option></select></div>}/>
    <AccessibleTabs className="analytics-tabs" tabs={["Overview","Systems","Confidence","Pacing","Peers"]} value={tab} onChange={setTab} label="Analytics views"/>

    {tab==="Overview"&&<>
      <section className="stat-grid four analytics-stats">
        <StatCard label="Overall accuracy" value={`${accuracy}%`} trend={`${peer.accuracyDelta>=0?"↗":"↘"} ${Math.abs(peer.accuracyDelta)} pts `} detail="vs cohort median" icon={<Target/>}/>
        <StatCard label="Questions answered" value={attempts.length} detail={`${new Set(attempts.map(a=>a.questionId)).size} unique questions`} icon={<BookOpen/>}/>
        <StatCard label="Average pace" value={avgTime?`${Math.floor(avgTime/60)}:${String(avgTime%60).padStart(2,"0")}`:"—"} trend={`${peer.paceDelta>=0?"↗":"↘"} ${Math.abs(peer.paceDelta)} sec `} detail={peer.paceDelta>=0?"faster than median":"slower than median"} icon={<Clock3/>}/>
        <StatCard label="Peer percentile" value={`${peer.percentile}th`} trend={`${peer.band} `} detail="seeded demo cohort" icon={<Trophy/>}/>
      </section>

      <section className="analytics-grid-main">
        <article className="panel accuracy-trend">
          <header><div><div className="card-kicker"><TrendingUp/> Accuracy trend</div><h2>{trendValues.at(-1)!>=trendValues[0]?"Steady improvement":"Useful variability signal"}</h2></div><Badge tone={trendValues.at(-1)!>=trendValues[0]?"success":"warning"}>{trendValues.at(-1)!-trendValues[0]>=0?"+":""}{trendValues.at(-1)!-trendValues[0]} pts</Badge></header>
          <div className="line-chart"><div className="y-labels"><span>100%</span><span>75%</span><span>50%</span><span>25%</span></div><div className="line-chart-body"><svg viewBox="0 0 700 240" preserveAspectRatio="none"><polyline points={trendPoints} fill="none" stroke="currentColor" strokeWidth="4" vectorEffect="non-scaling-stroke"/>{trendValues.map((value,index)=><circle key={`${value}-${index}`} cx={Math.round(index/Math.max(trendValues.length-1,1)*700)} cy={Math.round(225-value/maxTrend*175)} r="5" fill="currentColor"/>)}</svg><div className="x-labels">{trendValues.map((_,index)=><span key={index}>B{index+1}</span>)}</div></div></div>
          <footer><span><i/> Rolling block accuracy</span><b>Current: {trendValues.at(-1)}%</b></footer>
        </article>
        <article className="panel readiness-breakdown">
          <header><div className="card-kicker"><Sparkles/> Readiness model</div></header>
          <div className="readiness-donut-wrap"><Donut value={readiness.score} size={160} detail="readiness"/><div><Badge tone={readiness.score>=70?"success":"warning"}>{readiness.score>=70?"On track":"Needs attention"}</Badge><h3>{readiness.score>=70?"Goal alignment is strong":"Coverage can move the score"}</h3><p>Readiness blends accuracy, unique coverage, calibration, and system mastery. It is a demonstration heuristic, not an exam-score prediction.</p></div></div>
          <div className="readiness-factor-list">{[["Accuracy",readiness.accuracy],["Coverage",readiness.coverage],["Calibration",readiness.calibrated],["System mastery",Math.round(performance.reduce((s,p)=>s+p.mastery,0)/Math.max(performance.length,1))]].map(([label,value])=><div key={String(label)}><div><span>{label}</span><b>{value}%</b></div><Progress value={Number(value)}/></div>)}</div>
        </article>
      </section>

      <section className="analytics-bottom-grid">
        <article className="panel system-table">
          <header><div><div className="card-kicker"><BarChart3/> Systems</div><h2>Performance by content area</h2></div><button onClick={()=>setTab("Systems")}>View all <ArrowRight/></button></header>
          <div className="system-performance-list">{performance.slice(0,6).map(item=><div key={item.system}><div className="system-performance-label"><span>{item.system}</span><small>{item.attempts?`${item.attempts} question${item.attempts===1?"":"s"}`:"Not started"}</small></div><Progress value={item.mastery}/><b>{item.mastery}%</b></div>)}</div>
        </article>
        <article className="panel confidence-insight">
          <div className="confidence-top"><span><SlidersHorizontal/></span><Badge tone="warning">Calibration</Badge></div>
          <h2>{highConfidenceMisses} high-confidence misses</h2>
          <p>These misses receive extra weight in adaptive correction blocks because certainty can make an error repeat.</p>
          <div className="confidence-matrix">{matrix.map(cell=><div key={cell.key} className={cell.key==="high-miss"?"risk":""}><b>{cell.percent}%</b><span>{cell.label}</span><small>{cell.count} response{cell.count===1?"":"s"}</small></div>)}</div>
          <button className="btn btn-secondary btn-block" onClick={()=>startPractice([],correctionIds.length?correctionIds:undefined)}>Build correction block</button>
        </article>
      </section>
    </>}

    {tab==="Systems"&&<section className="panel detailed-systems"><header><div><h2>System mastery matrix</h2><p>Mastery blends accuracy and unique question coverage; zero-attempt systems are clearly marked.</p></div></header><div className="responsive-table"><table><caption className="sr-only">Sample learner performance by organ system</caption><thead><tr><th scope="col">System</th><th scope="col">Mastery</th><th scope="col">Accuracy</th><th scope="col">Answered</th><th scope="col">Signal</th><th scope="col">Action</th></tr></thead><tbody>{performance.map(item=><tr key={item.system}><td><b>{item.system}</b></td><td><div className="table-progress"><Progress value={item.mastery}/><span>{item.mastery}%</span></div></td><td>{item.attempts?`${item.accuracy}%`:"—"}</td><td>{item.answered} / {item.coverage}</td><td><Badge tone={!item.attempts?"neutral":item.mastery>=75?"success":item.mastery>=60?"warning":"danger"}>{!item.attempts?"Not started":item.mastery>=75?"Strong":item.mastery>=60?"Developing":"Priority"}</Badge></td><td><button className="table-action" onClick={()=>startPractice([item.system])}>Practice <ArrowRight/></button></td></tr>)}</tbody></table></div></section>}

    {tab==="Confidence"&&<section className="confidence-page-grid"><article className="panel calibration-visual"><header><h2>Confidence calibration</h2><p>Ideal calibration means confidence and correctness move together.</p></header><div className="calibration-bars">{[1,2,3,4,5].map(level=>{const relevant=attempts.filter(a=>a.confidence===level);const value=relevant.length?Math.round(relevant.filter(a=>a.correct).length/relevant.length*100):0;return <div key={level}><span>{level}</span><i style={{height:`${Math.max(4,value*1.8)}px`}}/><b>{relevant.length?`${value}%`:"No data"}</b><small>{["Guess","Low","Medium","High","Certain"][level-1]}</small></div>})}</div></article><article className="panel calibration-guidance"><div className="insight-icon"><SlidersHorizontal/></div><h2>Correct the certainty gap</h2><p>{highConfidenceMisses?`You have ${highConfidenceMisses} high-confidence miss${highConfidenceMisses===1?"":"es"}. Require yourself to explain why each distractor is wrong.`:"No high-confidence misses appear in this range. Keep recording confidence to preserve this signal."}</p><div><b>Recommended action</b><span>{highConfidenceMisses?"Incorrect + flagged Tutor block":"Mixed confidence-calibration block"}</span></div><button className="btn btn-brand btn-block" onClick={()=>startPractice([],correctionIds.length?correctionIds:undefined)}>Create correction block</button></article></section>}

    {tab==="Pacing"&&<section className="pacing-grid"><article className="panel"><header><h2>Response-time distribution</h2><p>Actual attempts grouped into 20-second buckets.</p></header><div className="histogram">{Array.from({length:8},(_,index)=>{const min=30+index*20;const count=attempts.filter(a=>a.timeSec>=min&&a.timeSec<min+20).length;return <div key={index}><i style={{height:`${Math.max(4,count*28)}px`}}/><b>{count}</b><span>{min}s</span></div>})}</div></article><article className="panel pace-summary"><h2>Pacing summary</h2>{[["Inside 45–120 sec",attempts.length?`${Math.round(attempts.filter(a=>a.timeSec>=45&&a.timeSec<=120).length/attempts.length*100)}%`:"0%","success"],["Too fast (<45 sec)",attempts.length?`${Math.round(attempts.filter(a=>a.timeSec<45).length/attempts.length*100)}%`:"0%","warning"],["Over 2 minutes",attempts.length?`${Math.round(attempts.filter(a=>a.timeSec>120).length/attempts.length*100)}%`:"0%","danger"]].map(([label,value,tone])=><div key={label}><span>{label}</span><Badge tone={tone as "success"|"warning"|"danger"}>{value}</Badge></div>)}<p>Speed is interpreted with accuracy so the model does not reward rushed guessing.</p></article></section>}

    {tab==="Peers"&&<section className="peer-page-grid">
      <article className="panel peer-percentile-card"><div className="card-kicker"><Trophy/> Peer benchmark</div><div className="peer-percentile-main"><Donut value={peer.percentile} size={190} label="th" detail="percentile"/><div><Badge tone={peer.percentile>=70?"success":peer.percentile>=45?"warning":"neutral"}>{peer.band}</Badge><h2>You performed above {peer.percentile}% of the seeded cohort.</h2><p>This demo benchmark weights accuracy at 82% and safe pacing at 18%. It is not an official USMLE percentile or a measured learner sample, so no real cohort size exists.</p></div></div><div className="peer-comparison-grid"><div><span>Your accuracy</span><b>{peer.accuracy}%</b><small>{peer.accuracyDelta>=0?"+":""}{peer.accuracyDelta} vs median</small></div><div><span>Cohort median</span><b>{peer.cohortMedianAccuracy}%</b><small>Seeded reference</small></div><div><span>Your pace</span><b>{peer.averageTime}s</b><small>{peer.paceDelta>=0?`${peer.paceDelta}s faster`:`${Math.abs(peer.paceDelta)}s slower`}</small></div><div><span>Cohort pace</span><b>{peer.cohortMedianTime}s</b><small>Median response time</small></div></div></article>
      <article className="panel peer-distribution-card"><header><div><h2>Cohort score distribution</h2><p>Your marker is positioned from the calculated percentile.</p></div><Badge tone="info">Demo cohort</Badge></header><div className="peer-histogram">{peerBands.map((height,index)=><div key={index}><i style={{height:`${height*2.2}px`}} className={Math.abs(index/(peerBands.length-1)*100-peer.percentile)<6?"current":""}/><span>{40+index*5}%</span></div>)}<b className="peer-marker" style={{left:`${peer.percentile}%`}}><span>You</span></b></div><div className="peer-legend"><span><i/> Learner distribution</span><span><i className="current"/> Your band</span></div></article>
    </section>}
  </>;
}

function StudyPlanPage() {
  const { state, dispatch, rebuildPlan }=useStepwise();
  const router=useRouter();
  const [settings,setSettings]=useState<StudyPlanSettings>(state.planSettings);
  const [editOpen,setEditOpen]=useState(false);
  const [toast,setToast]=useState("");
  const [view,setView]=useState<"timeline"|"calendar">("timeline");
  const grouped=state.studyTasks.reduce<Record<string,typeof state.studyTasks>>((acc,task)=>{(acc[task.date] ||= []).push(task);return acc},{});
  const dates=Object.keys(grouped).sort().slice(0,10);
  const examDays=Math.max(0,Math.ceil((new Date(settings.examDate).getTime()-new Date("2026-07-22").getTime())/86400000));
  const completed=state.studyTasks.filter(task=>task.completed).length;
  const plannedWeekMinutes=state.studyTasks.filter(task=>task.date>="2026-07-20"&&task.date<="2026-07-26").reduce((sum,task)=>sum+task.minutes,0);
  const planQuestions=state.questions.filter(question=>question.step===settings.targetStep);
  const planPerformance=systemPerformance(planQuestions,state.attempts);
  const weakest=planPerformance[0];
  const strongest=[...planPerformance].filter(item=>item.attempts).sort((a,b)=>b.mastery-a.mastery)[0];
  const highConfidenceMisses=state.attempts.filter(attempt=>!attempt.correct&&attempt.confidence>=4&&planQuestions.some(question=>question.id===attempt.questionId)).length;
  const nextAssessment=state.studyTasks.find(task=>task.type==="Assessment"&&!task.completed);
  const save=()=>{rebuildPlan(settings);setEditOpen(false);setToast("Study plan rebuilt around your availability");window.setTimeout(()=>setToast(""),2000)};
  const startAssessment=()=>{
    const config:SessionConfig={step:settings.targetStep,mode:"Exam",count:40,systems:[],disciplines:[],difficulties:[],include:"All",timePerQuestionSec:90};
    sessionStorage.setItem("stepwise-session-config",JSON.stringify(config));
    router.push("/app/session");
  };
  return <>
    <PageHeader title="Study plan" description="A sample schedule that balances weak areas, mixed retrieval, review, and exam pacing." actions={<><div className="view-toggle" role="group" aria-label="Study plan view"><button aria-pressed={view==="timeline"} className={view==="timeline"?"active":""} onClick={()=>setView("timeline")}><Activity/> Timeline</button><button aria-pressed={view==="calendar"} className={view==="calendar"?"active":""} onClick={()=>setView("calendar")}><Calendar/> Calendar</button></div><button className="btn btn-secondary" onClick={()=>setEditOpen(true)}><SlidersHorizontal/> Edit plan</button></>}/>
    <section className="plan-summary panel">
      <div className="plan-goal">
        <div className="plan-goal-icon"><Target/></div>
        <div><span>Target Exam</span><h2>{settings.targetStep} · Goal {settings.targetScore}</h2><p>{formatDate(settings.examDate,{month:"long",day:"numeric",year:"numeric"})}</p></div>
      </div>
      <div className="plan-metrics">
        <div><span>Days remaining</span><b>{examDays}</b></div>
        <div><span>Study days / week</span><b>{settings.weeklyDays.length}</b></div>
        <div><span>Plan completion</span><b>{Math.round((completed/Math.max(state.studyTasks.length,1))*100)}%</b></div>
        <div><span>Planned this week</span><b>{(plannedWeekMinutes/60).toFixed(1)} hr</b></div>
      </div>
      <div className="plan-track">
        <Progress value={Math.round((completed/Math.max(state.studyTasks.length,1))*100)}/>
        <span>Plan automatically rebalances after every completed session.</span>
      </div>
    </section>
    {view==="timeline"?<section className="plan-layout"><div className="timeline">{dates.map((date)=>{
      const dateObj = new Date(`${date}T12:00:00`);
      const dayName = dateObj.toLocaleDateString("en-US",{weekday:"short"});
      const dayNum = dateObj.getDate();
      return <div key={date} className={`timeline-day ${date==="2026-07-22"?"today":""}`}>
        <aside className="timeline-day-date"><span>{dayName}</span><b>{dayNum}</b></aside>
        <div>
          <header><h3>{date==="2026-07-22"?"Today":formatDate(date,{weekday:"long",month:"long",day:"numeric"})}</h3><span>{grouped[date].reduce((sum,task)=>sum+task.minutes,0)} min</span></header>
          {grouped[date].map(task=><article key={task.id} className={task.completed?"completed":""}>
            <button className="task-checkbox" onClick={()=>dispatch({type:"TOGGLE_TASK",id:task.id})} aria-label={`Mark ${task.title} ${task.completed?"incomplete":"complete"}`}>{task.completed?<Check/>:<span/>}</button>
            <i className={`plan-task-icon ${task.type.toLowerCase()}`}>{task.type==="Questions"?<BookOpen/>:task.type==="Flashcards"?<Layers3/>:task.type==="Assessment"?<Trophy/>:<BookCheck/>}</i>
            <div className="task-copy"><Badge tone={task.priority==="Weakness"?"warning":task.priority==="Core"?"brand":"neutral"}>{task.priority}</Badge><h4>{task.title}</h4><p>{task.detail}</p></div>
            <span className="task-time"><Clock3/> {task.minutes} min</span>
            <button className="task-menu-btn" onClick={()=>dispatch({type:"TOGGLE_TASK",id:task.id})} aria-label={`Toggle ${task.title}`}><MoreHorizontal/></button>
          </article>)}
        </div>
      </div>;
    })}</div>
    <aside className="plan-sidebar">
      <article className="panel">
        <div className="card-kicker"><BrainCircuit/> Plan intelligence</div>
        <h2>Why this week looks different</h2>
        <p>The schedule allocates more retrieval time to low-mastery systems and preserves lighter maintenance for stable systems.</p>
        <ul className="plan-intelligence-list">
          <li><span className="dot danger"/><div><b className="intel-title">{weakest?.system ?? "Mixed systems"} priority</b><small className="intel-detail">{weakest?.attempts?`${weakest.mastery}% mastery signal`:`Not started · coverage priority`}</small></div></li>
          <li><span className="dot success"/><div><b className="intel-title">{strongest?.system ?? "Mixed recall"} maintenance</b><small className="intel-detail">{strongest?`${strongest.mastery}% mastery signal`:"Build more history to identify strength"}</small></div></li>
          <li><span className="dot info"/><div><b className="intel-title">{highConfidenceMisses} calibration review{highConfidenceMisses===1?"":"s"}</b><small className="intel-detail">High-confidence errors receive extra review weight</small></div></li>
        </ul>
      </article>
      <article className="panel exam-countdown">
        <small>NEXT MILESTONE</small>
        <h3>{nextAssessment?.title ?? "Readiness assessment"}</h3>
        <p>{nextAssessment?`${formatDate(nextAssessment.date,{weekday:"long",month:"long",day:"numeric"})} · ${nextAssessment.detail}`:"Create an assessment from the QBank"}</p>
        <div><span>{nextAssessment?Math.max(0,Math.ceil((new Date(`${nextAssessment.date}T12:00:00`).getTime()-new Date("2026-07-22T12:00:00").getTime())/86400000)):examDays}</span><small>days away</small></div>
        <button className="btn btn-secondary btn-block" onClick={startAssessment}>Start assessment</button>
      </article>
    </aside></section>:<CalendarView tasks={state.studyTasks}/>} 
    <Modal open={editOpen} onClose={()=>setEditOpen(false)} title="Edit study plan" description="The algorithm will rebuild future tasks around these constraints."><div className="plan-form"><Field label="Target exam"><select value={settings.targetStep} onChange={e=>setSettings({...settings,targetStep:e.target.value as Step})}><option>Step 1</option><option>Step 2 CK</option></select></Field><div className="form-grid-2"><Field label="Exam date"><input type="date" value={settings.examDate} onChange={e=>setSettings({...settings,examDate:e.target.value})}/></Field><Field label="Target score"><input type="number" value={settings.targetScore} onChange={e=>setSettings({...settings,targetScore:Number(e.target.value)})}/></Field></div><Field label="Available study days"><div className="day-picker compact">{["S","M","T","W","T","F","S"].map((day,index)=><button type="button" key={`${day}-${index}`} className={settings.weeklyDays.includes(index)?"active":""} onClick={()=>setSettings({...settings,weeklyDays:settings.weeklyDays.includes(index)?settings.weeklyDays.filter(d=>d!==index):[...settings.weeklyDays,index]})}>{day}</button>)}</div></Field><div className="form-grid-2"><Field label="Weekday minutes"><input type="number" min="20" value={settings.weekdayMinutes} onChange={e=>setSettings({...settings,weekdayMinutes:Number(e.target.value)})}/></Field><Field label="Weekend minutes"><input type="number" min="20" value={settings.weekendMinutes} onChange={e=>setSettings({...settings,weekendMinutes:Number(e.target.value)})}/></Field></div><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setEditOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={save}><RefreshCw/> Rebuild plan</button></div></div></Modal>
    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function CalendarView({tasks}:{tasks:ReturnType<typeof useStepwise>["state"]["studyTasks"]}) {
  const [visibleMonth,setVisibleMonth]=useState(()=>new Date("2026-07-01T12:00:00"));
  const year=visibleMonth.getFullYear();
  const month=visibleMonth.getMonth();
  const firstOfMonth=new Date(year,month,1,12);
  const gridStart=new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate()-firstOfMonth.getDay());
  const days=Array.from({length:42},(_,index)=>{const date=new Date(gridStart);date.setDate(gridStart.getDate()+index);return date});
  const monthLabel=visibleMonth.toLocaleDateString("en-US",{month:"long",year:"numeric"});
  const shiftMonth=(offset:number)=>setVisibleMonth(current=>new Date(current.getFullYear(),current.getMonth()+offset,1,12));
  const dateKey=(date:Date)=>`${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
  return <section className="panel month-calendar">
    <header>
      <div><button type="button" onClick={()=>shiftMonth(-1)} aria-label="Show previous month">‹</button><h2>{monthLabel}</h2><button type="button" onClick={()=>shiftMonth(1)} aria-label="Show next month">›</button></div>
      <span><i/> Planned task</span>
    </header>
    <div className="calendar-weekdays">{["Sun","Mon","Tue","Wed","Thu","Fri","Sat"].map(day=><span key={day}>{day}</span>)}</div>
    <div className="calendar-grid">{days.map(date=>{
      const key=dateKey(date);
      const dayTasks=tasks.filter(task=>task.date===key);
      const classes=[key==="2026-07-22"?"today":"",date.getMonth()!==month?"outside":"",dayTasks.length?"has-tasks":""].filter(Boolean).join(" ");
      return <div key={key} className={classes}><b>{date.getDate()}</b>{dayTasks.slice(0,3).map(task=><span key={task.id} className={task.type.toLowerCase()} title={`${task.title} · ${task.minutes} minutes`}>{task.type} · {task.minutes}m</span>)}{dayTasks.length>3&&<small>+{dayTasks.length-3} more</small>}</div>;
    })}</div>
  </section>;
}
