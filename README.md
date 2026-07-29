# Stepwise QBank

Stepwise is a Next.js 16 learning platform for USMLE Step 1 and Step 2 CK
preparation. It combines question sessions, reasoning review, adaptive
selection, study planning, spaced repetition, learner analytics, support, and
one-time subscription access.

This repository now contains a full-stack application foundation:

- Appwrite email/password authentication with secure server sessions,
  verification, password recovery, protected routes, and normalized learner
  data;
- Resend transactional welcome, support, and receipt email;
- tracked support tickets;
- one-time Safepay plans: 90 days/$20, 180 days/$30, 360 days/$50;
- server-owned checkout amounts, signed webhook processing, replay protection,
  subscription extension, reversals, and server-side entitlement enforcement;
- Rasch EAP ability, Bayesian mastery, real item statistics, and adaptive
  information targeting;
- Sentry redaction, health/readiness checks, audit events, daily aggregation,
  coverage gates, CI, CodeQL, and Dependabot.

Provider activation is deliberately separate from implementation. The Appwrite
schema and authentication policies are live and verified; the Appwrite server
key is stored in encrypted Vercel Production and the current revision is live
on all four Stepwise hosts. Resend domain/SMTP, Safepay sandbox, Sentry, and
their remaining secrets must still pass the staged process in
[DEPLOYMENT.md](DEPLOYMENT.md). Payment flags remain off.

> Stepwise is an independent educational product and is not affiliated with,
> sponsored by, or endorsed by USMLE, NBME, FSMB, or a commercial question-bank
> provider. Bundled questions are original demonstration content. Stepwise does
> not manufacture peer distributions or percentiles when measured data is
> unavailable. It is not medical advice.

## Local development

Requires Node.js 20.9 or newer.

```bash
npm ci
npm run audit
npm run dev
```

Open `http://localhost:3000`. If Turbopack refers to a route that was removed,
stop the server and run `npm run dev:clean`.

Copy `.env.example` to `.env.local` only when testing providers. Never commit
API keys. The app can build without provider variables; protected external
flows then fail closed or report that configuration is unavailable.

## Main routes

- `/` — product and exact one-time pricing
- `/try` — guided original-question sample
- `/login`, `/signup`, `/verify-email`, `/forgot-password`, `/reset-password`
- `/checkout` — server-owned one-time plan selection
- `/help` — searchable help and tracked support form
- `/app` — learner dashboard
- `/app/qbank`, `/app/session`, `/app/exam-day`
- `/app/analytics`, `/app/study-plan`, `/app/flashcards`
- `/app/library`, `/app/notebook`, `/app/community`, `/app/settings`
- `/admin` and `/influencer` — label-protected workspaces
- `/api/health` and `/api/health?ready=1`

## Learning model

Adaptive sessions rank eligible questions using:

1. Rasch item information at the learner’s EAP ability estimate — 32%
2. beta-binomial system mastery gap — 28%
3. knowledge recency — 16%
4. exposure control — 12%
5. confidence calibration repair — 12%

Ability includes posterior uncertainty. Item statistics use one latest response
per learner/item, corrected point-biserial correlation, upper/lower
discrimination, distractor efficiency, timing, and confidence. Operational
statistics are withheld below 30 independent learners. Cohort percentiles
require a separate comparable sample of at least 50 learners and are currently
suppressed.

## Quality commands

```bash
npm run verify:source
npm run lint
npm run typecheck
npm test
npm run test:coverage
npm run build
npm run security:audit
```

`npm run audit` performs source verification, lint, typecheck, coverage, and a
production build. Do not run `npm audit fix --force`; review advisories and
upgrade intentionally.

## Documentation

- [Deployment and provider activation](DEPLOYMENT.md)
- [Architecture and trust boundaries](ARCHITECTURE.md)
- [Security reporting](SECURITY.md)
- [Product checklist](PROJECT_CHECKLIST.md)
- [Design system](DESIGN_SYSTEM.md)
- [USMLE alignment](USMLE_ALIGNMENT.md)
