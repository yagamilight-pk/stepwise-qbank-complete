import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowRight, BookOpen, BookOpenCheck, Bookmark, BookmarkCheck, Brain, Check, ChevronRight,
  Clock3, Filter, GraduationCap, Heart, Layers3, LibraryBig, Search, ShieldCheck, Siren,
  Stethoscope, Target, UserCheck, Wind
} from "lucide-react";
import { medicalArticles, librarySystems } from "@/lib/library";
import { rankLibraryArticles, systemPerformance } from "@/lib/algorithms";
import { useStepwise } from "@/lib/store";
import type { Step } from "@/lib/types";
import { Badge, Donut, EmptyState, PageHeader, Progress, Toast, uid } from "./ui";

function renderSystemIcon(systemName: string, size = 18) {
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
  const [query, setQuery] = useState("");
  const [system, setSystem] = useState("All");
  const [step, setStep] = useState<"All" | Step>("All");
  const [selectedId, setSelectedId] = useState(state.libraryActivity[0]?.articleId ?? medicalArticles[0].id);
  const [toast, setToast] = useState("");

  const performance = useMemo(
    () => systemPerformance(state.questions, state.attempts),
    [state.questions, state.attempts]
  );
  const ranked = useMemo(
    () => rankLibraryArticles(medicalArticles, query, system, step, performance, state.savedArticles, state.libraryActivity),
    [query, system, step, performance, state.savedArticles, state.libraryActivity]
  );
  const selected = ranked.find((article) => article.id === selectedId) ?? ranked[0] ?? medicalArticles[0];
  const activity = state.libraryActivity.find((item) => item.articleId === selected.id);
  const completedCount = state.libraryActivity.filter((item) => item.completed).length;
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
    showToast(activity?.completed ? "Article returned to in progress" : "Article marked complete");
  };

  const buildRelatedBlock = () => {
    const related = selected.relatedQuestionIds.filter((id) => state.questions.some((question) => question.id === id && question.status === "Published"));
    sessionStorage.setItem("stepwise-session-config", JSON.stringify({
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

  return <>
    <PageHeader
      title="Medical library"
      description="A high-yield clinical reference connected to your questions, weak systems, notes, and spaced repetition."
      actions={<>
        <button className="btn btn-secondary" onClick={() => {
          setQuery("");
          setSystem("All");
          setStep("All");
          showToast("Library filters cleared");
        }}><Filter size={16}/> Clear filters</button>
        <button className="btn btn-brand" onClick={buildRelatedBlock}><Target size={16}/> Practice this topic</button>
      </>}
    />

    <section className="library-overview-grid">
      <article className="panel library-welcome">
        <span className="library-welcome-icon"><LibraryBig size={24}/></span>
        <div>
          <div className="card-kicker"><BookOpen size={14}/> High-Yield Clinical Reference</div>
          <h2>Read less. Connect more.</h2>
          <p>Search concise, original learning articles and immediately turn the concept into questions, notes, or flashcards.</p>
        </div>
      </article>
      <article className="panel library-metric"><Donut value={Math.round(completedCount / medicalArticles.length * 100)} size={92} detail="complete"/><div><span>Library progress</span><b>{completedCount} of {medicalArticles.length}</b><small>{state.savedArticles.length} saved articles</small></div></article>
      <article className="panel library-metric"><span className="metric-icon"><Target size={20}/></span><div><span>Recommended system</span><b>{performance[0]?.system ?? "Cardiovascular"}</b><small>{performance[0]?.mastery ?? 50}% current mastery</small></div></article>
    </section>

    <section className="medical-library-shell">
      <aside className="panel medical-library-index">
        <div className="library-search">
          <Search size={16}/>
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search disease, drug, finding…"/>
        </div>
        <div className="library-filter-row">
          <select value={step} onChange={(event) => setStep(event.target.value as "All" | Step)} aria-label="Filter by exam">
            <option value="All">All exams</option>
            <option value="Step 1">Step 1</option>
            <option value="Step 2 CK">Step 2 CK</option>
          </select>
          <select value={system} onChange={(event) => setSystem(event.target.value)} aria-label="Filter by system">
            <option>All</option>
            {librarySystems.map((item) => <option key={item}>{item}</option>)}
          </select>
        </div>
        <div className="library-result-summary"><span>{ranked.length} articles</span><small>Ranked by match + study priority</small></div>
        <div className="library-article-list">
          {ranked.map((article) => {
            const articleActivity = state.libraryActivity.find((item) => item.articleId === article.id);
            return <button key={article.id} className={selected.id === article.id ? "active" : ""} onClick={() => openArticle(article.id)}>
              <span className="article-list-icon">{articleActivity?.completed ? <Check size={16}/> : renderSystemIcon(article.system, 16)}</span>
              <span>
                <b>{article.title}</b>
                <small>{article.system} · {article.readingMinutes} min</small>
                {articleActivity && <Progress value={articleActivity.progress} size="sm"/>}
              </span>
              {state.savedArticles.includes(article.id) ? <BookmarkCheck size={16}/> : <ChevronRight size={16}/>}
            </button>;
          })}
          {!ranked.length && <EmptyState icon={<Search size={24}/>} title="No matching article" description="Try a broader term or clear one of the filters."/>}
        </div>
      </aside>

      {ranked.length ? <article className="panel medical-article">
        <header className="medical-article-header">
          <div className="article-header-main">
            <div className="article-badges">
              <Badge tone="brand">{selected.step}</Badge>
              <Badge>{selected.system}</Badge>
              <Badge tone={selected.difficulty === "Hard" ? "danger" : selected.difficulty === "Easy" ? "success" : "warning"}>{selected.difficulty}</Badge>
            </div>
            <h1>{selected.title}</h1>
            <p>{selected.summary}</p>
            <div className="article-meta">
              <span><Clock3 size={14}/> {selected.readingMinutes} min read</span>
              <span><GraduationCap size={14}/> {selected.category}</span>
              <span><BookOpenCheck size={14}/> Updated {new Date(`${selected.updatedAt}T12:00:00`).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
            </div>
          </div>
          <div className="article-actions">
            <button className={`btn btn-secondary ${saved ? "active" : ""}`} onClick={() => {
              dispatch({ type: "TOGGLE_SAVED_ARTICLE", articleId: selected.id });
              showToast(saved ? "Removed from saved articles" : "Article saved");
            }}>{saved ? <BookmarkCheck size={16}/> : <Bookmark size={16}/>}{saved ? "Saved" : "Save"}</button>
            <button className="btn btn-secondary" onClick={createCard}><Layers3 size={16}/> Make flashcard</button>
            <button className="btn btn-brand" onClick={toggleComplete}>{activity?.completed ? "Reopen article" : "Mark complete"}</button>
          </div>
        </header>

        <nav className="article-toc-nav" aria-label="Table of contents">
          <span className="toc-label">On this page</span>
          <div className="toc-links">
            {selected.sections.map((section, sectionIndex) => <a key={section.id} href={`#${selected.id}-${section.id}`} onClick={() => {
              const nextProgress = Math.round((sectionIndex + 1) / selected.sections.length * 100);
              dispatch({ type: "SET_LIBRARY_ACTIVITY", activity: { articleId: selected.id, progress: Math.max(activity?.progress ?? 0, nextProgress), completed: nextProgress === 100 || Boolean(activity?.completed), lastOpenedAt: new Date().toISOString() } });
            }}><span>{String(sectionIndex + 1).padStart(2, "0")}</span> {section.title}</a>)}
          </div>
          <div className="toc-progress-indicator">
            <Progress value={activity?.progress ?? 12}/>
          </div>
        </nav>

        <div className="article-body-wrapper">
          <div className="article-content">
            {selected.sections.map((section, sectionIndex) => <section key={section.id} id={`${selected.id}-${section.id}`}>
              <span className="article-section-number">{String(sectionIndex + 1).padStart(2, "0")}</span>
              <h2>{section.title}</h2>
              <p>{section.body}</p>
              {section.callout && <aside className="clinical-callout">{renderSystemIcon(selected.system, 18)}<div><b>High-yield connection</b><p>{section.callout}</p></div></aside>}
              {section.bullets && <ul>{section.bullets.map((bullet) => <li key={bullet}><Check size={14}/>{bullet}</li>)}</ul>}
              {section.table && <div className="responsive-table article-table"><table><thead><tr>{section.table.headers.map((header) => <th key={header}>{header}</th>)}</tr></thead><tbody>{section.table.rows.map((row, rowIndex) => <tr key={`${section.id}-${rowIndex}`}>{row.map((cell, cellIndex) => <td key={`${cell}-${cellIndex}`}>{cell}</td>)}</tr>)}</tbody></table></div>}
            </section>)}
          </div>

          <footer className="article-bottom-cta">
            <div className="cta-info">
              <span className="cta-icon">{renderSystemIcon(selected.system, 22)}</span>
              <div>
                <h3>Close the loop on {selected.title}</h3>
                <p>This article is linked to {selected.relatedQuestionIds.length || 1} seeded questions and your {selected.system} mastery signal.</p>
              </div>
            </div>
            <div className="cta-actions">
              <button className="btn btn-brand" onClick={buildRelatedBlock}>Start related questions <ArrowRight size={16}/></button>
              <button className="btn btn-secondary" onClick={createCard}><Layers3 size={16}/> Create recall card</button>
            </div>
          </footer>
        </div>
      </article> : <article className="panel medical-article medical-article-empty"><EmptyState icon={<Search size={24}/>} title="No article selected" description="Clear the filters or search for a broader clinical concept."/><button className="btn btn-secondary" onClick={() => { setQuery(""); setSystem("All"); setStep("All"); }}>Reset library filters</button></article>}
    </section>
    <Toast message={toast} visible={Boolean(toast)}/>
  </>;
}
