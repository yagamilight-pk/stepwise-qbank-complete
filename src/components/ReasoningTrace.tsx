"use client";

import { Check, CircleDot, RotateCcw } from "lucide-react";
import { useId } from "react";

export interface ReasoningTraceStep {
  phase: string;
  title: string;
  detail: string;
  state?: "complete" | "current" | "next";
}

export function ReasoningTrace({
  steps,
  title = "Follow the reasoning",
  description = "See how the clinical cue becomes a decision and a durable correction.",
  compact = false,
  sample = false
}: {
  steps: ReasoningTraceStep[];
  title?: string;
  description?: string;
  compact?: boolean;
  sample?: boolean;
}) {
  const titleId = useId();
  return (
    <section className={`reasoning-trace ${compact ? "reasoning-trace-compact" : ""}`} aria-labelledby={titleId}>
      <header>
        <div>
          <span className="reasoning-trace-kicker">
            <CircleDot aria-hidden="true"/>
            {sample ? "Sample reasoning trace" : "Reasoning trace"}
          </span>
          <h3 id={titleId}>{title}</h3>
          <p>{description}</p>
        </div>
        {sample ? <span className="reasoning-trace-sample">Example data</span> : null}
      </header>
      <ol>
        {steps.map((step, index) => (
          <li
            key={`${step.phase}-${index}`}
            className={`trace-${step.state ?? (index === steps.length - 1 ? "next" : "complete")}`}
            aria-current={step.state === "current" ? "step" : undefined}
          >
            <span className="trace-index" aria-hidden="true">
              {step.state === "next" ? <RotateCcw/> : step.state === "complete" ? <Check/> : <CircleDot/>}
            </span>
            <div>
              <span>{step.phase}</span>
              <strong>{step.title}</strong>
              <p>{step.detail}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}
