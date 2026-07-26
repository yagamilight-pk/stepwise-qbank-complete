# Stepwise Design System

## Subject and audience

Stepwise is a high-stakes clinical reasoning and exam-preparation workspace for medical learners preparing for Step 1 and Step 2 CK.

The interface must support long reading sessions, time pressure, uncertainty, error correction, and privacy-sensitive performance data. It should feel like a precise learning instrument, not a hospital portal, game, or generic SaaS dashboard.

## Product thesis

Every missed question should become an understandable correction and a concrete next action.

## Signature pattern: Reasoning Trace

```text
Clinical cue -> Working hypothesis -> Decision -> Correction -> Next review
```

This pattern connects marketing, the guided sample, answer explanations, analytics, notes, flashcards, and study planning.

## Color tokens

- Exam paper: `#f7f9fc`
- Clinical ink: `#121a2a`
- Stepwise signal: `#5147d9`
- Diagnostic teal: `#0f766e`
- Verified green: `#15805c`
- Correction coral: `#c84f5a`

Color never carries meaning alone. Correct, incorrect, warning, selected, flagged, and due states also require text, iconography, shape, or pattern.

## Typography

- Interface: system humanist sans stack for high legibility and zero font-network dependency
- Editorial: old-style serif used selectively for clinical reading and major product statements
- Data: monospace stack for timers, question IDs, measurements, and financial references

Minimum product text target is 12px for secondary metadata and 14px for primary interface copy. Smaller text is reserved for nonessential preview illustrations only.

## Layout concepts

### Marketing

```text
[Outcome and proof]        [Live Reasoning Trace]
[Try five questions]       [Cue -> decision -> correction]
```

### Learner dashboard

```text
[NOW: one recommended action]
[NEXT: short queue]        [WHY: evidence and limits]
[Progress and history below the fold]
```

### Question session

```text
[Session status]
[Question metadata] [Clinical stem and choices] [Utilities]
[Result -> explanation -> Reasoning Trace -> next action]
```

Exam-mode state is deliberately quieter than Tutor mode. Saved answers remain editable, navigator states do not reveal correctness, timing is continuous, and feedback appears only after block completion. The exam profile derives from the selected exam date so the interface can distinguish current May 2026 delivery from the legacy block model.

Compact session layouts retain the navigator, settings, pause or continuous state, and timer in the toolbar. The session-tools hub keeps laboratory values and calculator access available when there is not enough width for every labeled control.

## Motion

Motion is concentrated in the Reasoning Trace, progress signals, route preparation, and immediate interaction feedback. Entry motion is short and orchestrated; instrument panels use restrained lift and depth rather than decorative spectacle. Background decoration does not animate. Reduced-motion preferences remove nonessential transitions.

## Premium instrument layer

- Layered surfaces use quiet inner highlights and low-chroma shadows.
- Obsidian navigation, paper-white reading surfaces, violet action, and diagnostic teal evidence create a stable clinical hierarchy.
- Workspace trustlines expose exam context, local persistence health, sandbox state, and external-service boundaries before users act.
- Daily momentum translates goal progress into one compact live signal.
- Active navigation uses both color and a physical signal rail.
- Focused sessions expose block-save and recovery state without introducing decorative status theater.
- Admin authoring exposes a clinical-content readiness instrument rather than treating publish as an unqualified button.
- Progress fills use a subtle scan that is disabled with reduced motion.
- Dark mode uses explicit graphite surfaces and descendant text colors.
- Mobile navigation floats above the safe area as a compact study dock.

Premium here means calm authority, not visual excess. The system avoids glass-on-glass decoration, saturated multi-color gradients, novelty metrics, and oversized rounding. Depth is reserved for state changes, modal focus, and the single most important action.

## State integrity

Fresh accounts must look intentional without fabricated performance. Empty analytics explain what action creates a signal, unscheduled study days explain the recovery state, and first-use cards lead to a real next action. Demonstration labels stay visible wherever data is simulated.

Active exam blocks are treated as recoverable work. Answer, confidence, elimination, position, and timing state remain visible and restorable; completion copy always distinguishes answered from unanswered items.

Dark clinical surfaces must set descendant text colors explicitly. Inherited page-level heading and logo tokens cannot be relied on for sidebars, authentication panels, or the question-session toolbar.

## Accessibility floor

- WCAG 2.2 AA target
- Visible focus for every interactive element
- Complete keyboard operation
- Dialog focus containment and restoration
- At least 44px product target size for primary touch actions
- Responsive reflow at 200% and 400% zoom
- Status messages exposed to assistive technology
- Accessible alternatives for data visualizations

## Self-critique

The prior design relied heavily on purple gradients, bento cards, and very small dashboard typography. Those patterns could describe almost any productivity product. The revised system retains the recognizable Stepwise signal color but moves distinctiveness into the Reasoning Trace, clinical-reading typography, evidence labels, and purpose-specific layouts.
