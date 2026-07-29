import type { Step } from "./types";

export interface UsmleExamProfile {
  step: Step;
  examDate: string;
  modernSoftware: boolean;
  transitionDate: string;
  blocksPerExam: number;
  blockMinutes: number;
  maxItemsPerBlock: number;
  maxItemsPerExam: number;
  examDayHours: number;
  breakMinutes: number;
  tutorialMinutes: number;
  label: string;
}

const TRANSITION_DATES: Record<Step, string> = {
  "Step 1": "2026-05-14",
  "Step 2 CK": "2026-05-07"
};

export function getUsmleExamProfile(step: Step, examDate: string): UsmleExamProfile {
  const transitionDate = TRANSITION_DATES[step];
  const modernSoftware = examDate >= transitionDate;
  const stepOne = step === "Step 1";

  return {
    step,
    examDate,
    modernSoftware,
    transitionDate,
    blocksPerExam: modernSoftware ? (stepOne ? 14 : 16) : (stepOne ? 7 : 8),
    blockMinutes: modernSoftware ? 30 : 60,
    maxItemsPerBlock: modernSoftware ? 20 : 40,
    maxItemsPerExam: stepOne ? 280 : 318,
    examDayHours: stepOne ? 8 : 9,
    breakMinutes: modernSoftware ? 55 : 45,
    tutorialMinutes: modernSoftware ? 5 : 15,
    label: modernSoftware ? "2026 testing software" : "Legacy testing software"
  };
}
