"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import {
  Activity, AlertTriangle, ArrowRight, BarChart3, Check, CheckCircle2,
  CircleDollarSign, Copy, CreditCard, Download, Edit3, Eye,
  FileStack, Filter, Flag, Gauge, Globe2, Image as ImageIcon, Layers3, Mail, MoreHorizontal, Plus,
  RefreshCw, Scale, Search, Send, Settings, ShieldCheck, Smartphone, Sparkles, Tablet, Target, Trash2, TrendingUp, UploadCloud, UserCheck,
  UserMinus, Users, X
} from "lucide-react";
import { systemPerformance } from "@/lib/algorithms";
import { useStepwise } from "@/lib/store";
import type { AdminUser, Difficulty, InfluencerProfile, JsonlQuestion, Question, QuestionAiEnrichment, QuestionOption, QuestionStatus, QuestionTaxonomy, Step } from "@/lib/types";
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

export function parseJsonlText(text: string): { valid: Question[]; invalid: number; mediaCount: number; rawJsonl: JsonlQuestion[] } {
  const lines = text.split(/\r?\n/).filter(line => line.trim().length > 0);
  const valid: Question[] = [];
  const rawJsonl: JsonlQuestion[] = [];
  let invalid = 0;
  let mediaCount = 0;

  for (const line of lines) {
    try {
      const obj = JSON.parse(line.trim()) as JsonlQuestion;
      if (!obj.stem && !obj.id) {
        invalid++;
        continue;
      }
      rawJsonl.push(obj);
      if (obj.media?.questionImages?.length || obj.media?.explanationImages?.length) {
        mediaCount += (obj.media.questionImages?.length || 0) + (obj.media.explanationImages?.length || 0);
      }

      const options = obj.options || [];
      const choices = options.map((opt, idx) => ({
        id: `${obj.id || "q"}-${opt.key || String.fromCharCode(65 + idx)}`,
        text: opt.text || ""
      }));

      const correctOpt = options.find(opt => opt.isCorrect);
      const correctChoiceId = correctOpt
        ? `${obj.id || "q"}-${correctOpt.key}`
        : choices[0]?.id || "";

      const distractorAnalysis: Record<string, string> = obj.explanation?.distractorAnalysis || {};
      const wrongNotes: Record<string, string> = {};
      options.forEach(opt => {
        if (!opt.isCorrect && opt.key && distractorAnalysis[opt.key]) {
          wrongNotes[`${obj.id || "q"}-${opt.key}`] = distractorAnalysis[opt.key];
        }
      });

      const organSystem = obj.taxonomy?.organSystem || "Gastrointestinal System";
      const subject = obj.taxonomy?.subject || "Internal Medicine";
      const step: Step = subject.includes("Step 1") || (obj.bankTitle && obj.bankTitle.toLowerCase().includes("step1")) ? "Step 1" : "Step 2 CK";

      const questionObj: Question = {
        id: obj.id || `Q-${Math.floor(1000 + Math.random() * 9000)}`,
        questionId: obj.questionId || `QID:${Math.floor(1000 + Math.random() * 9000)}`,
        step,
        system: organSystem,
        discipline: subject,
        topic: obj.taxonomy?.topic || "General",
        subtopic: obj.taxonomy?.subtopic || "",
        bankTitle: obj.bankTitle || "Stepwise_QBank",
        blockName: obj.blockName || "Block_1",
        difficulty: (obj.aiEnrichment?.difficultyLevel === "Easy" ? "Easy" : obj.aiEnrichment?.difficultyLevel === "Hard" ? "Hard" : "Medium") as Difficulty,
        status: (obj.status?.toLowerCase() === "published" ? "Published" : "Draft") as QuestionStatus,
        stem: obj.stem || "",
        choices,
        options,
        correctChoiceId,
        explanation: obj.explanation?.main || "",
        objective: obj.explanation?.educationalObjective || "",
        pearls: obj.aiEnrichment?.clinicalPearl ? [obj.aiEnrichment.clinicalPearl] : [],
        wrongChoiceNotes: wrongNotes,
        tags: obj.aiEnrichment?.highYieldKeywords || [],
        author: "iMD Author",
        updatedAt: obj.timestamp ? obj.timestamp.slice(0, 10) : new Date().toISOString().slice(0, 10),
        averageTimeSec: 85,
        globalAccuracy: parseInt(options.find(o => o.isCorrect)?.percent || "65", 10) || 65,
        answerStats: obj.answerStats || "",
        taxonomy: obj.taxonomy,
        richExplanation: obj.explanation,
        aiEnrichment: obj.aiEnrichment,
        media: obj.media
      };

      valid.push(questionObj);
    } catch {
      invalid++;
    }
  }

  return { valid, invalid, mediaCount, rawJsonl };
}

const SYSTEM_COLORS: Record<string, string> = {
  "Gastrointestinal System": "#3b82f6",
  "Cardiovascular": "#ef4444",
  "Renal": "#10b981",
  "Neurology": "#8b5cf6",
  "Respiratory": "#f59e0b",
  "Musculoskeletal": "#ec4899",
  "Hematology": "#6366f1",
  "Endocrine": "#14b8a6",
  "Reproductive": "#f97316",
  "General": "#64748b"
};

function SystemPieChart({ data }: { data: Array<{ label: string; count: number; color: string }> }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  if (!total) {
    return <div className="pie-chart-empty"><PieChartPlaceholder/><span>No questions in database</span></div>;
  }
  const cumulativeCounts = data.reduce<number[]>(
    (counts, item) => [...counts, (counts.at(-1) ?? 0) + item.count],
    [0]
  );
  const slices = data.map((item, index) => {
    const percent = item.count / total;
    const startAngle = (cumulativeCounts[index] / total) * 2 * Math.PI - Math.PI / 2;
    const endAngle = (cumulativeCounts[index + 1] / total) * 2 * Math.PI - Math.PI / 2;
    const x1 = Math.cos(startAngle) * 42 + 50;
    const y1 = Math.sin(startAngle) * 42 + 50;
    const x2 = Math.cos(endAngle) * 42 + 50;
    const y2 = Math.sin(endAngle) * 42 + 50;
    const largeArc = percent > 0.5 ? 1 : 0;
    const pathData = percent >= 0.999
      ? `M 50 8 A 42 42 0 1 1 49.99 8 Z`
      : `M 50 50 L ${x1} ${y1} A 42 42 0 ${largeArc} 1 ${x2} ${y2} Z`;
    return { ...item, pathData, percent: Math.round(percent * 100) };
  });

  return (
    <div className="admin-pie-container">
      <div className="pie-graphic-wrap">
        <svg viewBox="0 0 100 100" className="admin-pie-svg">
          {slices.map((slice, i) => (
            <path key={i} d={slice.pathData} fill={slice.color} stroke="var(--surface)" strokeWidth="1.5">
              <title>{`${slice.label}: ${slice.count} questions (${slice.percent}%)`}</title>
            </path>
          ))}
          <circle cx="50" cy="50" r="26" fill="var(--surface)" />
          <text x="50" y="47" textAnchor="middle" className="pie-center-text" fill="var(--fg-main)">{total}</text>
          <text x="50" y="58" textAnchor="middle" className="pie-center-sub" fill="var(--muted)">Items</text>
        </svg>
      </div>
      <div className="admin-pie-legend">
        {slices.map((slice, i) => (
          <div key={i} className="pie-legend-item">
            <span className="pie-dot" style={{ backgroundColor: slice.color }} />
            <span className="pie-label">{slice.label}</span>
            <b className="pie-value">{slice.count} ({slice.percent}%)</b>
          </div>
        ))}
      </div>
    </div>
  );
}

function PieChartPlaceholder() {
  return <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a10 10 0 0 1 10 10H12z"/></svg>;
}

export function AdminPage({ section }: { section: string }) {
  if (section === "importer") return <ImporterAdmin/>;
  if (section === "questions") return <QuestionsAdmin/>;
  if (section === "users") return <UsersAdmin/>;
  if (section === "content") return <ContentMapAdmin/>;
  if (section === "reports") return <ReportsAdmin/>;
  if (section === "billing") return <BillingAdmin/>;
  if (section === "affiliates") return <AffiliatesAdmin/>;
  if (section === "settings") return <AdminSettings/>;
  return <AdminOverview/>;
}

