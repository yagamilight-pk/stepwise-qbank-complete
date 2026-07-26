"use client";

import { useDeferredValue, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BookOpen, BookOpenCheck, Bookmark, BookmarkCheck, Brain, Check,
  Clock3, GraduationCap, Heart, Layers3, Search, ShieldCheck, Siren, Stethoscope,
  Target, UserCheck, Wind, X, Menu
} from "lucide-react";
import { medicalArticles, librarySystems } from "@/lib/library";
import { rankLibraryArticles, systemPerformance } from "@/lib/algorithms";
import { useStepwise } from "@/lib/store";
import { ACTIVE_SESSION_KEY, SESSION_CONFIG_KEY } from "@/lib/session";
import type { Step } from "@/lib/types";
import { EmptyState, Toast, uid } from "./ui";

function renderSystemIcon(systemName: string, size = 16) {
  const normalized = systemName.toLowerCase();
  if (normalized.includes("cardio")) return <Heart size={size}/>;
  if (normalized.includes("pulmo")) return <Wind size={size}/>;
  if (normalized.includes("neuro")) return <Brain size={size}/>;
  if (normalized.includes("psych")) return <UserCheck size={size}/>;
  if (normalized.includes("prof") || normalized.includes("ethics")) return <ShieldCheck size={size}/>;
  if (normalized.includes("emerg")) return <Siren size={size}/>;
  return <Stethoscope size={size}/>;
}

