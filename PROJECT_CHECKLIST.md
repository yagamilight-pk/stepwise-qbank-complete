# Stepwise Frontend Completion Checklist

Last updated: July 25, 2026

This is the frontend handoff source of truth. Checked items are implemented in this repository; unchecked items require a real browser/device pass, production-scale evidence, or external services and governance.

## 1. Product foundation

- [x] Explicit Next.js App Router pages for all 35 product destinations
- [x] Route-specific metadata and `noindex` rules for private surfaces
- [x] Loading, error, not-found, Open Graph, and Twitter image experiences
- [x] Learner, admin, and partner implementations loaded as separate dynamic chunks
- [x] Typed local demonstration state and algorithms
- [x] Complete local quality pipeline passing

## 2. Design system

- [x] Semantic color, type, spacing, elevation, and status tokens
- [x] Interface, editorial, and data typography roles without font-network dependency
- [x] Purpose-specific public, learner, session, editorial, admin, and partner density
- [x] WCAG-oriented focus, target-size, contrast, reflow, and reduced-motion rules
- [x] Signature Reasoning Trace used on marketing, guided trial, and session feedback
- [x] Shared modal, tabs, empty, loading, error, toast, progress, badge, and form patterns

## 3. Public and account experience

- [x] Responsive marketing page and five-question guided sample
- [x] Login, signup, password-recovery, and onboarding demonstrations
- [x] Privacy, terms, cookies, accessibility, help, and 404 surfaces
- [x] Accessible primary/mobile navigation, FAQ, billing toggle, forms, and live status
- [x] Unverified social proof removed
- [x] Pricing, identity, reset-email, learner-data, and legal-demo boundaries labelled
- [x] Page-specific search metadata and generated social-card artwork

## 4. Learner workspace

- [x] Dashboard organized around the next action, plan, and supporting evidence
- [x] QBank builder, inventory, exact-question launch, and full-screen session
- [x] Keyboard shortcuts, timer, navigator, strikeout, confidence, calculator, and lab tools
- [x] Explanation, reasoning diagnosis, Reasoning Trace, notes, flashcards, and review
- [x] Analytics, study plan, notebook, medical library, private study circle, and settings
- [x] Accessible tabs, charts, calendars, tables, filters, controls, and dynamic status
- [x] Sample dates, cohort data, readiness heuristic, and response distributions disclosed

## 5. Medical-content trust

- [x] Original demonstration questions and reference articles
- [x] Independent-product and educational-use disclaimers
- [x] Question reporting and admin resolution workflow
- [x] Article reading metadata and demonstration editorial-status disclosure
- [x] Production review requirements named at point of use
- [x] Simulated cohort, readiness-model, and non-predictive limitations shown in context
- [ ] Named medical reviewers, evidence citations, guideline versions, and approval records
- [ ] Production editorial governance, licensing, and immutable clinical audit trail

## 6. Admin and partner workspaces

- [x] Admin overview, import, authoring, preview, user, content, report, billing, and settings
- [x] Question and report review states
- [x] Partner onboarding, login, referral links, conversion ledger, payout, and media surfaces
- [x] Accessible captions, scopes, filters, controls, financial status, and action labels
- [x] Partner-specific commission calculations and approved-balance payout eligibility
- [x] External-transfer and demo-approval boundaries stated
- [ ] Server-enforced roles, authorization, finance-provider integration, and audit logging
- [ ] Product-wide locale selection, currency negotiation, translation, and RTL support

## 7. Accessibility and responsive quality

- [x] WCAG 2.2 AA-oriented component semantics and keyboard behavior
- [x] Dialog focus trap, initial focus, Escape handling, scroll lock, and focus restoration
- [x] Keyboard tabs, menus, accordions, listbox, popover, tables, and choice controls
- [x] Text alternatives/status for key progress and data visualizations
- [x] Desktop, tablet, phone, safe-area, print, high-contrast, large-text, and reduced-motion CSS
- [ ] Manual 200%/400% zoom and viewport screenshot review
- [ ] Manual NVDA, VoiceOver, keyboard-only, iOS Safari, and Android Chrome verification

## 8. Performance and engineering

- [x] External Google Fonts CSS import removed
- [x] Explicit static routes and current Next.js `proxy.ts` convention
- [x] Heavy learner/admin/partner implementations deferred into dynamic chunks
- [x] Production build and 39 generated static outputs reviewed
- [x] Source audit covers route, accessibility, honesty, algorithm, and product invariants
- [ ] Production-scale list virtualization and dataset profiling
- [ ] Field Core Web Vitals, error monitoring, and real-user performance budgets

## 9. Verification and handoff

- [x] `npm.cmd run verify:source` — 54/54
- [x] `npm.cmd run lint` — zero findings
- [x] `npm.cmd run typecheck`
- [x] `npm.cmd run build` — 39/39 static outputs
- [x] Production-server HTTP smoke on 13 representative routes, including expected 404
- [x] Architecture, design system, current status, and verification log are current
- [x] README describes the delivered scope and production boundaries
- [ ] Visual browser screenshots and interaction walkthrough

## External production work

These cannot be completed honestly by frontend code alone:

- Production authentication, authorization, sessions, recovery, and role enforcement
- Protected question delivery, entitlements, and server-side mutation validation
- Billing, receipts, refunds, payout transfer, and payment reconciliation
- Cross-device learner persistence, privacy operations, consent, and deletion workflows
- Real cohort aggregation with documented sample sizes and minimum-threshold enforcement
- Medical licensing, named editorial ownership, evidence review, and clinical governance
- Transactional email, product analytics consent, monitoring, security review, and legal approval
