"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bookmark, BrainCircuit, Calculator, Check, CheckCircle2, CircleAlert,
  Clock3, Flag, FlaskConical, Highlighter, Layers3, List, MoreHorizontal, NotebookPen,
  Pause, Play, RotateCcw, Search, Settings2, Sparkles, TimerReset, X, XCircle
} from "lucide-react";
import { choicePeerDistribution, diagnoseReasoningTrap, selectQuestions } from "@/lib/algorithms";
import { useStepwise } from "@/lib/store";
import type { Confidence, Question, SessionConfig } from "@/lib/types";
import { Badge, Donut, Field, formatSeconds, Modal, Progress, Toast, uid } from "./ui";
import { ReasoningTrace } from "./ReasoningTrace";

const fallbackConfig: SessionConfig = { step:"Step 2 CK",mode:"Adaptive",count:10,systems:[],disciplines:[],difficulties:[],include:"All",timePerQuestionSec:90 };

interface LocalResult { questionId:string; selectedChoiceId:string; correct:boolean; confidence:Confidence; timeSec:number }

export function SessionPage() {
  const { state, dispatch }=useStepwise();
  const router=useRouter();
  const [sessionId]=useState(()=>uid("session"));
  const [config,setConfig]=useState<SessionConfig>(fallbackConfig);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [index,setIndex]=useState(0);
  const [selected,setSelected]=useState<Record<string,string>>({});
  const [confidence,setConfidence]=useState<Record<string,Confidence>>({});
  const [submitted,setSubmitted]=useState<string[]>([]);
  const [struck,setStruck]=useState<Record<string,string[]>>({});
  const [results,setResults]=useState<LocalResult[]>([]);
  const [seconds,setSeconds]=useState(0);
  const [paused,setPaused]=useState(false);
  const [summary,setSummary]=useState(false);
  const [reviewIndex,setReviewIndex]=useState<number|null>(null);
  const [paletteOpen,setPaletteOpen]=useState(false);
  const [labOpen,setLabOpen]=useState(false);
  const [calculatorOpen,setCalculatorOpen]=useState(false);
  const [calculator,setCalculator]=useState({left:"",operator:"+",right:""});
  const [stemHighlighted,setStemHighlighted]=useState(false);
  const [noteOpen,setNoteOpen]=useState(false);
  const [cardOpen,setCardOpen]=useState(false);
  const [exitOpen,setExitOpen]=useState(false);
  const [reportOpen,setReportOpen]=useState(false);
  const [reportReason,setReportReason]=useState<"Medical accuracy"|"Ambiguous wording"|"Typo"|"Outdated guideline">("Medical accuracy");
  const [reportDetail,setReportDetail]=useState("");
  const [toast,setToast]=useState("");
  const [noteBody,setNoteBody]=useState("");
  const [cardBack,setCardBack]=useState("");
  const initialized=useRef(false);

  useEffect(()=>{
    if(initialized.current)return;
    initialized.current=true;
    let nextConfig=fallbackConfig;
    try{const raw=sessionStorage.getItem("stepwise-session-config");if(raw)nextConfig={...fallbackConfig,...JSON.parse(raw)}}catch{}
    const chosen=selectQuestions(state,nextConfig);
    const finalQuestions=chosen.length?chosen:selectQuestions(state,{...fallbackConfig,step:nextConfig.step,include:"All"});
    setConfig(nextConfig);setQuestions(finalQuestions);
    dispatch({type:"ADD_SESSION",session:{id:sessionId,createdAt:new Date().toISOString(),config:nextConfig,questionIds:finalQuestions.map(q=>q.id),currentIndex:0}});
  },[dispatch,sessionId,state]);

  useEffect(()=>{
    if(paused||summary||!questions.length)return;
    const timer=window.setInterval(()=>setSeconds(value=>value+1),1000);
    return()=>window.clearInterval(timer);
  },[paused,summary,questions.length]);


  const question=questions[reviewIndex??index];
  const isReview=reviewIndex!==null;
  const answered=question?submitted.includes(question.id):false;
  const chosenChoice=question?selected[question.id]:undefined;
  const correctChoice=question?.correctChoiceId;
  const peerDistribution=useMemo(() => question ? choicePeerDistribution(question) : [], [question]);
  const elapsedForCurrent=useMemo(()=>{
    const prior=results.reduce((sum,result)=>sum+result.timeSec,0);
    return Math.max(1,seconds-prior);
  },[results,seconds]);
  const timeLimit=questions.length*config.timePerQuestionSec;
  const remaining=Math.max(0,timeLimit-seconds);
  const calculatorResult=useMemo(()=>{
    const left=Number(calculator.left);
    const right=Number(calculator.right);
    if(!Number.isFinite(left)||!Number.isFinite(right))return "—";
    if(calculator.operator==="+")return String(left+right);
    if(calculator.operator==="-")return String(left-right);
    if(calculator.operator==="×")return String(left*right);
    if(calculator.operator==="÷")return right===0?"Undefined":String(left/right);
    return "—";
  },[calculator]);

  const showToast=(message:string)=>{setToast(message);window.setTimeout(()=>setToast(""),1800)};
  const playFeedback=(correct:boolean)=>{
    if(!state.settings.sound)return;
    try{
      const AudioContextClass=window.AudioContext||(window as typeof window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
      if(!AudioContextClass)return;
      const audio=new AudioContextClass();
      const oscillator=audio.createOscillator();
      const gain=audio.createGain();
      oscillator.frequency.value=correct?620:220;
      gain.gain.setValueAtTime(0.045,audio.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001,audio.currentTime+0.12);
      oscillator.connect(gain);gain.connect(audio.destination);
      oscillator.start();oscillator.stop(audio.currentTime+0.12);
      oscillator.addEventListener("ended",()=>audio.close());
    }catch{}
  };
  const finishSession=useCallback(()=>{
    setSummary(true);
    setReviewIndex(null);
    dispatch({type:"UPDATE_SESSION",id:sessionId,patch:{completedAt:new Date().toISOString(),currentIndex:Math.max(0,questions.length-1)}});
  },[dispatch,questions.length,sessionId]);
  const goTo=useCallback((nextIndex:number)=>{
    const bounded=Math.max(0,Math.min(questions.length-1,nextIndex));
    setIndex(bounded);
    setStemHighlighted(false);
    dispatch({type:"UPDATE_SESSION",id:sessionId,patch:{currentIndex:bounded}});
  },[dispatch,questions.length,sessionId]);
  const goNext=useCallback(()=>{
    if(index<questions.length-1)goTo(index+1);
    else finishSession();
  },[finishSession,goTo,index,questions.length]);
  const finishSessionWithCurrentAnswer=useCallback(()=>{
    const currentQuestion=questions[index];
    if(currentQuestion&&!submitted.includes(currentQuestion.id)){
      const selectedChoiceId=selected[currentQuestion.id];
      if(selectedChoiceId){
        const level=confidence[currentQuestion.id]||3;
        const result:LocalResult={questionId:currentQuestion.id,selectedChoiceId,correct:selectedChoiceId===currentQuestion.correctChoiceId,confidence:level,timeSec:elapsedForCurrent};
        setResults(current=>[...current,result]);
        setSubmitted(current=>[...current,currentQuestion.id]);
        dispatch({type:"ADD_ATTEMPT",attempt:{id:uid("attempt"),...result,createdAt:new Date().toISOString(),sessionId,mode:config.mode}});
      }
    }
    finishSession();
  },[confidence,config.mode,dispatch,elapsedForCurrent,finishSession,index,questions,selected,sessionId,submitted]);
  const submit=()=>{
    if(!question||isReview)return;
    const choice=selected[question.id];
    if(!choice){showToast("Choose an answer before submitting");return}
    if(submitted.includes(question.id)){goNext();return}
    const level=confidence[question.id]||3;
    const result:LocalResult={questionId:question.id,selectedChoiceId:choice,correct:choice===question.correctChoiceId,confidence:level,timeSec:elapsedForCurrent};
    setSubmitted(current=>[...current,question.id]);
    setResults(current=>[...current,result]);
    dispatch({type:"ADD_ATTEMPT",attempt:{id:uid("attempt"),...result,createdAt:new Date().toISOString(),sessionId,mode:config.mode}});
    playFeedback(result.correct);
    if(config.mode!=="Tutor"){
      if(index<questions.length-1)window.setTimeout(()=>goTo(index+1),180);
      else window.setTimeout(finishSession,180);
    }
  };

  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{
      if(summary||noteOpen||cardOpen||labOpen||calculatorOpen||exitOpen||reportOpen)return;
      const currentQuestion=questions[index];
      if(!currentQuestion)return;
      if(["1","2","3","4","5"].includes(event.key)){
        const choice=currentQuestion.choices[Number(event.key)-1];
        if(choice&&!submitted.includes(currentQuestion.id))setSelected(current=>({...current,[currentQuestion.id]:choice.id}));
      }
      if(event.key.toLowerCase()==="f")dispatch({type:"TOGGLE_FLAG",questionId:currentQuestion.id});
      if(event.key.toLowerCase()==="b")dispatch({type:"TOGGLE_BOOKMARK",questionId:currentQuestion.id});
      if(event.key==="ArrowRight"&&submitted.includes(currentQuestion.id))goNext();
    };
    window.addEventListener("keydown",listener);
    return()=>window.removeEventListener("keydown",listener);
  },[calculatorOpen,cardOpen,dispatch,exitOpen,goNext,index,labOpen,noteOpen,questions,reportOpen,submitted,summary]);
  const saveNote=()=>{
    if(!question||!noteBody.trim())return;
    dispatch({type:"UPSERT_NOTE",note:{id:uid("note"),questionId:question.id,title:`${question.topic} — ${question.id}`,body:noteBody,tags:[question.system.toLowerCase(),question.step],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()}});setNoteBody("");setNoteOpen(false);showToast("Note saved to your notebook");
  };
  const submitReport=()=>{
    if(!question||!reportDetail.trim()){showToast("Add a short description before submitting");return}
    dispatch({type:"ADD_REPORT",report:{id:uid("report"),questionId:question.id,reason:reportReason,detail:reportDetail.trim(),reporter:"current-learner",createdAt:new Date().toISOString(),status:"Open"}});
    setReportDetail("");setReportOpen(false);showToast("Issue sent to the content review queue");
  };
  const saveCard=()=>{
    if(!question||!cardBack.trim())return;
    dispatch({type:"UPSERT_FLASHCARD",card:{id:uid("card"),questionId:question.id,front:question.objective,back:cardBack,tags:[question.system,question.step],interval:0,ease:2.5,repetitions:0,lapses:0,dueAt:new Date().toISOString(),createdAt:new Date().toISOString()}});setCardBack("");setCardOpen(false);showToast("Flashcard added to today’s review");
  };

  useEffect(()=>{
    if(summary||paused||config.mode==="Tutor"||!questions.length||remaining>0)return;
    const timeout=window.setTimeout(finishSessionWithCurrentAnswer,0);
    return()=>window.clearTimeout(timeout);
  },[config.mode,finishSessionWithCurrentAnswer,paused,questions.length,remaining,summary]);

  if(!questions.length)return <div className="session-loading"><span><Sparkles/></span><h2>Building your block</h2><p>Ranking eligible questions by weakness, recency, and challenge fit…</p></div>;
  if(summary)return <SessionSummary questions={questions} results={results} seconds={seconds} onReview={setReviewIndex} reviewIndex={reviewIndex} onBack={()=>setReviewIndex(null)} onRestart={()=>router.push("/app/qbank")}/>;

  return <div className="session-page">
    <header className="session-toolbar"><div><button className="session-exit" onClick={()=>setExitOpen(true)}><ArrowLeft/> Exit</button><div className="session-progress-title"><b>{config.step} · {config.mode}</b><span>Question {index+1} of {questions.length}</span></div></div><div className="session-tools"><button onClick={()=>setPaletteOpen(!paletteOpen)} aria-expanded={paletteOpen} aria-controls="question-palette"><List/><span>Navigator</span></button><button onClick={()=>setLabOpen(true)}><FlaskConical/><span>Lab values</span></button><button onClick={()=>setCalculatorOpen(true)}><Calculator/><span>Calculator</span></button><button onClick={()=>setPaused(!paused)} aria-pressed={paused}>{paused?<Play/>:<Pause/>}<span>{paused?"Resume":"Pause"}</span></button>{state.settings.showTimer&&<div className={remaining<180&&config.mode!=="Tutor"?"session-timer warning":"session-timer"} aria-label={`${config.mode==="Tutor"?formatSeconds(seconds):formatSeconds(remaining)} ${config.mode==="Tutor"?"elapsed":"remaining"}`}><Clock3/><b>{config.mode==="Tutor"?formatSeconds(seconds):formatSeconds(remaining)}</b><small>{config.mode==="Tutor"?"elapsed":"remaining"}</small></div>}</div></header>
    <div className="session-progress-bar" role="progressbar" aria-label="Block progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index+(answered?1:0)}><i style={{width:`${((index+(answered?1:0))/questions.length)*100}%`}}/></div>
    {paletteOpen&&<div id="question-palette" className="question-palette" aria-label="Question navigator"><header><b>Question navigator</b><button onClick={()=>setPaletteOpen(false)} aria-label="Close question navigator"><X/></button></header><div>{questions.map((item,itemIndex)=><button key={item.id} className={`${itemIndex===index?"current":""} ${submitted.includes(item.id)?results.find(r=>r.questionId===item.id)?.correct?"correct":"incorrect":""} ${state.flagged.includes(item.id)?"flagged":""}`} onClick={()=>{goTo(itemIndex);setPaletteOpen(false)}} aria-label={`Question ${itemIndex+1}${submitted.includes(item.id)?" answered":""}${state.flagged.includes(item.id)?" flagged":""}`} aria-current={itemIndex===index?"step":undefined}>{itemIndex+1}{state.flagged.includes(item.id)&&<i/>}</button>)}</div><footer><span><i className="answered"/> Answered</span><span><i className="current"/> Current</span><span><i className="flagged"/> Flagged</span></footer></div>}
    {paused&&<div className="paused-overlay" role="dialog" aria-modal="true" aria-labelledby="paused-title"><div><Pause/><h2 id="paused-title">Session paused</h2><p>Your timer is stopped and the question is hidden.</p><button className="btn btn-brand" onClick={()=>setPaused(false)}><Play/> Resume session</button></div></div>}
    <main className="question-workspace">
      <aside className="question-meta"><Badge tone="brand">{question.step}</Badge><dl><div><dt>System</dt><dd>{question.system}</dd></div><div><dt>Discipline</dt><dd>{question.discipline}</dd></div><div><dt>Difficulty</dt><dd><Badge tone={question.difficulty==="Hard"?"danger":question.difficulty==="Easy"?"success":"warning"}>{question.difficulty}</Badge></dd></div></dl><div className="session-utility"><button className={state.flagged.includes(question.id)?"active":""} onClick={()=>dispatch({type:"TOGGLE_FLAG",questionId:question.id})}><Flag/> {state.flagged.includes(question.id)?"Flagged":"Flag question"}<kbd>F</kbd></button><button className={state.bookmarks.includes(question.id)?"active":""} onClick={()=>dispatch({type:"TOGGLE_BOOKMARK",questionId:question.id})}><Bookmark/> {state.bookmarks.includes(question.id)?"Bookmarked":"Bookmark"}<kbd>B</kbd></button><button onClick={()=>setNoteOpen(true)}><NotebookPen/> Add note</button><button onClick={()=>setReportOpen(true)}><CircleAlert/> Report issue</button></div><div className="shortcut-card"><b>Keyboard shortcuts</b><span><kbd>1–5</kbd> choose answer</span><span><kbd>F</kbd> flag</span><span><kbd>B</kbd> bookmark</span></div></aside>
      <section className="question-main">
        <div className="question-number"><span>{question.id}</span><div><button aria-label="Highlight question stem" aria-pressed={stemHighlighted} className={stemHighlighted?"active":""} onClick={()=>setStemHighlighted(!stemHighlighted)}><Highlighter/></button><button aria-label="Explain session settings" onClick={()=>showToast("Timer, confidence, and feedback settings are controlled by the block mode")}><Settings2/></button><button aria-label="Explain available question actions" onClick={()=>showToast("Flag, bookmark, note, and report actions are available in the left panel")}><MoreHorizontal/></button></div></div>
        <article className={`question-stem ${stemHighlighted?"highlighted":""}`}>{question.stem}</article>
        <div className="choice-list-session">{question.choices.map((choice,choiceIndex)=>{
          const selectedNow=chosenChoice===choice.id;const isCorrect=answered&&choice.id===correctChoice;const isWrong=answered&&selectedNow&&!isCorrect;const eliminated=struck[question.id]?.includes(choice.id);
          const peer=peerDistribution.find((item)=>item.choiceId===choice.id)?.percent??0;
          return <div key={choice.id} className={`session-choice ${selectedNow?"selected":""} ${isCorrect?"correct":""} ${isWrong?"wrong":""} ${eliminated?"eliminated":""}`}>
            {answered&&<span className="peer-option-fill" style={{width:`${peer}%`}} aria-hidden="true"/>}
            <button className="choice-select" disabled={answered} onClick={()=>!answered&&setSelected(current=>({...current,[question.id]:choice.id}))} aria-pressed={selectedNow} aria-label={`${String.fromCharCode(65+choiceIndex)}. ${choice.text}`}>
              <span>{String.fromCharCode(65+choiceIndex)}</span><p>{choice.text}</p>
              {answered&&<strong className="peer-option-percent">{peer}%</strong>}
              {isCorrect&&<CheckCircle2/>}{isWrong&&<XCircle/>}
            </button>
            <button className="strike-button" disabled={answered} onClick={()=>setStruck(current=>({...current,[question.id]:(current[question.id]||[]).includes(choice.id)?(current[question.id]||[]).filter(id=>id!==choice.id):[...(current[question.id]||[]),choice.id]}))} aria-label={`${eliminated?"Restore":"Strike out"} choice ${String.fromCharCode(65+choiceIndex)}`} aria-pressed={eliminated}><span/></button>
          </div>})}</div>
        {answered&&<p className="distribution-note">Response percentages are simulated sample data for this demonstration.</p>}
        {!answered&&<div className="confidence-select"><span>How confident are you?</span><div>{([1,2,3,4,5] as Confidence[]).map(level=><button key={level} className={confidence[question.id]===level?"active":""} aria-pressed={confidence[question.id]===level} onClick={()=>setConfidence(current=>({...current,[question.id]:level}))}><b>{level}</b><small>{["Guess","Low","Medium","High","Certain"][level-1]}</small></button>)}</div></div>}
        {answered&&config.mode==="Tutor"&&<Explanation question={question} selectedChoiceId={chosenChoice} onCard={()=>{setCardBack(question.explanation);setCardOpen(true)}} onNote={()=>setNoteOpen(true)}/>} 
        <footer className="question-footer"><button className="btn btn-ghost" disabled={index===0} onClick={()=>goTo(index-1)}><ArrowLeft/> Previous</button><div><span role="status" aria-live="polite">{answered&&config.mode==="Tutor"?"Explanation unlocked":"Select one best answer"}</span><button className="btn btn-brand btn-lg" onClick={submit}>{answered?index===questions.length-1?"Finish block":"Next question":config.mode==="Tutor"?"Submit answer":index===questions.length-1?"Submit & finish":"Submit & next"}<ArrowRight/></button></div></footer>
      </section>
    </main>
    <Modal open={labOpen} onClose={()=>setLabOpen(false)} title="Common laboratory reference values" wide><LabValues/></Modal>
    <Modal open={calculatorOpen} onClose={()=>setCalculatorOpen(false)} title="Quick calculator" description="A simple four-operation calculator for session scratch work."><div className="calculator-grid"><input inputMode="decimal" aria-label="First number" value={calculator.left} onChange={e=>setCalculator({...calculator,left:e.target.value})} placeholder="0"/><select aria-label="Operation" value={calculator.operator} onChange={e=>setCalculator({...calculator,operator:e.target.value})}><option>+</option><option>-</option><option>×</option><option>÷</option></select><input inputMode="decimal" aria-label="Second number" value={calculator.right} onChange={e=>setCalculator({...calculator,right:e.target.value})} placeholder="0"/><strong aria-live="polite">= {calculatorResult}</strong></div><div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setCalculator({left:"",operator:"+",right:""})}><RotateCcw/> Clear</button><button className="btn btn-brand" onClick={()=>setCalculatorOpen(false)}>Done</button></div></Modal>
    <Modal open={noteOpen} onClose={()=>setNoteOpen(false)} title="Add a question note" description={`${question.id} · ${question.system}`}><Field label="Note"><textarea rows={7} value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Capture the distinction, rule, or reasoning step you want to remember…"/></Field><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setNoteOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={saveNote}><NotebookPen/> Save note</button></div></Modal>
    <Modal open={cardOpen} onClose={()=>setCardOpen(false)} title="Create a flashcard" description="The learning objective becomes the prompt."><Field label="Front"><textarea rows={3} readOnly value={question.objective}/></Field><Field label="Back"><textarea rows={6} value={cardBack} onChange={e=>setCardBack(e.target.value)}/></Field><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setCardOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={saveCard}><Layers3/> Add flashcard</button></div></Modal>
    <Modal open={reportOpen} onClose={()=>setReportOpen(false)} title="Report a content issue" description={`${question.id} · Reports appear in the admin review queue.`}><Field label="Issue type"><select value={reportReason} onChange={event=>setReportReason(event.target.value as typeof reportReason)}><option>Medical accuracy</option><option>Ambiguous wording</option><option>Typo</option><option>Outdated guideline</option></select></Field><Field label="What should the content team review?"><textarea rows={6} value={reportDetail} onChange={event=>setReportDetail(event.target.value)} placeholder="Describe the specific statement, option, or explanation concern…"/></Field><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setReportOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={submitReport}>Submit report</button></div></Modal>
    <Modal open={exitOpen} onClose={()=>setExitOpen(false)} title="Leave this session?" description="Your answered questions are already saved. You can return to QBank to begin a new block."><div className="exit-modal-actions"><button className="btn btn-secondary" onClick={()=>setExitOpen(false)}>Keep studying</button><Link className="btn btn-danger" href="/app/qbank">Exit session</Link></div></Modal>
    <Toast message={toast} visible={Boolean(toast)}/>
  </div>;
}

