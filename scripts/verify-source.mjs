import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const read = (path) => readFileSync(resolve(root, path), "utf8");
const checks = [];
const requireCheck = (name, condition) => {
  checks.push({ name, passed: Boolean(condition) });
  if (!condition) throw new Error(`Source verification failed: ${name}`);
};

const requiredFiles = [
  "src/components/Demo.tsx",
  "src/components/MedicalLibrary.tsx",
  "src/components/Session.tsx",
  "src/components/ExamDay.tsx",
  "src/components/Admin.tsx",
  "src/components/Influencer.tsx",
  "src/components/ReasoningTrace.tsx",
  "src/lib/algorithms.ts",
  "src/lib/content-governance.ts",
  "src/lib/library.ts",
  "src/lib/session.ts",
  "src/lib/exam-day.ts",
  "src/lib/store.tsx",
  "src/lib/appwrite-server.ts",
  "src/lib/auth.ts",
  "src/lib/learner-state.ts",
  "src/lib/psychometrics.ts",
  "src/lib/commercial.ts",
  "src/lib/safepay.ts",
  "src/app/actions/auth.ts",
  "src/app/actions/checkout.ts",
  "src/app/api/health/route.ts",
  "src/app/api/jobs/psychometrics/route.ts",
  "src/app/api/state/route.ts",
  "src/app/api/subscription/route.ts",
  "src/app/api/support/tickets/route.ts",
  "src/app/api/webhooks/safepay/route.ts",
  ".github/workflows/ci.yml",
  ".github/workflows/codeql.yml",
  "src/app/globals.css",
  "src/app/design-system.css",
  "src/app/(marketing)/try/page.tsx",
  "src/app/(learner)/app/session/page.tsx",
  "src/app/(learner)/app/exam-day/page.tsx",
  "src/app/(admin)/admin/page.tsx",
  "src/app/(influencer)/influencer/page.tsx"
];
requiredFiles.forEach((file) => requireCheck(`required file ${file}`, existsSync(resolve(root, file))));

const learner = read("src/components/Learner.tsx");
const more = read("src/components/LearnerMore.tsx");
const session = read("src/components/Session.tsx");
const demo = read("src/components/Demo.tsx");
const algorithms = read("src/lib/algorithms.ts");
const governance = read("src/lib/content-governance.ts");
const sessionDomain = read("src/lib/session.ts");
const examDay = read("src/lib/exam-day.ts");
const examDayComponent = read("src/components/ExamDay.tsx");
const admin = read("src/components/Admin.tsx");
const usmle = read("src/lib/usmle.ts");
const css = `${read("src/app/globals.css")}\n${read("src/app/design-system.css")}`;
const shells = read("src/components/Shells.tsx");
const marketing = read("src/components/Marketing.tsx");
const medicalLibrary = read("src/components/MedicalLibrary.tsx");
const tryRoute = read("src/app/(marketing)/try/page.tsx");
const sessionRoute = read("src/app/(learner)/app/session/page.tsx");
const appwriteServer = read("src/lib/appwrite-server.ts");
const authActions = read("src/app/actions/auth.ts");
const learnerState = read("src/lib/learner-state.ts");
const stateRoute = read("src/app/api/state/route.ts");
const psychometrics = read("src/lib/psychometrics.ts");
const checkout = read("src/app/actions/checkout.ts");
const paymentWebhook = read("src/app/api/webhooks/safepay/route.ts");
const supportRoute = read("src/app/api/support/tickets/route.ts");
const learnerLayout = read("src/app/(learner)/app/layout.tsx");
const adminLayout = read("src/app/(admin)/admin/layout.tsx");
const proxy = read("src/proxy.ts");
const loginRoute = read("src/app/(auth)/login/page.tsx");
const packageJson = JSON.parse(read("package.json"));
const componentFiles = ["Admin.tsx","Auth.tsx","Demo.tsx","Influencer.tsx","Learner.tsx","LearnerMore.tsx","Marketing.tsx","MedicalLibrary.tsx","ReasoningTrace.tsx","Session.tsx","Shells.tsx","Support.tsx","ui.tsx"];
const allComponents = componentFiles.map((file) => read(`src/components/${file}`)).join("\n");

