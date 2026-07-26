"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft, ArrowRight, Bookmark, BrainCircuit, Calculator, Check, CheckCircle2, CircleAlert,
  Clock3, FileStack, Flag, FlaskConical, Highlighter, Layers3, List, LockKeyhole, MoreHorizontal, NotebookPen,
  Pause, Play, RotateCcw, Search, Settings2, ShieldCheck, Sparkles, TimerReset, X, XCircle
} from "lucide-react";
import { choicePeerDistribution, diagnoseReasoningTrap, selectQuestions } from "@/lib/algorithms";
import {
  SESSION_CONFIG_KEY,
  arrangeQuestionsForSession,
  buildSessionResults,
  clearSessionDraft,
  readSessionDraft,
  scoreSession,
  writeSessionDraft,
  type LocalSessionResult
} from "@/lib/session";
import { completeExamBlock, readExamDayRun, writeExamDayRun } from "@/lib/exam-day";
import { useStepwise } from "@/lib/store";
import type { Confidence, Question, SessionConfig } from "@/lib/types";
import { getUsmleExamProfile } from "@/lib/usmle";
import { Badge, Donut, Field, formatSeconds, Modal, Progress, Toast, Toggle, uid } from "./ui";
import { ReasoningTrace } from "./ReasoningTrace";

const fallbackConfig: SessionConfig = { step:"Step 2 CK",mode:"Adaptive",count:10,systems:[],disciplines:[],difficulties:[],include:"All",timePerQuestionSec:90 };

