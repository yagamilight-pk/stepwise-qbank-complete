"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Check, CheckCircle2,
  CircleDollarSign, Copy, CreditCard, Download, Edit3, Eye, FileCheck2, FilePlus2,
  FileStack, Filter, Flag, Gauge, Globe2, Layers3, Mail, MoreHorizontal, Plus,
  RefreshCw, Scale, Search, Send, Settings, ShieldCheck, Sparkles, Target, Trash2, TrendingUp, UserCheck,
  UserMinus, Users
} from "lucide-react";
import { systemPerformance } from "@/lib/algorithms";
import { useStepwise } from "@/lib/store";
import type { AdminUser, Difficulty, Question, QuestionStatus, Step } from "@/lib/types";
import { Avatar, Badge, Donut, Field, formatDate, Modal, PageHeader, Progress, Sparkline, StatCard, Toast, Toggle } from "./ui";

function downloadFile(filename: string, contents: string, type = "application/json") {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  URL.revokeObjectURL(url);
}

function csv(rows: Array<Array<string | number>>) {
  return rows.map(row => row.map(value => `"${String(value).replaceAll('"', '""')}"`).join(",")).join("\n");
}

export function AdminPage({ section }: { section: string }) {
  if (section === "questions") return <QuestionsAdmin/>;
  if (section === "users") return <UsersAdmin/>;
  if (section === "content") return <ContentMapAdmin/>;
  if (section === "reports") return <ReportsAdmin/>;
  if (section === "billing") return <BillingAdmin/>;
  if (section === "settings") return <AdminSettings/>;
  return <AdminOverview/>;
}

function AdminOverview() {
  const { state } = useStepwise();
  const published = state.questions.filter(question => question.status === "Published").length;
  const openReports = state.reports.filter(report => report.status === "Open").length;
  const activeUsers = state.adminUsers.filter(user => user.status === "Active").length;
  const performance = systemPerformance(state.questions, state.attempts);
  const reviewQueue = state.questions.filter(question => question.status === "In review" || question.status === "Draft");
  const recentUsers = [...state.adminUsers].sort((a,b)=>b.joinedAt.localeCompare(a.joinedAt)).slice(0,4);

  return <>
    <PageHeader eyebrow="Operations workspace" title="Good morning, Maya." description={openReports ? `${openReports} learner report${openReports === 1 ? "" : "s"} need editorial review.` : "Content quality is stable. Editorial queue is up to date."} actions={<><button className="btn btn-secondary" onClick={()=>downloadFile("stepwise-admin-report.json",JSON.stringify(state,null,2))}><Download/> Export report</button><Link className="btn btn-brand" href="/admin/questions"><FilePlus2/> New question</Link></>}/>
    <section className="stat-grid four admin-stat-grid">
      <StatCard label="Active learners" value={activeUsers} detail={` of ${state.adminUsers.length} accounts`} trend="Active " icon={<Users/>}><Sparkline values={[0,0,0,0,0,0,state.attempts.length]} height={34}/></StatCard>
      <StatCard label="Published questions" value={published} detail=" across both Steps" icon={<FileCheck2/>}><Progress value={(published/Math.max(state.questions.length,1))*100}/></StatCard>
      <StatCard label="Open reports" value={openReports} detail={openReports ? "Needs review" : "Queue clear"} icon={<Flag/>}><span className="admin-stat-link">Review queue <ArrowRight/></span></StatCard>
      <StatCard label="Monthly recurring revenue" value="$0" detail="Ready for API integration" trend="Baseline " icon={<CircleDollarSign/>}><Sparkline values={[0,0,0,0,0,0,0]} height={34}/></StatCard>
    </section>

    <section className="admin-overview-grid">
      <article className="panel admin-growth-card"><header><div><div className="card-kicker"><TrendingUp/> Platform activity</div><h2>Learner engagement</h2><p>Daily active learners and completed question blocks.</p></div><select defaultValue="30"><option value="30">Last 30 days</option><option value="90">Last 90 days</option></select></header><div className="admin-growth-chart">{[0,0,0,0,0,0,0,0,0,0,0,state.attempts.length].map((value,index)=><span key={index}><i style={{height:`${Math.max(4, value*2)}px`}}/><b style={{height:`${Math.max(4, value*1.5)}px`}}/></span>)}</div><footer><span><i/> Active learners</span><span><i/> Completed blocks</span><b>{state.attempts.length} questions answered this week</b></footer></article>
      <article className="panel admin-health-card"><header><div className="card-kicker"><ShieldCheck/> Content health</div><Badge tone="success" dot>Healthy</Badge></header><div className="admin-health-score"><Donut value={100} size={148} detail="health"/><div><h2>100 / 100</h2><p>Based on report volume, review freshness, blueprint coverage, and learner discrimination signals.</p></div></div><div className="admin-health-bars">{[["Medical review freshness",100],["Blueprint coverage",100],["Report resolution",100],["Item performance",100]].map(([label,value])=><div key={String(label)}><Progress value={Number(value)} label={String(label)} showValue/></div>)}</div></article>
    </section>

    <section className="admin-lower-grid">
      <article className="panel admin-queue"><header><div><div className="card-kicker"><FileStack/> Editorial queue</div><h2>Questions needing attention</h2></div><Link href="/admin/questions">Open all <ArrowRight/></Link></header>{reviewQueue.length ? reviewQueue.map(question=><div key={question.id}><span className="queue-status"><i className={question.status.toLowerCase().replace(" ","-")}/></span><div><b>{question.id} · {question.topic}</b><p>{question.system} · {question.step} · Updated {formatDate(question.updatedAt)}</p></div><Badge tone={question.status==="Draft"?"warning":"info"}>{question.status}</Badge><Link className="icon-btn" href="/admin/questions" aria-label={`Open ${question.id}`}><ArrowRight/></Link></div>) : <div className="admin-empty-inline"><CheckCircle2/><span><b>Editorial queue clear</b><small>All current demo questions are published.</small></span></div>}</article>
      <article className="panel admin-system-risk"><header><div><div className="card-kicker"><Gauge/> Blueprint watch</div><h2>Lowest mastery systems</h2></div><Link href="/admin/content">Content map</Link></header>{performance.slice(0,5).map((item,index)=><div key={item.system}><span>{index+1}</span><div><b>{item.system}</b><Progress value={item.mastery}/></div><strong>{item.mastery}%</strong></div>)}</article>
      <article className="panel admin-new-users"><header><div><div className="card-kicker"><UserCheck/> New learners</div><h2>Recent signups</h2></div><Link href="/admin/users">All users</Link></header>{recentUsers.map(user=><div key={user.id}><Avatar name={user.name}/><div><b>{user.name}</b><p>{user.plan} · Joined {formatDate(user.joinedAt,{month:"short",day:"numeric"})}</p></div><Badge tone={user.status==="Active"?"success":user.status==="At risk"?"warning":"neutral"}>{user.status}</Badge></div>)}</article>
    </section>
  </>;
}

