# Verification Record

Verification date: July 22, 2026

## Passed in the delivery environment

### Source contract

```text
Stepwise source verification passed (42/42 checks).
```

Checks cover routes, required files, the guided trial, dedicated session workspace, embedded option distributions, absence of a separate distribution card, peer analytics disclaimer, private-circle privacy gate, exact-question routing, adaptive selection, reasoning diagnostics, flashcard scheduling/queue/forecast/keyboard flow, study planning, performance windows, streaks, library ranking and empty states, calendar navigation, mobile navigation, tablet/phone breakpoints, overflow protection, keyboard focus, placeholder links, empty click handlers, dependency overrides, and aligned Next.js/ESLint package versions.

### Offline TypeScript source validation

```text
tsc -p tsconfig.offline.json
passed
```

The offline configuration uses local declaration stubs because installed npm dependencies were unavailable in the packaging environment. It validates project structure, JSX syntax, imports, types, unused locals, and unused parameters. Run the normal dependency-aware `npm run typecheck` after installation.

### Stylesheet parser

```text
CSS rules parsed: 1,669
CSS parser errors: 0
```

### Algorithm smoke tests

Passed against the real `src/lib/algorithms.ts` implementation:

- Choice percentages total exactly 100%
- Directionality reasoning trap classification
- Good flashcard rating updates interval and review timestamp
- Private-circle threshold unlock

### Static interaction scan

```text
Unbound button candidates: 0
Placeholder href="#" links: 0
Disabled landing-page mockup buttons: 0
```

### Seed coverage

- Original demonstration questions: 14
- Original medical-library articles: 12
- Seeded Step 2 CK systems with activity: all included demonstration systems

## Dependency advisory remediation

The supplied terminal log reported PostCSS and Sharp advisories through Next.js. The final package aligns `next` and `eslint-config-next` at `16.2.11` and includes npm overrides for patched transitive releases:

```json
{
  "postcss": "8.5.10",
  "sharp": "0.35.3"
}
```

Use a clean extraction and run `npm install`. Do **not** use `npm audit fix --force`, because npm indicated that it would install a breaking and unrelated older Next.js release.

## Environment limitation

The packaging environment could not reach the npm registry, so it could not perform a fresh dependency installation, installed-package ESLint run, Next.js production build, or final npm advisory scan.

On an internet-connected machine run:

```bash
npm install
npm run audit
npm run security:audit
npm run dev
```

`npm run audit` executes source verification, ESLint, dependency-aware TypeScript checking, and the production Next.js build.

## Data boundary

Choice percentages and cohort comparisons are deterministic demonstration data. They are not official USMLE, NBME, school, or commercial-QBank statistics. Production cohort aggregation must be server-side, privacy-reviewed, and protected by minimum-cohort thresholds.