export function SessionPage() {
  const { state, dispatch, hydrated }=useStepwise();
  const router=useRouter();
  const [sessionId,setSessionId]=useState(()=>uid("session"));
  const [config,setConfig]=useState<SessionConfig>(fallbackConfig);
  const [questions,setQuestions]=useState<Question[]>([]);
  const [index,setIndex]=useState(0);
  const [selected,setSelected]=useState<Record<string,string>>({});
  const [confidence,setConfidence]=useState<Record<string,Confidence>>({});
  const [submitted,setSubmitted]=useState<string[]>([]);
  const [lockedSequential,setLockedSequential]=useState<string[]>([]);
  const [struck,setStruck]=useState<Record<string,string[]>>({});
  const [results,setResults]=useState<LocalSessionResult[]>([]);
  const [seconds,setSeconds]=useState(0);
  const [paused,setPaused]=useState(false);
  const [restored,setRestored]=useState(false);
  const [draftReady,setDraftReady]=useState(false);
  const [autosaveStatus,setAutosaveStatus]=useState<"saved"|"error">("saved");
  const [summary,setSummary]=useState(false);
  const [reviewIndex,setReviewIndex]=useState<number|null>(null);
  const [paletteOpen,setPaletteOpen]=useState(false);
  const [labOpen,setLabOpen]=useState(false);
  const [calculatorOpen,setCalculatorOpen]=useState(false);
  const [settingsOpen,setSettingsOpen]=useState(false);
  const [toolsOpen,setToolsOpen]=useState(false);
  const [calculator,setCalculator]=useState({left:"",operator:"+",right:""});
  const [stemHighlighted,setStemHighlighted]=useState(false);
  const [noteOpen,setNoteOpen]=useState(false);
  const [cardOpen,setCardOpen]=useState(false);
  const [exitOpen,setExitOpen]=useState(false);
  const [finishOpen,setFinishOpen]=useState(false);
  const [reportOpen,setReportOpen]=useState(false);
  const [reportReason,setReportReason]=useState<"Medical accuracy"|"Ambiguous wording"|"Typo"|"Outdated guideline">("Medical accuracy");
  const [reportDetail,setReportDetail]=useState("");
  const [toast,setToast]=useState("");
  const [noteBody,setNoteBody]=useState("");
  const [cardBack,setCardBack]=useState("");
  const initialized=useRef(false);
  const secondsRef=useRef(0);
  const wallClockStartRef=useRef(0);
  const pausedAtWallRef=useRef<number|null>(null);
  const pausedDurationRef=useRef(0);
  const activeQuestionTimingRef=useRef<{questionId:string;startedAt:number}>({questionId:"",startedAt:0});
  const elapsedByQuestionRef=useRef<Record<string,number>>({});

  useEffect(()=>{
    if(!hydrated)return;
    const initTimer=window.setTimeout(()=>{
      if(initialized.current)return;
      initialized.current=true;
      const draft=readSessionDraft(sessionStorage);
      let nextConfig=fallbackConfig;
      try{const raw=sessionStorage.getItem(SESSION_CONFIG_KEY);if(raw)nextConfig={...fallbackConfig,...JSON.parse(raw)}}catch{}
      const restoredQuestions=draft
        ? draft.questionIds.map((id)=>state.questions.find((item)=>item.id===id)).filter((item):item is Question=>Boolean(item))
        : [];
      if(draft&&restoredQuestions.length===draft.questionIds.length&&restoredQuestions.length){
        nextConfig={...fallbackConfig,...draft.config};
        const savedAtMs=Date.parse(draft.savedAt);
        const offlineSeconds=nextConfig.mode==="Exam"&&Number.isFinite(savedAtMs)
          ? Math.max(0,Math.floor((Date.now()-savedAtMs)/1000))
          : 0;
        const restoredElapsed=draft.elapsedSeconds+offlineSeconds;
        const restoredQuestionElapsed={...draft.elapsedByQuestion};
        const restoredQuestionId=restoredQuestions[Math.max(0,Math.min(restoredQuestions.length-1,draft.index))]?.id;
        if(restoredQuestionId&&offlineSeconds){
          restoredQuestionElapsed[restoredQuestionId]=(restoredQuestionElapsed[restoredQuestionId]||0)+offlineSeconds;
        }
        setSessionId(draft.sessionId);
        setConfig(nextConfig);
        setQuestions(restoredQuestions);
        setIndex(Math.max(0,Math.min(restoredQuestions.length-1,draft.index)));
        setSelected(draft.selected);
        setConfidence(draft.confidence);
        setSubmitted(draft.submitted);
        setLockedSequential(draft.lockedSequential ?? []);
        setStruck(draft.struck);
        setResults(draft.results);
        setSeconds(restoredElapsed);
        secondsRef.current=restoredElapsed;
        elapsedByQuestionRef.current=restoredQuestionElapsed;
        wallClockStartRef.current=Date.now()-restoredElapsed*1000;
        setRestored(true);
        if(!state.sessions.some((session)=>session.id===draft.sessionId)){
          dispatch({type:"ADD_SESSION",session:{id:draft.sessionId,createdAt:draft.savedAt,config:nextConfig,questionIds:draft.questionIds,currentIndex:draft.index}});
        }
      }else{
        if(draft)clearSessionDraft(sessionStorage);
        const chosen=arrangeQuestionsForSession(selectQuestions(state,nextConfig));
        const finalQuestions=chosen.length?chosen:arrangeQuestionsForSession(selectQuestions(state,{...fallbackConfig,step:nextConfig.step,include:"All"}));
        wallClockStartRef.current=Date.now();
        setConfig(nextConfig);setQuestions(finalQuestions);
        dispatch({type:"ADD_SESSION",session:{id:sessionId,createdAt:new Date().toISOString(),config:nextConfig,questionIds:finalQuestions.map(q=>q.id),currentIndex:0}});
      }
      setDraftReady(true);
    },0);
    return()=>window.clearTimeout(initTimer);
  },[dispatch,hydrated,sessionId,state]);

  useEffect(()=>{
    if(paused||summary||!questions.length)return;
    const updateElapsed=()=>setSeconds(Math.max(0,Math.floor((Date.now()-wallClockStartRef.current-pausedDurationRef.current)/1000)));
    updateElapsed();
    const timer=window.setInterval(updateElapsed,1000);
    return()=>window.clearInterval(timer);
  },[paused,summary,questions.length]);


  const question=questions[reviewIndex??index];
  const isReview=reviewIndex!==null;
  const answered=question?submitted.includes(question.id):false;
  const revealAnswer=answered&&config.mode==="Tutor";
  const chosenChoice=question?selected[question.id]:undefined;
  const sequenceLocked=question?lockedSequential.includes(question.id):false;
  const correctChoice=question?.correctChoiceId;
  const peerDistribution=useMemo(() => question ? choicePeerDistribution(question) : [], [question]);
  useEffect(()=>{secondsRef.current=seconds},[seconds]);
  useEffect(()=>{
    if(summary||!question?.id)return;
    const active=activeQuestionTimingRef.current;
    if(active.questionId&&active.questionId!==question.id){
      const elapsed=Math.max(0,secondsRef.current-active.startedAt);
      elapsedByQuestionRef.current[active.questionId]=(elapsedByQuestionRef.current[active.questionId]||0)+elapsed;
    }
    if(active.questionId!==question.id){
      activeQuestionTimingRef.current={questionId:question.id,startedAt:secondsRef.current};
    }
  },[question?.id,summary]);
  const getElapsedForQuestion=useCallback((questionId:string)=>{
    const active=activeQuestionTimingRef.current;
    return Math.max(
      1,
      (elapsedByQuestionRef.current[questionId]||0)
        +(active.questionId===questionId?Math.max(0,secondsRef.current-active.startedAt):0),
    );
  },[]);
  const snapshotElapsedByQuestion=useCallback(()=>{
    const snapshot={...elapsedByQuestionRef.current};
    const active=activeQuestionTimingRef.current;
    if(active.questionId){
      snapshot[active.questionId]=(snapshot[active.questionId]||0)+Math.max(0,secondsRef.current-active.startedAt);
    }
    return snapshot;
  },[]);
  const togglePause=useCallback(()=>{
    if(config.mode==="Exam")return;
    if(paused){
      if(pausedAtWallRef.current!==null){
        pausedDurationRef.current+=Date.now()-pausedAtWallRef.current;
        pausedAtWallRef.current=null;
      }
      setPaused(false);
    }else{
      pausedAtWallRef.current=Date.now();
      setPaused(true);
    }
  },[config.mode,paused]);
  const examProfile=getUsmleExamProfile(config.step,state.planSettings.examDate);
  const timeLimit=config.mode==="Exam"
    ? (config.examDay?questions.length*config.timePerQuestionSec:examProfile.blockMinutes*60)
    : questions.length*config.timePerQuestionSec;
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
  const persistResult=useCallback((result:LocalSessionResult)=>{
    setSubmitted(current=>current.includes(result.questionId)?current:[...current,result.questionId]);
    setResults(current=>current.some(item=>item.questionId===result.questionId)?current.map(item=>item.questionId===result.questionId?result:item):[...current,result]);
    dispatch({type:"UPSERT_ATTEMPT",attempt:{id:uid("attempt"),...result,createdAt:new Date().toISOString(),sessionId,mode:config.mode}});
  },[config.mode,dispatch,sessionId]);
  const selectChoice=useCallback((questionId:string,choiceId:string)=>{
    if(lockedSequential.includes(questionId))return;
    setSelected((current)=>({...current,[questionId]:choiceId}));
    if(config.mode==="Tutor")return;
    setSubmitted((current)=>current.includes(questionId)?current:[...current,questionId]);
    setResults((current)=>{
      const next:LocalSessionResult={
        questionId,
        selectedChoiceId:choiceId,
        correct:choiceId===questions.find((item)=>item.id===questionId)?.correctChoiceId,
        confidence:confidence[questionId]||3,
        timeSec:getElapsedForQuestion(questionId)
      };
      return current.some((item)=>item.questionId===questionId)
        ? current.map((item)=>item.questionId===questionId?next:item)
        : [...current,next];
    });
  },[confidence,config.mode,getElapsedForQuestion,lockedSequential,questions]);
  const finishSession=useCallback(()=>{
    const elapsed=snapshotElapsedByQuestion();
    const finalResults=buildSessionResults(questions,selected,confidence,elapsed);
    const score=scoreSession(questions.length,finalResults);
    setResults(finalResults);
    setSubmitted(finalResults.map((result)=>result.questionId));
    for(const result of finalResults){
      const alreadySaved=state.attempts.some((attempt)=>attempt.sessionId===sessionId&&attempt.questionId===result.questionId);
      if(!alreadySaved){
        dispatch({type:"UPSERT_ATTEMPT",attempt:{id:uid("attempt"),...result,createdAt:new Date().toISOString(),sessionId,mode:config.mode}});
      }
    }
    setSummary(true);
    setReviewIndex(null);
    clearSessionDraft(sessionStorage);
    dispatch({type:"UPDATE_SESSION",id:sessionId,patch:{
      completedAt:new Date().toISOString(),
      currentIndex:Math.max(0,questions.length-1),
      answeredCount:score.answered,
      unansweredCount:score.unanswered,
      accuracy:score.accuracy
    }});
    if(config.examRunId&&typeof config.examBlockIndex==="number"){
      const examRun=readExamDayRun(localStorage);
      if(examRun?.id===config.examRunId){
        writeExamDayRun(localStorage,completeExamBlock(examRun,config.examBlockIndex,secondsRef.current,score.answered,score.correct));
      }
    }
  },[confidence,config.examBlockIndex,config.examRunId,config.mode,dispatch,questions,selected,sessionId,snapshotElapsedByQuestion,state.attempts]);
  const goTo=useCallback((nextIndex:number)=>{
    const bounded=Math.max(0,Math.min(questions.length-1,nextIndex));
    if(lockedSequential.includes(questions[bounded]?.id)&&bounded!==index){
      setToast("Sequential responses cannot be reopened after submission");
      window.setTimeout(()=>setToast(""),1800);
      return;
    }
    setIndex(bounded);
    setStemHighlighted(false);
    dispatch({type:"UPDATE_SESSION",id:sessionId,patch:{currentIndex:bounded}});
  },[dispatch,index,lockedSequential,questions,sessionId]);
  const goNext=useCallback(()=>{
    if(index<questions.length-1)goTo(index+1);
    else finishSession();
  },[finishSession,goTo,index,questions.length]);
  const setConfidenceLevel=useCallback((questionId:string,level:Confidence)=>{
    setConfidence((current)=>({...current,[questionId]:level}));
    if(config.mode==="Tutor")return;
    setResults((current)=>current.map((result)=>result.questionId===questionId?{...result,confidence:level}:result));
  },[config.mode]);
  const submit=()=>{
    if(!question||isReview)return;
    const choice=selected[question.id];
    if(!choice){showToast("Choose an answer before submitting");return}
    if(config.mode==="Tutor"&&submitted.includes(question.id)){goNext();return}
    const level=confidence[question.id]||3;
    const result:LocalSessionResult={questionId:question.id,selectedChoiceId:choice,correct:choice===question.correctChoiceId,confidence:level,timeSec:getElapsedForQuestion(question.id)};
    if(question.sequentialSet?.locksAfterSubmit){
      setLockedSequential((current)=>current.includes(question.id)?current:[...current,question.id]);
    }
    if(config.mode==="Tutor"){
      persistResult(result);
      playFeedback(result.correct);
    }
    if(config.mode!=="Tutor"){
      if(index<questions.length-1)window.setTimeout(()=>goTo(index+1),180);
      else window.setTimeout(finishSession,180);
    }
  };

  useEffect(()=>{
    if(!draftReady||summary||!questions.length)return;
    const saved=writeSessionDraft(sessionStorage,{
      version:1,
      sessionId,
      config,
      questionIds:questions.map((item)=>item.id),
      index,
      selected,
      confidence,
      submitted,
      lockedSequential,
      struck,
      results,
      elapsedSeconds:seconds,
      elapsedByQuestion:snapshotElapsedByQuestion(),
      savedAt:new Date().toISOString()
    });
    const statusTimer=window.setTimeout(()=>setAutosaveStatus(saved?"saved":"error"),0);
    return()=>window.clearTimeout(statusTimer);
  },[confidence,config,draftReady,index,lockedSequential,questions,results,seconds,selected,sessionId,snapshotElapsedByQuestion,struck,submitted,summary]);

  useEffect(()=>{
    const listener=(event:KeyboardEvent)=>{
      if(summary||noteOpen||cardOpen||labOpen||calculatorOpen||settingsOpen||toolsOpen||exitOpen||finishOpen||reportOpen)return;
      const currentQuestion=questions[index];
      if(!currentQuestion)return;
      if(["1","2","3","4","5"].includes(event.key)){
        const choice=currentQuestion.choices[Number(event.key)-1];
        if(choice&&!(config.mode==="Tutor"&&submitted.includes(currentQuestion.id))&&!lockedSequential.includes(currentQuestion.id))selectChoice(currentQuestion.id,choice.id);
      }
      if(event.key==="ArrowUp"||event.key==="ArrowDown"){
        event.preventDefault();
        const currentChoiceIndex=Math.max(0,currentQuestion.choices.findIndex(choice=>choice.id===selected[currentQuestion.id]));
        const delta=event.key==="ArrowDown"?1:-1;
        const nextChoice=currentQuestion.choices[(currentChoiceIndex+delta+currentQuestion.choices.length)%currentQuestion.choices.length];
        if(nextChoice&&!(config.mode==="Tutor"&&submitted.includes(currentQuestion.id))&&!lockedSequential.includes(currentQuestion.id))selectChoice(currentQuestion.id,nextChoice.id);
      }
      if(event.key.toLowerCase()==="f")dispatch({type:"TOGGLE_FLAG",questionId:currentQuestion.id});
      if(event.key.toLowerCase()==="b")dispatch({type:"TOGGLE_BOOKMARK",questionId:currentQuestion.id});
      if(event.key==="ArrowRight"&&submitted.includes(currentQuestion.id))goNext();
    };
    window.addEventListener("keydown",listener);
    return()=>window.removeEventListener("keydown",listener);
  },[calculatorOpen,cardOpen,config.mode,dispatch,exitOpen,finishOpen,goNext,index,labOpen,lockedSequential,noteOpen,questions,reportOpen,selectChoice,selected,settingsOpen,submitted,summary,toolsOpen]);
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
    const timeout=window.setTimeout(finishSession,0);
    return()=>window.clearTimeout(timeout);
  },[config.mode,finishSession,paused,questions.length,remaining,summary]);

  if(!questions.length)return <div className="session-loading"><span><Sparkles/></span><h2>Building your block</h2><p>Ranking eligible questions by weakness, recency, and challenge fit…</p></div>;
  if(summary)return <SessionSummary questions={questions} results={results} seconds={seconds} blockSeconds={timeLimit} examDay={Boolean(config.examDay)} examBlockIndex={config.examBlockIndex} examBlockCount={config.examBlockCount} onReview={setReviewIndex} reviewIndex={reviewIndex} onBack={()=>setReviewIndex(null)} onRestart={()=>router.push(config.examDay?"/app/exam-day":"/app/qbank")}/>;

  return <div className="session-page">
    <header className="session-toolbar"><div><button className="session-exit" onClick={()=>setExitOpen(true)}><ArrowLeft/> Exit</button><div className="session-progress-title"><b>{config.step} · {config.mode}</b><span>Question {index+1} of {questions.length}</span></div><span className={`session-save-state ${autosaveStatus}`} role="status" aria-live="polite"><CheckCircle2/> {autosaveStatus==="saved"?"Block saved":"Save unavailable"}</span></div><div className="session-tools"><button onClick={()=>setPaletteOpen(!paletteOpen)} aria-label="Question navigator" aria-expanded={paletteOpen} aria-controls="question-palette"><List/><span>Navigator</span></button><button onClick={()=>setLabOpen(true)} aria-label="Laboratory values"><FlaskConical/><span>Lab values</span></button><button onClick={()=>setCalculatorOpen(true)} aria-label="Calculator"><Calculator/><span>Calculator</span></button><button onClick={()=>setSettingsOpen(true)} aria-label="Session settings"><Settings2/><span>Settings</span></button>{config.mode==="Exam"?<span className="exam-continuous" title="Exam-mode timing cannot be paused"><LockKeyhole/><b>Continuous</b></span>:<button onClick={togglePause} aria-label={paused?"Resume session":"Pause session"} aria-pressed={paused}>{paused?<Play/>:<Pause/>}<span>{paused?"Resume":"Pause"}</span></button>}{state.settings.showTimer&&<div className={remaining<180&&config.mode!=="Tutor"?"session-timer warning":"session-timer"} aria-label={`${config.mode==="Tutor"?formatSeconds(seconds):formatSeconds(remaining)} ${config.mode==="Tutor"?"elapsed":"remaining"}`}><Clock3/><b>{config.mode==="Tutor"?formatSeconds(seconds):formatSeconds(remaining)}</b><small>{config.mode==="Tutor"?"elapsed":"remaining"}</small></div>}</div></header>
    <div className="session-progress-bar" role="progressbar" aria-label="Block progress" aria-valuemin={0} aria-valuemax={questions.length} aria-valuenow={index+(answered?1:0)}><i style={{width:`${((index+(answered?1:0))/questions.length)*100}%`}}/></div>
    {restored&&<div className="session-restored" role="status"><RotateCcw/><span><b>Block restored</b> Your answers, eliminations, position, and elapsed time were recovered from this browser.</span><button type="button" onClick={()=>setRestored(false)} aria-label="Dismiss restored-session message"><X/></button></div>}
    {paletteOpen&&<div id="question-palette" className="question-palette" aria-label="Question navigator"><header><b>Question navigator</b><button onClick={()=>setPaletteOpen(false)} aria-label="Close question navigator"><X/></button></header><div>{questions.map((item,itemIndex)=>{const saved=submitted.includes(item.id);const status=saved?(config.mode==="Tutor"?(results.find(r=>r.questionId===item.id)?.correct?"correct":"incorrect"):"answered"):"";return <button key={item.id} className={`${itemIndex===index?"current":""} ${status} ${state.flagged.includes(item.id)?"flagged":""}`} onClick={()=>{goTo(itemIndex);setPaletteOpen(false)}} aria-label={`Question ${itemIndex+1}${saved?" answered":""}${state.flagged.includes(item.id)?" flagged":""}`} aria-current={itemIndex===index?"step":undefined}>{itemIndex+1}{state.flagged.includes(item.id)&&<i/>}</button>})}</div><footer><span><i className="answered"/> Answer saved</span><span><i className="current"/> Current</span><span><i className="flagged"/> Flagged</span><button type="button" onClick={()=>{setPaletteOpen(false);setFinishOpen(true)}}>Finish block</button></footer></div>}
    {paused&&<div className="paused-overlay" role="dialog" aria-modal="true" aria-labelledby="paused-title"><div><Pause/><h2 id="paused-title">Session paused</h2><p>Your timer is stopped and the question is hidden.</p><button className="btn btn-brand" onClick={togglePause}><Play/> Resume session</button></div></div>}
    <main className="question-workspace">
      <aside className="question-meta"><Badge tone="brand">{question.step}</Badge><dl><div><dt>System</dt><dd>{question.system}</dd></div><div><dt>Discipline</dt><dd>{question.discipline}</dd></div><div><dt>Difficulty</dt><dd><Badge tone={question.difficulty==="Hard"?"danger":question.difficulty==="Easy"?"success":"warning"}>{question.difficulty}</Badge></dd></div></dl><div className="session-utility"><button className={state.flagged.includes(question.id)?"active":""} onClick={()=>dispatch({type:"TOGGLE_FLAG",questionId:question.id})}><Flag/> {state.flagged.includes(question.id)?"Flagged":"Flag question"}<kbd>F</kbd></button><button className={state.bookmarks.includes(question.id)?"active":""} onClick={()=>dispatch({type:"TOGGLE_BOOKMARK",questionId:question.id})}><Bookmark/> {state.bookmarks.includes(question.id)?"Bookmarked":"Bookmark"}<kbd>B</kbd></button><button onClick={()=>setNoteOpen(true)}><NotebookPen/> Add note</button><button onClick={()=>setReportOpen(true)}><CircleAlert/> Report issue</button></div><div className="shortcut-card"><b>Keyboard shortcuts</b><span><kbd>1–5</kbd> choose answer</span><span><kbd>↑ ↓</kbd> move choice</span><span><kbd>F / B</kbd> flag / bookmark</span></div></aside>
      <section className="question-main">
        <div className="question-number"><span>{question.id}<small>{question.format}</small></span><div><button aria-label="Highlight question stem" aria-pressed={stemHighlighted} className={stemHighlighted?"active":""} onClick={()=>setStemHighlighted(!stemHighlighted)}><Highlighter/></button><button aria-label="Open session settings" onClick={()=>setSettingsOpen(true)}><Settings2/></button><button aria-label="Open session tools" onClick={()=>setToolsOpen(true)}><MoreHorizontal/></button></div></div>
        <h1 className={`question-stem ${stemHighlighted?"highlighted":""}`}>{question.stem}</h1>
        <QuestionStimulus question={question}/>
        <div className="choice-list-session">{question.choices.map((choice,choiceIndex)=>{
          const selectedNow=chosenChoice===choice.id;const isCorrect=revealAnswer&&choice.id===correctChoice;const isWrong=revealAnswer&&selectedNow&&!isCorrect;const eliminated=struck[question.id]?.includes(choice.id);
          const peer=peerDistribution.find((item)=>item.choiceId===choice.id)?.percent??0;
          return <div key={choice.id} className={`session-choice ${selectedNow?"selected":""} ${isCorrect?"correct":""} ${isWrong?"wrong":""} ${eliminated?"eliminated":""}`}>
            {revealAnswer&&<span className="peer-option-fill" style={{width:`${peer}%`}} aria-hidden="true"/>}
            <button className="choice-select" disabled={revealAnswer||sequenceLocked} onClick={()=>!revealAnswer&&!sequenceLocked&&selectChoice(question.id,choice.id)} aria-pressed={selectedNow} aria-label={`${String.fromCharCode(65+choiceIndex)}. ${choice.text}`}>
              <span>{String.fromCharCode(65+choiceIndex)}</span><p>{choice.text}</p>
              {revealAnswer&&<strong className="peer-option-percent">{peer}%</strong>}
              {isCorrect&&<CheckCircle2/>}{isWrong&&<XCircle/>}
            </button>
            <button className="strike-button" disabled={revealAnswer||sequenceLocked} onClick={()=>setStruck(current=>({...current,[question.id]:(current[question.id]||[]).includes(choice.id)?(current[question.id]||[]).filter(id=>id!==choice.id):[...(current[question.id]||[]),choice.id]}))} aria-label={`${eliminated?"Restore":"Strike out"} choice ${String.fromCharCode(65+choiceIndex)}`} aria-pressed={eliminated}><span/></button>
          </div>})}</div>
        {revealAnswer&&<p className="distribution-note">Response percentages are simulated sample data for this demonstration.</p>}
        {!revealAnswer&&<div className="confidence-select"><span>How confident are you?</span><div>{([1,2,3,4,5] as Confidence[]).map(level=><button key={level} className={confidence[question.id]===level?"active":""} aria-pressed={confidence[question.id]===level} onClick={()=>setConfidenceLevel(question.id,level)}><b>{level}</b><small>{["Guess","Low","Medium","High","Certain"][level-1]}</small></button>)}</div></div>}
        {answered&&config.mode==="Tutor"&&<Explanation question={question} selectedChoiceId={chosenChoice} onCard={()=>{setCardBack(question.explanation);setCardOpen(true)}} onNote={()=>setNoteOpen(true)}/>} 
        <footer className="question-footer"><button className="btn btn-ghost" disabled={index===0} onClick={()=>goTo(index-1)}><ArrowLeft/> Previous</button><div><span role="status" aria-live="polite">{revealAnswer?"Explanation unlocked":answered?"Answer saved · changes remain open until block end":"Select one best answer"}</span><button className="btn btn-brand btn-lg" onClick={submit}>{config.mode==="Tutor"?(answered?(index===questions.length-1?"Finish block":"Next question"):"Submit answer"):(index===questions.length-1?"Save & finish":"Save & next")}<ArrowRight/></button></div></footer>
      </section>
    </main>
    <Modal open={toolsOpen} onClose={()=>setToolsOpen(false)} title="Session tools" description="Open testing utilities without leaving the current question."><div className="session-tool-menu"><button onClick={()=>{setToolsOpen(false);setPaletteOpen(true)}}><List/><span><b>Question navigator</b><small>Review answered, unanswered, and flagged items.</small></span><ArrowRight/></button><button onClick={()=>{setToolsOpen(false);setLabOpen(true)}}><FlaskConical/><span><b>Laboratory values</b><small>Search common clinical reference ranges.</small></span><ArrowRight/></button><button onClick={()=>{setToolsOpen(false);setCalculatorOpen(true)}}><Calculator/><span><b>Calculator</b><small>Use four-operation scratch calculations.</small></span><ArrowRight/></button><button onClick={()=>{setToolsOpen(false);setSettingsOpen(true)}}><Settings2/><span><b>Display settings</b><small>Adjust timer, contrast, type size, and motion.</small></span><ArrowRight/></button></div></Modal>
    <Modal open={labOpen} onClose={()=>setLabOpen(false)} title="Common laboratory reference values" wide><LabValues/></Modal>
    <Modal open={calculatorOpen} onClose={()=>setCalculatorOpen(false)} title="Quick calculator" description="A simple four-operation calculator for session scratch work."><div className="calculator-grid"><input inputMode="decimal" aria-label="First number" value={calculator.left} onChange={e=>setCalculator({...calculator,left:e.target.value})} placeholder="0"/><select aria-label="Operation" value={calculator.operator} onChange={e=>setCalculator({...calculator,operator:e.target.value})}><option>+</option><option>-</option><option>×</option><option>÷</option></select><input inputMode="decimal" aria-label="Second number" value={calculator.right} onChange={e=>setCalculator({...calculator,right:e.target.value})} placeholder="0"/><strong aria-live="polite">= {calculatorResult}</strong></div><div className="modal-actions"><button className="btn btn-secondary" onClick={()=>setCalculator({left:"",operator:"+",right:""})}><RotateCcw/> Clear</button><button className="btn btn-brand" onClick={()=>setCalculatorOpen(false)}>Done</button></div></Modal>
    <Modal open={settingsOpen} onClose={()=>setSettingsOpen(false)} title="Session display settings" description="Adjust the testing workspace without leaving the current block."><div className="session-settings"><Toggle checked={state.settings.showTimer} onChange={checked=>dispatch({type:"SET_SETTINGS",settings:{showTimer:checked}})} label="Show block timer" detail="Keep remaining time visible in the testing toolbar."/><Toggle checked={state.settings.highContrast} onChange={checked=>dispatch({type:"SET_SETTINGS",settings:{highContrast:checked}})} label="High-contrast controls" detail="Increase boundaries and selected-state visibility."/><Toggle checked={state.settings.largeText} onChange={checked=>dispatch({type:"SET_SETTINGS",settings:{largeText:checked}})} label="Larger reading text" detail="Increase the clinical stem and primary interface text."/><Toggle checked={state.settings.reducedMotion} onChange={checked=>dispatch({type:"SET_SETTINGS",settings:{reducedMotion:checked}})} label="Reduce motion" detail="Remove nonessential transitions and animated feedback."/></div><div className="modal-actions"><button className="btn btn-brand" onClick={()=>setSettingsOpen(false)}>Apply settings</button></div></Modal>
    <Modal open={noteOpen} onClose={()=>setNoteOpen(false)} title="Add a question note" description={`${question.id} · ${question.system}`}><Field label="Note"><textarea rows={7} value={noteBody} onChange={e=>setNoteBody(e.target.value)} placeholder="Capture the distinction, rule, or reasoning step you want to remember…"/></Field><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setNoteOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={saveNote}><NotebookPen/> Save note</button></div></Modal>
    <Modal open={cardOpen} onClose={()=>setCardOpen(false)} title="Create a flashcard" description="The learning objective becomes the prompt."><Field label="Front"><textarea rows={3} readOnly value={question.objective}/></Field><Field label="Back"><textarea rows={6} value={cardBack} onChange={e=>setCardBack(e.target.value)}/></Field><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setCardOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={saveCard}><Layers3/> Add flashcard</button></div></Modal>
    <Modal open={reportOpen} onClose={()=>setReportOpen(false)} title="Report a content issue" description={`${question.id} · Reports appear in the admin review queue.`}><Field label="Issue type"><select value={reportReason} onChange={event=>setReportReason(event.target.value as typeof reportReason)}><option>Medical accuracy</option><option>Ambiguous wording</option><option>Typo</option><option>Outdated guideline</option></select></Field><Field label="What should the content team review?"><textarea rows={6} value={reportDetail} onChange={event=>setReportDetail(event.target.value)} placeholder="Describe the specific statement, option, or explanation concern…"/></Field><div className="modal-actions"><button className="btn btn-ghost" onClick={()=>setReportOpen(false)}>Cancel</button><button className="btn btn-brand" onClick={submitReport}>Submit report</button></div></Modal>
    <Modal open={finishOpen} onClose={()=>setFinishOpen(false)} title="Finish this block now?" description={`${Math.max(0,questions.length-new Set(Object.keys(selected)).size)} unanswered item${Math.max(0,questions.length-new Set(Object.keys(selected)).size)===1?"":"s"} will count in the total-item score. You can review every item after completion.`}><div className="exit-modal-actions"><button className="btn btn-secondary" onClick={()=>setFinishOpen(false)}>Return to block</button><button className="btn btn-brand" onClick={()=>{setFinishOpen(false);finishSession()}}><Check/> Finish & score</button></div></Modal>
    <Modal open={exitOpen} onClose={()=>setExitOpen(false)} title={config.examDay?"Return to the command deck?":"Discard this active block?"} description={config.examDay?"The active block remains recoverable in this browser. Its wall-clock exam timer continues while you are away.":"Your block is recoverable while you stay in it or refresh. Exiting now discards the active draft; completed attempts remain in your history."}><div className="exit-modal-actions"><button className="btn btn-secondary" onClick={()=>setExitOpen(false)}>Keep studying</button><Link className={config.examDay?"btn btn-brand":"btn btn-danger"} href={config.examDay?"/app/exam-day":"/app/qbank"} onClick={()=>{if(!config.examDay)clearSessionDraft(sessionStorage)}}>{config.examDay?"Save & return":"Discard & exit"}</Link></div></Modal>
    <Toast message={toast} visible={Boolean(toast)}/>
  </div>;
}

