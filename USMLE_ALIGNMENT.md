# USMLE Alignment Review

Reviewed: July 26, 2026

This document separates current official exam facts, implemented frontend behavior, and remaining product work. Stepwise is an independent preparation product; visual familiarity must not become copied trade dress, and demonstration content must not be described as official.

## Official sources reviewed

- [USMLE Step 2 CK exam content](https://www.usmle.org/step-exams/step-2-ck/step-2-ck-exam-content)
- [USMLE Step 2 CK question formats](https://www.usmle.org/exam-resources/step-2-ck-materials/step-2-ck-test-question-formats)
- [USMLE exam resources and current software orientation](https://www.usmle.org/exam-resources)
- [USMLE test-delivery software update](https://www.usmle.org/test-delivery-software-updates-place-step-1)
- [USMLE content outline](https://www.usmle.org/sites/default/files/2022-01/USMLE_Content_Outline_0.pdf?preview=true&site_id=1864)

## Current delivery model implemented

For an exam date on or after the official software transition:

| Exam | Transition date | Exam day | Current block model | Maximum items |
| --- | --- | --- | --- | --- |
| Step 1 | May 14, 2026 | 8 hours | 14 × 30-minute blocks, no more than 20 items per block | 280 |
| Step 2 CK | May 7, 2026 | 9 hours | 16 × 30-minute blocks, no more than 20 items per block | 318 |

Stepwise resolves the profile from the selected exam and learner exam date. Dates before the transition retain the legacy 60-minute block profile.

Implemented behavior:

- The QBank builder shows the applicable software profile and exam-date basis.
- Exam mode enforces the applicable per-block item ceiling.
- Exam mode uses the official block duration even for a shortened rehearsal.
- Exam timing is continuous and cannot be paused.
- Answers remain editable and reviewable until the block ends.
- Correctness, explanation, sounds, answer-state colors, and response distributions remain hidden until the block is complete.
- The question navigator distinguishes saved, current, and flagged questions without leaking correctness in Exam or Timed modes.
- Question-level timing accumulates correctly across revisits and answer changes.
- Active blocks recover question order, position, answers, eliminations, confidence, results, and elapsed time after refresh.
- Early completion explicitly reports unanswered items, and scoring uses the full block denominator.
- Keyboard choice movement, strikeout, flag, bookmark, timer display, contrast, large text, reduced motion, calculator, and searchable laboratory-value utilities work in the session surface.
- Essential controls remain reachable on desktop, tablet, and phone; compact screens also expose all utilities through the session-tools hub.
- The Exam Command Deck supports the current full-day block count or a three-block rehearsal.
- The optional tutorial, starting break reserve, unused-tutorial credit, unused-block credit, automatic between-block break clock, and persistent phase recovery are modeled explicitly.
- Completed blocks are permanently closed; answers and explanations remain concealed during the run, with aggregate debrief unlocked only after the final block.

## Question-format alignment

The official Step 2 CK materials describe single-best-answer vignettes and chart/tabular items, sequential item sets, scientific abstracts, and items that include audio or video.

The repository now has typed and responsive learner renderers for:

- Single-best-answer vignettes
- Chart/tabular patient records with flagged values
- Structured scientific abstracts
- Audio/video evidence with an accessible transcript surface
- Sequential-set context and item-order metadata

The editor validates required format-specific structures before local publication and provides dedicated chart-row, abstract-section, sequential-set, and media/transcript controls. Sequential items sharing a set ID are arranged by authored order, and submitted sequential responses lock against navigation and editing. Production media licensing and a clinically reviewed production item corpus remain external requirements.

## Content-outline alignment

The shared USMLE content outline is the correct blueprint source for future content operations. The current demonstration library spans common Step 1 and Step 2 CK systems and disciplines, but it is not a production-scale blueprint and does not establish complete coverage of newer or cross-cutting areas such as geriatric medicine, nutrition, prescription-drug use, veterans and families, gender-affirming care, or care of patients with disabilities.

## Remaining gaps before production-grade exam simulation

1. Author and medically review production-scale sequential sets, abstracts, chart items, and licensed clinical media.
2. Move exam-day state, protected content, entitlements, and recovery from browser storage to an authenticated, cross-device service.
3. Map every item to versioned USMLE blueprint nodes and build coverage thresholds for systems, disciplines, physician tasks, age groups, and cross-cutting content.
4. Replace condensed demonstration laboratory values with appropriately licensed, clinically validated reference material.
5. Establish named medical reviewers, evidence citations, guideline versions, approval records, content retirement rules, and immutable editorial audit history.
6. Validate keyboard-only, screen-reader, zoom, iOS Safari, Android Chrome, and physical-device behavior. Current repository automation is Chrome-based.
7. Re-verify the official exam structure whenever USMLE publishes a delivery, content-outline, or software change.

## Automated contracts

`tests/visual/exam-behavior.spec.ts` protects the current Step 2 CK profile, exam timer, no-feedback-before-block-end rule, editable-answer review, crash recovery, answer reconciliation, total-item scoring, all advanced stimulus renderers, the full exam-day phase transition, irreversible closure, automatic break accounting, responsive toolbar access, settings, and mobile utility access.

`tests/visual/product-contracts.spec.ts` protects onboarding continuity, content-governance boundaries, baseline security headers, one-main landmark structure, and horizontal-overflow behavior.