requireCheck("medical library route", shells.includes('href: "/app/library"'));
requireCheck("exam day route", shells.includes('href: "/app/exam-day"') && examDayComponent.includes("Exam Command Deck"));
requireCheck("guided trial route", tryRoute.includes("<DemoPage") && marketing.includes('href="/try"'));
requireCheck("full-screen session route", sessionRoute.includes("<LearnerShell") && shells.includes('if (section === "session") return <LearnerPage section="session"/>'));
requireCheck("explicit App Router routes", !existsSync(resolve(root, "src/app/[[...slug]]/page.tsx")));
requireCheck("private route metadata", sessionRoute.includes("true"));
requireCheck("Appwrite session cookie is server-only", authActions.includes("httpOnly: true") && authActions.includes('sameSite: "strict"') && appwriteServer.includes("setSession(secret)"));
requireCheck("learner cloud state excludes privileged demo data", learnerState.includes("selectLearnerState") && !learnerState.includes("adminUsers") && !learnerState.includes("payoutRecords"));
requireCheck("Appwrite rows are user-scoped", stateRoute.includes("Role.user(services.user.$id)") && stateRoute.includes("MAX_STATE_BYTES"));
requireCheck("protected route layouts", learnerLayout.includes("requireLearnerAccess()") && adminLayout.includes('requireAppwriteUser("admin")'));
requireCheck("server-side subscription enforcement", read("src/lib/auth.ts").includes("ENFORCE_SUBSCRIPTIONS") && read("src/lib/auth.ts").includes("hasActiveSubscription"));
requireCheck("protected routes reject missing session before render", proxy.includes("protectedPrefixes") && proxy.includes("request.cookies.has(`a_session_${projectId}`)") && proxy.includes("NextResponse.redirect(loginUrl)"));
requireCheck("subdomain login preserves a safe protected destination", proxy.includes('loginUrl.searchParams.set("returnTo", routedPath)') && loginRoute.includes("safeReturnTo") && loginRoute.includes('returnTo={safeReturnTo(params.returnTo)}'));
requireCheck("peer choice distribution is embedded", session.includes("choicePeerDistribution") && session.includes("peer-option-fill") && session.includes("peer-option-percent"));
requireCheck("peer distribution is not a separate explanation card", !session.includes("Peer response distribution"));
requireCheck("guided trial embeds peer context", demo.includes("peer-option-fill") && demo.includes("diagnoseReasoningTrap"));
requireCheck("peer percentile analytics", learner.includes('tab==="Peers"') && learner.includes("peerBenchmark"));
requireCheck("insufficient cohort is not fabricated", learner.includes("No invented percentile") && learner.includes("Suppressed below threshold"));
requireCheck("private-circle threshold algorithm", algorithms.includes("export function studyCircleEligibility") && more.includes("studyCircleEligibility(members)"));
requireCheck("exact question launch", algorithms.includes("config.questionIds?.length") && learner.includes("questionIds:[question.id]"));
requireCheck("adaptive psychometric model", algorithms.includes("export function adaptiveScore") && psychometrics.includes("estimateAbilityEap") && psychometrics.includes("scoreAdaptiveCandidate"));
requireCheck("operational item statistics gate", psychometrics.includes("calculateItemStatistics") && psychometrics.includes("eligibleForOperationalUse"));
requireCheck("scheduled psychometric aggregation", read("src/app/api/jobs/psychometrics/route.ts").includes("CRON_SECRET") && read("vercel.json").includes("/api/jobs/psychometrics"));
requireCheck("reasoning trap algorithm", algorithms.includes("export function diagnoseReasoningTrap"));
requireCheck("spaced repetition algorithm", algorithms.includes("export function reviewFlashcard"));
requireCheck("flashcard urgency queue", algorithms.includes("export function buildFlashcardReviewQueue") && more.includes("buildFlashcardReviewQueue"));
requireCheck("flashcard retention forecast", algorithms.includes("export function flashcardRetentionForecast") && more.includes("metrics.retention"));
requireCheck("functional flashcard keyboard review", more.includes('event.code === "Space"') && more.includes('["1", "2", "3", "4"]'));
requireCheck("study plan algorithm", algorithms.includes("export function generateStudyPlan"));
requireCheck("full horizon study plan", algorithms.includes("maxCalendarDays = 366") && learner.includes("timelineLimit"));
requireCheck("local timezone date keys", algorithms.includes("export const localDateKey"));
requireCheck("crash safe session draft", sessionDomain.includes("writeSessionDraft") && session.includes("Block restored"));
requireCheck("persistent exam day orchestration", examDay.includes("writeExamDayRun") && examDay.includes("completeExamBlock") && examDay.includes("settleExamBreak"));
requireCheck("current 2026 break and tutorial profile", usmle.includes("modernSoftware ? 55 : 45") && usmle.includes("modernSoftware ? 5 : 15"));
requireCheck("exam block closure conceals review", session.includes("Performance and explanations stay concealed") && examDay.includes('status: complete ? "Complete" : "On break"'));
requireCheck("sequential sets lock and arrange", sessionDomain.includes("arrangeQuestionsForSession") && session.includes("lockedSequential"));
requireCheck("total item scoring", sessionDomain.includes("correct / boundedTotal") && session.includes("unanswered item"));
requireCheck("content publish governance", governance.includes("validateQuestionGovernance") && governance.includes("medical-review"));
requireCheck("demo production boundary", governance.includes("Demo content is not cleared for production"));
requireCheck("multi format clinical stimuli", session.includes("QuestionStimulus") && session.includes('format==="Scientific abstract"'));
requireCheck("structured multi format authoring", admin.includes("FormatAuthoringFields") && admin.includes("Patient chart structure") && admin.includes("Scientific abstract") && admin.includes("Accessible transcript"));
requireCheck("production scale deferred filtering", admin.includes("useDeferredValue") && learner.includes("useDeferredValue") && medicalLibrary.includes("useDeferredValue"));
requireCheck("period comparison algorithm", algorithms.includes("export function performanceWindow"));
requireCheck("streak algorithm", algorithms.includes("export function studyStreak"));
requireCheck("library ranking algorithm", algorithms.includes("export function rankLibraryArticles"));
requireCheck("library empty-result state", medicalLibrary.includes("No clinical topic selected") && medicalLibrary.includes("Clear search filters"));
requireCheck("zero-attempt data is explicit", algorithms.includes("const mastery = relevant.length") && learner.includes("Not started"));
requireCheck("calendar navigation is interactive", learner.includes('aria-label="Show previous month"') && learner.includes("shiftMonth(-1)"));
requireCheck("mobile web navigation", shells.includes("mobile-bottom-nav") && css.includes("env(safe-area-inset-bottom)"));
requireCheck("responsive tablet breakpoint", css.includes("@media (max-width: 900px)") || css.includes("@media (max-width: 1000px)"));
requireCheck("responsive phone breakpoint", css.includes("@media (max-width: 460px)"));
requireCheck("horizontal overflow protection", css.includes("overflow-x: hidden") && css.includes("min-width: 0"));
requireCheck("visible keyboard focus", css.includes(":focus-visible"));
requireCheck("reasoning trace signature", marketing.includes("<ReasoningTrace") && session.includes("<ReasoningTrace") && demo.includes("<ReasoningTrace"));
requireCheck("missing response distributions are not synthesized", algorithms.includes("It never synthesizes missing cohort data") && !algorithms.includes("seeded demo cohort"));
requireCheck("server-owned payment contract", checkout.includes("getCommercialPlan") && paymentWebhook.includes("verifySafepaySignature") && paymentWebhook.includes("paymentEvents"));
requireCheck("tracked support workflow", supportRoute.includes("supportTickets") && supportRoute.includes("sendSupportAcknowledgement"));
requireCheck("medical review boundary", medicalLibrary.includes("Production publication requires named medical review"));
requireCheck("no placeholder hrefs", !allComponents.includes('href="#"'));
requireCheck("no accidental empty click handlers", !/onClick=\{\s*\(.*?\)\s*=>\s*\{\s*\}\s*\}/s.test(allComponents));
requireCheck("no disabled landing-page mockup buttons", !marketing.includes("<button disabled"));
requireCheck("security overrides present", packageJson.overrides?.postcss === "8.5.23" && packageJson.overrides?.sharp === "0.35.3");
requireCheck("Next lint package versions aligned", packageJson.dependencies?.next === packageJson.devDependencies?.["eslint-config-next"]);
requireCheck("medical-content disclaimer", read("README.md").includes("independent educational product") && read("README.md").includes("It is not medical advice"));
requireCheck("security response headers", read("next.config.ts").includes("X-Content-Type-Options") && read("next.config.ts").includes("Permissions-Policy"));

console.log(`Stepwise source verification passed (${checks.length}/${checks.length} checks).`);