const emptyQuestion = (): Question => ({
  id: `SW-${Math.floor(3000 + Math.random()*6000)}`,
  step: "Step 2 CK",
  system: "Cardiovascular",
  discipline: "Internal Medicine",
  topic: "",
  difficulty: "Medium",
  status: "Draft",
  stem: "",
  choices: ["A","B","C","D","E"].map(letter=>({id:`draft-${letter}`,text:""})),
  correctChoiceId: "draft-A",
  explanation: "",
  objective: "",
  pearls: [],
  wrongChoiceNotes: {},
  tags: [],
  author: "Dr. Maya Patel",
  updatedAt: new Date().toISOString().slice(0,10),
  averageTimeSec: 90,
  globalAccuracy: 65,
  sourceLabel: "Stepwise original"
});

function QuestionsAdmin() {
  const { state, dispatch } = useStepwise();
  const [search,setSearch]=useState("");
  const [step,setStep]=useState<"All"|Step>("All");
  const [status,setStatus]=useState<"All"|QuestionStatus>("All");
  const [editor,setEditor]=useState<Question|null>(null);
  const [deleteTarget,setDeleteTarget]=useState<Question|null>(null);
  const [toast,setToast]=useState("");
  const [preview,setPreview]=useState<Question|null>(null);
  const filtered=state.questions.filter(question=>{
    const haystack=`${question.id} ${question.stem} ${question.system} ${question.topic} ${question.tags.join(" ")}`.toLowerCase();
    return haystack.includes(search.toLowerCase()) && (step==="All"||question.step===step) && (status==="All"||question.status===status);
  });
  const save=()=>{
    if(!editor) return;
    const normalized={...editor, updatedAt:new Date().toISOString().slice(0,10), tags:editor.tags.filter(Boolean), pearls:editor.pearls.filter(Boolean)};
    dispatch({type:"UPSERT_QUESTION",question:normalized});
    setEditor(null);setToast("Question saved to the content library");window.setTimeout(()=>setToast(""),1800);
  };
  const setChoice=(index:number,text:string)=>{if(!editor)return;const choices=editor.choices.map((choice,i)=>i===index?{...choice,text}:choice);setEditor({...editor,choices});};
  const duplicate=(question:Question)=>{const copy={...question,id:`${question.id}-COPY`,status:"Draft" as QuestionStatus,updatedAt:new Date().toISOString().slice(0,10)};dispatch({type:"UPSERT_QUESTION",question:copy});setToast("Draft duplicate created");window.setTimeout(()=>setToast(""),1600)};

  return <>
    <PageHeader title="Question library" description="Create, review, publish, and maintain original Stepwise items from one editorial workspace." actions={<><button className="btn btn-secondary" onClick={()=>downloadFile("stepwise-questions.csv",csv([["ID","Step","System","Discipline","Topic","Difficulty","Status","Accuracy"],...filtered.map(q=>[q.id,q.step,q.system,q.discipline,q.topic,q.difficulty,q.status,q.globalAccuracy])]),"text/csv")}><Download/> Export CSV</button><button className="btn btn-brand" onClick={()=>setEditor(emptyQuestion())}><Plus/> Create question</button></>}/>
    <section className="panel admin-table-panel"><header className="admin-filterbar"><div className="table-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search ID, stem, topic, or tag…"/></div><div><select value={step} onChange={e=>setStep(e.target.value as "All"|Step)}><option>All</option><option>Step 1</option><option>Step 2 CK</option></select><select value={status} onChange={e=>setStatus(e.target.value as "All"|QuestionStatus)}><option>All</option><option>Draft</option><option>In review</option><option>Published</option><option>Archived</option></select><button className="btn btn-secondary" onClick={()=>{setToast("System, discipline, and difficulty filters are available in the block builder");setTimeout(()=>setToast(""),1800)}}><Filter/> More filters</button></div></header>
      <div className="admin-table-summary"><span><b>{filtered.length}</b> questions shown</span><span>{state.questions.filter(q=>q.status==="Published").length} published · {state.questions.filter(q=>q.status==="Draft").length} drafts</span></div>
      <div className="responsive-table"><table className="admin-question-table"><thead><tr><th>Question</th><th>Blueprint</th><th>Status</th><th>Performance</th><th>Updated</th><th/></tr></thead><tbody>{filtered.map(question=><tr key={question.id}><td><div className="question-cell"><span>{question.id}</span><p>{question.stem.slice(0,112)}{question.stem.length>112?"…":""}</p><small>{question.tags.slice(0,3).map(tag=>`#${tag}`).join("  ")}</small></div></td><td><b>{question.system}</b><small>{question.step} · {question.discipline}</small></td><td><Badge tone={question.status==="Published"?"success":question.status==="Draft"?"warning":question.status==="Archived"?"neutral":"info"} dot>{question.status}</Badge></td><td><b>{question.globalAccuracy}%</b><small>{question.averageTimeSec}s avg · {question.difficulty}</small></td><td>{formatDate(question.updatedAt,{month:"short",day:"numeric",year:"numeric"})}<small>{question.author}</small></td><td><div className="row-actions"><button onClick={()=>setPreview(question)} title="Preview"><Eye/></button><button onClick={()=>setEditor(structuredClone(question))} title="Edit"><Edit3/></button><button onClick={()=>duplicate(question)} title="Duplicate"><Copy/></button><button onClick={()=>setDeleteTarget(question)} title="Delete"><Trash2/></button></div></td></tr>)}</tbody></table></div>
    </section>
    <Modal open={Boolean(editor)} onClose={()=>setEditor(null)} title={editor?.stem?`Edit ${editor.id}`:"Create question"} description="All content is stored locally in this frontend demo." wide>{editor&&<div className="question-editor"><div className="editor-grid"><Field label="Question ID"><input value={editor.id} onChange={e=>setEditor({...editor,id:e.target.value})}/></Field><Field label="Exam"><select value={editor.step} onChange={e=>setEditor({...editor,step:e.target.value as Step})}><option>Step 1</option><option>Step 2 CK</option></select></Field><Field label="Status"><select value={editor.status} onChange={e=>setEditor({...editor,status:e.target.value as QuestionStatus})}><option>Draft</option><option>In review</option><option>Published</option><option>Archived</option></select></Field><Field label="Difficulty"><select value={editor.difficulty} onChange={e=>setEditor({...editor,difficulty:e.target.value as Difficulty})}><option>Easy</option><option>Medium</option><option>Hard</option></select></Field><Field label="System"><input value={editor.system} onChange={e=>setEditor({...editor,system:e.target.value})}/></Field><Field label="Discipline"><input value={editor.discipline} onChange={e=>setEditor({...editor,discipline:e.target.value})}/></Field><Field label="Topic"><input value={editor.topic} onChange={e=>setEditor({...editor,topic:e.target.value})}/></Field><Field label="Tags" hint="Comma separated"><input value={editor.tags.join(", ")} onChange={e=>setEditor({...editor,tags:e.target.value.split(",").map(tag=>tag.trim())})}/></Field></div><Field label="Clinical vignette"><textarea rows={7} value={editor.stem} onChange={e=>setEditor({...editor,stem:e.target.value})}/></Field><div className="editor-choices"><div><h3>Answer choices</h3><p>Select the correct answer using the radio control.</p></div>{editor.choices.map((choice,index)=><label key={choice.id}><input type="radio" name="correct" checked={editor.correctChoiceId===choice.id} onChange={()=>setEditor({...editor,correctChoiceId:choice.id})}/><span>{String.fromCharCode(65+index)}</span><input value={choice.text} onChange={e=>setChoice(index,e.target.value)} placeholder={`Choice ${String.fromCharCode(65+index)}`}/></label>)}</div><Field label="Explanation"><textarea rows={6} value={editor.explanation} onChange={e=>setEditor({...editor,explanation:e.target.value})}/></Field><Field label="Learning objective"><textarea rows={3} value={editor.objective} onChange={e=>setEditor({...editor,objective:e.target.value})}/></Field><Field label="High-yield pearls" hint="One per line"><textarea rows={4} value={editor.pearls.join("\n")} onChange={e=>setEditor({...editor,pearls:e.target.value.split("\n")})}/></Field><div className="editor-footer"><span><ShieldCheck/> Editorial changes are persisted to localStorage.</span><div><button className="btn btn-secondary" onClick={()=>setEditor(null)}>Cancel</button><button className="btn btn-brand" onClick={save}><FileCheck2/> Save question</button></div></div></div>}</Modal>
    <Modal open={Boolean(preview)} onClose={()=>setPreview(null)} title={preview?`${preview.id} preview`:"Preview"} wide>{preview&&<div className="admin-question-preview"><div><Badge tone="brand">{preview.step}</Badge><Badge>{preview.system}</Badge><Badge>{preview.difficulty}</Badge></div><h2>{preview.stem}</h2><div>{preview.choices.map((choice,index)=><p key={choice.id} className={choice.id===preview.correctChoiceId?"correct":""}><span>{String.fromCharCode(65+index)}</span>{choice.text}{choice.id===preview.correctChoiceId&&<Check/>}</p>)}</div><article><b>Explanation</b><p>{preview.explanation}</p></article></div>}</Modal>
    <Modal open={Boolean(deleteTarget)} onClose={()=>setDeleteTarget(null)} title="Delete question?" description={`${deleteTarget?.id} will be removed from the local content library.`}><div className="exit-modal-actions"><button className="btn btn-secondary" onClick={()=>setDeleteTarget(null)}>Cancel</button><button className="btn btn-danger" onClick={()=>{if(deleteTarget)dispatch({type:"DELETE_QUESTION",id:deleteTarget.id});setDeleteTarget(null);setToast("Question deleted")}}><Trash2/> Delete</button></div></Modal>
    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function UsersAdmin() {
  const { state, dispatch } = useStepwise();
  const [search,setSearch]=useState("");
  const [plan,setPlan]=useState("All");
  const [selected,setSelected]=useState<AdminUser|null>(null);
  const [toast,setToast]=useState("");
  const users=state.adminUsers.filter(user=>(`${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase()))&&(plan==="All"||user.plan===plan));
  const updateStatus=(user:AdminUser,status:AdminUser["status"])=>{dispatch({type:"UPDATE_ADMIN_USER",id:user.id,patch:{status}});setSelected({...user,status});setToast(`User marked ${status.toLowerCase()}`);window.setTimeout(()=>setToast(""),1600)};
  return <>
    <PageHeader title="Learners" description="Search accounts, review engagement, and manage frontend access states." actions={<><button className="btn btn-secondary" onClick={()=>downloadFile("stepwise-learners.csv",csv([["Name","Email","Plan","Status","Questions","Accuracy"],...users.map(u=>[u.name,u.email,u.plan,u.status,u.questionsAnswered,u.accuracy])]),"text/csv")}><Download/> Export users</button><button className="btn btn-brand" onClick={()=>{setToast("Invitation workflow ready for your email provider");setTimeout(()=>setToast(""),1800)}}><Mail/> Invite learners</button></>}/>
    <section className="stat-grid four"><StatCard label="Total learners" value={state.adminUsers.length} trend="+14 " detail="this month" icon={<Users/>}/><StatCard label="Active this week" value={state.adminUsers.filter(u=>u.status==="Active").length} detail="83% of accounts" icon={<Activity/>}/><StatCard label="At-risk learners" value={state.adminUsers.filter(u=>u.status==="At risk").length} detail="need re-engagement" icon={<AlertTriangle/>}/><StatCard label="Average accuracy" value={`${Math.round(state.adminUsers.reduce((s,u)=>s+u.accuracy,0)/state.adminUsers.length)}%`} detail="across active users" icon={<Target/>}/></section>
    <section className="panel admin-table-panel"><header className="admin-filterbar"><div className="table-search"><Search/><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search learners…"/></div><div><select value={plan} onChange={e=>setPlan(e.target.value)}><option>All</option><option>Trial</option><option>Core</option><option>Pro</option><option>Institution</option></select><button className="btn btn-secondary" onClick={()=>{setToast("Plan and search filters are active");setTimeout(()=>setToast(""),1400)}}><Filter/> Filters</button></div></header><div className="responsive-table"><table><thead><tr><th>Learner</th><th>Plan</th><th>Status</th><th>Progress</th><th>Last active</th><th/></tr></thead><tbody>{users.map(user=><tr key={user.id}><td><div className="admin-user-cell"><Avatar name={user.name}/><div><b>{user.name}</b><small>{user.email}</small></div></div></td><td><Badge tone={user.plan==="Pro"?"brand":user.plan==="Institution"?"info":"neutral"}>{user.plan}</Badge></td><td><Badge tone={user.status==="Active"?"success":user.status==="At risk"?"warning":"neutral"} dot>{user.status}</Badge></td><td><b>{user.questionsAnswered.toLocaleString()} answered</b><small>{user.accuracy}% accuracy</small></td><td>{formatDate(user.lastActiveAt,{month:"short",day:"numeric",year:"numeric"})}</td><td><button className="icon-btn" onClick={()=>setSelected(user)}><MoreHorizontal/></button></td></tr>)}</tbody></table></div></section>
    <Modal open={Boolean(selected)} onClose={()=>setSelected(null)} title={selected?.name||"Learner"} description={selected?.email}>{selected&&<div className="user-detail-modal"><div className="user-detail-head"><Avatar name={selected.name} size="lg"/><div><Badge tone={selected.status==="Active"?"success":selected.status==="At risk"?"warning":"neutral"}>{selected.status}</Badge><h3>{selected.plan} plan</h3><p>Joined {formatDate(selected.joinedAt,{month:"long",day:"numeric",year:"numeric"})}</p></div></div><div className="user-detail-stats"><div><b>{selected.questionsAnswered.toLocaleString()}</b><span>Questions answered</span></div><div><b>{selected.accuracy}%</b><span>Accuracy</span></div><div><b>{Math.max(1,Math.round(selected.questionsAnswered/180))}</b><span>Active weeks</span></div></div><div className="user-detail-actions"><button onClick={()=>updateStatus(selected,"Active")}><UserCheck/> Mark active</button><button onClick={()=>updateStatus(selected,"At risk")}><AlertTriangle/> Mark at risk</button><button onClick={()=>updateStatus(selected,"Paused")}><UserMinus/> Pause access</button><button onClick={()=>{setToast(`Message composer opened for ${selected.name}`);setTimeout(()=>setToast(""),1800)}}><Mail/> Send message</button></div></div>}</Modal><Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function ContentMapAdmin() {
  const { state }=useStepwise();
  const [step,setStep]=useState<Step>("Step 2 CK");
  const questions=state.questions.filter(question=>question.step===step&&question.status==="Published");
  const performance=systemPerformance(questions,state.attempts);
  const systems=[...new Set(questions.map(q=>q.system))];
  const disciplines=[...new Set(questions.map(q=>q.discipline))];
  return <>
    <PageHeader title="Content map" description="Inspect blueprint distribution, learner performance, and editorial coverage by exam." actions={<select className="header-select" value={step} onChange={e=>setStep(e.target.value as Step)}><option>Step 1</option><option>Step 2 CK</option></select>}/>
    <section className="content-map-top"><article className="panel blueprint-coverage"><header><div className="card-kicker"><Gauge/> Blueprint coverage</div><Badge tone="success">Within target</Badge></header><div><Donut value={92} size={164} detail="covered"/><div><h2>{questions.length} published items</h2><p>{systems.length} systems and {disciplines.length} disciplines represented in the demo library.</p><div><span><b>{systems.length}</b> systems</span><span><b>{disciplines.length}</b> disciplines</span><span><b>{questions.filter(q=>q.difficulty==="Hard").length}</b> hard items</span></div></div></div></article><article className="panel content-recommendations"><header><div className="card-kicker"><Sparkles/> Editorial recommendations</div></header><div><span className="risk"><AlertTriangle/></span><div><b>Increase Neurology medium-difficulty coverage</b><p>Low learner mastery and limited item depth make this the highest-value expansion area.</p></div><Link href="/admin/questions" aria-label="Open question library"><ArrowRight/></Link></div><div><span><Scale/></span><div><b>Add cross-system ethics scenarios</b><p>Decision-making content is concentrated in one topic cluster.</p></div><Link href="/admin/questions" aria-label="Open question library"><ArrowRight/></Link></div><div><span><RefreshCw/></span><div><b>Refresh two older explanations</b><p>Editorial freshness is approaching the internal review threshold.</p></div><Link href="/admin/questions" aria-label="Open question library"><ArrowRight/></Link></div></article></section>
    <section className="panel content-matrix"><header><div><h2>System coverage and performance</h2><p>Coverage is based on the demo question library; mastery reflects local learner attempts.</p></div><button className="btn btn-secondary" onClick={()=>downloadFile(`stepwise-${step.toLowerCase().replaceAll(" ","-")}-content-map.json`,JSON.stringify(performance,null,2))}><Download/> Export map</button></header><div className="responsive-table"><table><thead><tr><th>System</th><th>Items</th><th>Difficulty mix</th><th>Learner mastery</th><th>Coverage health</th></tr></thead><tbody>{performance.map(item=>{const qs=questions.filter(q=>q.system===item.system);const hard=qs.filter(q=>q.difficulty==="Hard").length;return <tr key={item.system}><td><b>{item.system}</b><small>{[...new Set(qs.map(q=>q.discipline))].join(", ")}</small></td><td><b>{qs.length}</b><small>{item.attempts} attempts</small></td><td><div className="difficulty-mix"><i style={{width:`${Math.max(10,(qs.length-hard)/qs.length*100)}%`}}/><b style={{width:`${Math.max(10,hard/qs.length*100)}%`}}/></div><small>{hard} hard · {qs.length-hard} easy/medium</small></td><td><Progress value={item.mastery}/><small>{item.accuracy}% accuracy</small></td><td><Badge tone={item.mastery<60?"warning":"success"}>{item.mastery<60?"Expand":"Healthy"}</Badge></td></tr>})}</tbody></table></div></section>
  </>;
}

function ReportsAdmin() {
  const { state,dispatch }=useStepwise();
  const [tab,setTab]=useState<"Open"|"Resolved">("Open");
  const [selected,setSelected]=useState(state.reports.find(r=>r.status==="Open")||null);
  const [toast,setToast]=useState("");
  const reports=state.reports.filter(report=>report.status===tab);
  const resolve=()=>{if(!selected)return;dispatch({type:"SET_REPORT_STATUS",id:selected.id,status:"Resolved"});setToast("Report resolved");setSelected(null);window.setTimeout(()=>setToast(""),1600)};
  return <>
    <PageHeader title="Content reports" description="Triage learner feedback, inspect item context, and document editorial resolution." actions={<button className="btn btn-secondary" onClick={()=>downloadFile("stepwise-content-reports.json",JSON.stringify(state.reports,null,2))}><Download/> Export log</button>}/>
    <div className="page-tabs"><button className={tab==="Open"?"active":""} onClick={()=>{setTab("Open");setSelected(null)}}>Open <span>{state.reports.filter(r=>r.status==="Open").length}</span></button><button className={tab==="Resolved"?"active":""} onClick={()=>{setTab("Resolved");setSelected(null)}}>Resolved <span>{state.reports.filter(r=>r.status==="Resolved").length}</span></button></div>
    <section className="reports-layout"><aside className="panel report-list">{reports.map(report=><button key={report.id} className={selected?.id===report.id?"active":""} onClick={()=>setSelected(report)}><div><Badge tone={report.reason==="Medical accuracy"?"danger":report.reason==="Ambiguous wording"?"warning":"neutral"}>{report.reason}</Badge><span>{formatDate(report.createdAt,{month:"short",day:"numeric"})}</span></div><b>{report.questionId}</b><p>{report.detail}</p><small>Reported by {report.reporter}</small></button>)}{!reports.length&&<div className="admin-empty-inline"><CheckCircle2/><span><b>No reports here</b><small>This queue is currently clear.</small></span></div>}</aside><main className="panel report-detail">{selected?(()=>{const question=state.questions.find(q=>q.id===selected.questionId);return <><header><div><Badge tone={selected.status==="Open"?"warning":"success"}>{selected.status}</Badge><h2>{selected.reason}</h2><p>{selected.questionId} · Submitted {formatDate(selected.createdAt,{month:"long",day:"numeric",year:"numeric"})}</p></div><button className="icon-btn" onClick={()=>{setToast("Report actions are available in this detail panel");setTimeout(()=>setToast(""),1400)}} aria-label="Report actions"><MoreHorizontal/></button></header><article className="report-message"><Flag/><div><b>Learner report</b><p>{selected.detail}</p><small>{selected.reporter}</small></div></article>{question&&<article className="report-question-context"><div><span>{question.id}</span><Badge>{question.step}</Badge><Badge>{question.system}</Badge></div><h3>{question.stem}</h3><p><b>Current explanation:</b> {question.explanation}</p><footer><span>{question.globalAccuracy}% global accuracy</span><span>{question.averageTimeSec}s average time</span><Link href="/admin/questions"><Edit3/> Open editor</Link></footer></article>}<article className="resolution-note"><Field label="Resolution note"><textarea rows={5} defaultValue={selected.status==="Resolved"?"Reviewed by the editorial team. The item was clarified and republished.":""} placeholder="Document what you reviewed and any changes made…"/></Field></article><footer>{selected.status==="Open"?<><button className="btn btn-secondary" onClick={()=>{setToast("Follow-up request queued for the connected email service");setTimeout(()=>setToast(""),1800)}}>Request more detail</button><button className="btn btn-brand" onClick={resolve}><CheckCircle2/> Resolve report</button></>:<button className="btn btn-secondary" onClick={()=>{dispatch({type:"SET_REPORT_STATUS",id:selected.id,status:"Open"});setToast("Report reopened")}}><RefreshCw/> Reopen report</button>}</footer></>} )():<div className="report-placeholder"><Flag/><h2>Select a report</h2><p>Choose an item from the queue to inspect its learner feedback and question context.</p></div>}</main></section><Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function BillingAdmin() {
  const { state }=useStepwise();
  const [period,setPeriod]=useState("Monthly");
  const [toast,setToast]=useState("");
  const revenue=[0,0,0,0,0,0,0];
  return <>
    <PageHeader title="Billing" description="Track plan mix, recurring revenue, invoices, and frontend subscription states." actions={<><button className="btn btn-secondary" onClick={()=>{setToast("Revenue export prepared");setTimeout(()=>setToast(""),1600)}}><Download/> Export revenue</button><button className="btn btn-brand" onClick={()=>{setToast("Coupon editor is ready for a billing-provider connection");setTimeout(()=>setToast(""),1800)}}><CreditCard/> Create coupon</button></>}/>
    <section className="stat-grid four"><StatCard label="MRR" value="$0" trend="Baseline " detail="month over month" icon={<CircleDollarSign/>}/><StatCard label="Paid accounts" value={state.adminUsers.filter(u=>u.plan!=="Trial").length} detail="Active accounts" icon={<UserCheck/>}/><StatCard label="Trial conversion" value="0%" trend="Baseline " detail="last 30 days" icon={<TrendingUp/>}/><StatCard label="Churn" value="0.0%" trend="Baseline " detail="month over month" icon={<UserMinus/>}/></section>
    <section className="billing-main-grid"><article className="panel revenue-card"><header><div><div className="card-kicker"><BarChart3/> Revenue trend</div><h2>Recurring revenue</h2></div><select value={period} onChange={e=>setPeriod(e.target.value)}><option>Monthly</option><option>Quarterly</option><option>Annual</option></select></header><div className="revenue-chart">{revenue.map((value,index)=><div key={index}><span>${value}k</span><i style={{height:`${Math.max(4, value*5)}px`}}/><small>{["Jan","Feb","Mar","Apr","May","Jun","Jul"][index]}</small></div>)}</div><footer><b>$0 current MRR</b><span>Projected annual run rate: $0</span></footer></article><article className="panel plan-mix"><header><div className="card-kicker"><Layers3/> Plan mix</div></header><div className="plan-mix-donut"><Donut value={0} size={150} detail="Pro + Inst."/><div>{[["Pro",0,"brand"],["Institution",0,"info"],["Core",0,"success"],["Trial",100,"warning"]].map(([label,value,tone])=><p key={String(label)}><Badge tone={tone as "brand"|"info"|"success"|"warning"} dot>{label}</Badge><b>{value}%</b></p>)}</div></div><button className="btn btn-secondary btn-block" onClick={()=>{setToast("Plan configuration opened in demo mode");setTimeout(()=>setToast(""),1600)}}>Manage plans</button></article></section>
    <section className="panel admin-table-panel"><header className="billing-table-head"><div><h2>Recent transactions</h2><p>Sample billing events for the frontend admin experience.</p></div><button onClick={()=>{setToast("All loaded transactions are already shown");setTimeout(()=>setToast(""),1400)}}>View all</button></header><div className="responsive-table"><table><thead><tr><th>Customer</th><th>Plan</th><th>Amount</th><th>Status</th><th>Date</th><th>Invoice</th></tr></thead><tbody>{state.adminUsers.filter(u=>u.plan!=="Trial").map((user,index)=><tr key={user.id}><td><div className="admin-user-cell"><Avatar name={user.name}/><div><b>{user.name}</b><small>{user.email}</small></div></div></td><td>{user.plan}</td><td><b>${user.plan==="Institution"?"499.00":user.plan==="Pro"?"49.00":"29.00"}</b></td><td><Badge tone={index===4?"warning":"success"}>{index===4?"Pending":"Paid"}</Badge></td><td>Jul {18-index}, 2026</td><td><button className="icon-btn" aria-label={`Download invoice for ${user.name}`} onClick={()=>downloadFile(`invoice-${user.id}.txt`,`Stepwise demo invoice\nCustomer: ${user.name}\nPlan: ${user.plan}\nStatus: ${index===4?"Pending":"Paid"}`,"text/plain")}><Download/></button></td></tr>)}</tbody></table></div></section><Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function AdminSettings() {
  const [section,setSection]=useState("Workspace");
  const [saved,setSaved]=useState("");
  const [settings,setSettings]=useState({reviewRequired:true,autoArchive:false,reportAlerts:true,weeklyDigest:true,learnerExports:false,maintenance:false,sourceRequired:true,billingFailures:false});
  const update=(key:keyof typeof settings,value:boolean)=>{setSettings({...settings,[key]:value});setSaved("Settings saved");setTimeout(()=>setSaved(""),1400)};
  return <>
    <PageHeader title="Admin settings" description="Configure workspace identity, content governance, notifications, and access policies."/>
    <section className="settings-layout admin-settings-layout"><aside className="settings-nav panel">{(Object.entries({Workspace:Settings,"Content governance":ShieldCheck,Notifications:Mail,"Access & roles":Users,Integrations:Globe2}) as [string,React.ComponentType<{size?:number}>][]).map(([label,Icon])=><button key={label} className={section===label?"active":""} onClick={()=>setSection(label)}>{<Icon/>}{label}<ArrowRight/></button>)}</aside><main className="settings-content panel">
      {section==="Workspace"&&<><header><h2>Workspace profile</h2><p>Basic product identity used across administrative surfaces.</p></header><div className="admin-brand-editor"><div className="admin-brand-mark">S</div><div><b>Stepwise</b><p>USMLE preparation workspace</p><button onClick={()=>{setSaved("Logo picker opened in demo mode");setTimeout(()=>setSaved(""),1400)}}>Replace logo</button></div></div><div className="form-grid-2"><Field label="Workspace name"><input defaultValue="Stepwise Admin"/></Field><Field label="Support email"><input defaultValue="support@stepwise.demo"/></Field></div><Field label="Organization"><input defaultValue="Stepwise Learning Labs"/></Field><Field label="Public status message"><textarea rows={3} defaultValue="All systems operational."/></Field><button className="btn btn-brand" onClick={()=>{setSaved("Workspace profile saved");setTimeout(()=>setSaved(""),1400)}}>Save workspace</button></>}
      {section==="Content governance"&&<><header><h2>Content governance</h2><p>Define review gates and lifecycle behavior for question content.</p></header><div className="settings-group"><Toggle checked={settings.reviewRequired} onChange={v=>update("reviewRequired",v)} label="Require editorial review before publishing" detail="Drafts must enter the In review state before publication."/><Toggle checked={settings.autoArchive} onChange={v=>update("autoArchive",v)} label="Automatically archive stale items" detail="Archive items that miss the annual medical review threshold."/><Toggle checked={settings.sourceRequired} onChange={v=>update("sourceRequired",v)} label="Require source documentation" detail="Editors must record a source label before publishing."/></div><div className="governance-threshold"><Field label="Medical review interval"><select defaultValue="12"><option value="6">Every 6 months</option><option value="12">Every 12 months</option><option value="18">Every 18 months</option></select></Field><Field label="Report escalation threshold"><select defaultValue="3"><option value="1">1 report</option><option value="3">3 reports</option><option value="5">5 reports</option></select></Field></div></>}
      {section==="Notifications"&&<><header><h2>Admin notifications</h2><p>Choose the operational events that generate alerts.</p></header><div className="settings-group"><Toggle checked={settings.reportAlerts} onChange={v=>update("reportAlerts",v)} label="New content reports" detail="Alert editors when a learner submits medical or wording feedback."/><Toggle checked={settings.weeklyDigest} onChange={v=>update("weeklyDigest",v)} label="Weekly operations digest" detail="Send platform growth, content health, and unresolved queue metrics."/><Toggle checked={settings.billingFailures} onChange={v=>update("billingFailures",v)} label="Billing failures" detail="Notify owners when a payment retry fails."/></div></>}
      {section==="Access & roles"&&<><header><h2>Access and roles</h2><p>Frontend role matrix for the administrative workspace.</p></header><div className="role-grid">{[["Owner","Full workspace, billing, and role administration",3],["Content admin","Question authoring, reports, and blueprint analytics",5],["Support","Learner access and account troubleshooting",2]].map(([name,desc,count])=><article key={String(name)}><span><ShieldCheck/></span><div><b>{name}</b><p>{desc}</p><small>{count} members</small></div><button onClick={()=>{setSaved(`${name} role editor opened`);setTimeout(()=>setSaved(""),1400)}} aria-label={`Edit ${name} role`}><Edit3/></button></article>)}</div><button className="btn btn-secondary" onClick={()=>{setSaved("New role editor opened");setTimeout(()=>setSaved(""),1400)}}><Plus/> Add role</button></>}
      {section==="Integrations"&&<><header><h2>Integrations</h2><p>Connection-ready cards for production services.</p></header><div className="integration-grid">{(Object.entries({Authentication:UserCheck,Billing:CreditCard,Email:Send,Analytics:Activity}) as [string,React.ComponentType<{size?:number}>][]).map(([name,Icon])=>{const desc=(name==="Authentication"?"Identity provider and SSO":name==="Billing"?"Subscription and invoice provider":name==="Email"?"Transactional notifications":"Product event pipeline");const status=name==="Authentication"?"Configured":"Demo mode";return <article key={name}><span>{<Icon/>}</span><div><b>{name}</b><p>{desc}</p><Badge tone={status==="Configured"?"success":"warning"}>{status}</Badge></div><button onClick={()=>{setSaved(`${name} configuration opened`);setTimeout(()=>setSaved(""),1400)}}>Configure</button></article>})}</div><div className="integration-note"><AlertTriangle/><div><b>No secrets are included in this repository.</b><p>Use the provided environment example when connecting production providers.</p></div></div></>}
    </main></section><Toast message={saved} visible={Boolean(saved)}/>
  </>;
}
