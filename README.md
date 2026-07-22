# Stepwise — Complete USMLE QBank Frontend

Stepwise is a responsive Next.js frontend for USMLE Step 1 and Step 2 CK preparation. It includes a public product website, a guided five-question trial, authentication and onboarding, a learner workspace, full-screen question sessions, an original medical library, analytics, study planning, working spaced-repetition flashcards, a private study circle, settings, and an administrative console.

The repository is intentionally usable without a backend: typed demo state is persisted in `localStorage`, while the active question configuration uses `sessionStorage`. Production authentication, payments, protected medical content, and real cohort analytics still require server-side services.

> Stepwise is an independent educational interface demonstration. It is not affiliated with, sponsored by, or endorsed by USMLE, NBME, FSMB, UWorld, or any other question-bank provider. Questions and medical-library articles in this repository are original demonstration content. Cohort percentages are deterministic simulated data, not official exam or commercial-QBank statistics. This is not medical advice.

## Start in VS Code

Extract the ZIP into a **new empty folder**. Confirm that `package.json` is directly inside that folder, then run:

```bash
npm install
npm run audit
npm run dev
```

Open `http://localhost:3000`.

Do not run `npm audit fix --force`. npm may propose an unrelated breaking downgrade. This repository instead pins the patched transitive versions through `overrides`:

- `postcss: 8.5.10`
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
- `/app/session` — dedicated question workspace
- `/app/analytics` — performance, calibration, pacing, and cohort context
- `/app/study-plan` — generated timeline and calendar
- `/app/flashcards` — library and scheduled review
- `/app/library` — original clinical reference library
- `/app/notebook` — searchable question-linked notes
- `/app/community` — private thresholded study circle
- `/app/settings` — preferences, privacy, export, and accessibility
- `/admin` — administrative workspace

## Product capabilities

### Public website and guided trial

- Responsive marketing website with product storytelling, workflow, pricing, FAQ, and legal pages
- Five-question interactive trial adapted from the previous Stepwise concept
- Submission-time option shading that shows simulated cohort percentages inside each answer choice
- Explanation, learning objective, high-yield takeaways, and explainable reasoning-pattern feedback
- Three-day trial messaging, focused 20-question workflow, and no-card onboarding copy

### Learner workspace

- Dashboard with computed readiness, streak, daily activity, period comparisons, question volume, due cards, and weak-system guidance
- Step 1 and Step 2 CK block builder with Tutor, Timed, Exam, and Adaptive modes
- System, discipline, difficulty, status, count, and exact-question filters
- Quick 10-, 20-, and 40-question presets
- Full-screen session toolbar, timer, pause, navigator, strikeout, flag, bookmark, confidence, searchable lab values, calculator, notes, flashcards, reporting, and keyboard shortcuts
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
- Learner search and access controls
- Blueprint coverage and content recommendations
- Report triage and resolution
- Billing/transaction views and downloads
- Roles, governance, workspace, and integration settings

## Algorithms

The connected algorithms live in `src/lib/algorithms.ts`:

- Adaptive item ranking based on weakness, unseen coverage, recency, confidence mismatch, and challenge fit
- Exact-question routing
- Deterministic answer-choice distributions normalized to exactly 100%
- Explainable reasoning-trap classification
- System performance, coverage, period comparison, rolling accuracy, and study streaks
- Readiness and simulated cohort benchmarks
- Dynamic study-plan generation
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
npm run security:audit
```

The complete application check is:

```bash
npm run audit
```

`npm run audit` means the Stepwise source/lint/type/build pipeline. `npm audit` is npm’s dependency advisory command; they are different commands.

See `AUDIT.md` and `VERIFICATION.md` for the remediation and validation record.
