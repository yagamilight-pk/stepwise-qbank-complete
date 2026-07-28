# Stepwise — Complete USMLE QBank Frontend

Stepwise is a frontend-complete, responsive Next.js experience for USMLE Step 1 and Step 2 CK preparation. It includes a USMLE-first public product website with current delivery-structure previews, a guided five-question trial, account and onboarding demonstrations, a learner workspace, full-screen question sessions, an Exam Command Deck, an original medical library, analytics, study planning, working spaced-repetition flashcards, a private study circle, an administrative console, and a partner portal.

The repository remains usable without provider variables as a local demonstration. When Appwrite is configured, email/password accounts use HTTP-only server sessions, protected route layouts enforce account labels, and learner-owned progress synchronizes through a row-secured Appwrite table. Browser storage remains a resilient local cache, while crash-safe active question blocks use `sessionStorage`. Payments, payouts, protected medical-content delivery, immutable privileged audit logging, and real cohort analytics still require additional server-side services.

The frontend is connected to the isolated Vercel project
`yagamilight-pks-projects/stepwise-qbank-complete` and the GitHub Student
Appwrite project `stepwise-qbank-complete`. See `DEPLOYMENT.md` for the live
resource contract, environment scope, and verification boundary.

> Stepwise is an independent educational interface demonstration. It is not affiliated with, sponsored by, or endorsed by USMLE, NBME, FSMB, UWorld, or any other question-bank provider. Questions and medical-library articles in this repository are original demonstration content. Cohort percentages are deterministic simulated data, not official exam or commercial-QBank statistics. This is not medical advice.

## Start in VS Code

Extract the ZIP into a **new empty folder**. Confirm that `package.json` is directly inside that folder, then run:

```bash
npm install
npm run audit
npm run dev
```

Open `http://localhost:3000`.

If a development server reports a Turbopack panic after routes have been added, removed, or renamed, stop the running server and use:

```bash
npm run dev:clean
```

This removes only the generated `.next` cache and starts a fresh development graph. Normal day-to-day startup should continue to use `npm run dev`.

Do not run `npm audit fix --force`. npm may propose an unrelated breaking downgrade. This repository instead pins the patched transitive versions through `overrides`:

- `postcss: 8.5.23`
- `sharp: 0.35.3`

After a clean install, verify dependency security separately with:

```bash
npm run security:audit
```

## Main routes

- `/` — public product website
- `/try` — guided five-question experience without sign-in
- `/login`, `/signup`, `/onboarding` — account flow
- `/app` — learner overview
- `/app/qbank` — block builder and question inventory
- `/app/exam-day` — full-day and three-block testing-day rehearsal
- `/app/session` — dedicated question workspace
- `/app/analytics` — performance, calibration, pacing, and cohort context
- `/app/study-plan` — generated timeline and calendar
- `/app/flashcards` — library and scheduled review
- `/app/library` — original clinical reference library
- `/app/notebook` — searchable question-linked notes
- `/app/community` — private thresholded study circle
- `/app/settings` — preferences, privacy, export, and accessibility
- `/admin` and `/admin/*` — administrative workspace
- `/influencer` and `/influencer/*` — partner login and portal
- `/help`, `/privacy`, `/terms`, `/cookies`, `/accessibility` — support and legal surfaces

## Product capabilities

### Public website and guided trial

- Responsive marketing website with product storytelling, workflow, pricing, FAQ, and legal pages
- Five-question interactive trial adapted from the previous Stepwise concept
- Submission-time option shading that shows simulated cohort percentages inside each answer choice
- Explanation, learning objective, high-yield takeaways, and explainable reasoning-pattern feedback
- Signature Reasoning Trace that connects the clinical cue, decision, correction, and next review
- Three-day trial messaging, focused 20-question workflow, and no-card onboarding copy

### Learner workspace

- Dashboard with computed readiness, streak, daily activity, period comparisons, question volume, due cards, and weak-system guidance
- Step 1 and Step 2 CK block builder with Tutor, Timed, Exam, and Adaptive modes
- Date-aware current/legacy USMLE delivery profiles, including the May 2026 software transitions
- System, discipline, difficulty, status, count, and exact-question filters
- Practice presets up to 40 questions and current-software Exam presets up to 20 questions
- Full-screen session toolbar, mode-correct timer, navigator, strikeout, flag, bookmark, confidence, searchable lab values, calculator, notes, flashcards, reporting, and keyboard shortcuts
- Continuous Exam mode with reviewable answers, delayed correctness, a non-leaking navigator, and a responsive session-tool hub
- Crash-safe block recovery for answers, confidence, eliminations, position, question timing, and total elapsed time
- Reconciled answer edits, explicit early completion, unanswered-item accounting, and full-block score denominator
- Chart/tabular records, scientific abstracts, audio/video evidence, and sequential-set stimulus rendering
- Exam Command Deck with current tutorial and break allowances, block ledger, automatic time credit/debit, restart recovery, irreversible closure, and completed-run debrief
- Authored sequential-set ordering and response locking after submission
- Answer distribution rendered only after submission as a subtle background fill inside options
- Session summaries, correction review, pacing, calibration, and block signals
- Honest empty states: systems with no history display `Not started` rather than fabricated performance

