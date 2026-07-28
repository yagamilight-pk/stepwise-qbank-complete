"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Archive, ArrowLeft, ArrowRight, Bell, BookCheck, BookOpen, BrainCircuit, Check,
  CircleHelp, Clock3, Copy, Edit3, Layers3,
  LogOut, NotebookPen, Plus, RefreshCw, Search, Send, Settings, Shield,
  Sparkles, Star, Tag, Trash2, Trophy, TrendingUp, UserRound, Users
} from "lucide-react";
import { buildFlashcardReviewQueue, flashcardRetentionForecast, flashcardReviewIntervalLabel, studyCircleEligibility } from "@/lib/algorithms";
import { useStepwise } from "@/lib/store";
import { ACTIVE_SESSION_KEY, SESSION_CONFIG_KEY } from "@/lib/session";
import type { Flashcard, Note, ReviewRating, SessionConfig } from "@/lib/types";
import { Avatar, Badge, EmptyState, Field, formatDate, Modal, PageHeader, Progress, Toast, Toggle, uid } from "./ui";
import { AccessibleTabs } from "./AccessibleTabs";
import { signOut } from "@/app/actions/auth";

const ratingLabels: Array<{ rating: ReviewRating; label: string }> = [
  { rating: "again", label: "Again" },
  { rating: "hard", label: "Hard" },
  { rating: "good", label: "Good" },
  { rating: "easy", label: "Easy" }
];

type CardFilter = "All" | "Due" | "Learning" | "Mature";
type FlashcardView = "library" | "review" | "complete";

