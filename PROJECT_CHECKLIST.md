# Stepwise release checklist

Last updated: July 29, 2026

Checked items are implemented and locally testable. Provider activation,
production evidence, legal review, and manual-device work remain unchecked
until their own evidence exists.

## Product and UX

- [x] Public site, guided original-question sample, authentication, help, and
  legal routes
- [x] Learner dashboard, QBank builder, Tutor/Timed/Exam/Adaptive sessions,
  exam-day orchestration, analytics, plan, flashcards, library, notebook,
  community, and settings
- [x] Admin and partner route surfaces with Appwrite label gates
- [x] Highlighter applies only to a non-empty text selection
- [x] Lucide icon system used consistently instead of placeholder glyphs
- [x] Landing “Exam-faithful sessions” feature replaced by auditable content
  governance
- [x] Exact one-time pricing: 90 days/$20, 180 days/$30, 360 days/$50
- [x] Simulated peer percentile and synthesized answer distributions removed
- [ ] Final production-copy and conversion review with real plan availability

## Identity and email

- [x] Appwrite email/password signup, login, logout, protected routes, and
  HTTP-only secure session cookie
- [x] Appwrite email verification and password-recovery token flows
- [x] Resend welcome, support acknowledgement/operator notification, and
  payment-receipt templates with idempotency
- [x] Email delivery event ledger without plaintext recipient storage
- [ ] Verify `stepwise.page` in Resend
- [ ] Configure Appwrite custom SMTP through Resend for
  `noreply@stepwise.page`
- [ ] Customize and deliver-test verification and recovery templates
- [ ] Deliverability checks for SPF, DKIM, DMARC, reply-to, bounce, and spam

## Learner data and backend

- [x] Strict versioned learner-state schema, size limits, revision conflicts,
  and checksums
- [x] Row-secured snapshot cache for compatibility
- [x] Normalized learner profile, immutable attempts, sessions, artifacts, and
  deletion tombstones
- [x] Server verification of answer correctness before psychometric use
- [x] Audit, email, support, order, payment-event, subscription, mastery, item
  statistics, and versioned-question schema
- [x] Server-side subscription enforcement behind a fail-closed feature flag
- [x] Sign in to the Appwrite CLI and push/inspect the new schema
- [x] Confirm all 14 tables, 134 columns, and 22 indexes are available and a
  repeated push is idempotent
- [x] Enable password dictionary/personal-data checks, session alerts,
  password-change session invalidation, and a 10-session limit
- [x] Create a time-limited four-scope server key and add it directly to
  encrypted Vercel Production storage
- [ ] Disposable-user cross-device, concurrent-update, export, retention, and
  deletion test
- [ ] Move protected commercial question inventory out of client bundles

## Psychometrics and adaptive learning

- [x] Rasch probability, information, curated initial difficulty, and EAP
  ability with posterior standard error
- [x] Time-decayed beta-binomial mastery
- [x] Latest-independent-response item sample
- [x] p-value, corrected point-biserial, upper/lower discrimination, distractor
  efficiency, median time, and mean confidence
- [x] Minimum 30 independent learners before operational item statistics
- [x] Adaptive rank: information 32%, mastery gap 28%, recency 16%, exposure
  12%, confidence repair 12%
- [x] Authenticated daily aggregation job and learner-readable mastery rows
- [x] Cohort percentile suppressed until a comparable sample of at least 50
  eligible learners exists
- [ ] Validate dimensionality, model fit, DIF/fairness, exposure limits, and
  blueprint constraints with a qualified psychometrician and production data
- [ ] Establish item retirement, recalibration, and version-change policy

## Support and commerce

- [x] Tracked support tickets with validation, size limit, bot timing trap,
  per-email rate limit, audit event, and email workflow
- [x] Server-owned plan catalog and hosted Safepay checkout boundary
- [x] Order-before-provider flow, HMAC-SHA512 signature verification, payload
  limit, deterministic event ledger, replay handling, and reconciliation state
- [x] Signed payment activation, access extension, receipt, subscriber label,
  refund/chargeback revocation
- [x] Checkout, webhook, and entitlement flags default off
- [ ] Confirm Safepay’s exact production webhook event contract and signature
  header in a disposable sandbox
- [ ] Test duplicate and out-of-order events, two concurrent success events,
  refund, chargeback, provider timeout, and manual reconciliation
- [ ] Finalize refund, cancellation, tax, invoice, and customer-support policy
- [ ] Resolve Appwrite Education’s non-commercial restriction before enabling
  paid production

## Engineering assurance and reliability

- [x] Source-contract audit
- [x] ESLint and strict TypeScript
- [x] Vitest tests with 80/75/80/80 minimum coverage gates
- [x] GitHub Actions build assurance, CodeQL, and Dependabot
- [x] Sentry integration with request cookies, headers, request data, and PII
  removed
- [x] Liveness and dependency-readiness endpoints
- [x] Security headers, structured redacted audit records, and security policy
- [x] Vercel daily cron contract protected by `CRON_SECRET`
- [x] Production deployment and four-domain HTTP/readiness/CSP smoke evidence
- [x] Production dependency audit reports zero vulnerabilities
- [ ] Track the upstream `brace-expansion` advisory in the development-only
  ESLint/TypeScript toolchain; npm currently reports no fix
- [ ] Push changes and confirm GitHub Actions/CodeQL on the remote repository
- [ ] Configure Sentry and confirm source maps, redaction, alerting, and issue
  ownership in preview
- [ ] Load, soak, backup/restore, failover, and incident-response exercises
- [ ] Define SLOs: availability, state-save success, checkout confirmation,
  support/email delivery, and recovery objectives

## Accessibility, content, and governance

- [x] Semantic controls, visible focus, reduced motion, high contrast, large
  text, responsive reflow, and keyboard-oriented session controls
- [x] Original demonstration content and independent-product disclaimer
- [x] Typed rights, evidence, reviewer, approval, and version metadata
- [ ] Named medical reviewers, evidence citations, guideline versions, and
  approval records for every production item
- [ ] WCAG 2.2 AA manual keyboard, 200%/400% zoom, NVDA, VoiceOver, iOS Safari,
  and Android Chrome evidence
- [ ] Final privacy, terms, cookies, accessibility, refund, and data-retention
  review by qualified counsel

## Required release evidence

```bash
npm ci
npm run audit
npm run security:audit
```

Then capture a Vercel preview and complete the provider, payment, email,
accessibility, clinical-governance, and legal checks above. A local green build
does not convert unchecked provider work into production evidence.