function Explanation({question,selectedChoiceId,onCard,onNote}:{question:Question;selectedChoiceId?:string;onCard?:()=>void;onNote?:()=>void}) {
  const correct=selectedChoiceId===question.correctChoiceId;
  const trap=diagnoseReasoningTrap(question,selectedChoiceId);
  const selectedChoice=question.choices.find((choice)=>choice.id===selectedChoiceId);
  return <section className={`explanation ${correct?"correct":"incorrect"}`}>
    <header>
      <span>{correct?<CheckCircle2/>:<XCircle/>}</span>
      <div><Badge tone={correct?"success":"danger"}>{correct?"Correct":"Incorrect"}</Badge><h2>{correct?"Strong clinical reasoning":"Close the reasoning gap"}</h2></div>
      {(onCard||onNote)&&<div>{onNote&&<button onClick={onNote}><NotebookPen/> Note</button>}{onCard&&<button onClick={onCard}><Layers3/> Flashcard</button>}</div>}
    </header>
    <div className="explanation-body">
      <h3>Why this is the best answer</h3>
      <p>{question.explanation}</p>
      <div className="objective-box"><Sparkles/><div><b>Learning objective</b><p>{question.objective}</p></div></div>
      <div className="reasoning-trap-box"><BrainCircuit/><div><span>{correct?"Reasoning signal":"Reasoning trap"}</span><h3>{trap.label}</h3><p>{trap.description}</p><small>{trap.nextAction}</small></div></div>
      <ReasoningTrace
        steps={[
          { phase:"Clinical cue", title:question.topic, detail:`${question.system} · ${question.discipline}`, state:"complete" },
          { phase:"Decision", title:selectedChoice?.text ?? "No answer recorded", detail:correct?"The selected answer follows the strongest clinical evidence.":"The selected answer reveals where the reasoning path diverged.", state:"complete" },
          { phase:"Correction", title:trap.label, detail:trap.description, state:"current" },
          { phase:"Next review", title:"Rehearse the distinction", detail:trap.nextAction, state:"next" }
        ]}
      />
      <h3>Answer analysis</h3>
      <div className="answer-analysis">{question.choices.map((choice,index)=><div key={choice.id} className={choice.id===question.correctChoiceId?"correct":""}><span>{String.fromCharCode(65+index)}</span><div><b>{choice.text}</b><p>{question.wrongChoiceNotes[choice.id]}</p></div></div>)}</div>
      <h3>High-yield takeaways</h3>
      <ul>{question.pearls.map(pearl=><li key={pearl}><Check/>{pearl}</li>)}</ul>
    </div>
  </section>;
}

