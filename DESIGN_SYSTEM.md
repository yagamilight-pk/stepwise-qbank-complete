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

## Motion

Motion is concentrated in the Reasoning Trace and immediate interaction feedback. Background decoration does not animate. Reduced-motion preferences remove nonessential transitions.

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