function QuestionStimulus({question}:{question:Question}) {
  if(question.format==="Chart / tabular"&&question.patientChart?.length){
    return <section className="question-stimulus chart" aria-label="Patient chart">
      <header><FileStack/><div><b>Patient chart</b><small>Review the structured clinical record before answering.</small></div></header>
      <div>{question.patientChart.map((section)=><table key={section.title}><caption>{section.title}</caption><tbody>{section.rows.map((row)=><tr key={`${section.title}-${row.label}`}><th scope="row">{row.label}</th><td className={row.flag ?? ""}>{row.value}</td></tr>)}</tbody></table>)}</div>
    </section>;
  }
  if(question.format==="Scientific abstract"&&question.scientificAbstract){
    const abstract=question.scientificAbstract;
    return <article className="question-stimulus abstract"><header><FileStack/><div><b>{abstract.title}</b><small>Scientific abstract</small></div></header><dl><div><dt>Background</dt><dd>{abstract.background}</dd></div><div><dt>Methods</dt><dd>{abstract.methods}</dd></div><div><dt>Results</dt><dd>{abstract.results}</dd></div>{abstract.conclusion&&<div><dt>Conclusion</dt><dd>{abstract.conclusion}</dd></div>}</dl></article>;
  }
  if(question.format==="Audio / video"&&(question.media?.audioUrl||question.media?.videoUrl)){
    return <section className="question-stimulus media" aria-label="Clinical media">
      <header><Play/><div><b>Clinical media</b><small>Use the playback controls as part of the item evidence.</small></div></header>
      {question.media.videoUrl?<video controls preload="metadata" src={question.media.videoUrl}/>:<audio controls preload="metadata" src={question.media.audioUrl}/>}
      {question.media.transcript&&<details><summary>Accessible transcript</summary><p>{question.media.transcript}</p></details>}
    </section>;
  }
  if(question.format==="Sequential set"&&question.sequentialSet){
    return <div className="question-stimulus sequential"><LockKeyhole/><span><b>Sequential item {question.sequentialSet.order} of {question.sequentialSet.total}</b><small>Earlier responses lock after submission to preserve the clinical sequence.</small></span></div>;
  }
  return null;
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

function SessionSummary({questions,results,seconds,blockSeconds,examDay,examBlockIndex,examBlockCount,onReview,reviewIndex,onBack,onRestart}:{questions:Question[];results:LocalSessionResult[];seconds:number;blockSeconds:number;examDay:boolean;examBlockIndex?:number;examBlockCount?:number;onReview:(index:number)=>void;reviewIndex:number|null;onBack:()=>void;onRestart:()=>void}) {
  const { state } = useStepwise();
  const [filter,setFilter]=useState<"All"|"Incorrect"|"Correct"|"Unanswered">("All");
  if(examDay){
    const score=scoreSession(questions.length,results);
    const earned=Math.max(0,blockSeconds-seconds);
    return <main className="session-summary exam-block-closed">
      <header><div><span className="summary-check"><LockKeyhole/></span><div><Badge tone="success">Block {(examBlockIndex??0)+1} of {examBlockCount} closed</Badge><h1>Responses locked. Break time is running.</h1><p>This block is no longer available for review or answer changes. Any unused block time has been credited to the reserve.</p></div></div></header>
      <section className="panel block-closure-panel"><div><ShieldCheck/><span><small>BLOCK STATE</small><b>Permanently closed</b></span></div><div><FileStack/><span><small>ITEMS RECORDED</small><b>{score.answered} of {score.total}</b></span></div><div><TimerReset/><span><small>TIME CREDIT</small><b>+{formatSeconds(earned)}</b></span></div></section>
      <div className="exam-closure-note"><CircleAlert/><p>Performance and explanations stay concealed during the run to preserve testing-day behavior. The completed-run debrief unlocks after the final block.</p></div>
      <footer className="summary-footer"><span/><button className="btn btn-brand btn-lg" onClick={onRestart}>Open command deck <ArrowRight/></button></footer>
    </main>;
  }
  if(reviewIndex!==null){
    const question=questions[reviewIndex];
    const result=results.find(item=>item.questionId===question.id);
    return <div className="session-review-page"><header><button onClick={onBack}><ArrowLeft/> Back to summary</button><span>Reviewing {reviewIndex+1} of {questions.length}</span></header><main><div className="review-question-head"><Badge tone={!result?"neutral":result.correct?"success":"danger"}>{!result?"Unanswered":result.correct?"Correct":"Incorrect"}</Badge><span>{question.id} · {question.system}</span></div><h1>{question.stem}</h1><div className="choice-list-session review">{question.choices.map((choice,index)=>{const peer=choicePeerDistribution(question).find((item)=>item.choiceId===choice.id)?.percent??0;return <div key={choice.id} className={`session-choice ${choice.id===question.correctChoiceId?"correct":choice.id===result?.selectedChoiceId?"wrong":""}`}><span className="peer-option-fill" style={{width:`${peer}%`}} aria-hidden="true"/><div className="choice-select"><span>{String.fromCharCode(65+index)}</span><p>{choice.text}</p><strong className="peer-option-percent">{peer}%</strong>{choice.id===question.correctChoiceId&&<CheckCircle2/>}{choice.id===result?.selectedChoiceId&&choice.id!==question.correctChoiceId&&<XCircle/>}</div></div>})}</div><Explanation question={question} selectedChoiceId={result?.selectedChoiceId}/></main></div>;
  }
  const score=scoreSession(questions.length,results);
  const correct=score.correct;
  const accuracy=score.accuracy;
  const avg=results.length?Math.round(results.reduce((sum,result)=>sum+result.timeSec,0)/results.length):0;
  const confidentMisses=results.filter(result=>!result.correct&&result.confidence>=4).length;
  const bookmarks=questions.filter(question=>state.bookmarks.includes(question.id)).length;
  const visibleQuestions=questions.map((question,index)=>({question,index,result:results.find(item=>item.questionId===question.id)})).filter((item)=>{
    if(filter==="All")return true;
    if(filter==="Correct")return item.result?.correct;
    if(filter==="Unanswered")return !item.result;
    return Boolean(item.result&&!item.result.correct);
  });
  return <main className="session-summary">
    <header><div><span className="summary-check"><Check/></span><div><Badge tone="success">{examDay?`Exam block ${(examBlockIndex??0)+1} of ${examBlockCount} closed`:"Block complete"}</Badge><h1>{examDay?"Block locked. Reset before the next one.":"Strong work. Now consolidate it."}</h1><p>{examDay?"Unused block time has been credited to your break reserve. This block can no longer be changed.":"Your answers are saved and your adaptive profile has been updated."}</p></div></div><Link className="btn btn-secondary" href={examDay?"/app/exam-day":"/app"}>{examDay?"Return to command deck":"Return to dashboard"}</Link></header>
    <section className="summary-score panel"><div className="summary-score-main"><Donut value={accuracy} size={180} detail="block score"/><div><span>Performance</span><h2>{accuracy>=80?"Excellent control":accuracy>=65?"Building momentum":"Useful diagnostic block"}</h2><p>{correct} correct of {score.total} total items · {score.answered} answered · {score.unanswered} unanswered.</p><Badge tone={accuracy>=70?"success":"warning"}>{accuracy>=70?"Strong block performance":"Review recommended"}</Badge></div></div><div className="summary-metrics"><div><Clock3/><span><b>{formatSeconds(seconds)}</b><small>Total time</small></span></div><div><TimerReset/><span><b>{formatSeconds(avg)}</b><small>Answered-item pace</small></span></div><div><Flag/><span><b>{confidentMisses}</b><small>Confident misses</small></span></div><div><Bookmark/><span><b>{bookmarks}</b><small>Bookmarked</small></span></div></div></section>
    <section className="summary-grid">
      <article className="panel summary-review"><header><div><h2>Question review</h2><p>Open any item to inspect the explanation and sample response distribution.</p></div><select aria-label="Filter question review" value={filter} onChange={event=>setFilter(event.target.value as typeof filter)}><option>All</option><option>Incorrect</option><option>Correct</option><option>Unanswered</option></select></header><div>{visibleQuestions.map(({question,index,result})=><button key={question.id} onClick={()=>onReview(index)}><span className={!result?"unanswered":result.correct?"correct":"incorrect"}>{!result?<CircleAlert/>:result.correct?<Check/>:<X/>}</span><div><b>Question {index+1}</b><p>{question.system} · {question.topic}</p></div><span>{result?formatSeconds(result.timeSec):"Unanswered"}</span><ArrowRight/></button>)}{!visibleQuestions.length&&<p className="summary-empty">No questions match this filter.</p>}</div></article>
      <aside><article className="panel next-step-card"><div className="insight-icon"><Sparkles/></div><Badge tone="brand">Recommended next</Badge><h2>Review {Math.max(0,results.length-correct)} missed concepts</h2><p>{results.length-correct?"Spend 12–18 minutes on explanation recall before starting another block.":"Use the strongest item to create a recall card and maintain the concept."}</p><button className="btn btn-brand btn-block" onClick={()=>{const firstWrong=results.findIndex(result=>!result.correct);onReview(firstWrong>=0?firstWrong:0)}} disabled={!questions.length}>Begin review <ArrowRight/></button></article><article className="panel"><h3>Block signals</h3><div className="signal-list"><div><span>Knowledge</span><Progress value={accuracy}/><b>{accuracy}%</b></div><div><span>Calibration</span><Progress value={Math.max(40,100-confidentMisses*15)}/><b>{Math.max(40,100-confidentMisses*15)}%</b></div><div><span>Pacing</span><Progress value={Math.min(100,Math.round(90/Math.max(avg,1)*100))}/><b>{avg<=90?"On target":"Slow"}</b></div></div></article></aside>
    </section>
    <footer className="summary-footer"><button className="btn btn-secondary" onClick={onRestart}>{examDay?<TimerReset/>:<RotateCcw/>} {examDay?"Continue exam day":"Build another block"}</button><Link className="btn btn-brand" href="/app/analytics">View analytics <ArrowRight/></Link></footer>
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