function AdminOverview() {
  const { state } = useStepwise();
  const totalQuestions = state.questions.length;
  const published = state.questions.filter(question => question.status === "Published").length;
  const draft = state.questions.filter(question => question.status === "Draft").length;
  const openReports = state.reports.filter(report => report.status === "Open").length;

  const uniqueBlocks = new Set(state.questions.map(q => q.blockName || q.discipline || "Block_1")).size;
  const mediaCount = state.questions.filter(q => q.media?.questionImages?.length || q.media?.explanationImages?.length).length;

  const systemCounts = useMemo(() => {
    const map = new Map<string, number>();
    for (const q of state.questions) {
      const sys = q.system || "Other";
      map.set(sys, (map.get(sys) || 0) + 1);
    }
    const result: Array<{ label: string; count: number; color: string }> = [];
    let idx = 0;
    const fallbackColors = ["#3b82f6", "#ef4444", "#10b981", "#8b5cf6", "#f59e0b", "#ec4899", "#6366f1", "#14b8a6"];
    map.forEach((count, label) => {
      result.push({
        label,
        count,
        color: SYSTEM_COLORS[label] || fallbackColors[idx % fallbackColors.length]
      });
      idx++;
    });
    return result.sort((a, b) => b.count - a.count);
  }, [state.questions]);

  const difficultyCounts = useMemo(() => {
    const easy = state.questions.filter(q => q.difficulty === "Easy").length;
    const medium = state.questions.filter(q => q.difficulty === "Medium").length;
    const hard = state.questions.filter(q => q.difficulty === "Hard").length;
    return { easy, medium, hard, total: totalQuestions };
  }, [state.questions, totalQuestions]);

  return <>
    <PageHeader eyebrow="Content Administration & Analytics" title="Dashboard Overview" description="Monitor question bank volume, organ system distribution, difficulty mix, and operational queues." actions={<><Link className="btn btn-secondary" href="/admin/importer"><UploadCloud/> JSONL Importer</Link><Link className="btn btn-brand" href="/admin/questions"><Plus/> New question</Link></>}/>

    <section className="stat-grid four admin-stat-grid">
      <StatCard label="Total Questions" value={totalQuestions} detail={`${published} published · ${draft} drafts`} trend="Active " icon={<FileStack/>}><Progress value={(published / Math.max(totalQuestions, 1)) * 100}/></StatCard>
      <StatCard label="Total Blocks" value={uniqueBlocks} detail="across active blueprints" icon={<Layers3/>}><Sparkline values={[1, 2, 2, 3, 3, uniqueBlocks]} height={34}/></StatCard>
      <StatCard label="Media Attachments" value={mediaCount} detail={`${Math.round((mediaCount / Math.max(totalQuestions, 1)) * 100)}% question coverage`} icon={<ImageIcon/>}><Progress value={(mediaCount / Math.max(totalQuestions, 1)) * 100}/></StatCard>
      <StatCard label="Open Reports" value={openReports} detail={openReports ? "Editorial review needed" : "Queue clear"} icon={<Flag/>}><span className="admin-stat-link">Review queue <ArrowRight/></span></StatCard>
    </section>

    <section className="admin-overview-grid">
      <article className="panel admin-growth-card">
        <header>
          <div>
            <div className="card-kicker"><Gauge/> Blueprint Distribution</div>
            <h2>Distribution by Organ System</h2>
            <p>Percentage and item count breakdown across medical systems.</p>
          </div>
          <Badge tone="brand">{systemCounts.length} Systems</Badge>
        </header>
        <SystemPieChart data={systemCounts} />
      </article>

      <article className="panel admin-health-card">
        <header>
          <div className="card-kicker"><BarChart3/> Difficulty Breakdown</div>
          <h2>Difficulty Distribution</h2>
        </header>
        <div className="difficulty-summary-box">
          <div className="diff-bar-item">
            <div><span>Easy</span><b>{difficultyCounts.easy} ({Math.round((difficultyCounts.easy / Math.max(difficultyCounts.total, 1)) * 100)}%)</b></div>
            <Progress value={(difficultyCounts.easy / Math.max(difficultyCounts.total, 1)) * 100} />
          </div>
          <div className="diff-bar-item">
            <div><span>Medium</span><b>{difficultyCounts.medium} ({Math.round((difficultyCounts.medium / Math.max(difficultyCounts.total, 1)) * 100)}%)</b></div>
            <Progress value={(difficultyCounts.medium / Math.max(difficultyCounts.total, 1)) * 100} />
          </div>
          <div className="diff-bar-item">
            <div><span>Hard</span><b>{difficultyCounts.hard} ({Math.round((difficultyCounts.hard / Math.max(difficultyCounts.total, 1)) * 100)}%)</b></div>
            <Progress value={(difficultyCounts.hard / Math.max(difficultyCounts.total, 1)) * 100} />
          </div>
        </div>
        <div className="diff-footer-stats">
          <div><Badge tone="success" dot>Easy: {difficultyCounts.easy}</Badge></div>
          <div><Badge tone="warning" dot>Medium: {difficultyCounts.medium}</Badge></div>
          <div><Badge tone="danger" dot>Hard: {difficultyCounts.hard}</Badge></div>
        </div>
      </article>
    </section>

    <section className="admin-lower-grid">
      <article className="panel admin-queue">
        <header><div><div className="card-kicker"><FileStack/> Draft & Editorial Queue</div><h2>Questions needing review</h2></div><Link href="/admin/questions">Explorer <ArrowRight/></Link></header>
        {state.questions.filter(q => q.status === "Draft" || q.status === "In review").slice(0, 4).map(question => (
          <div key={question.id}>
            <span className="queue-status"><i className={question.status.toLowerCase().replace(" ", "-")}/></span>
            <div><b>{question.questionId || question.id} · {question.topic || question.system}</b><p>{question.stem.slice(0, 80)}…</p></div>
            <Badge tone={question.status === "Draft" ? "warning" : "info"}>{question.status}</Badge>
            <Link className="icon-btn" href="/admin/questions" aria-label={`Open ${question.id}`}><ArrowRight/></Link>
          </div>
        ))}
        {!state.questions.some(q => q.status === "Draft" || q.status === "In review") && (
          <div className="admin-empty-inline"><CheckCircle2/><span><b>Editorial queue clear</b><small>All items are published.</small></span></div>
        )}
      </article>
      <article className="panel admin-new-users">
        <header><div><div className="card-kicker"><UserCheck/> Active Learners</div><h2>User accounts</h2></div><Link href="/admin/users">All users</Link></header>
        {state.adminUsers.slice(0, 4).map(user => (
          <div key={user.id}>
            <Avatar name={user.name}/>
            <div><b>{user.name}</b><p>{user.plan} · Joined {formatDate(user.joinedAt, { month: "short", day: "numeric" })}</p></div>
            <Badge tone={user.status === "Active" ? "success" : user.status === "At risk" ? "warning" : "neutral"}>{user.status}</Badge>
          </div>
        ))}
      </article>
    </section>
  </>;
}