function SessionSummary({questions,results,seconds,onReview,reviewIndex,onBack,onRestart}:{questions:Question[];results:LocalResult[];seconds:number;onReview:(index:number)=>void;reviewIndex:number|null;onBack:()=>void;onRestart:()=>void}) {
  const { state } = useStepwise();
  const [filter,setFilter]=useState<"All"|"Incorrect"|"Correct">("All");
  if(reviewIndex!==null){
    const question=questions[reviewIndex];
    const result=results.find(item=>item.questionId===question.id);
    return <div className="session-review-page"><header><button onClick={onBack}><ArrowLeft/> Back to summary</button><span>Reviewing {reviewIndex+1} of {questions.length}</span></header><main><div className="review-question-head"><Badge tone={result?.correct?"success":"danger"}>{result?.correct?"Correct":"Incorrect"}</Badge><span>{question.id} · {question.system}</span></div><h1>{question.stem}</h1><div className="choice-list-session review">{question.choices.map((choice,index)=>{const peer=choicePeerDistribution(question).find((item)=>item.choiceId===choice.id)?.percent??0;return <div key={choice.id} className={`session-choice ${choice.id===question.correctChoiceId?"correct":choice.id===result?.selectedChoiceId?"wrong":""}`}><span className="peer-option-fill" style={{width:`${peer}%`}} aria-hidden="true"/><div className="choice-select"><span>{String.fromCharCode(65+index)}</span><p>{choice.text}</p><strong className="peer-option-percent">{peer}%</strong>{choice.id===question.correctChoiceId&&<CheckCircle2/>}{choice.id===result?.selectedChoiceId&&choice.id!==question.correctChoiceId&&<XCircle/>}</div></div>})}</div><Explanation question={question} selectedChoiceId={result?.selectedChoiceId}/></main></div>;
  }
  const correct=results.filter(result=>result.correct).length;
  const accuracy=results.length?Math.round(correct/results.length*100):0;
  const avg=results.length?Math.round(results.reduce((sum,result)=>sum+result.timeSec,0)/results.length):0;
  const confidentMisses=results.filter(result=>!result.correct&&result.confidence>=4).length;
  const bookmarks=questions.filter(question=>state.bookmarks.includes(question.id)).length;
  const visibleQuestions=questions.map((question,index)=>({question,index,result:results.find(item=>item.questionId===question.id)})).filter(item=>filter==="All"||(filter==="Correct"?item.result?.correct:!item.result?.correct));
  return <main className="session-summary">
    <header><div><span className="summary-check"><Check/></span><div><Badge tone="success">Block complete</Badge><h1>Strong work. Now consolidate it.</h1><p>Your answers are saved and your adaptive profile has been updated.</p></div></div><Link className="btn btn-secondary" href="/app">Return to dashboard</Link></header>
    <section className="summary-score panel"><div className="summary-score-main"><Donut value={accuracy} size={180} detail="accuracy"/><div><span>Performance</span><h2>{accuracy>=80?"Excellent control":accuracy>=65?"Building momentum":"Useful diagnostic block"}</h2><p>{correct} correct out of {results.length} answered.</p><Badge tone={accuracy>=70?"success":"warning"}>{accuracy>=70?"Above recent average":"Review recommended"}</Badge></div></div><div className="summary-metrics"><div><Clock3/><span><b>{formatSeconds(seconds)}</b><small>Total time</small></span></div><div><TimerReset/><span><b>{formatSeconds(avg)}</b><small>Average pace</small></span></div><div><Flag/><span><b>{confidentMisses}</b><small>Confident misses</small></span></div><div><Bookmark/><span><b>{bookmarks}</b><small>Bookmarked</small></span></div></div></section>
    <section className="summary-grid">
      <article className="panel summary-review"><header><div><h2>Question review</h2><p>Open any item to inspect the explanation and sample response distribution.</p></div><select aria-label="Filter question review" value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option>All</option><option>Incorrect</option><option>Correct</option></select></header><div>{visibleQuestions.map(({question,index,result})=><button key={question.id} onClick={()=>onReview(index)}><span className={result?.correct?"correct":"incorrect"}>{result?.correct?<Check/>:<X/>}</span><div><b>Question {index+1}</b><p>{question.system} · {question.topic}</p></div><span>{result?formatSeconds(result.timeSec):"—"}</span><ArrowRight/></button>)}{!visibleQuestions.length&&<p className="summary-empty">No questions match this filter.</p>}</div></article>
      <aside><article className="panel next-step-card"><div className="insight-icon"><Sparkles/></div><Badge tone="brand">Recommended next</Badge><h2>Review {Math.max(0,results.length-correct)} missed concepts</h2><p>{results.length-correct?"Spend 12–18 minutes on explanation recall before starting another block.":"Use the strongest item to create a recall card and maintain the concept."}</p><button className="btn btn-brand btn-block" onClick={()=>{const firstWrong=results.findIndex(result=>!result.correct);onReview(firstWrong>=0?firstWrong:0)}} disabled={!questions.length}>Begin review <ArrowRight/></button></article><article className="panel"><h3>Block signals</h3><div className="signal-list"><div><span>Knowledge</span><Progress value={accuracy}/><b>{accuracy}%</b></div><div><span>Calibration</span><Progress value={Math.max(40,100-confidentMisses*15)}/><b>{Math.max(40,100-confidentMisses*15)}%</b></div><div><span>Pacing</span><Progress value={Math.min(100,Math.round(90/Math.max(avg,1)*100))}/><b>{avg<=90?"On target":"Slow"}</b></div></div></article></aside>
    </section>
    <footer className="summary-footer"><button className="btn btn-secondary" onClick={onRestart}><RotateCcw/> Build another block</button><Link className="btn btn-brand" href="/app/analytics">View analytics <ArrowRight/></Link></footer>
  </main>;
}

