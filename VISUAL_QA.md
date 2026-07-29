# Stepwise Visual QA

The repository includes a VS Code-native Playwright screenshot workflow. It uses the locally installed Google Chrome channel, so normal capture does not depend on downloading a separate browser. Each capture builds and starts the optimized production application to avoid development-only HMR noise.

## Capture from VS Code

1. Open the Command Palette.
2. Select `Tasks: Run Test Task`.
3. Choose `Stepwise: Capture all visual QA screenshots` if prompted.
4. Review the generated images under `artifacts/visual-review/`.

The recommended Microsoft Playwright extension is listed in `.vscode/extensions.json`. With it installed, the same visual suite is also available in VS Code's Testing sidebar.

## Capture from the terminal

```bash
npm run visual:capture
```

The command builds the current source, starts a temporary production server on port `3108`, captures the matrix, and stops the exact server process even when a test fails. The normal development server on port `3000` can remain running.

The suite captures:

- Every product route at 1440px desktop width
- Fourteen representative public, learner, admin, partner, and support routes at tablet and mobile widths
- Full-page PNGs with animation and caret movement disabled
- Browser console and uncaught page errors as test failures
- A stable question-session capture that waits for the real exam workspace instead of the transient block-building state
- Light-theme route coverage plus desktop and mobile dark-theme learner captures
- Current Step 2 CK Exam-mode and responsive session-tool interaction contracts
- Session recovery, answer reconciliation, early completion, and unanswered-scoring contracts
- Onboarding continuity, governance boundary, security-header, landmark, and overflow contracts
- A Playwright HTML report and traces for failed captures

Generated evidence:

```text
artifacts/
  visual-review/
    desktop-1440/
    tablet-768/
    mobile-390/
  playwright-report/
  test-results/
```

Generated artifacts are intentionally ignored by Git. They remain available locally for review in VS Code.

## Verified baseline

The July 26, 2026 production capture completed with:

- 65 light/dark screenshots
- 11 USMLE, learner-correctness, governance, security, accessibility-structure, and responsive interaction contracts
- 76 cases passed
- 56 intentionally skipped project/route combinations
- Zero browser console errors
- Zero uncaught page errors
- Desktop, tablet, and mobile question-session captures showing the real question workspace and compact tool access

## Browser choice

The workflow uses Playwright's `chrome` channel. Google Chrome must remain installed at its standard Windows location. To use a different browser later, update `channel` in `playwright.visual.config.ts`.
