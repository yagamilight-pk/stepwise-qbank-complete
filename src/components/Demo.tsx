"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, BrainCircuit, Check, Clock3, RotateCcw, X } from "lucide-react";
import { choicePeerDistribution, diagnoseReasoningTrap } from "@/lib/algorithms";
import { demoQuestions } from "@/lib/data";
import { Badge, Logo, Progress } from "./ui";

export function DemoPage() {
  const questions = useMemo(() => demoQuestions.filter((question) => question.step === "Step 2 CK").slice(0, 5), []);
  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState<string[]>([]);
  const [complete, setComplete] = useState(false);
  const question = questions[index];
  const selected = answers[question?.id];
  const answered = question ? submitted.includes(question.id) : false;
  const distribution = question ? choicePeerDistribution(question) : [];
  const correctCount = questions.filter((item) => submitted.includes(item.id) && answers[item.id] === item.correctChoiceId).length;

  const submit = () => {
    if (!question || !selected || answered) return;
    setSubmitted((items) => [...items, question.id]);
  };

  const move = (nextIndex: number) => {
    if (nextIndex >= questions.length) {
      setComplete(true);
      return;
    }
    setIndex(Math.max(0, nextIndex));
  };

  const restart = () => {
    setAnswers({});
    setSubmitted([]);
    setIndex(0);
    setComplete(false);
  };

  if (!question || complete) {
    return <main className="try-page">
      <header className="try-nav"><Link href="/"><Logo/></Link><div><Link href="/login" className="btn btn-ghost">Sign in</Link><Link href="/signup" className="btn btn-brand">Start free</Link></div></header>
      <section className="try-complete panel">
        <span className="summary-check"><Check/></span>
        <Badge tone="success">Interactive sample complete</Badge>
        <h1>{correctCount} of {questions.length} correct</h1>
        <p>You experienced the core Stepwise loop: answer, see cohort context inside each option, diagnose the reasoning pattern, and convert the miss into a next action.</p>
        <div className="try-score"><Progress value={(correctCount / Math.max(questions.length, 1)) * 100}/><span>{Math.round(correctCount / Math.max(questions.length, 1) * 100)}%</span></div>
        <div className="try-complete-actions"><button className="btn btn-secondary" onClick={restart}><RotateCcw/> Try again</button><Link className="btn btn-brand" href="/signup">Create free workspace <ArrowRight/></Link></div>
      </section>
    </main>;
  }

  const trap = answered ? diagnoseReasoningTrap(question, selected) : null;
  return <main className="try-page">
    <header className="try-nav"><Link href="/"><Logo/></Link><div><span className="try-progress-label">Question {index + 1} of {questions.length}</span><Link href="/signup" className="btn btn-brand">Save progress</Link></div></header>
    <div className="try-progress"><Progress value={((index + (answered ? 1 : 0)) / questions.length) * 100}/></div>
    <section className="try-workspace">
      <aside className="try-sidebar">
        <div><Badge tone="brand">{question.step}</Badge><h2>{question.system}</h2><p>{question.discipline} · {question.topic}</p></div>
        <nav aria-label="Question navigator">{questions.map((item, itemIndex) => <button key={item.id} className={`${itemIndex === index ? "active" : ""} ${submitted.includes(item.id) ? "answered" : ""}`} onClick={() => setIndex(itemIndex)}>{itemIndex + 1}{submitted.includes(item.id) && <Check/>}</button>)}</nav>
        <small><Clock3/> Untimed guided demo</small>
      </aside>
      <article className="try-question panel">
        <header><span>Original Stepwise sample</span><Badge tone={question.difficulty === "Hard" ? "danger" : "warning"}>{question.difficulty}</Badge></header>
        <h1>{question.stem}</h1>
        <div className="try-options">{question.choices.map((choice, choiceIndex) => {
          const percent = distribution.find((item) => item.choiceId === choice.id)?.percent ?? 0;
          const chosen = selected === choice.id;
          const correct = answered && choice.id === question.correctChoiceId;
          const wrong = answered && chosen && !correct;
          return <button
            key={choice.id}
            className={`${chosen ? "selected" : ""} ${correct ? "correct" : ""} ${wrong ? "wrong" : ""}`}
            onClick={() => !answered && setAnswers((items) => ({ ...items, [question.id]: choice.id }))}
            disabled={answered}
          >
            {answered && <span className="peer-option-fill" style={{ width: `${percent}%` }}/>}<span className="try-choice-letter">{String.fromCharCode(65 + choiceIndex)}</span><span className="try-choice-copy">{choice.text}</span>{answered && <span className="peer-option-percent">{percent}%</span>}{correct && <Check/>}{wrong && <X/>}
          </button>;
        })}</div>
        {!answered ? <footer><Link href="/" className="btn btn-ghost"><ArrowLeft/> Exit demo</Link><button className="btn btn-brand" onClick={submit} disabled={!selected}>Submit answer</button></footer> : <section className="try-explanation">
          <div className="try-result"><span className={selected === question.correctChoiceId ? "correct" : "wrong"}>{selected === question.correctChoiceId ? <Check/> : <X/>}</span><div><small>{selected === question.correctChoiceId ? "CORRECT" : "LEARNING MOMENT"}</small><h2>{question.objective}</h2></div></div>
          <p>{question.explanation}</p>
          {trap && <div className="reasoning-trap-box"><BrainCircuit/><div><span>Reasoning signal</span><h3>{trap.label}</h3><p>{trap.description}</p><small>Next action: {trap.nextAction}</small></div></div>}
          <div className="try-pearls"><b>High-yield takeaway</b>{question.pearls.map((pearl) => <p key={pearl}><Check/>{pearl}</p>)}</div>
          <footer><button className="btn btn-secondary" onClick={() => move(index - 1)} disabled={index === 0}><ArrowLeft/> Previous</button><button className="btn btn-brand" onClick={() => move(index + 1)}>{index === questions.length - 1 ? "View result" : "Next question"}<ArrowRight/></button></footer>
        </section>}
      </article>
    </section>
  </main>;
}