function ImporterAdmin() {
  const { dispatch } = useStepwise();
  const [jsonlInput, setJsonlInput] = useState("");
  const [parsedResult, setParsedResult] = useState<{ valid: Question[]; invalid: number; mediaCount: number; rawJsonl: JsonlQuestion[] } | null>(null);
  const [toast, setToast] = useState("");
  const [dragActive, setDragActive] = useState(false);

  const sampleJsonl = `{
  "id": "uworld_step1_block1_q004",
  "questionId": "QID:6625",
  "answerStats": "Incorrect. Correct answer is B 51% answered correctly",
  "timestamp": "2026-07-22T15:48:44.112Z",
  "bankTitle": "iMD_QBank",
  "blockName": "Block_1",
  "index": 4,
  "stem": "A 12-year-old boy is brought to the office after developing bloody stools...",
  "options": [
    { "key": "A", "text": "Angiodysplasia", "percent": "18%", "isCorrect": false },
    { "key": "B", "text": "Hamartoma", "percent": "51%", "isCorrect": true },
    { "key": "C", "text": "Meckel diverticulum", "percent": "1%", "isCorrect": false },
    { "key": "D", "text": "Small-vessel vasculitis", "percent": "8%", "isCorrect": false }
  ],
  "taxonomy": {
    "subject": "Pediatrics / Gastroenterology",
    "organSystem": "Gastrointestinal System",
    "topic": "Polyposis Syndromes",
    "subtopic": "Peutz-Jeghers Syndrome"
  },
  "explanation": {
    "main": "Peutz-Jeghers syndrome is an autosomal dominant disease characterized by...",
    "educationalObjective": "Peutz-Jeghers syndrome is characterized by mucocutaneous macules and GI hamartomas.",
    "distractorAnalysis": {
      "A": "Angiodysplasia presents in elderly patients.",
      "C": "Meckel diverticulum causes painless bleeding.",
      "D": "Henoch-Schönlein purpura presents with palpable purpura."
    }
  },
  "aiEnrichment": {
    "difficultyLevel": "Medium",
    "difficultyScore": 3,
    "reasoningTraps": ["Confusing Henoch-Schönlein purpura with PJS."],
    "highYieldKeywords": ["Peutz-Jeghers", "STK11 mutation", "Hamartomatous polyps"],
    "clinicalPearl": "Hyperpigmented macules on the lips in a child with GI bleeding is pathognomonic."
  },
  "media": {
    "questionImages": ["media/q_4_question_img_1.png"],
    "explanationImages": ["media/q_4_explanation_fig_1.png"]
  },
  "status": "published"
}`;

  const handleParse = (text: string) => {
    setJsonlInput(text);
    if (!text.trim()) {
      setParsedResult(null);
      return;
    }
    const result = parseJsonlText(text);
    setParsedResult(result);
  };

  const handleFileUpload = (files: FileList | null) => {
    if (!files || !files[0]) return;
    const file = files[0];
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string || "";
      handleParse(content);
    };
    reader.readAsText(file);
  };

  const handleImportAll = () => {
    if (!parsedResult || !parsedResult.valid.length) return;
    for (const q of parsedResult.valid) {
      dispatch({ type: "UPSERT_QUESTION", question: q });
    }
    setToast(`Successfully imported ${parsedResult.valid.length} question(s) into database!`);
    setTimeout(() => setToast(""), 2500);
  };

  return <>
    <PageHeader title="JSONL Importer" description="Drag and drop 'questions.jsonl' files or paste JSON Lines data for live parsing preview and instant batch ingestion." actions={<><button className="btn btn-secondary" onClick={() => handleParse(sampleJsonl)}><Copy/> Load Sample JSONL</button><button className="btn btn-brand" disabled={!parsedResult?.valid.length} onClick={handleImportAll}><UploadCloud/> Import {parsedResult?.valid.length || 0} Questions</button></>}/>

    <section className="importer-layout-grid">
      <article className="panel importer-drop-panel">
        <header>
          <div className="card-kicker"><UploadCloud/> Data Ingestion</div>
          <h2>Drag & Drop questions.jsonl File</h2>
        </header>

        <div
          className={`dropzone-box ${dragActive ? "drag-over" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
          onDragLeave={() => setDragActive(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragActive(false);
            handleFileUpload(e.dataTransfer.files);
          }}
        >
          <UploadCloud size={42} />
          <h3>Drag and drop your <b>questions.jsonl</b> file here</h3>
          <p>Or select a file from your computer</p>
          <label className="btn btn-secondary btn-sm">
            Browse file
            <input type="file" accept=".jsonl,.json,.txt" style={{ display: "none" }} onChange={(e) => handleFileUpload(e.target.files)} />
          </label>
        </div>

        <div className="importer-textarea-wrap">
          <label className="field-label">Or paste JSONL raw text below:</label>
          <textarea
            rows={10}
            className="jsonl-textarea"
            value={jsonlInput}
            onChange={(e) => handleParse(e.target.value)}
            placeholder="Paste raw .jsonl contents here (one JSON object per line)…"
          />
        </div>
      </article>

      <article className="panel importer-preview-panel">
        <header>
          <div className="card-kicker"><Eye/> Live Parsing Preview</div>
          <h2>Ingestion Analysis</h2>
        </header>

        {parsedResult ? (
          <div className="parsing-stats-grid">
            <div className="stat-card-mini"><span>Valid Questions</span><b>{parsedResult.valid.length}</b></div>
            <div className="stat-card-mini"><span>Invalid / Errors</span><b className={parsedResult.invalid ? "text-danger" : ""}>{parsedResult.invalid}</b></div>
            <div className="stat-card-mini"><span>Media Linked</span><b>{parsedResult.mediaCount}</b></div>
          </div>
        ) : (
          <div className="importer-empty-state">
            <UploadCloud size={32} />
            <p>Upload or paste JSONL data to see a live validation breakdown and preview table.</p>
          </div>
        )}

        {parsedResult && parsedResult.valid.length > 0 && (
          <div className="parsed-questions-list">
            <h3>Parsed Items Preview ({parsedResult.valid.length})</h3>
            <div className="responsive-table">
              <table>
                <caption className="sr-only">Questions parsed from the selected JSON Lines file</caption>
                <thead>
                  <tr>
                    <th scope="col">QID</th>
                    <th scope="col">Stem Snippet</th>
                    <th scope="col">System / Subject</th>
                    <th scope="col">Options</th>
                    <th scope="col">Difficulty</th>
                    <th scope="col">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {parsedResult.valid.map((q) => (
                    <tr key={q.id}>
                      <td><b>{q.questionId || q.id}</b></td>
                      <td><p className="stem-snippet">{q.stem.slice(0, 60)}…</p></td>
                      <td><small>{q.system}<br/>{q.discipline}</small></td>
                      <td><Badge tone="info">{q.choices.length} options</Badge></td>
                      <td><Badge tone={q.difficulty === "Easy" ? "success" : q.difficulty === "Hard" ? "danger" : "warning"}>{q.difficulty}</Badge></td>
                      <td><Badge tone="success">{q.status}</Badge></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </article>
    </section>

    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

const emptyQuestion = (): Question => ({
  id: `uworld_step1_block1_q${Math.floor(100 + Math.random() * 900)}`,
  questionId: `QID:${Math.floor(6000 + Math.random() * 3000)}`,
  step: "Step 2 CK",
  system: "Gastrointestinal System",
  discipline: "Pediatrics / Gastroenterology",
  topic: "Polyposis Syndromes",
  subtopic: "Peutz-Jeghers Syndrome",
  bankTitle: "iMD_QBank",
  blockName: "Block_1",
  difficulty: "Medium",
  status: "Draft",
  stem: "",
  choices: [
    { id: "opt-A", text: "" },
    { id: "opt-B", text: "" },
    { id: "opt-C", text: "" },
    { id: "opt-D", text: "" }
  ],
  options: [
    { key: "A", text: "", percent: "20%", isCorrect: false },
    { key: "B", text: "", percent: "60%", isCorrect: true },
    { key: "C", text: "", percent: "10%", isCorrect: false },
    { key: "D", text: "", percent: "10%", isCorrect: false }
  ],
  correctChoiceId: "opt-B",
  explanation: "",
  objective: "",
  pearls: [],
  wrongChoiceNotes: {},
  tags: [],
  author: "Dr. Maya Patel",
  updatedAt: new Date().toISOString().slice(0, 10),
  averageTimeSec: 85,
  globalAccuracy: 60,
  taxonomy: {
    subject: "Pediatrics / Gastroenterology",
    organSystem: "Gastrointestinal System",
    topic: "Polyposis Syndromes",
    subtopic: "Peutz-Jeghers Syndrome"
  },
  aiEnrichment: {
    difficultyLevel: "Medium",
    difficultyScore: 3,
    reasoningTraps: [],
    highYieldKeywords: [],
    clinicalPearl: ""
  },
  media: {
    questionImages: [],
    explanationImages: []
  }
});

function completeTaxonomy(question: Question): QuestionTaxonomy {
  return {
    subject: question.taxonomy?.subject ?? question.discipline,
    organSystem: question.taxonomy?.organSystem ?? question.system,
    topic: question.taxonomy?.topic ?? question.topic,
    subtopic: question.taxonomy?.subtopic ?? question.subtopic ?? ""
  };
}

function completeAiEnrichment(question: Question): QuestionAiEnrichment {
  return {
    difficultyLevel: question.aiEnrichment?.difficultyLevel ?? question.difficulty,
    difficultyScore: question.aiEnrichment?.difficultyScore,
    reasoningTraps: question.aiEnrichment?.reasoningTraps ?? [],
    highYieldKeywords: question.aiEnrichment?.highYieldKeywords ?? question.tags,
    clinicalPearl: question.aiEnrichment?.clinicalPearl ?? question.pearls[0] ?? ""
  };
}

function QuestionsAdmin() {
  const { state, dispatch } = useStepwise();
  const [search, setSearch] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("All");
  const [systemFilter, setSystemFilter] = useState("All");
  const [difficultyFilter, setDifficultyFilter] = useState<"All" | Difficulty>("All");
  const [statusFilter, setStatusFilter] = useState<"All" | QuestionStatus>("All");

  const [editor, setEditor] = useState<Question | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Question | null>(null);
  const [toast, setToast] = useState("");

  const subjects = useMemo(() => ["All", ...new Set(state.questions.map(q => q.discipline || q.taxonomy?.subject).filter(Boolean))], [state.questions]);
  const systems = useMemo(() => ["All", ...new Set(state.questions.map(q => q.system || q.taxonomy?.organSystem).filter(Boolean))], [state.questions]);

  const filtered = state.questions.filter(question => {
    const keywords = (question.tags || []).join(" ");
    const haystack = `${question.id} ${question.questionId || ""} ${question.stem} ${question.system} ${question.topic} ${keywords}`.toLowerCase();
    const matchesSearch = haystack.includes(search.toLowerCase());
    const matchesSubject = subjectFilter === "All" || (question.discipline || question.taxonomy?.subject) === subjectFilter;
    const matchesSystem = systemFilter === "All" || (question.system || question.taxonomy?.organSystem) === systemFilter;
    const matchesDifficulty = difficultyFilter === "All" || question.difficulty === difficultyFilter;
    const matchesStatus = statusFilter === "All" || question.status === statusFilter;
    return matchesSearch && matchesSubject && matchesSystem && matchesDifficulty && matchesStatus;
  });

  const saveQuestion = (qToSave: Question) => {
    const normalized: Question = {
      ...qToSave,
      updatedAt: new Date().toISOString().slice(0, 10),
      tags: qToSave.tags.filter(Boolean),
      pearls: qToSave.pearls.filter(Boolean)
    };
    dispatch({ type: "UPSERT_QUESTION", question: normalized });
    setEditor(null);
    setToast("Question saved to database");
    setTimeout(() => setToast(""), 1800);
  };

  const duplicate = (question: Question) => {
    const copy = {
      ...question,
      id: `${question.id}-COPY`,
      questionId: `QID:${Math.floor(6000 + Math.random() * 3000)}`,
      status: "Draft" as QuestionStatus,
      updatedAt: new Date().toISOString().slice(0, 10)
    };
    dispatch({ type: "UPSERT_QUESTION", question: copy });
    setToast("Draft duplicate created");
    setTimeout(() => setToast(""), 1600);
  };

  return <>
    <PageHeader title="Question Explorer & Editor" description="Search, filter, edit, author, and preview medical question items with live mobile/tablet simulation." actions={<><button className="btn btn-secondary" onClick={() => downloadFile("questions.csv", csv([["ID", "QID", "System", "Subject", "Difficulty", "Status", "Accuracy"], ...filtered.map(q => [q.id, q.questionId || "", q.system, q.discipline, q.difficulty, q.status, q.globalAccuracy])]), "text/csv")}><Download/> Export CSV</button><button className="btn btn-brand" onClick={() => setEditor(emptyQuestion())}><Plus/> New Question</button></>}/>

    <section className="panel admin-table-panel">
      <header className="admin-filterbar">
        <div className="table-search">
          <Search aria-hidden="true"/>
          <input aria-label="Search questions" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search QID, stem text, or keywords…"/>
        </div>
        <div className="admin-filter-group">
          <select aria-label="Filter by subject" value={subjectFilter} onChange={e => setSubjectFilter(e.target.value)}>
            <option value="All">All Subjects</option>
            {subjects.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select aria-label="Filter by system" value={systemFilter} onChange={e => setSystemFilter(e.target.value)}>
            <option value="All">All Systems</option>
            {systems.filter(s => s !== "All").map(s => <option key={s} value={s}>{s}</option>)}
          </select>
          <select aria-label="Filter by difficulty" value={difficultyFilter} onChange={e => setDifficultyFilter(e.target.value as "All" | Difficulty)}>
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>
          <select aria-label="Filter by status" value={statusFilter} onChange={e => setStatusFilter(e.target.value as "All" | QuestionStatus)}>
            <option value="All">All Statuses</option>
            <option value="Draft">Draft</option>
            <option value="In review">In review</option>
            <option value="Published">Published</option>
            <option value="Archived">Archived</option>
          </select>
        </div>
      </header>

      <div className="admin-table-summary">
        <span><b>{filtered.length}</b> questions matching filters</span>
        <span>{state.questions.filter(q => q.status === "Published").length} published · {state.questions.filter(q => q.status === "Draft").length} drafts</span>
      </div>

      <div className="responsive-table">
        <table className="admin-question-table">
          <caption className="sr-only">Question bank items matching the current search and filters</caption>
          <thead>
            <tr>
              <th scope="col">QID / ID</th>
              <th scope="col">Stem & Keywords</th>
              <th scope="col">Subject / Organ System</th>
              <th scope="col">Difficulty</th>
              <th scope="col">Accuracy</th>
              <th scope="col">Status</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(question => (
              <tr key={question.id}>
                <td>
                  <div className="qid-cell">
                    <b>{question.questionId || question.id}</b>
                    <small>{question.bankTitle || "iMD_QBank"}</small>
                  </div>
                </td>
                <td>
                  <div className="question-cell">
                    <p>{question.stem.slice(0, 100)}{question.stem.length > 100 ? "…" : ""}</p>
                    <small>{(question.tags || []).slice(0, 3).map(tag => `#${tag}`).join("  ")}</small>
                  </div>
                </td>
                <td>
                  <b>{question.system}</b>
                  <small>{question.discipline}</small>
                </td>
                <td>
                  <Badge tone={question.difficulty === "Easy" ? "success" : question.difficulty === "Hard" ? "danger" : "warning"}>{question.difficulty}</Badge>
                </td>
                <td>
                  <b>{question.globalAccuracy}%</b>
                  <small>{question.averageTimeSec}s avg</small>
                </td>
                <td>
                  <Badge tone={question.status === "Published" ? "success" : question.status === "Draft" ? "warning" : "info"} dot>{question.status}</Badge>
                </td>
                <td>
                  <div className="row-actions">
                    <button onClick={() => setEditor(structuredClone(question))} title="Edit Question & Live Preview" aria-label={`Edit ${question.questionId || question.id}`}><Edit3/></button>
                    <button onClick={() => duplicate(question)} title="Duplicate" aria-label={`Duplicate ${question.questionId || question.id}`}><Copy/></button>
                    <button onClick={() => setDeleteTarget(question)} title="Delete" aria-label={`Delete ${question.questionId || question.id}`}><Trash2/></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>

    {editor && (
      <QuestionEditorModal
        question={editor}
        onClose={() => setEditor(null)}
        onSave={saveQuestion}
      />
    )}

    <Modal open={Boolean(deleteTarget)} onClose={() => setDeleteTarget(null)} title="Delete question?" description={`${deleteTarget?.id} will be permanently removed.`}>
      <div className="exit-modal-actions">
        <button className="btn btn-secondary" onClick={() => setDeleteTarget(null)}>Cancel</button>
        <button className="btn btn-danger" onClick={() => { if (deleteTarget) dispatch({ type: "DELETE_QUESTION", id: deleteTarget.id }); setDeleteTarget(null); setToast("Question deleted"); }}>
          <Trash2/> Delete
        </button>
      </div>
    </Modal>

    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function QuestionEditorModal({ question, onClose, onSave }: { question: Question; onClose: () => void; onSave: (q: Question) => void }) {
  const [eq, setEq] = useState<Question>(structuredClone(question));
  const [device, setDevice] = useState<"mobile" | "tablet">("mobile");
  const [previewSelectedChoice, setPreviewSelectedChoice] = useState<string | null>(null);

  const options: QuestionOption[] = eq.options && eq.options.length > 0
    ? eq.options
    : eq.choices.map((c, i) => ({
        key: String.fromCharCode(65 + i),
        text: c.text,
        percent: "25%",
        isCorrect: c.id === eq.correctChoiceId
      }));

  const updateOptionText = (index: number, text: string) => {
    const nextOptions = [...options];
    nextOptions[index] = { ...nextOptions[index], text };
    const nextChoices = nextOptions.map((opt, i) => ({
      id: `${eq.id}-${opt.key || String.fromCharCode(65 + i)}`,
      text: opt.text
    }));
    setEq({ ...eq, options: nextOptions, choices: nextChoices });
  };

  const updateOptionCorrect = (index: number) => {
    const nextOptions = options.map((opt, i) => ({
      ...opt,
      isCorrect: i === index
    }));
    const correctId = `${eq.id}-${nextOptions[index].key || String.fromCharCode(65 + index)}`;
    setEq({ ...eq, options: nextOptions, correctChoiceId: correctId });
  };

  const addOption = () => {
    const nextKey = String.fromCharCode(65 + options.length);
    const nextOptions = [...options, { key: nextKey, text: "", percent: "0%", isCorrect: false }];
    const nextChoices = nextOptions.map((opt, i) => ({
      id: `${eq.id}-${opt.key || String.fromCharCode(65 + i)}`,
      text: opt.text
    }));
    setEq({ ...eq, options: nextOptions, choices: nextChoices });
  };

  const removeOption = (index: number) => {
    if (options.length <= 2) return;
    const nextOptions = options.filter((_, i) => i !== index);
    setEq({ ...eq, options: nextOptions });
  };

  return (
    <div className="editor-overlay-modal">
      <div className="editor-window">
        <header className="editor-top-bar">
          <div className="editor-title-wrap">
            <Badge tone="brand">{eq.status}</Badge>
            <h2>{eq.questionId || eq.id} — Editor & Student Preview</h2>
          </div>
          <div className="editor-top-actions">
            <div className="device-toggle-group">
              <button className={device === "mobile" ? "active" : ""} onClick={() => setDevice("mobile")}><Smartphone size={16}/> Mobile</button>
              <button className={device === "tablet" ? "active" : ""} onClick={() => setDevice("tablet")}><Tablet size={16}/> Tablet</button>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={() => onSave({ ...eq, status: "Draft" })}>Save Draft</button>
            <button className="btn btn-brand btn-sm" onClick={() => onSave({ ...eq, status: "Published" })}><Check/> Publish</button>
            <button className="icon-btn" onClick={onClose} aria-label="Close editor"><X/></button>
          </div>
        </header>

        <div className="editor-split-body">
          {/* Left Side: WYSIWYG & Form Editor */}
          <div className="editor-left-form">
            <section className="form-section">
              <h3>Question Metadata & Identifiers</h3>
              <div className="form-grid-2">
                <Field label="QID / Question ID"><input value={eq.questionId || ""} onChange={e => setEq({ ...eq, questionId: e.target.value })} placeholder="e.g. QID:6625"/></Field>
                <Field label="Internal ID"><input value={eq.id} onChange={e => setEq({ ...eq, id: e.target.value })}/></Field>
                <Field label="QBank Title"><input value={eq.bankTitle || "iMD_QBank"} onChange={e => setEq({ ...eq, bankTitle: e.target.value })}/></Field>
                <Field label="Block Name"><input value={eq.blockName || "Block_1"} onChange={e => setEq({ ...eq, blockName: e.target.value })}/></Field>
              </div>
            </section>

            <section className="form-section">
              <h3>Taxonomy & Tags</h3>
              <div className="form-grid-2">
                <Field label="Subject"><input value={eq.taxonomy?.subject || eq.discipline} onChange={e => setEq({ ...eq, discipline: e.target.value, taxonomy: { ...completeTaxonomy(eq), subject: e.target.value } })}/></Field>
                <Field label="Organ System"><input value={eq.taxonomy?.organSystem || eq.system} onChange={e => setEq({ ...eq, system: e.target.value, taxonomy: { ...completeTaxonomy(eq), organSystem: e.target.value } })}/></Field>
                <Field label="Topic"><input value={eq.taxonomy?.topic || eq.topic} onChange={e => setEq({ ...eq, topic: e.target.value, taxonomy: { ...completeTaxonomy(eq), topic: e.target.value } })}/></Field>
                <Field label="Subtopic"><input value={eq.taxonomy?.subtopic || eq.subtopic || ""} onChange={e => setEq({ ...eq, subtopic: e.target.value, taxonomy: { ...completeTaxonomy(eq), subtopic: e.target.value } })}/></Field>
              </div>
            </section>

            <section className="form-section">
              <h3>Clinical Vignette / Stem</h3>
              <Field label="Question Stem">
                <textarea rows={6} value={eq.stem} onChange={e => setEq({ ...eq, stem: e.target.value })} placeholder="Type clinical vignette stem text here…"/>
              </Field>
            </section>

            <section className="form-section">
              <div className="section-head-between">
                <h3>Options & Answer Key</h3>
                <button className="btn btn-secondary btn-sm" onClick={addOption}><Plus size={14}/> Add Option</button>
              </div>
              <div className="options-editor-list">
                {options.map((opt, idx) => (
                  <div key={opt.key || idx} className={`option-edit-row ${opt.isCorrect ? "is-correct-row" : ""}`}>
                    <label className="radio-correct-label" title="Mark as Correct Answer">
                      <input type="radio" name="correctOpt" checked={opt.isCorrect} onChange={() => updateOptionCorrect(idx)} />
                      <span className="key-badge">{opt.key}</span>
                    </label>
                    <input className="option-text-input" aria-label={`Option ${opt.key} text`} value={opt.text} onChange={e => updateOptionText(idx, e.target.value)} placeholder={`Option ${opt.key} text…`}/>
                    <input className="option-percent-input" aria-label={`Option ${opt.key} sample response percentage`} value={opt.percent || "0%"} onChange={e => {
                      const next = [...options];
                      next[idx] = { ...next[idx], percent: e.target.value };
                      setEq({ ...eq, options: next });
                    }} placeholder="Stats %"/>
                    <button className="icon-btn-danger" onClick={() => removeOption(idx)} aria-label={`Remove option ${opt.key}`}><Trash2 size={14}/></button>
                  </div>
                ))}
              </div>
            </section>

            <section className="form-section">
              <h3>Explanations & Objectives</h3>
              <Field label="Main Explanation">
                <textarea rows={5} value={eq.explanation} onChange={e => setEq({ ...eq, explanation: e.target.value })} placeholder="Comprehensive explanation of the underlying pathophysiology and diagnosis…"/>
              </Field>
              <Field label="Educational Objective">
                <textarea rows={3} value={eq.objective} onChange={e => setEq({ ...eq, objective: e.target.value })} placeholder="Key takeaway learning pearl for students…"/>
              </Field>
            </section>

            <section className="form-section">
              <h3>AI Enrichment & Difficulty</h3>
              <div className="form-grid-2">
                <Field label="Difficulty Level">
                  <select value={eq.difficulty} onChange={e => setEq({ ...eq, difficulty: e.target.value as Difficulty })}>
                    <option value="Easy">Easy</option>
                    <option value="Medium">Medium</option>
                    <option value="Hard">Hard</option>
                  </select>
                </Field>
                <Field label="Clinical Pearl">
                  <input value={eq.pearls?.[0] || eq.aiEnrichment?.clinicalPearl || ""} onChange={e => setEq({ ...eq, pearls: [e.target.value], aiEnrichment: { ...completeAiEnrichment(eq), clinicalPearl: e.target.value } })} placeholder="Pathognomonic sign or high yield pearl…"/>
                </Field>
              </div>
              <Field label="High-Yield Keywords (Comma-separated)">
                <input value={(eq.tags || []).join(", ")} onChange={e => setEq({ ...eq, tags: e.target.value.split(",").map(t => t.trim()) })} placeholder="e.g. Peutz-Jeghers, STK11 mutation, Hamartomatous polyps"/>
              </Field>
            </section>
          </div>

          {/* Right Side: Live Mobile/Tablet Student Preview */}
          <div className="editor-right-preview">
            <div className={`student-device-frame ${device}`}>
              <div className="device-top-bar">
                <span>9:41</span>
                <span className="device-title">Stepwise Question Preview</span>
                <span className="device-battery">100%</span>
              </div>
              <div className="device-screen-body">
                <div className="preview-stem-header">
                  <div className="preview-badges">
                    <Badge tone="brand">{eq.questionId || eq.id}</Badge>
                    <Badge tone="neutral">{eq.system}</Badge>
                    <Badge tone={eq.difficulty === "Easy" ? "success" : eq.difficulty === "Hard" ? "danger" : "warning"}>{eq.difficulty}</Badge>
                  </div>
                  <h4 className="preview-vignette-text">{eq.stem || "Your vignette stem text will appear here in real time as you edit."}</h4>
                </div>

                <div className="preview-options-list">
                  {options.map((opt, idx) => {
                    const isSelected = previewSelectedChoice === opt.key;
                    return (
                      <button
                        key={opt.key || idx}
                        className={`student-preview-choice ${isSelected ? "selected" : ""} ${opt.isCorrect ? "correct-preview" : ""}`}
                        onClick={() => setPreviewSelectedChoice(opt.key)}
                      >
                        <span className="preview-opt-key">{opt.key}</span>
                        <span className="preview-opt-text">{opt.text || `Option ${opt.key}`}</span>
                        {opt.percent && <span className="preview-opt-pct">{opt.percent}</span>}
                      </button>
                    );
                  })}
                </div>

                {eq.explanation && (
                  <div className="student-preview-explanation">
                    <h5>Explanation</h5>
                    <p>{eq.explanation}</p>
                    {eq.objective && (
                      <div className="preview-objective-box">
                        <b>Educational Objective:</b>
                        <p>{eq.objective}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function UsersAdmin() {
  const { state, dispatch } = useStepwise();
  const [search, setSearch] = useState("");
  const [plan, setPlan] = useState("All");
  const [selected, setSelected] = useState<AdminUser | null>(null);
  const [toast, setToast] = useState("");
  const users = state.adminUsers.filter(user => (`${user.name} ${user.email}`.toLowerCase().includes(search.toLowerCase())) && (plan === "All" || user.plan === plan));
  const updateStatus = (user: AdminUser, status: AdminUser["status"]) => { dispatch({ type: "UPDATE_ADMIN_USER", id: user.id, patch: { status } }); setSelected({ ...user, status }); setToast(`User marked ${status.toLowerCase()}`); window.setTimeout(() => setToast(""), 1600); };
  return <>
    <PageHeader title="Learners" description="Search accounts, review engagement, and manage frontend access states." actions={<><button className="btn btn-secondary" onClick={() => downloadFile("stepwise-learners.csv", csv([["Name", "Email", "Plan", "Status", "Questions", "Accuracy"], ...users.map(u => [u.name, u.email, u.plan, u.status, u.questionsAnswered, u.accuracy])]), "text/csv")}><Download/> Export users</button><button className="btn btn-brand" onClick={() => { setToast("Invitation workflow ready for your email provider"); setTimeout(() => setToast(""), 1800); }}><Mail/> Invite learners</button></>}/>
    <section className="stat-grid four"><StatCard label="Total learners" value={state.adminUsers.length} trend="+14 " detail="this month" icon={<Users/>}/><StatCard label="Active this week" value={state.adminUsers.filter(u => u.status === "Active").length} detail="83% of accounts" icon={<Activity/>}/><StatCard label="At-risk learners" value={state.adminUsers.filter(u => u.status === "At risk").length} detail="need re-engagement" icon={<AlertTriangle/>}/><StatCard label="Average accuracy" value={`${Math.round(state.adminUsers.reduce((s, u) => s + u.accuracy, 0) / Math.max(state.adminUsers.length, 1))}%`} detail="across active users" icon={<Target/>}/></section>
    <section className="panel admin-table-panel"><header className="admin-filterbar"><div className="table-search"><Search aria-hidden="true"/><input aria-label="Search learners" value={search} onChange={e => setSearch(e.target.value)} placeholder="Search learners…"/></div><div><select aria-label="Filter learners by plan" value={plan} onChange={e => setPlan(e.target.value)}><option>All</option><option>Trial</option><option>Core</option><option>Pro</option><option>Institution</option></select><button className="btn btn-secondary" onClick={() => { setToast("Plan and search filters are active"); setTimeout(() => setToast(""), 1400); }}><Filter/> Filters</button></div></header><div className="responsive-table"><table><caption className="sr-only">Learners matching the current search and plan filter</caption><thead><tr><th scope="col">Learner</th><th scope="col">Plan</th><th scope="col">Status</th><th scope="col">Progress</th><th scope="col">Last active</th><th scope="col">Actions</th></tr></thead><tbody>{users.map(user => <tr key={user.id}><td><div className="admin-user-cell"><Avatar name={user.name}/><div><b>{user.name}</b><small>{user.email}</small></div></div></td><td><Badge tone={user.plan === "Pro" ? "brand" : user.plan === "Institution" ? "info" : "neutral"}>{user.plan}</Badge></td><td><Badge tone={user.status === "Active" ? "success" : user.status === "At risk" ? "warning" : "neutral"} dot>{user.status}</Badge></td><td><b>{user.questionsAnswered.toLocaleString()} answered</b><small>{user.accuracy}% accuracy</small></td><td>{formatDate(user.lastActiveAt, { month: "short", day: "numeric", year: "numeric" })}</td><td><button className="icon-btn" aria-label={`Open details for ${user.name}`} onClick={() => setSelected(user)}><MoreHorizontal/></button></td></tr>)}</tbody></table></div></section>
    <Modal open={Boolean(selected)} onClose={() => setSelected(null)} title={selected?.name || "Learner"} description={selected?.email}>{selected && <div className="user-detail-modal"><div className="user-detail-head"><Avatar name={selected.name} size="lg"/><div><Badge tone={selected.status === "Active" ? "success" : selected.status === "At risk" ? "warning" : "neutral"}>{selected.status}</Badge><h3>{selected.plan} plan</h3><p>Joined {formatDate(selected.joinedAt, { month: "long", day: "numeric", year: "numeric" })}</p></div></div><div className="user-detail-stats"><div><b>{selected.questionsAnswered.toLocaleString()}</b><span>Questions answered</span></div><div><b>{selected.accuracy}%</b><span>Accuracy</span></div><div><b>{Math.max(1, Math.round(selected.questionsAnswered / 180))}</b><span>Active weeks</span></div></div><div className="user-detail-actions"><button onClick={() => updateStatus(selected, "Active")}><UserCheck/> Mark active</button><button onClick={() => updateStatus(selected, "At risk")}><AlertTriangle/> Mark at risk</button><button onClick={() => updateStatus(selected, "Paused")}><UserMinus/> Pause access</button><button onClick={() => { setToast(`Message composer opened for ${selected.name}`); setTimeout(() => setToast(""), 1800); }}><Mail/> Send message</button></div></div>}</Modal><Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function ContentMapAdmin() {
  const { state } = useStepwise();
  const [step, setStep] = useState<Step>("Step 2 CK");
  const questions = state.questions.filter(question => question.step === step && question.status === "Published");
  const performance = systemPerformance(questions, state.attempts);
  const systems = [...new Set(questions.map(q => q.system))];
  const disciplines = [...new Set(questions.map(q => q.discipline))];
  return <>
    <PageHeader title="Content map" description="Inspect blueprint distribution, learner performance, and editorial coverage by exam." actions={<select className="header-select" aria-label="Content map exam" value={step} onChange={e => setStep(e.target.value as Step)}><option>Step 1</option><option>Step 2 CK</option></select>}/>
    <section className="content-map-top"><article className="panel blueprint-coverage"><header><div className="card-kicker"><Gauge/> Blueprint coverage</div><Badge tone="success">Within target</Badge></header><div><Donut value={92} size={164} detail="covered"/><div><h2>{questions.length} published items</h2><p>{systems.length} systems and {disciplines.length} disciplines represented in the demo library.</p><div><span><b>{systems.length}</b> systems</span><span><b>{disciplines.length}</b> disciplines</span><span><b>{questions.filter(q => q.difficulty === "Hard").length}</b> hard items</span></div></div></div></article><article className="panel content-recommendations"><header><div className="card-kicker"><Sparkles/> Editorial recommendations</div></header><div><span className="risk"><AlertTriangle/></span><div><b>Increase Neurology medium-difficulty coverage</b><p>Low learner mastery and limited item depth make this the highest-value expansion area.</p></div><Link href="/admin/questions" aria-label="Open question library"><ArrowRight/></Link></div><div><span><Scale/></span><div><b>Add cross-system ethics scenarios</b><p>Decision-making content is concentrated in one topic cluster.</p></div><Link href="/admin/questions" aria-label="Open question library"><ArrowRight/></Link></div><div><span><RefreshCw/></span><div><b>Refresh two older explanations</b><p>Editorial freshness is approaching the internal review threshold.</p></div><Link href="/admin/questions" aria-label="Open question library"><ArrowRight/></Link></div></article></section>
    <section className="panel content-matrix"><header><div><h2>System coverage and performance</h2><p>Coverage is based on the demo question library; mastery reflects local learner attempts.</p></div><button className="btn btn-secondary" onClick={() => downloadFile(`stepwise-${step.toLowerCase().replaceAll(" ", "-")}-content-map.json`, JSON.stringify(performance, null, 2))}><Download/> Export map</button></header><div className="responsive-table"><table><caption className="sr-only">Demonstration question coverage and learner performance by organ system</caption><thead><tr><th scope="col">System</th><th scope="col">Items</th><th scope="col">Difficulty mix</th><th scope="col">Learner mastery</th><th scope="col">Coverage health</th></tr></thead><tbody>{performance.map(item => { const qs = questions.filter(q => q.system === item.system); const hard = qs.filter(q => q.difficulty === "Hard").length; return <tr key={item.system}><td><b>{item.system}</b><small>{[...new Set(qs.map(q => q.discipline))].join(", ")}</small></td><td><b>{qs.length}</b><small>{item.attempts} attempts</small></td><td><div className="difficulty-mix"><i style={{ width: `${Math.max(10, (qs.length - hard) / Math.max(qs.length, 1) * 100)}%` }}/><b style={{ width: `${Math.max(10, hard / Math.max(qs.length, 1) * 100)}%` }}/></div><small>{hard} hard · {qs.length - hard} easy/medium</small></td><td><Progress value={item.mastery}/><small>{item.accuracy}% accuracy</small></td><td><Badge tone={item.mastery < 60 ? "warning" : "success"}>{item.mastery < 60 ? "Expand" : "Healthy"}</Badge></td></tr>; })}</tbody></table></div></section>
  </>;
}

function ReportsAdmin() {
  const { state, dispatch } = useStepwise();
  const [tab, setTab] = useState<"Open" | "Resolved">("Open");
  const [selected, setSelected] = useState(state.reports.find(r => r.status === "Open") || null);
  const [toast, setToast] = useState("");
  const reports = state.reports.filter(report => report.status === tab);
  const resolve = () => { if (!selected) return; dispatch({ type: "SET_REPORT_STATUS", id: selected.id, status: "Resolved" }); setToast("Report resolved"); setSelected(null); window.setTimeout(() => setToast(""), 1600); };
  return <>
    <PageHeader title="Content reports" description="Triage learner feedback, inspect item context, and document editorial resolution." actions={<button className="btn btn-secondary" onClick={() => downloadFile("stepwise-content-reports.json", JSON.stringify(state.reports, null, 2))}><Download/> Export log</button>}/>
    <div className="page-tabs"><button className={tab === "Open" ? "active" : ""} onClick={() => { setTab("Open"); setSelected(null); }}>Open <span>{state.reports.filter(r => r.status === "Open").length}</span></button><button className={tab === "Resolved" ? "active" : ""} onClick={() => { setTab("Resolved"); setSelected(null); }}>Resolved <span>{state.reports.filter(r => r.status === "Resolved").length}</span></button></div>
    <section className="reports-layout"><aside className="panel report-list">{reports.map(report => <button key={report.id} className={selected?.id === report.id ? "active" : ""} onClick={() => setSelected(report)}><div><Badge tone={report.reason === "Medical accuracy" ? "danger" : report.reason === "Ambiguous wording" ? "warning" : "neutral"}>{report.reason}</Badge><span>{formatDate(report.createdAt, { month: "short", day: "numeric" })}</span></div><b>{report.questionId}</b><p>{report.detail}</p><small>Reported by {report.reporter}</small></button>)}{!reports.length && <div className="admin-empty-inline"><CheckCircle2/><span><b>No reports here</b><small>This queue is currently clear.</small></span></div>}</aside><main className="panel report-detail">{selected ? (() => { const question = state.questions.find(q => q.id === selected.questionId); return <><header><div><Badge tone={selected.status === "Open" ? "warning" : "success"}>{selected.status}</Badge><h2>{selected.reason}</h2><p>{selected.questionId} · Submitted {formatDate(selected.createdAt, { month: "long", day: "numeric", year: "numeric" })}</p></div><button className="icon-btn" onClick={() => { setToast("Report actions are available in this detail panel"); setTimeout(() => setToast(""), 1400); }} aria-label="Report actions"><MoreHorizontal/></button></header><article className="report-message"><Flag/><div><b>Learner report</b><p>{selected.detail}</p><small>{selected.reporter}</small></div></article>{question && <article className="report-question-context"><div><span>{question.id}</span><Badge>{question.step}</Badge><Badge>{question.system}</Badge></div><h3>{question.stem}</h3><p><b>Current explanation:</b> {question.explanation}</p><footer><span>{question.globalAccuracy}% global accuracy</span><span>{question.averageTimeSec}s average time</span><Link href="/admin/questions"><Edit3/> Open editor</Link></footer></article>}<article className="resolution-note"><Field label="Resolution note"><textarea rows={5} defaultValue={selected.status === "Resolved" ? "Reviewed by the editorial team. The item was clarified and republished." : ""} placeholder="Document what you reviewed and any changes made…"/></Field></article><footer>{selected.status === "Open" ? <><button className="btn btn-secondary" onClick={() => { setToast("Follow-up request queued for the connected email service"); setTimeout(() => setToast(""), 1800); }}>Request more detail</button><button className="btn btn-brand" onClick={resolve}><CheckCircle2/> Resolve report</button></> : <button className="btn btn-secondary" onClick={() => { dispatch({ type: "SET_REPORT_STATUS", id: selected.id, status: "Open" }); setToast("Report reopened"); }}><RefreshCw/> Reopen report</button>}</footer></>; })() : <div className="report-placeholder"><Flag/><h2>Select a report</h2><p>Choose an item from the queue to inspect its learner feedback and question context.</p></div>}</main></section><Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function BillingAdmin() {
  const { state } = useStepwise();
  const [period, setPeriod] = useState("Monthly");
  const [toast, setToast] = useState("");
  const revenue = [0, 0, 0, 0, 0, 0, 0];
  return <>
    <PageHeader title="Billing" description="Track plan mix, recurring revenue, invoices, and frontend subscription states." actions={<><button className="btn btn-secondary" onClick={() => { setToast("Revenue export prepared"); setTimeout(() => setToast(""), 1600); }}><Download/> Export revenue</button><button className="btn btn-brand" onClick={() => { setToast("Coupon editor is ready for a billing-provider connection"); setTimeout(() => setToast(""), 1800); }}><CreditCard/> Create coupon</button></>}/>
    <section className="stat-grid four"><StatCard label="MRR" value="$0" trend="Baseline " detail="month over month" icon={<CircleDollarSign/>}/><StatCard label="Paid accounts" value={state.adminUsers.filter(u => u.plan !== "Trial").length} detail="Active accounts" icon={<UserCheck/>}/><StatCard label="Trial conversion" value="0%" trend="Baseline " detail="last 30 days" icon={<TrendingUp/>}/><StatCard label="Churn" value="0.0%" trend="Baseline " detail="month over month" icon={<UserMinus/>}/></section>
    <section className="billing-main-grid"><article className="panel revenue-card"><header><div><div className="card-kicker"><BarChart3/> Revenue trend</div><h2>Recurring revenue</h2></div><select aria-label="Revenue reporting period" value={period} onChange={e => setPeriod(e.target.value)}><option>Monthly</option><option>Quarterly</option><option>Annual</option></select></header><div className="revenue-chart">{revenue.map((value, index) => <div key={index}><span>${value}k</span><i style={{ height: `${Math.max(4, value * 5)}px` }}/><small>{["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"][index]}</small></div>)}</div><footer><b>$0 current MRR</b><span>Projected annual run rate: $0</span></footer></article><article className="panel plan-mix"><header><div className="card-kicker"><Layers3/> Plan mix</div></header><div className="plan-mix-donut"><Donut value={0} size={150} detail="Pro + Inst."/><div>{[["Pro", 0, "brand"], ["Institution", 0, "info"], ["Core", 0, "success"], ["Trial", 100, "warning"]].map(([label, value, tone]) => <p key={String(label)}><Badge tone={tone as "brand" | "info" | "success" | "warning"} dot>{label}</Badge><b>{value}%</b></p>)}</div></div><button className="btn btn-secondary btn-block" onClick={() => { setToast("Plan configuration opened in demo mode"); setTimeout(() => setToast(""), 1600); }}>Manage plans</button></article></section>
    <section className="panel admin-table-panel"><header className="billing-table-head"><div><h2>Recent transactions</h2><p>Sample billing events for the frontend admin experience.</p></div><button onClick={() => { setToast("All loaded transactions are already shown"); setTimeout(() => setToast(""), 1400); }}>View all</button></header><div className="responsive-table"><table><caption className="sr-only">Sample billing transactions shown in the frontend demonstration</caption><thead><tr><th scope="col">Customer</th><th scope="col">Plan</th><th scope="col">Amount</th><th scope="col">Status</th><th scope="col">Date</th><th scope="col">Invoice</th></tr></thead><tbody>{state.adminUsers.filter(u => u.plan !== "Trial").map((user, index) => <tr key={user.id}><td><div className="admin-user-cell"><Avatar name={user.name}/><div><b>{user.name}</b><small>{user.email}</small></div></div></td><td>{user.plan}</td><td><b>${user.plan === "Institution" ? "499.00" : user.plan === "Pro" ? "49.00" : "29.00"}</b></td><td><Badge tone={index === 4 ? "warning" : "success"}>{index === 4 ? "Pending" : "Paid"}</Badge></td><td>Jul {18 - index}, 2026</td><td><button className="icon-btn" aria-label={`Download invoice for ${user.name}`} onClick={() => downloadFile(`invoice-${user.id}.txt`, `Stepwise demo invoice\nCustomer: ${user.name}\nPlan: ${user.plan}\nStatus: ${index === 4 ? "Pending" : "Paid"}`, "text/plain")}><Download/></button></td></tr>)}</tbody></table></div></section><Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

function AdminSettings() {
  const [section, setSection] = useState("Workspace");
  const [saved, setSaved] = useState("");
  const [settings, setSettings] = useState({ reviewRequired: true, autoArchive: false, reportAlerts: true, weeklyDigest: true, learnerExports: false, maintenance: false, sourceRequired: true, billingFailures: false });
  const update = (key: keyof typeof settings, value: boolean) => { setSettings({ ...settings, [key]: value }); setSaved("Settings saved"); setTimeout(() => setSaved(""), 1400); };
  return <>
    <PageHeader title="Admin settings" description="Configure workspace identity, content governance, notifications, and access policies."/>
    <section className="settings-layout admin-settings-layout"><aside className="settings-nav panel">{(Object.entries({ Workspace: Settings, "Content governance": ShieldCheck, Notifications: Mail, "Access & roles": Users, Integrations: Globe2 }) as [string, React.ComponentType<{ size?: number }>][]).map(([label, Icon]) => <button key={label} className={section === label ? "active" : ""} onClick={() => setSection(label)}>{<Icon/>}{label}<ArrowRight/></button>)}</aside><main className="settings-content panel">
      {section === "Workspace" && <><header><h2>Workspace profile</h2><p>Basic product identity used across administrative surfaces.</p></header><div className="admin-brand-editor"><div className="admin-brand-mark">S</div><div><b>Stepwise</b><p>USMLE preparation workspace</p><button onClick={() => { setSaved("Logo picker opened in demo mode"); setTimeout(() => setSaved(""), 1400); }}>Replace logo</button></div></div><div className="form-grid-2"><Field label="Workspace name"><input defaultValue="Stepwise Admin"/></Field><Field label="Support email"><input defaultValue="support@stepwise.page"/></Field></div><Field label="Organization"><input defaultValue="Stepwise Learning Labs"/></Field><Field label="Public status message"><textarea rows={3} defaultValue="All systems operational."/></Field><button className="btn btn-brand" onClick={() => { setSaved("Workspace profile saved"); setTimeout(() => setSaved(""), 1400); }}>Save workspace</button></>}
      {section === "Content governance" && <><header><h2>Content governance</h2><p>Define review gates and lifecycle behavior for question content.</p></header><div className="settings-group"><Toggle checked={settings.reviewRequired} onChange={v => update("reviewRequired", v)} label="Require editorial review before publishing" detail="Drafts must enter the In review state before publication."/><Toggle checked={settings.autoArchive} onChange={v => update("autoArchive", v)} label="Automatically archive stale items" detail="Archive items that miss the annual medical review threshold."/><Toggle checked={settings.sourceRequired} onChange={v => update("sourceRequired", v)} label="Require source documentation" detail="Editors must record a source label before publishing."/></div><div className="governance-threshold"><Field label="Medical review interval"><select defaultValue="12"><option value="6">Every 6 months</option><option value="12">Every 12 months</option><option value="18">Every 18 months</option></select></Field><Field label="Report escalation threshold"><select defaultValue="3"><option value="1">1 report</option><option value="3">3 reports</option><option value="5">5 reports</option></select></Field></div></>}
      {section === "Notifications" && <><header><h2>Admin notifications</h2><p>Choose the operational events that generate alerts.</p></header><div className="settings-group"><Toggle checked={settings.reportAlerts} onChange={v => update("reportAlerts", v)} label="New content reports" detail="Alert editors when a learner submits medical or wording feedback."/><Toggle checked={settings.weeklyDigest} onChange={v => update("weeklyDigest", v)} label="Weekly operations digest" detail="Send platform growth, content health, and unresolved queue metrics."/><Toggle checked={settings.billingFailures} onChange={v => update("billingFailures", v)} label="Billing failures" detail="Notify owners when a payment retry fails."/></div></>}
      {section === "Access & roles" && <><header><h2>Access and roles</h2><p>Frontend role matrix for the administrative workspace.</p></header><div className="role-grid">{[["Owner", "Full workspace, billing, and role administration", 3], ["Content admin", "Question authoring, reports, and blueprint analytics", 5], ["Support", "Learner access and account troubleshooting", 2]].map(([name, desc, count]) => <article key={String(name)}><span><ShieldCheck/></span><div><b>{name}</b><p>{desc}</p><small>{count} members</small></div><button onClick={() => { setSaved(`${name} role editor opened`); setTimeout(() => setSaved(""), 1400); }} aria-label={`Edit ${name} role`}><Edit3/></button></article>)}</div><button className="btn btn-secondary" onClick={() => { setSaved("New role editor opened"); setTimeout(() => setSaved(""), 1400); }}><Plus/> Add role</button></>}
      {section === "Integrations" && <><header><h2>Integrations</h2><p>Connection-ready cards for production services.</p></header><div className="integration-grid">{(Object.entries({ Authentication: UserCheck, Billing: CreditCard, Email: Send, Analytics: Activity }) as [string, React.ComponentType<{ size?: number }>][]).map(([name, Icon]) => { const desc = (name === "Authentication" ? "Identity provider and SSO" : name === "Billing" ? "Subscription and invoice provider" : name === "Email" ? "Transactional notifications" : "Product event pipeline"); const status = name === "Authentication" ? "Configured" : "Demo mode"; return <article key={name}><span>{<Icon/>}</span><div><b>{name}</b><p>{desc}</p><Badge tone={status === "Configured" ? "success" : "warning"}>{status}</Badge></div><button onClick={() => { setSaved(`${name} configuration opened`); setTimeout(() => setSaved(""), 1400); }}>Configure</button></article>; })}</div><div className="integration-note"><AlertTriangle/><div><b>No secrets are included in this repository.</b><p>Use the provided environment example when connecting production providers.</p></div></div></>}
    </main></section><Toast message={saved} visible={Boolean(saved)}/>
  </>;
}

function AffiliatesAdmin() {
  const { state, dispatch } = useStepwise();
  const [toast, setToast] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [credentialsModal, setCredentialsModal] = useState<InfluencerProfile | null>(null);

  // Form State
  const [name, setName] = useState("");
  const [handle, setHandle] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("stepwise2026");
  const [rate, setRate] = useState("30");
  const [tier, setTier] = useState<InfluencerProfile["tier"]>("VIP Ambassador");
  const [promoCode, setPromoCode] = useState("");
  const [discountPercent, setDiscountPercent] = useState("15");

  const totalGross = state.referralConversions.reduce((sum, c) => sum + c.listPrice, 0);
  const totalNet = state.referralConversions.reduce((sum, c) => sum + c.netProfit, 0);
  const totalCommission = state.referralConversions.reduce((sum, c) => sum + c.commissionEarned, 0);
  const pendingPayouts = state.payoutRecords.filter(p => p.status === "Processing");

  const handleCreatePartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !promoCode) {
      setToast("Please fill in Name, Email, and Promo Code.");
      setTimeout(() => setToast(""), 1800);
      return;
    }

    const cleanCode = promoCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, "");
    const newInf: InfluencerProfile = {
      id: `inf_${Date.now().toString(36)}`,
      name: name.trim(),
      handle: handle.trim().startsWith("@") ? handle.trim() : `@${handle.trim() || "creator"}`,
      email: email.trim().toLowerCase(),
      password: password.trim() || "stepwise2026",
      commissionRate: (Number(rate) || 30) / 100,
      tier,
      defaultPromoCode: cleanCode,
      defaultDiscountPercent: Number(discountPercent) || 15,
      referralUrl: `https://stepwise.page/?ref=${cleanCode}`,
      payoutMethod: "PayPal",
      payoutAccount: email.trim().toLowerCase(),
      joinedDate: new Date().toISOString().split("T")[0],
      totalClicks: 0,
      totalSignups: 0
    };

    dispatch({ type: "ADD_INFLUENCER", influencer: newInf });
    setModalOpen(false);
    setCredentialsModal(newInf);
    // Reset Form
    setName(""); setHandle(""); setEmail(""); setPromoCode(""); setPassword("stepwise2026");
  };

  const approvePayout = (id: string) => {
    dispatch({ type: "APPROVE_PAYOUT", payoutId: id });
    setToast("Payout marked completed in this demo. No external transfer was initiated.");
    setTimeout(() => setToast(""), 1800);
  };

  const deletePartner = (id: string, infName: string) => {
    if (confirm(`Remove partner "${infName}"?`)) {
      dispatch({ type: "DELETE_INFLUENCER", id });
      setToast(`Partner ${infName} removed.`);
      setTimeout(() => setToast(""), 1800);
    }
  };

  const copyPartnerDetails = (inf: InfluencerProfile) => {
    const text = `🎉 Welcome to Stepwise Partner Program!\n\nPartner Portal Login: https://stepwise.page/influencer/login\nEmail/Code: ${inf.email} (or ${inf.defaultPromoCode})\nPassword: ${inf.password || "stepwise2026"}\n\nYour Referral Code (${inf.defaultDiscountPercent}% Off for Students): ${inf.defaultPromoCode}\nYour Rev-Share Rate: ${Math.round(inf.commissionRate * 100)}% of Net Profit`;
    navigator.clipboard?.writeText(text);
    setToast("Login details copied to clipboard!");
    setTimeout(() => setToast(""), 1800);
  };

  return <>
    <PageHeader title="Affiliate & Influencer Hub" description="Track attributed revenue, manage partner-specific net-profit share terms, and review payout records." actions={<button className="btn btn-brand" onClick={() => setModalOpen(true)}><Plus/> Add Partner</button>}/>

    <section className="stat-grid four">
      <StatCard label="Total Partners" value={state.influencers.length} detail="Active channels" icon={<Users/>}/>
      <StatCard label="Gross Sales" value={`$${totalGross.toFixed(2)}`} trend={totalGross > 0 ? "+24%" : "0%"} detail="Referred revenue" icon={<CircleDollarSign/>}/>
      <StatCard label="Net Profit Base" value={`$${totalNet.toFixed(2)}`} detail="After 10% ops & coupons" icon={<TrendingUp/>}/>
      <StatCard label="Partner Share" value={`$${totalCommission.toFixed(2)}`} detail="Based on each partner’s contracted rate" icon={<Sparkles/>}/>
    </section>

    {pendingPayouts.length > 0 && <section className="panel margin-top-20"><header><h3>Payout Requests Awaiting Review ({pendingPayouts.length})</h3><p>Marking a record paid updates demo status only; it does not initiate an external transfer.</p></header><div className="responsive-table"><table><caption className="sr-only">Partner payout requests awaiting administrator review</caption><thead><tr><th scope="col">Partner</th><th scope="col">Amount</th><th scope="col">Method</th><th scope="col">Account</th><th scope="col">Requested Date</th><th scope="col">Action</th></tr></thead><tbody>{pendingPayouts.map(p => <tr key={p.id}><td><b>{p.influencerName}</b></td><td><b className="earnings-highlight">${p.amount.toFixed(2)}</b></td><td>{p.method}</td><td>{p.account}</td><td>{new Date(p.requestedAt).toLocaleDateString()}</td><td><button className="btn btn-brand btn-sm" onClick={() => approvePayout(p.id)}><Check/> Mark Paid</button></td></tr>)}</tbody></table></div></section>}

    <section className="panel admin-table-panel margin-top-20">
      <header className="panel-head-between">
        <div>
          <h2>Influencer Partners Directory</h2>
          <p>Active content creators, custom discount codes, and rev-share rates.</p>
        </div>
        <button className="btn btn-brand btn-sm" onClick={() => setModalOpen(true)}><Plus/> Add Partner</button>
      </header>
      <div className="responsive-table">
        <table>
          <caption className="sr-only">Partner performance, referral terms, and portal access actions</caption>
          <thead>
            <tr>
              <th scope="col">Partner</th>
              <th scope="col">Tier</th>
              <th scope="col">Rev-Share %</th>
              <th scope="col">Promo Code</th>
              <th scope="col">Clicks</th>
              <th scope="col">Conversions</th>
              <th scope="col">Gross Driven</th>
              <th scope="col">Net Profit Base</th>
              <th scope="col">Earnings</th>
              <th scope="col">Share Login</th>
              <th scope="col">Actions</th>
            </tr>
          </thead>
          <tbody>
            {state.influencers.map(inf => {
              const convs = state.referralConversions.filter(c => c.influencerId === inf.id);
              const gross = convs.reduce((s, c) => s + c.listPrice, 0);
              const net = convs.reduce((s, c) => s + c.netProfit, 0);
              const earned = convs.reduce((s, c) => s + c.commissionEarned, 0);
              return <tr key={inf.id}>
                <td>
                  <div className="admin-user-cell">
                    <Avatar name={inf.name}/>
                    <div>
                      <b>{inf.name}</b>
                      <small>{inf.handle} · {inf.email}</small>
                    </div>
                  </div>
                </td>
                <td><Badge tone="brand">{inf.tier}</Badge></td>
                <td><b>{Math.round(inf.commissionRate * 100)}%</b></td>
                <td><code>{inf.defaultPromoCode}</code></td>
                <td>{inf.totalClicks}</td>
                <td><b>{convs.length}</b></td>
                <td>${gross.toFixed(2)}</td>
                <td>${net.toFixed(2)}</td>
                <td><b className="earnings-highlight">${earned.toFixed(2)}</b></td>
                <td>
                  <button className="btn btn-secondary btn-sm" onClick={() => copyPartnerDetails(inf)} aria-label={`Copy portal credentials for ${inf.name}`}>
                    <Copy size={13}/> Copy Credentials
                  </button>
                </td>
                <td>
                  <button className="icon-btn danger-hover" title="Remove partner" onClick={() => deletePartner(inf.id, inf.name)} aria-label={`Remove partner ${inf.name}`}>
                    <Trash2 size={15}/>
                  </button>
                </td>
              </tr>;
            })}
            {!state.influencers.length && <tr><td colSpan={11} className="table-empty">No influencer partners registered yet. Select <q>Add Partner</q> to onboard a creator.</td></tr>}
          </tbody>
        </table>
      </div>
    </section>

    {/* Add Influencer Modal */}
    <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Influencer Partner">
      <form onSubmit={handleCreatePartner} className="add-partner-form">
        <div className="form-grid-2">
          <Field label="Creator Full Name">
            <input value={name} onChange={e => setName(e.target.value)} placeholder="e.g. Dr. Sarah Lin" required/>
          </Field>
          <Field label="Social Handle / Channel">
            <input value={handle} onChange={e => setHandle(e.target.value)} placeholder="e.g. @medstudent_sarah"/>
          </Field>
        </div>

        <div className="form-grid-2 margin-top-12">
          <Field label="Partner Email">
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="sarah@medinfluencers.io" required/>
          </Field>
          <Field label="Portal Password">
            <input value={password} onChange={e => setPassword(e.target.value)} placeholder="e.g. stepwise2026" required/>
          </Field>
        </div>

        <div className="form-grid-2 margin-top-12">
          <Field label="Follower Promo Code">
            <input value={promoCode} onChange={e => setPromoCode(e.target.value)} placeholder="e.g. SARAH15" required/>
          </Field>
          <Field label="Student Discount %">
            <select value={discountPercent} onChange={e => setDiscountPercent(e.target.value)}>
              <option value="10">10% Off</option>
              <option value="15">15% Off (Standard)</option>
              <option value="20">20% Off</option>
            </select>
          </Field>
        </div>

        <div className="form-grid-2 margin-top-12">
          <Field label="Revenue Share % (on Net Profit)">
            <select value={rate} onChange={e => setRate(e.target.value)}>
              <option value="25">25% Rev-Share</option>
              <option value="30">30% Rev-Share (Standard)</option>
              <option value="35">35% Rev-Share (Top Creator)</option>
            </select>
          </Field>
          <Field label="Partner Tier Badge">
            <select value={tier} onChange={e => setTier(e.target.value as InfluencerProfile["tier"])}>
              <option value="Standard Partner">Standard Partner</option>
              <option value="VIP Ambassador">VIP Ambassador</option>
              <option value="Top Creator">Top Creator</option>
            </select>
          </Field>
        </div>

        <div className="modal-actions-between margin-top-20">
          <button type="button" className="btn btn-secondary" onClick={() => setModalOpen(false)}>Cancel</button>
          <button type="submit" className="btn btn-brand"><Plus/> Save & Generate Credentials</button>
        </div>
      </form>
    </Modal>

    {/* Share Credentials Confirmation Modal */}
    <Modal open={Boolean(credentialsModal)} onClose={() => setCredentialsModal(null)} title="Partner Onboarded Successfully!">
      {credentialsModal && <div className="credentials-share-card">
        <div className="share-head-banner">
          <CheckCircle2 size={32} color="#10b981"/>
          <div>
            <h3>Partner Account Ready for {credentialsModal.name}</h3>
            <p>Share these credentials with the influencer so they can log in to view their dashboard.</p>
          </div>
        </div>

        <div className="credentials-box">
          <div className="cred-row"><span>Partner Login URL:</span> <b>https://stepwise.page/influencer/login</b></div>
          <div className="cred-row"><span>Email / Promo Code:</span> <b>{credentialsModal.email}</b> or <b>{credentialsModal.defaultPromoCode}</b></div>
          <div className="cred-row"><span>Password:</span> <code>{credentialsModal.password}</code></div>
          <div className="cred-row"><span>Rev-Share Rate:</span> <b>{Math.round(credentialsModal.commissionRate * 100)}% of Net Profit</b></div>
          <div className="cred-row"><span>Student Discount:</span> <b>{credentialsModal.defaultDiscountPercent}% Off Code ({credentialsModal.defaultPromoCode})</b></div>
        </div>

        <div className="modal-actions-between margin-top-20">
          <button className="btn btn-secondary" onClick={() => setCredentialsModal(null)}>Close</button>
          <button className="btn btn-brand" onClick={() => copyPartnerDetails(credentialsModal)}>
            <Copy size={16}/> Copy Credentials to Send to Influencer
          </button>
        </div>
      </div>}
    </Modal>

    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}