export function FlashcardsPage() {
  const { state, dispatch } = useStepwise();
  const router = useRouter();
  const [view, setView] = useState<FlashcardView>("library");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<CardFilter>("All");
  const [editorOpen, setEditorOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [front, setFront] = useState("");
  const [back, setBack] = useState("");
  const [tags, setTags] = useState<string>(state.planSettings.targetStep);
  const [reviewQueue, setReviewQueue] = useState<string[]>([]);
  const [reviewIndex, setReviewIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [toast, setToast] = useState("");

  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const updateNow = () => setNow(Date.now());
    updateNow();
    const intervalId = window.setInterval(updateNow, 60_000);
    return () => window.clearInterval(intervalId);
  }, []);

  const nowDate = useMemo(() => now !== null ? new Date(now) : null, [now]);
  const metrics = useMemo(() => {
    if (nowDate === null) return { retention: 0, due: 0, learning: 0, mature: 0, streak: 0 };
    return flashcardRetentionForecast(state.flashcards, nowDate);
  }, [nowDate, state.flashcards]);
  const current = state.flashcards.find((card) => card.id === reviewQueue[reviewIndex]);

  const filtered = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return state.flashcards.filter((card) => {
      const matchesQuery = !normalized || `${card.front} ${card.back} ${card.tags.join(" ")}`.toLowerCase().includes(normalized);
      const due = now !== null && new Date(card.dueAt).getTime() <= now;
      const matchesFilter = filter === "All"
        || (filter === "Due" && due)
        || (filter === "Learning" && card.repetitions < 2)
        || (filter === "Mature" && card.interval >= 21);
      return matchesQuery && matchesFilter;
    });
  }, [filter, now, query, state.flashcards]);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  }, []);

  const resetEditor = () => {
    setEditingId(null);
    setFront("");
    setBack("");
    setTags(state.planSettings.targetStep);
  };

  const openCreate = () => {
    resetEditor();
    setEditorOpen(true);
  };

  const openEdit = (card: Flashcard) => {
    setEditingId(card.id);
    setFront(card.front);
    setBack(card.back);
    setTags(card.tags.join(", "));
    setEditorOpen(true);
  };

  const saveCard = () => {
    if (!front.trim() || !back.trim()) {
      showToast("Add both a prompt and an answer");
      return;
    }
    const existing = editingId ? state.flashcards.find((card) => card.id === editingId) : undefined;
    const card: Flashcard = {
      id: existing?.id ?? uid("card"),
      questionId: existing?.questionId,
      front: front.trim(),
      back: back.trim(),
      tags: tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      interval: existing?.interval ?? 0,
      ease: existing?.ease ?? 2.5,
      repetitions: existing?.repetitions ?? 0,
      lapses: existing?.lapses ?? 0,
      dueAt: existing?.dueAt ?? new Date().toISOString(),
      lastReviewedAt: existing?.lastReviewedAt,
      createdAt: existing?.createdAt ?? new Date().toISOString()
    };
    dispatch({ type: "UPSERT_FLASHCARD", card });
    setEditorOpen(false);
    resetEditor();
    showToast(existing ? "Flashcard updated" : "Flashcard created");
  };

  const startReview = useCallback(() => {
    const dueCards = state.flashcards.filter((card) => new Date(card.dueAt).getTime() <= Date.now());
    const queue = buildFlashcardReviewQueue(dueCards.length ? dueCards : state.flashcards).map((card) => card.id);
    if (!queue.length) {
      showToast("Create a flashcard before starting review");
      return;
    }
    setReviewQueue(queue);
    setReviewIndex(0);
    setReviewedCount(0);
    setRevealed(false);
    setView("review");
  }, [showToast, state.flashcards]);

  const rate = useCallback((rating: ReviewRating) => {
    if (!current || !revealed) return;
    dispatch({ type: "REVIEW_FLASHCARD", id: current.id, rating });
    const nextReviewed = reviewedCount + 1;
    setReviewedCount(nextReviewed);
    if (reviewIndex < reviewQueue.length - 1) {
      setReviewIndex((value) => value + 1);
      setRevealed(false);
    } else {
      setView("complete");
    }
  }, [current, dispatch, revealed, reviewIndex, reviewQueue.length, reviewedCount]);

  useEffect(() => {
    if (view !== "review") return;
    const listener = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.matches("input, textarea, select, button")) return;
      if (event.code === "Space") {
        event.preventDefault();
        setRevealed(true);
        return;
      }
      if (revealed && ["1", "2", "3", "4"].includes(event.key)) {
        event.preventDefault();
        rate(ratingLabels[Number(event.key) - 1].rating);
      }
    };
    window.addEventListener("keydown", listener);
    return () => window.removeEventListener("keydown", listener);
  }, [rate, revealed, view]);

  const openSourceQuestion = (card: Flashcard) => {
    if (!card.questionId) return;
    const question = state.questions.find((item) => item.id === card.questionId);
    if (!question) {
      showToast("The source question is no longer available");
      return;
    }
    const config: SessionConfig = {
      step: question.step,
      mode: "Tutor",
      count: 1,
      systems: [question.system],
      disciplines: [question.discipline],
      difficulties: [question.difficulty],
      include: "All",
      timePerQuestionSec: 90,
      questionIds: [question.id]
    };
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    sessionStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify(config));
    router.push("/app/session");
  };

  if (view === "complete") {
    return <div className="flashcard-complete panel">
      <span className="summary-check"><Check/></span>
      <Badge tone="success">Review complete</Badge>
      <h1>{reviewedCount} cards consolidated</h1>
      <p>Intervals and ease factors were updated from each recall rating. Due dates now reflect your latest review.</p>
      <div className="flashcard-complete-actions">
        <button className="btn btn-secondary" onClick={() => setView("library")}><ArrowLeft/> Return to library</button>
        <button className="btn btn-brand" onClick={startReview}><RefreshCw/> Review another queue</button>
      </div>
    </div>;
  }

  if (view === "review" && current) {
    const dueLabel = now !== null && new Date(current.dueAt).getTime() <= now ? "Due now" : `Scheduled ${formatDate(current.dueAt, { month: "short", day: "numeric" })}`;
    const intervalPreview = Object.fromEntries(
      ratingLabels.map(({ rating }) => [rating, flashcardReviewIntervalLabel(current, rating)])
    ) as Record<ReviewRating, string>;
    return <div className="flashcard-review">
      <header className="flashcard-review-header">
        <button className="btn btn-secondary" onClick={() => setView("library")}><ArrowLeft size={16}/> End review</button>
        <div className="review-progress-wrap">
          <span>Card {reviewIndex + 1} of {reviewQueue.length}</span>
          <Progress value={((reviewIndex + 1) / reviewQueue.length) * 100}/>
        </div>
        <Badge tone="brand"><Clock3 size={13}/> {dueLabel}</Badge>
      </header>
      <section className="flashcard-review-workspace">
        <div className="review-card-meta">
          <Badge tone="brand">{current.tags[0] || "Review"}</Badge>
        </div>
        <div
          className={`flip-card-container ${revealed ? "flipped" : ""}`}
          role="button"
          tabIndex={0}
          onClick={() => setRevealed(!revealed)}
          onKeyDown={(event) => {
            if (event.key === "Enter" || event.key === " ") {
              event.preventDefault();
              setRevealed(!revealed);
            }
          }}
          aria-label={revealed ? "Flashcard answer revealed - click to flip back" : "Flashcard prompt - click to reveal answer"}
        >
          <div className="flip-card-inner">
            <div className="flip-card-front panel">
              <small className="card-face-tag">PROMPT</small>
              <h2 className="card-prompt-text">{current.front}</h2>
              <span className="flip-hint-badge">Click or press <kbd>Space</kbd> to reveal answer</span>
            </div>
            <div className="flip-card-back panel">
              <small className="card-face-tag answer-tag">ANSWER & EXPLANATION</small>
              <div className="card-answer-text">{current.back}</div>
              {current.questionId && (
                <button className="source-question-link btn btn-secondary" onClick={(event) => { event.stopPropagation(); openSourceQuestion(current); }}>
                  Open source question <ArrowRight size={14}/>
                </button>
              )}
            </div>
          </div>
        </div>

        {revealed ? (
          <div className="review-ratings-panel panel">
            <h3>How well did you recall this concept?</h3>
            <div className="rating-buttons-grid">
              {ratingLabels.map(({ rating, label }) => (
                <button
                  key={rating}
                  onClick={() => rate(rating)}
                  className={`rating-card rating-${rating}`}
                >
                  <span className="rating-name">{label}</span>
                  <span className="rating-time">{intervalPreview[rating]}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <button className="btn btn-brand btn-lg reveal-button" onClick={() => setRevealed(true)}>
            Show answer <ArrowRight size={16}/>
          </button>
        )}
      </section>
      <footer className="flashcard-keyboard-hints">
        <span><kbd>Space</kbd> Flip card</span>
        <span><kbd>1</kbd> Again</span>
        <span><kbd>2</kbd> Hard</span>
        <span><kbd>3</kbd> Good</span>
        <span><kbd>4</kbd> Easy</span>
      </footer>
      <Toast message={toast} visible={Boolean(toast)}/>
    </div>;
  }

  return <>
    <PageHeader
      title="Flashcards"
      description="Review focused recall cards with an interval scheduler that adapts after every rating."
      actions={<><button className="btn btn-secondary" onClick={openCreate}><Plus/> New card</button><button className="btn btn-brand" onClick={startReview} disabled={!state.flashcards.length}><Layers3/> Review {metrics.due || state.flashcards.length} cards</button></>}
    />
    <section className="flashcard-stats stat-grid four">
      <article className="panel stat-card flashcard-stat-card">
        <div className="stat-card-head">
          <small>Due now</small>
          <span className="stat-icon purple"><Clock3 size={18}/></span>
        </div>
        <div className="stat-value">{metrics.due}</div>
        <p className="stat-detail">About {Math.max(1, Math.ceil(metrics.due * 1.2))} min</p>
      </article>
      <article className="panel stat-card flashcard-stat-card">
        <div className="stat-card-head">
          <small>Learning</small>
          <span className="stat-icon blue"><RefreshCw size={18}/></span>
        </div>
        <div className="stat-value">{metrics.learning}</div>
        <p className="stat-detail">Fewer than 2 successful reviews</p>
      </article>
      <article className="panel stat-card flashcard-stat-card">
        <div className="stat-card-head">
          <small>Mature</small>
          <span className="stat-icon green"><Check size={18}/></span>
        </div>
        <div className="stat-value">{metrics.mature}</div>
        <p className="stat-detail">Intervals of 21 days or more</p>
      </article>
      <article className="panel stat-card flashcard-stat-card">
        <div className="stat-card-head">
          <small>Forecast recall</small>
          <span className="stat-icon orange"><TrendingUp size={18}/></span>
        </div>
        <div className="stat-value">{metrics.retention}%</div>
        <p className="stat-detail">{metrics.streak ? `${metrics.streak}-day review streak` : "Review today to start a streak"}</p>
      </article>
    </section>
    <section className="flashcard-layout">
      <article className="panel flashcard-library">
        <header>
          <div className="table-search"><Search/><input aria-label="Search flashcards" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search prompts, answers, or tags…"/></div>
          <div><select value={filter} onChange={(event) => setFilter(event.target.value as CardFilter)} aria-label="Filter flashcards"><option>All</option><option>Due</option><option>Learning</option><option>Mature</option></select></div>
        </header>
        {filtered.length
          ? <div className="flashcard-list">{filtered.map((card) => {
            const due = now !== null && new Date(card.dueAt).getTime() <= now;
            return <article key={card.id}>
              <div className="card-status"><span className={due ? "due" : "scheduled"}/></div>
              <div className="card-copy">
                <div>{card.tags.map((tag) => <Badge key={tag}>{tag}</Badge>)}</div>
                <h3>{card.front}</h3><p>{card.back}</p>
                <footer><span><Clock3/> {due ? "Due now" : `Due ${formatDate(card.dueAt, { month: "short", day: "numeric" })}`}</span><span>Interval {card.interval}d · Ease {card.ease.toFixed(2)}</span>{card.questionId && <button onClick={() => openSourceQuestion(card)}>Source {card.questionId}</button>}</footer>
              </div>
              <div className="card-actions"><button onClick={() => openEdit(card)} aria-label={`Edit ${card.front}`}><Edit3/></button><button onClick={() => dispatch({ type: "DELETE_FLASHCARD", id: card.id })} aria-label={`Delete ${card.front}`}><Trash2/></button></div>
            </article>;
          })}</div>
          : <EmptyState icon={<Layers3/>} title="No cards match" description="Change the filter, clear the search, or create a focused flashcard."/>}
      </article>
      <aside className="flashcard-side">
        <article className="panel retention-card"><div className="card-kicker"><TrendingUp/> Retention forecast</div><h2>{metrics.retention}%</h2><p>Estimated recall based on each card&apos;s current interval, ease, and elapsed time.</p><div className="retention-chart">{[0.82, 0.9, 0.94, 0.88, 0.96, 0.91, 1].map((factor, index) => <span key={index}><i style={{ height: `${Math.max(12, Math.round(metrics.retention * factor) - 38)}px` }}/></span>)}</div><small>This forecast is a learning aid, not a validated psychometric score.</small></article>
        <article className="panel flashcard-tip"><Sparkles/><h3>Make stronger cards</h3><p>Test one decision or distinction per prompt. Concise, specific retrieval produces cleaner review signals.</p></article>
      </aside>
    </section>
    <Modal open={editorOpen} onClose={() => setEditorOpen(false)} title={editingId ? "Edit flashcard" : "Create flashcard"} description="Use one focused prompt and one concise answer.">
      <div className="card-form"><Field label="Front"><textarea rows={4} value={front} onChange={(event) => setFront(event.target.value)} placeholder="What should you be able to retrieve?"/></Field><Field label="Back"><textarea rows={6} value={back} onChange={(event) => setBack(event.target.value)} placeholder="Write the answer and the key distinction."/></Field><Field label="Tags" hint="Comma separated"><input value={tags} onChange={(event) => setTags(event.target.value)}/></Field><div className="modal-actions"><button className="btn btn-ghost" onClick={() => setEditorOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={saveCard}>{editingId ? <Edit3/> : <Plus/>}{editingId ? "Save changes" : "Create card"}</button></div></div>
    </Modal>
    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

export function NotebookPage() {
  const { state, dispatch }=useStepwise();
  const [query,setQuery]=useState("");
  const [noteFilter,setNoteFilter]=useState<"All"|"Questions"|"High-yield">("All");
  const [selectedId,setSelectedId]=useState(state.notes[0]?.id||"");
  const [editOpen,setEditOpen]=useState(false);
  const [draft,setDraft]=useState<Partial<Note>>({title:"",body:"",tags:[]});
  const [toast,setToast]=useState("");
  const filtered=state.notes.filter(note=>`${note.title} ${note.body} ${note.tags.join(" ")}`.toLowerCase().includes(query.toLowerCase())&&(noteFilter==="All"||(noteFilter==="Questions"&&Boolean(note.questionId))||(noteFilter==="High-yield"&&note.tags.includes("high-yield"))));
  const selected=state.notes.find(note=>note.id===selectedId)||filtered[0];
  const openEditor=(note?:Note)=>{setDraft(note?{...note}:{title:"",body:"",tags:[]});setEditOpen(true)};
  const save=()=>{if(!draft.title?.trim()||!draft.body?.trim())return;const now=new Date().toISOString();const note:Note={id:draft.id||uid("note"),questionId:draft.questionId,title:draft.title,body:draft.body,tags:draft.tags||[],createdAt:draft.createdAt||now,updatedAt:now};dispatch({type:"UPSERT_NOTE",note});setSelectedId(note.id);setEditOpen(false);setToast("Note saved");window.setTimeout(()=>setToast(""),1600)};
  return <>
    <PageHeader title="Notebook" description="Keep reasoning notes, high-yield distinctions, and question-linked insights in one searchable place." actions={<button className="btn btn-brand" onClick={()=>openEditor()}><Plus/> New note</button>}/>
    <section className="notebook-shell panel"><aside className="note-list-panel"><header><div className="table-search"><Search/><input aria-label="Search notes" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search notes…"/></div><button onClick={()=>setNoteFilter(noteFilter==="High-yield"?"All":"High-yield")} aria-label="Toggle high-yield filter"><Tag/></button></header><div className="note-filters"><button className={noteFilter==="All"?"active":""} onClick={()=>setNoteFilter("All")}>All notes <span>{state.notes.length}</span></button><button className={noteFilter==="Questions"?"active":""} onClick={()=>setNoteFilter("Questions")}>Question notes <span>{state.notes.filter(note=>note.questionId).length}</span></button><button className={noteFilter==="High-yield"?"active":""} onClick={()=>setNoteFilter("High-yield")}>High-yield <span>{state.notes.filter(note=>note.tags.includes("high-yield")).length}</span></button></div><div className="note-list">{filtered.map(note=><button key={note.id} className={selected?.id===note.id?"active":""} onClick={()=>setSelectedId(note.id)}><div><b>{note.title}</b><span>{formatDate(note.updatedAt,{month:"short",day:"numeric"})}</span></div><p>{note.body.slice(0,110)}{note.body.length>110?"…":""}</p><footer>{note.tags.slice(0,2).map(tag=><span key={tag}>#{tag}</span>)}{note.questionId&&<i>{note.questionId}</i>}</footer></button>)}</div></aside><article className="note-reader">{selected?<><header><div><div>{selected.tags.map(tag=><Badge key={tag}>{tag}</Badge>)}</div><h1>{selected.title}</h1><p>Updated {formatDate(selected.updatedAt,{month:"long",day:"numeric",year:"numeric"})}{selected.questionId&&<> · Linked to <b>{selected.questionId}</b></>}</p></div><div><button aria-label={`Edit ${selected.title}`} onClick={()=>openEditor(selected)}><Edit3/></button><button aria-label={`Copy ${selected.title}`} onClick={()=>{navigator.clipboard?.writeText(selected.body);setToast("Note copied")}}><Copy/></button><button aria-label={`Delete ${selected.title}`} onClick={()=>{dispatch({type:"DELETE_NOTE",id:selected.id});setSelectedId("")}}><Trash2/></button></div></header><div className="note-content">{selected.body.split("\n").map((line,index)=><p key={index}>{line}</p>)}</div>{selected.questionId&&<footer><BookCheck/><div><b>Question context preserved</b><p>This note remains linked to its original explanation and content tags.</p></div><Link href="/app/qbank">Open QBank <ArrowRight/></Link></footer>}</>:<EmptyState icon={<NotebookPen/>} title="Select a note" description="Choose a note from the list or create a new one."/>}</article></section>
    <Modal open={editOpen} onClose={()=>setEditOpen(false)} title={draft.id?"Edit note":"Create note"}><div className="note-form"><Field label="Title"><input value={draft.title||""} onChange={e=>setDraft({...draft,title:e.target.value})} placeholder="A precise, searchable title"/></Field><Field label="Note"><textarea rows={12} value={draft.body||""} onChange={e=>setDraft({...draft,body:e.target.value})} placeholder="Write the reasoning distinction you want to revisit…"/></Field><Field label="Tags" hint="Comma separated"><input value={(draft.tags||[]).join(", ")} onChange={e=>setDraft({...draft,tags:e.target.value.split(",").map(tag=>tag.trim()).filter(Boolean)})}/></Field><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setEditOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={save}><NotebookPen/> Save note</button></div></div></Modal><Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

export function CommunityPage() {
  const { state } = useStepwise();
  const [tab, setTab] = useState<"Private circle" | "Milestones">("Private circle");
  const [members, setMembers] = useState([
    { id: "circle-mei", name: "Mei Chen", email: "mei@example.com", verified: true, consented: true, eligibleQuestionCount: 42 },
    { id: "circle-daniel", name: "Daniel Brooks", email: "daniel@example.com", verified: true, consented: true, eligibleQuestionCount: 27 },
    { id: "circle-aisha", name: "Aisha Rahman", email: "aisha@example.com", verified: false, consented: false, eligibleQuestionCount: 12 }
  ]);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [toast, setToast] = useState("");
  const eligibility = studyCircleEligibility(members);
  const highConfidenceMisses = state.attempts.filter((attempt) => !attempt.correct && attempt.confidence >= 4).length;
  const slowMisses = state.attempts.filter((attempt) => !attempt.correct && attempt.timeSec > 105).length;
  const knowledgeMisses = Math.max(1, state.attempts.filter((attempt) => !attempt.correct).length - highConfidenceMisses);
  const combinedSignals = [
    { label: "Knowledge gap", value: Math.min(100, 38 + knowledgeMisses * 6) },
    { label: "Overconfidence", value: Math.min(100, 24 + highConfidenceMisses * 9) },
    { label: "Pacing pressure", value: Math.min(100, 20 + slowMisses * 8) }
  ];
  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1600);
  };
  const sendInvite = () => {
    const email = inviteEmail.trim().toLowerCase();
    if (!email || !email.includes("@")) {
      showToast("Enter a valid email address");
      return;
    }
    if (members.some((member) => member.email === email)) {
      showToast("That peer is already in this circle");
      return;
    }
    setMembers((current) => [...current, { id: uid("circle"), name: email.split("@")[0], email, verified: false, consented: false, eligibleQuestionCount: 0 }]);
    setInviteEmail("");
    setInviteOpen(false);
    showToast("Private invitation created");
  };
  const updateMember = (id: string, patch: Partial<(typeof members)[number]>) => {
    setMembers((current) => current.map((member) => member.id === id ? { ...member, ...patch } : member));
  };

  return <>
    <PageHeader
      title="Private study circle"
      description="Benchmark aggregate reasoning patterns with verified peers only after consent and privacy thresholds are met."
      actions={<button className="btn btn-brand" onClick={() => setInviteOpen(true)}><Users/> Invite a peer</button>}
    />
    <AccessibleTabs tabs={["Private circle", "Milestones"]} value={tab} onChange={(value)=>setTab(value as typeof tab)} label="Study circle views"/>

    {tab === "Private circle" && <section className="private-circle-layout">
      <div className="notebook-main">
        <article className="panel circle-privacy-hero">
          <span className="circle-lock"><Shield/></span>
          <div><div className="card-kicker">Private by default</div><h2>Aggregate patterns, never individual scores.</h2><p>Stepwise unlocks shared error analytics only when enough verified peers consent and each person has sufficient question history. Names, question text, answers, and individual performance remain hidden.</p></div>
          <Badge tone={eligibility.unlocked ? "success" : "warning"}>{eligibility.unlocked ? "Analytics unlocked" : "Thresholds pending"}</Badge>
        </article>

        <article className="panel circle-thresholds">
          <header><div><h2>Eligibility checks</h2><p>All three safeguards must reach their threshold.</p></div><strong>{eligibility.overallProgress}%</strong></header>
          <div className="circle-threshold-grid">
            <div><span><Users/> Verified peers</span><b>{eligibility.verifiedPeers} / {eligibility.minimumPeers}</b><Progress value={eligibility.peerProgress}/><small>Identity and invitation verified</small></div>
            <div><span><Check/> Mutual consent</span><b>{eligibility.consentedPeers} / {eligibility.minimumPeers}</b><Progress value={eligibility.consentProgress}/><small>Every included peer opts in</small></div>
            <div><span><BookOpen/> Eligible history</span><b>{eligibility.historyEligiblePeers} / {eligibility.minimumPeers}</b><Progress value={eligibility.historyProgress}/><small>At least {eligibility.minimumQuestions} answered questions each</small></div>
          </div>
        </article>

        <article className={`panel shared-signal-card ${eligibility.unlocked ? "unlocked" : "locked"}`}>
          <header><div><div className="card-kicker"><BrainCircuit/> Shared error analytics</div><h2>{eligibility.unlocked ? "Combined reasoning patterns" : "Locked until the circle is eligible"}</h2><p>{eligibility.unlocked ? "Only thresholded, aggregate signals are shown." : "Complete verification, consent, and question-history requirements to reveal combined patterns."}</p></div><Shield/></header>
          {eligibility.unlocked
            ? <div className="shared-signal-list">{combinedSignals.map((signal) => <div key={signal.label}><span>{signal.label}</span><Progress value={signal.value}/><b>{signal.value}%</b></div>)}</div>
            : <div className="locked-signal-preview"><i/><i/><i/><span>Individual data cannot be inferred from this view.</span></div>}
        </article>
      </div>

      <aside>
        <article className="panel circle-members">
          <header><div><h2>Circle members</h2><p>{members.length} invitations</p></div><button onClick={() => setInviteOpen(true)}><Plus/> Add</button></header>
          <div>{members.map((member) => <article key={member.id}>
            <Avatar name={member.name}/>
            <div><b>{member.name}</b><span>{member.verified ? "Verified peer" : "Invitation pending"}</span><small>{member.eligibleQuestionCount} eligible questions</small></div>
            <div className="member-controls">
              <button className={member.verified ? "active" : ""} onClick={() => updateMember(member.id, { verified: !member.verified, consented: member.verified ? false : member.consented })}>{member.verified ? "Verified" : "Verify"}</button>
              <button disabled={!member.verified} className={member.consented ? "active" : ""} onClick={() => updateMember(member.id, { consented: !member.consented })}>{member.consented ? "Consented" : "Consent"}</button>
            </div>
            {member.eligibleQuestionCount < eligibility.minimumQuestions && <button className="history-simulate" onClick={() => updateMember(member.id, { eligibleQuestionCount: Math.min(eligibility.minimumQuestions, member.eligibleQuestionCount + 5) })}>Add demo history</button>}
          </article>)}</div>
        </article>
        <article className="panel circle-invite-code"><div className="card-kicker"><Copy/> Referral connection</div><h3>SW-ALEX-27</h3><p>A referral creates a pending circle connection. Shared analytics still requires verification, consent, and activity thresholds.</p><button className="btn btn-secondary btn-block" onClick={() => { navigator.clipboard?.writeText("SW-ALEX-27"); showToast("Referral code copied"); }}><Copy/> Copy code</button></article>
      </aside>
    </section>}

    {tab === "Milestones" && <section className="milestone-grid">{[
      ["First 500 questions", 100, "Completed Jul 11"],
      ["Seven-day streak", 100, "Completed Jul 18"],
      ["80% Cardio mastery", 82, "In progress"],
      ["First full simulation", 60, "1 of 2 complete"]
    ].map(([title, value, detail]) => <article className="panel" key={String(title)}><span className={Number(value) === 100 ? "complete" : ""}>{Number(value) === 100 ? <Trophy/> : <Clock3/>}</span><h2>{title}</h2><p>{detail}</p><Progress value={Number(value)}/>{Number(value) === 100 && <button onClick={() => { navigator.clipboard?.writeText(`I completed ${title} on Stepwise.`); showToast(`${title} copied`); }}>Share milestone</button>}</article>)}</section>}

    <Modal open={inviteOpen} onClose={() => setInviteOpen(false)} title="Invite a verified peer" description="The invite creates a private connection. No study history is shared until every threshold is met.">
      <Field label="Peer email"><input type="email" value={inviteEmail} onChange={(event) => setInviteEmail(event.target.value)} placeholder="peer@example.com"/></Field>
      <div className="modal-actions"><button className="btn btn-ghost" onClick={() => setInviteOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={sendInvite}><Send/> Create invite</button></div>
    </Modal>
    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}

export function SettingsPage() {
  const { state, dispatch, resetDemo }=useStepwise();
  const router=useRouter();
  const [section,setSection]=useState("Preferences");
  const [resetOpen,setResetOpen]=useState(false);
  const [toast,setToast]=useState("");
  const nav=[["Profile",UserRound],["Preferences",Settings],["Notifications",Bell],["Privacy & data",Shield],["Subscription",Star],["Accessibility",CircleHelp]] as const;
  const update=(patch:Partial<typeof state.settings>)=>{dispatch({type:"SET_SETTINGS",settings:patch});setToast("Settings saved automatically");window.setTimeout(()=>setToast(""),1500)};
  return <>
    <PageHeader title="Settings" description="Control your workspace, study preferences, notifications, and local demo data."/>
    <section className="settings-layout"><aside className="settings-nav panel">{nav.map(([label,Icon])=><button key={label} className={section===label?"active":""} onClick={()=>setSection(label)}><Icon/>{label}<ArrowRight/></button>)}</aside><div className="settings-content panel">
      {section==="Profile"&&<><header><h2>Profile</h2><p>Personal information shown across your learner workspace.</p></header><div className="profile-editor"><div className="profile-photo"><Avatar name={state.learnerProfile.name} size="lg"/><button onClick={()=>{setToast("Photo uploads are not connected yet");setTimeout(()=>setToast(""),1400)}}>Change photo</button></div><div className="form-grid-2"><Field label="Full name"><input value={state.learnerProfile.name} onChange={event=>dispatch({type:"SET_LEARNER_PROFILE",profile:{name:event.target.value}})}/></Field><Field label="Target exam"><input readOnly value={state.learnerProfile.targetExam}/></Field></div><Field label="Email"><input type="email" readOnly value={state.learnerProfile.email}/></Field><Field label="Medical school"><input value={state.learnerProfile.medicalSchool} onChange={event=>dispatch({type:"SET_LEARNER_PROFILE",profile:{medicalSchool:event.target.value}})}/></Field><div className="profile-actions"><button className="btn btn-brand" onClick={()=>{setToast("Profile queued for cloud sync");setTimeout(()=>setToast(""),1400)}}>Save profile</button><button className="btn btn-secondary" onClick={async()=>{await signOut();router.replace("/login");router.refresh();}}><LogOut/> Sign out</button></div></div></>}
      {section==="Preferences"&&<><header><h2>Study preferences</h2><p>Control how question sessions and your daily workspace behave.</p></header><div className="settings-group"><h3>Appearance</h3><div className="theme-picker">{(["light","dark","system"] as const).map(theme=><button key={theme} className={state.settings.theme===theme?"active":""} onClick={()=>update({theme})}><span className={`theme-preview ${theme}`}><i/><b/><em/></span><strong>{theme[0].toUpperCase()+theme.slice(1)}</strong>{state.settings.theme===theme&&<Check/>}</button>)}</div><Toggle checked={state.settings.compactMode} onChange={checked=>update({compactMode:checked})} label="Compact workspace" detail="Reduce padding and fit more content on screen."/></div><div className="settings-group"><h3>Question sessions</h3><Toggle checked={state.settings.showTimer} onChange={checked=>update({showTimer:checked})} label="Show session timer" detail="Keep elapsed or remaining time visible in the toolbar."/><Toggle checked={state.settings.sound} onChange={checked=>update({sound:checked})} label="Answer feedback sounds" detail="Play subtle confirmation sounds in tutor mode."/><Field label="Daily question goal"><input type="number" value={state.settings.dailyGoal} onChange={e=>update({dailyGoal:Number(e.target.value)})}/></Field></div></>}
      {section==="Notifications"&&<><header><h2>Notifications</h2><p>Choose which reminders and summaries can reach you.</p></header><div className="settings-group"><Toggle checked={state.settings.emailDigest} onChange={checked=>update({emailDigest:checked})} label="Weekly learning digest" detail="A summary of progress, weak systems, and next-week focus."/><Toggle checked={state.settings.planReminders} onChange={checked=>update({planReminders:checked})} label="Study plan reminders" detail="Reminders for incomplete planned sessions."/><Toggle checked={state.settings.cardReminders} onChange={checked=>update({cardReminders:checked})} label="Flashcards due" detail="A daily reminder when cards are ready for review."/><Toggle checked={state.settings.communityActivity} onChange={checked=>update({communityActivity:checked})} label="Community activity" detail="Replies and activity in your study circle."/></div></>}
      {section==="Privacy & data"&&<><header><h2>Privacy & data</h2><p>Manage the learner data synchronized to your account and cached in this browser.</p></header><div className="settings-group data-actions"><article><span><Archive/></span><div><b>Export study data</b><p>Download attempts, notes, cards, and settings as JSON.</p></div><button className="btn btn-secondary" onClick={()=>{const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="stepwise-study-data.json";a.click();URL.revokeObjectURL(url)}}>Export</button></article><article className="danger-zone"><span><Trash2/></span><div><b>Reset learner workspace</b><p>Restore sample learner data locally and synchronize that reset to your account.</p></div><button className="btn btn-danger" onClick={()=>setResetOpen(true)}>Reset</button></article></div></>}
      {section==="Subscription"&&<><header><h2>Subscription</h2><p>Billing-ready interface for future payment integration.</p></header><div className="subscription-card"><div><Badge tone="brand">PRO DEMO</Badge><h2>Stepwise Pro</h2><p>Adaptive QBank, full analytics, study planning, flashcards, and exam simulation.</p></div><div><b>$49</b><span>/ month, billed annually</span></div><footer><span>Demo access never expires in this repository.</span><button className="btn btn-secondary" onClick={()=>{setToast("Billing portal handoff opened in demo mode");setTimeout(()=>setToast(""),1500)}}>Manage billing</button></footer></div><div className="invoice-list"><h3>Billing history</h3><div><span>Jul 1, 2026</span><b>Stepwise Pro</b><span>$49.00</span><button onClick={()=>{const blob=new Blob(["Stepwise demo receipt — July 2026 — $49.00"],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="stepwise-receipt-2026-07.txt";a.click();URL.revokeObjectURL(url)}}>Receipt</button></div><div><span>Jun 1, 2026</span><b>Stepwise Pro</b><span>$49.00</span><button onClick={()=>{const blob=new Blob(["Stepwise demo receipt — June 2026 — $49.00"],{type:"text/plain"});const url=URL.createObjectURL(blob);const a=document.createElement("a");a.href=url;a.download="stepwise-receipt-2026-06.txt";a.click();URL.revokeObjectURL(url)}}>Receipt</button></div></div></>}
      {section==="Accessibility"&&<><header><h2>Accessibility</h2><p>Adjust motion, density, and study session presentation.</p></header><div className="settings-group"><Toggle checked={state.settings.reducedMotion} onChange={checked=>update({reducedMotion:checked})} label="Reduce motion" detail="Minimize nonessential transitions and animations."/><Toggle checked={state.settings.highContrast} onChange={checked=>update({highContrast:checked})} label="High contrast answer states" detail="Increase separation between correct, incorrect, and selected states."/><Toggle checked={state.settings.largeText} onChange={checked=>update({largeText:checked})} label="Larger question text" detail="Increase reading size inside the session workspace."/></div></>}
    </div></section>
    <Modal open={resetOpen} onClose={()=>setResetOpen(false)} title="Reset learner workspace?" description="This restores the original learner attempts, notes, cards, and settings, then synchronizes the reset when cloud storage is available."><div className="exit-modal-actions"><button className="btn btn-secondary" onClick={()=>setResetOpen(false)}>Cancel</button><button className="btn btn-danger" onClick={()=>{resetDemo();setResetOpen(false);setToast("Learner workspace reset")}}>Reset everything</button></div></Modal><Toast message={toast} visible={Boolean(toast)}/>
  </>;
}
