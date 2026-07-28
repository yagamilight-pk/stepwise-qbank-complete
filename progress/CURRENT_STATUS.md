# Current Frontend Status

Last updated: July 28, 2026

## Outcome

The complete interactive Stepwise frontend is implemented and passes its local quality, production-build, contract, and visual-capture pipelines. The product now behaves as a premium clinical command instrument rather than a generic dashboard: learner, session, admin, partner, account, and public surfaces share restrained enterprise depth, explicit trust states, USMLE-oriented reading density, and honest demo-versus-production boundaries.

The first production-provider boundary is live: Appwrite email/password
sessions, server-enforced route access, password recovery, and row-secured
learner-state synchronization. The isolated Appwrite project is provisioned in
the GitHub Student organization, and the separate Vercel project is connected
to GitHub with production, preview, and development environment values.

## Delivered

- 36 explicit product destinations plus framework not-found and generated social-image routes
- Public product, guided trial, account, help, and legal surfaces
- USMLE-first public positioning with current Step 1/Step 2 CK delivery rails and a direct Exam Command Deck path
- Learner dashboard, QBank, session, analytics, study plan, flashcards, library, notebook, community, and settings
- Admin operations, import/editor, users, coverage, reports, billing, partner administration, and settings
- Partner login, overview, links, conversions, payouts, and media kit
- Semantic design tokens, responsive reflow, keyboard focus, dialog focus management, accessible tabs/popovers/tables/forms
- Reasoning Trace across discovery, trial, and real question review
- Disclosure of sample pricing, simulated cohort figures, readiness limitations, local-only identity, and demo-only finance behavior
- Purpose-built fresh-learner guidance instead of fabricated chart activity
- Correct dark-surface contrast in authentication, onboarding, trial, learner/admin sidebars, and the marketing footer
- Focused session rail with unclipped utilities and non-overlapping responsive shortcut guidance
- Date-aware current/legacy Step 1 and Step 2 CK block profiles based on the learner exam date
- Target-exam continuity from onboarding through dashboard metrics, QBank defaults, and new flashcard tags
- Continuous Exam-mode timing, editable in-block answers, delayed correctness, and non-leaking navigator states
- Premium Exam Command Deck with current 2026 tutorial/break allowances, full-day and three-block runs, persisted tutorial timing, automatic expiry, break-overrun testing-time penalties, permanent block closure, and final debrief
- Schema-validated, crash-safe active-block restore for answers, confidence, eliminations, position, and elapsed time, with malformed drafts rejected safely
- Reconciled answer edits, early block completion, unanswered-item accounting, and total-item scoring
- Working session settings, deadline-based timing across revisits/background throttling, and a responsive all-utilities session hub
- Complete exam-date study-plan horizon with local-timezone-safe activity keys and incremental timeline disclosure
- Sequential, chart/tabular, scientific-abstract, audio/video, and imported question/explanation-image clinical stimulus renderers
- Dedicated advanced-format authoring controls and live previews, with authored sequential ordering and response locking
- Typed evidence, rights, reviewer, approval, competency, physician-task, and version records
- Content import validation and admin publish gates separating demo delivery from production-cleared content
- Route-group provider isolation, deferred feature chunks, versioned local persistence, and visible save health
- Single-source flashcard interval calculations with exact due-now dashboard counts
- Deferred search, memoized filtering, and incremental disclosure for large learner and admin datasets
- Manifest, sitemap, robots policy, metadata, and baseline security response headers
- Explicit local-sandbox, unconnected-provider, non-live billing/payout, and small-sample operational truth
- Appwrite server sessions, authenticated learner routes, label-gated admin/partner routes, password recovery, and scoped cloud-state sync
- Live Appwrite FRA project with email/password authentication, explicit web hosts, and a row-secured `user_states` table
- Isolated `yagamilight-pks-projects/stepwise-qbank-complete` Vercel project with the GitHub repository connected
- `stepwise.page`, `www.stepwise.page`, `app.stepwise.page`, and `admin.stepwise.page` transferred from the previous Vercel project with host-aware public, learner, and admin routing
- Premium daily-momentum, loading, depth, motion, dark-mode, and mobile-navigation refinements
- Explicit official-source alignment review and an honest gap register in `USMLE_ALIGNMENT.md`

## Verified locally

- Source audit: 86/86
- ESLint: zero errors and zero warnings
- TypeScript: pass
- Next.js production build: pass; 44/44 static outputs plus four dynamic routes
- Production HTTP smoke: 12 representative routes returned 200; unknown route returned 404
- Production Chrome suite: 84 cases passed; 66 intentionally skipped matrix combinations; zero browser runtime errors
- Visual evidence: 68 light/dark screenshots across desktop, tablet, and mobile
- Exam contracts: current Step 2 CK profile, 30-minute clock, all advanced stimuli including imported images, persisted tutorial expiry, break-overrun penalties, irreversible closure, schema-safe active-block restore, answer edits, early finish, full-denominator scoring, responsive tools, and mobile laboratory-value access passed
- Product contracts: onboarding continuity through the selected-exam QBank state, flashcard scheduler/due-now agreement, governance boundary, one-main landmark structure, responsive overflow, and security headers passed
- Cached offline dependency audit: zero findings; a live advisory refresh was not authorized and is not claimed
- `git diff --check`: recorded in the final verification pass

## Verification boundary

The in-app browser surface was unavailable, but the repository-local Google Chrome suite completed production screenshots at desktop, tablet, and mobile sizes and those artifacts were visually inspected. Manual 200%/400% zoom, full pointer/keyboard traversal, NVDA, VoiceOver, iOS Safari, and Android Chrome testing are not claimed.

## Production boundary

This is a frontend-complete interactive demonstration with Appwrite identity and
learner-state persistence, not a production medical platform or official exam
emulator. Protected content, payments, payouts, real analytics, privacy
operations, populated reviewer/evidence records, immutable clinical audit
logging, monitoring, and legal approval still require external systems and
accountable owners. The frontend implements the full local exam-day rehearsal
and major non-single-best-answer stimulus families, but production content
still requires licensed assets, a full authored bank, and named clinical
review.

See `PROJECT_CHECKLIST.md` for the complete status and `progress/VERIFICATION_LOG.md` for evidence.
