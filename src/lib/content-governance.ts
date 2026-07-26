import type { Question, QuestionStatus } from "./types";

export type GovernanceSeverity = "error" | "warning";

export interface GovernanceIssue {
  code: string;
  label: string;
  severity: GovernanceSeverity;
}

export interface GovernanceResult {
  issues: GovernanceIssue[];
  errors: GovernanceIssue[];
  warnings: GovernanceIssue[];
  completeness: number;
  canPublish: boolean;
  productionReady: boolean;
}

function hasText(value: string | undefined, minimum = 1) {
  return Boolean(value?.trim() && value.trim().length >= minimum);
}

export function validateQuestionGovernance(
  question: Question,
  targetStatus: QuestionStatus = question.status
): GovernanceResult {
  const issues: GovernanceIssue[] = [];
  const error = (code: string, label: string) => issues.push({ code, label, severity: "error" });
  const warn = (code: string, label: string) => issues.push({ code, label, severity: "warning" });

  if (!hasText(question.stem, 40)) error("stem", "Add a complete clinical vignette or item stem.");
  if (question.choices.length < 4) error("choices", "Provide at least four answer choices.");
  if (question.choices.some((choice) => !hasText(choice.text))) error("choice-text", "Complete every answer choice.");
  if (new Set(question.choices.map((choice) => choice.text.trim().toLowerCase())).size !== question.choices.length) {
    error("choice-duplicates", "Remove duplicate answer choices.");
  }
  if (!question.choices.some((choice) => choice.id === question.correctChoiceId)) {
    error("correct-answer", "Select exactly one valid best answer.");
  }
  if (!hasText(question.explanation, 60)) error("explanation", "Add a substantive best-answer explanation.");
  if (!hasText(question.objective, 20)) error("objective", "Add a focused educational objective.");
  if (!hasText(question.system) || !hasText(question.discipline) || !hasText(question.topic)) {
    error("taxonomy", "Complete the system, discipline, and topic taxonomy.");
  }

  const missingDistractors = question.choices.filter(
    (choice) => choice.id !== question.correctChoiceId && !hasText(question.wrongChoiceNotes[choice.id], 12)
  );
  if (missingDistractors.length) {
    warn("distractors", `Add rationale for ${missingDistractors.length} distractor${missingDistractors.length === 1 ? "" : "s"}.`);
  }
  if (!question.physicianTask) warn("physician-task", "Map the item to a physician task.");
  if (!question.competencies?.length) warn("competencies", "Add at least one competency.");

  if (question.format === "Chart / tabular" && !question.patientChart?.length) {
    error("chart", "Add patient-chart data for this item format.");
  }
  if (question.format === "Scientific abstract" && !question.scientificAbstract) {
    error("abstract", "Add the scientific abstract sections.");
  }
  if (question.format === "Sequential set" && !question.sequentialSet) {
    error("sequential", "Configure the sequential item set.");
  }
  if (question.format === "Audio / video" && !question.media?.audioUrl && !question.media?.videoUrl) {
    error("media", "Attach audio or video for this item format.");
  }
  if ((question.media?.questionImages?.length || question.media?.explanationImages?.length)
      && !question.media?.altText?.length) {
    warn("media-alt", "Add accessible alternative text for clinical media.");
  }

  if (question.contentUse === "Production") {
    if (!question.references?.length) error("references", "Add at least one current evidence reference.");
    if (!question.sourceLabel) error("source-label", "Record the item source and provenance.");
    if (!question.governance || question.governance.rightsStatus === "Pending verification") {
      error("rights", "Verify original or licensed content rights.");
    }
    if (!question.governance?.medicalReviewer || !question.governance.medicalReviewedAt) {
      error("medical-review", "Record the medical reviewer and review date.");
    }
    if (targetStatus === "Published" && (!question.governance?.approvedBy || !question.governance.approvedAt)) {
      error("approval", "Record final editorial approval before publishing.");
    }
  } else {
    warn("demo-boundary", "Demo content is not cleared for production learner delivery.");
  }

  const errors = issues.filter((issue) => issue.severity === "error");
  const warnings = issues.filter((issue) => issue.severity === "warning");
  const checks = 12;
  const completeness = Math.max(0, Math.round(((checks - Math.min(checks, errors.length + warnings.length * 0.35)) / checks) * 100));
  const canPublish = targetStatus !== "Published" || errors.length === 0;
  const productionReady = question.contentUse === "Production" && errors.length === 0;

  return { issues, errors, warnings, completeness, canPublish, productionReady };
}