### Functional flashcards

- Create, edit, delete, search, tag, filter, and open source question
- Due, Learning, and Mature states
- Urgency-sorted review queue
- Space-to-reveal and 1–4 keyboard ratings
- Again, Hard, Good, and Easy interval updates
- Ease, repetitions, lapses, due dates, review streak, and retention forecast

### Original medical library

- Twelve original Step 1 and Step 2 CK reference articles
- Search and Step/system filters with relevance and weakness-aware ranking
- Reading progress, saved state, completion, table of contents, comparison tables, clinical callouts, mechanisms, management, and common traps
- One-click related block and flashcard creation
- Complete no-results state with filter reset

The library uses high-density medical-reference workflow conventions, but it does not copy UWorld content, trade dress, questions, explanations, illustrations, or proprietary assets.

### Private study circle

- Verified-peer invitation flow
- Mutual-consent requirement
- Minimum activity history threshold
- Aggregate reasoning-pattern analytics only after every safeguard is satisfied
- No individual scores, answers, question text, or identifiable study history in the shared view

### Administrative workspace

- Operations dashboard
- Question CRUD, preview, duplication, status workflow, publishing, deletion, and export
- Structural import validation and visible demo/production publish gates
- Dedicated patient-chart, scientific-abstract, sequential-set, and media/transcript authoring controls with live student preview
- Evidence, provenance, rights, medical-review, approval, version, competency, and physician-task metadata
- Learner search and access controls
- Blueprint coverage and content recommendations
- Report triage and resolution
- Billing/transaction views and downloads
- Roles, governance, workspace, and integration settings

### Influencer partner workspace

- Demo-only partner login with explicit local-auth boundary
- Referral links, campaign parameters, conversion ledger, and media assets
- Partner-specific net-profit commission calculations
- Approved-balance payout eligibility with minimum and account checks
- Clear distinction between local approval state and real external transfer

## Algorithms

The connected algorithms live in `src/lib/algorithms.ts`, `src/lib/session.ts`, and `src/lib/content-governance.ts`:

- Adaptive item ranking based on weakness, unseen coverage, recency, confidence mismatch, and challenge fit
- Exact-question routing
- Deterministic answer-choice distributions normalized to exactly 100%
- Explainable reasoning-trap classification
- System performance, coverage, period comparison, rolling accuracy, and study streaks
- Readiness and simulated cohort benchmarks
- Local-timezone-safe dynamic study-plan generation through the complete exam horizon
- Active-session draft validation, recovery, final-result reconciliation, and total-item scoring
- Persistent exam-day phase, block, tutorial, break-reserve, closure, and recovery orchestration
- Content completeness, format, evidence, rights, medical-review, and approval gates
- Spaced-repetition scheduling, urgency queue, and retention forecast
- Medical-library relevance and study-priority ranking
- Private-circle verification, consent, and history eligibility

## Responsive behavior

The design is optimized as a web platform rather than a fixed desktop canvas:

- Desktop: persistent information architecture and multi-column workspaces
- Tablet: collapsed navigation, reflowed dashboards, scroll-safe data tables, and condensed session chrome
- Phone: stacked content, bottom web navigation, safe-area padding, full-width actions, touch-sized controls, and overflow-safe clinical text
- Visible keyboard focus, reduced motion, large text, high contrast, and compact density modes

## Quality commands

```bash
npm run verify:source
npm run lint
npm run typecheck
npm run build
npm run visual:capture
npm run security:audit
```

The complete application check is:

```bash
npm run audit
```

`npm run audit` means the Stepwise source/lint/type/build pipeline. `npm audit` is npm’s dependency advisory command; they are different commands.

## Verified handoff snapshot

On July 26, 2026:

- Source audit passed 74/74 checks
- ESLint passed with zero findings
- TypeScript passed
- The production build generated 43/43 static outputs
- Representative production-server routes returned the expected 200 responses and the unknown route returned 404
- The production Google Chrome suite passed 81 cases with zero browser runtime errors
- Visual evidence includes 68 light/dark route/viewport captures
- Browser contracts passed for the current Step 2 CK structure, exam-day phase and break orchestration, irreversible closure, all advanced stimulus renderers, Exam feedback timing, answer review, crash recovery, answer reconciliation, unanswered scoring, onboarding continuity, governance boundaries, security headers, landmark structure, responsive overflow, and compact-screen session tools
- The cached offline dependency audit reported zero findings; a current live advisory refresh is not claimed

The embedded in-app browser surface was unavailable, but desktop/tablet/mobile production screenshots were captured and visually reviewed through the repository-local Chrome suite. Manual zoom, physical keyboard traversal, screen readers, and real iOS/Android browsers remain explicit handoff checks rather than claimed results.

See `PROJECT_CHECKLIST.md`, `progress/CURRENT_STATUS.md`, and `progress/VERIFICATION_LOG.md` for the current completion record. `ARCHITECTURE.md`, `DESIGN_SYSTEM.md`, and `USMLE_ALIGNMENT.md` document the implementation model, visual language, official-source alignment, and remaining exam-simulation gaps.