export function MedicalLibraryPage() {
  const { state, dispatch } = useStepwise();
  const router = useRouter();
  
  // Search & Filter State
  const [query, setQuery] = useState("");
  const deferredQuery = useDeferredValue(query);
  const [system, setSystem] = useState("All");
  const [step, setStep] = useState<"All" | Step>("All");
  
  // Navigation & Toggle States
  const [selectedId, setSelectedId] = useState(state.libraryActivity[0]?.articleId ?? medicalArticles[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [toast, setToast] = useState("");

  const performance = useMemo(
    () => systemPerformance(state.questions, state.attempts),
    [state.questions, state.attempts]
  );
  
  const ranked = useMemo(
    () => rankLibraryArticles(medicalArticles, deferredQuery, system, step, performance, state.savedArticles, state.libraryActivity),
    [deferredQuery, system, step, performance, state.savedArticles, state.libraryActivity]
  );

  const selected = ranked.find((article) => article.id === selectedId) ?? ranked[0] ?? medicalArticles[0];
  const activity = state.libraryActivity.find((item) => item.articleId === selected.id);
  const saved = state.savedArticles.includes(selected.id);

  const showToast = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 1800);
  };

  const openArticle = (articleId: string) => {
    setSelectedId(articleId);
    const existing = state.libraryActivity.find((item) => item.articleId === articleId);
    dispatch({
      type: "SET_LIBRARY_ACTIVITY",
      activity: {
        articleId,
        progress: Math.max(existing?.progress ?? 0, 12),
        completed: existing?.completed ?? false,
        lastOpenedAt: new Date().toISOString()
      }
    });
  };

  const toggleComplete = () => {
    dispatch({
      type: "SET_LIBRARY_ACTIVITY",
      activity: {
        articleId: selected.id,
        progress: activity?.completed ? 72 : 100,
        completed: !activity?.completed,
        lastOpenedAt: new Date().toISOString()
      }
    });
    showToast(activity?.completed ? "Returned to in progress" : "Marked complete");
  };

  const buildRelatedBlock = () => {
    const related = selected.relatedQuestionIds.filter((id) => 
      state.questions.some((question) => question.id === id && question.status === "Published")
    );
    sessionStorage.removeItem(ACTIVE_SESSION_KEY);
    sessionStorage.setItem(SESSION_CONFIG_KEY, JSON.stringify({
      step: selected.step === "Step 1" ? "Step 1" : "Step 2 CK",
      mode: "Tutor",
      count: Math.max(1, related.length),
      systems: [selected.system],
      disciplines: [],
      difficulties: [],
      include: "All",
      timePerQuestionSec: 90,
      questionIds: related.length ? related : undefined
    }));
    router.push("/app/session");
  };

  const createCard = () => {
    dispatch({
      type: "UPSERT_FLASHCARD",
      card: {
        id: uid("library-card"),
        front: selected.title,
        back: `${selected.summary}\n\n${selected.sections[0]?.callout ?? selected.sections[0]?.body ?? ""}`,
        tags: [selected.system, selected.category, "Medical library"],
        interval: 0,
        ease: 2.5,
        repetitions: 0,
        lapses: 0,
        dueAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      }
    });
    showToast("High-yield flashcard added");
  };

  return (
    <div className="new-library-root">
      
      {/* Search Header Hero - Minimalist & Clean */}
      <header className="new-library-hero-block">
        <div className="hero-eyebrow-badge"><BookOpen size={12}/> Reference Knowledge Base</div>
        <h1>Medical Library</h1>
        <p>Original clinical reference topics mapped directly to active questions, performance signals, and recall cards.</p>
        
        <div className="hero-action-bar">
          {/* Search Field */}
          <div className="search-wrapper">
            <Search size={16} className="search-icon"/>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search concepts, findings, systems, drugs..."
              aria-label="Search articles"
            />
            {query && <button className="clear-search-btn" onClick={() => setQuery("")} aria-label="Clear search"><X size={14}/></button>}
          </div>

          {/* Collapsible Index Toggle Trigger */}
          <button 
            className={`sidebar-toggle-btn ${sidebarOpen ? "active" : ""}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Collapse sidebar" : "Expand sidebar"}
            aria-expanded={sidebarOpen}
            aria-controls="medical-library-index"
          >
            <Menu size={16}/>
            <span>{sidebarOpen ? "Hide Index" : "Show Index"}</span>
          </button>
        </div>

        {/* Global Filters Pills */}
        <div className="hero-pills-row">
          <div className="pills-group">
            <span className="pills-label">Exam:</span>
            {(["All", "Step 1", "Step 2 CK"] as const).map((s) => (
              <button key={s} aria-pressed={step === s} className={`pill-choice ${step === s ? "active" : ""}`} onClick={() => setStep(s)}>{s}</button>
            ))}
          </div>
          <div className="pills-divider"/>
          <div className="pills-group scrollable-pills">
            <span className="pills-label">System:</span>
            {["All", ...librarySystems].map((sys) => (
              <button key={sys} aria-pressed={system === sys} className={`pill-choice ${system === sys ? "active" : ""}`} onClick={() => setSystem(sys)}>{sys}</button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className={`new-library-workspace ${sidebarOpen ? "sidebar-visible" : "sidebar-collapsed"}`}>
        
        {/* Left Side: Topic Index Panel */}
        <aside className="new-library-sidebar" id="medical-library-index" aria-label="Medical article index">
          <div className="sidebar-index-header">
            <span>{ranked.length} Articles matched</span>
            {query || system !== "All" || step !== "All" ? (
              <button className="clear-filters-link" onClick={() => { setQuery(""); setSystem("All"); setStep("All"); }}>Reset</button>
            ) : null}
          </div>
          <div className="sidebar-cards-wrapper">
            {ranked.map((art) => {
              const artActivity = state.libraryActivity.find((item) => item.articleId === art.id);
              const isSelected = selected.id === art.id;
              const isSaved = state.savedArticles.includes(art.id);
              return (
                <button
                  key={art.id}
                  className={`sidebar-article-card ${isSelected ? "selected" : ""}`}
                  onClick={() => openArticle(art.id)}
                  aria-current={isSelected ? "page" : undefined}
                >
                  <div className="card-top-info">
                    <span className="card-system">{art.system}</span>
                    <span className="card-reading-time"><Clock3 size={11}/> {art.readingMinutes}m</span>
                  </div>
                  <h3>{art.title}</h3>
                  <div className="card-bottom-info">
                    <span className="card-exam">{art.step}</span>
                    {artActivity?.completed ? (
                      <span className="status-complete"><Check size={11}/> Done</span>
                    ) : artActivity?.progress ? (
                      <span className="status-reading">{artActivity.progress}% read</span>
                    ) : (
                      <span className="status-unread">Unread</span>
                    )}
                    {isSaved && <BookmarkCheck size={13} className="saved-icon"/>}
                  </div>
                </button>
              );
            })}
            {!ranked.length && (
              <div className="sidebar-empty">
                <EmptyState
                  icon={<Search size={20}/>}
                  title="No results"
                  description="Try clearing your filters."
                />
              </div>
            )}
          </div>
        </aside>

        {/* Right Side: Full Width Reading Area */}
        {ranked.length ? (
          <div className="new-library-reader">
            {/* Header Meta Toolbar */}
            <div className="reader-toolbar">
              <div className="reader-badge-list">
                <span className="badge-pill brand">{selected.step}</span>
                <span className="badge-pill info">{selected.system}</span>
                <span className="badge-pill muted">{selected.category}</span>
                <span className={`badge-pill diff-${selected.difficulty.toLowerCase()}`}>{selected.difficulty}</span>
              </div>
              <div className="reader-action-buttons">
                <button 
                  className={`reader-btn ${saved ? "saved" : ""}`}
                  onClick={() => {
                    dispatch({ type: "TOGGLE_SAVED_ARTICLE", articleId: selected.id });
                    showToast(saved ? "Removed from saved articles" : "Article bookmarked");
                  }}
                >
                  {saved ? <BookmarkCheck size={14}/> : <Bookmark size={14}/>}
                  <span>{saved ? "Saved" : "Save"}</span>
                </button>
                <button className="reader-btn" onClick={createCard}>
                  <Layers3 size={14}/>
                  <span>Make flashcard</span>
                </button>
                <button className="reader-btn primary" onClick={toggleComplete}>
                  <span>{activity?.completed ? "Reopen Topic" : "Mark as Complete"}</span>
                </button>
              </div>
            </div>

            {/* Reading Document Layout (Centered at max-width 900px for optimal reading) */}
            <article className="reading-document">
              
              <h1 className="document-title">{selected.title}</h1>
              
              <div className="document-lead-summary">
                <p>{selected.summary}</p>
              </div>

              <div className="document-meta-details">
                <span><Clock3 size={14}/> {selected.readingMinutes} min read</span>
                <span><GraduationCap size={14}/> {selected.category}</span>
                <span><BookOpenCheck size={14}/> Updated {new Date(`${selected.updatedAt}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                <span><Target size={14}/> {selected.relatedQuestionIds.length} Linked Question{selected.relatedQuestionIds.length === 1 ? "" : "s"}</span>
              </div>
              <aside className="medical-review-note">
                <BookOpenCheck size={18}/>
                <div>
                  <strong>Demonstration editorial status</strong>
                  <p>This original study summary is provided for interface evaluation. Production publication requires named medical review, evidence citations, and guideline-version approval.</p>
                </div>
              </aside>

              {/* Horizontal Document Anchor Quick Links */}
              <nav className="document-toc-bar" aria-label="Sections index">
                <span className="toc-title">ON THIS PAGE</span>
                <div className="toc-links-row">
                  {selected.sections.map((sec, i) => (
                    <a key={sec.id} href={`#${selected.id}-${sec.id}`}>
                      <span className="toc-idx">{String(i + 1).padStart(2, "0")}</span>
                      <span>{sec.title}</span>
                    </a>
                  ))}
                </div>
              </nav>

              {/* Body Sections */}
              <div className="document-body">
                {selected.sections.map((section, idx) => (
                  <section key={section.id} id={`${selected.id}-${section.id}`} className="document-section">
                    <div className="document-section-heading">
                      <span className="section-index">{String(idx + 1).padStart(2, "0")}</span>
                      <h2>{section.title}</h2>
                    </div>
                    <p className="document-paragraph">{section.body}</p>

                    {/* High-Yield Clinical Pearl Box */}
                    {section.callout && (
                      <div className="document-pearl-box">
                        <div className="pearl-header">
                          {renderSystemIcon(selected.system, 18)}
                          <strong>HIGH-YIELD CONNECTION</strong>
                        </div>
                        <p>{section.callout}</p>
                      </div>
                    )}

                    {/* Checklists */}
                    {section.bullets && (
                      <ul className="document-checklist">
                        {section.bullets.map((bullet) => (
                          <li key={bullet}>
                            <Check size={14} className="check-bullet"/>
                            <span>{bullet}</span>
                          </li>
                        ))}
                      </ul>
                    )}

                    {/* Data Tables */}
                    {section.table && (
                      <div className="document-table-wrapper">
                        <table className="document-table">
                          <caption className="sr-only">{section.title} comparison</caption>
                          <thead>
                            <tr>
                              {section.table.headers.map((header) => (
                                <th scope="col" key={header}>{header}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {section.table.rows.map((row, rIdx) => (
                              <tr key={`${section.id}-${rIdx}`}>
                                {row.map((cell, cIdx) => (
                                  <td key={`${cell}-${cIdx}`}>{cell}</td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </section>
                ))}
              </div>

              {/* Footer CTA Segment */}
              <footer className="document-footer-cta">
                <div className="cta-description">
                  <div className="cta-icon-wrapper">
                    {renderSystemIcon(selected.system, 20)}
                  </div>
                  <div>
                    <h3>Practice this topic in Stepwise QBank</h3>
                    <p>Test your active recall with the {selected.relatedQuestionIds.length} connected questions and update your system mastery signal.</p>
                  </div>
                </div>
                <div className="cta-buttons-row">
                  <button className="cta-btn-primary" onClick={buildRelatedBlock}>
                    Start practice block <ArrowRight size={15}/>
                  </button>
                  <button className="cta-btn-secondary" onClick={createCard}>
                    Create recall card
                  </button>
                </div>
              </footer>

            </article>
          </div>
        ) : (
          <div className="new-library-empty-canvas">
            <EmptyState
              icon={<Search size={28}/>}
              title="No clinical topic selected"
              description="Reset search query or filter criteria to display library topics."
              action={<button className="btn btn-secondary" onClick={() => { setQuery(""); setSystem("All"); setStep("All"); }}>Clear search filters</button>}
            />
          </div>
        )}
      </div>

      <Toast message={toast} visible={Boolean(toast)}/>
    </div>
  );
}