function LabValues(){
  const [query,setQuery]=useState("");
  const groups=[
    {title:"Hematology",rows:[["Hemoglobin, male","13.5–17.5 g/dL"],["Hemoglobin, female","12.0–16.0 g/dL"],["WBC count","4,500–11,000/mm³"],["Platelets","150,000–400,000/mm³"],["MCV","80–100 fL"],["INR","0.8–1.2"]]},
    {title:"Chemistry",rows:[["Sodium","135–145 mEq/L"],["Potassium","3.5–5.0 mEq/L"],["Chloride","98–106 mEq/L"],["Bicarbonate","22–28 mEq/L"],["BUN","7–20 mg/dL"],["Creatinine","0.6–1.3 mg/dL"],["Glucose, fasting","70–100 mg/dL"],["Calcium, total","8.5–10.5 mg/dL"]]},
    {title:"Arterial blood gas",rows:[["pH","7.35–7.45"],["PaCO₂","35–45 mm Hg"],["PaO₂","80–100 mm Hg"],["HCO₃⁻","22–26 mEq/L"]]},
    {title:"Liver and endocrine",rows:[["AST","10–40 U/L"],["ALT","7–56 U/L"],["Alkaline phosphatase","44–147 U/L"],["Total bilirubin","0.1–1.2 mg/dL"],["TSH","0.4–4.0 mIU/L"],["Free T4","0.8–1.8 ng/dL"]]}
  ];
  const normalized=query.trim().toLowerCase();
  const filtered=groups.map(group=>({...group,rows:group.rows.filter(([label,value])=>!normalized||`${label} ${value} ${group.title}`.toLowerCase().includes(normalized))})).filter(group=>group.rows.length);
  return <div className="lab-values"><div className="lab-search"><Search aria-hidden="true"/><input aria-label="Search laboratory reference values" value={query} onChange={event=>setQuery(event.target.value)} placeholder="Search reference values…"/></div><div>{filtered.map(group=><section key={group.title}><h3>{group.title}</h3>{group.rows.map(([label,value])=><div key={label}><span>{label}</span><b>{value}</b></div>)}</section>)}{!filtered.length&&<p className="lab-empty">No reference values match “{query}”.</p>}</div><small>Condensed values for interface demonstration. Production exam reference tables should be licensed and clinically validated.</small></div>;
}
